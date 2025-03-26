import { env } from "cloudflare:workers";
import Elysia, { type Static, t } from "elysia";
import { Auth, type KeyStorer } from "firebase-auth-cloudflare-workers";
// firebase-admin wont run on cf worker so i use this instead
import { type Result, ResultAsync, err, ok } from "neverthrow";

class NoKVStore implements KeyStorer {
	async get() {
		return null;
	}
	async put(value: string, expirationTtl: number) {}
}

export const User = t.Object({
	studentId: t.String(),
});
export type User = Static<typeof User>;

export const AuthUnauthorizedError = t.UnionEnum([
	"missing-authorization",
	"invalid-token",
]);
export const AuthForbiddenError = t.UnionEnum([
	"not-chula",
	"invalid-student-id",
	"not-science-student",
]);
export const AuthError = t.Union([AuthUnauthorizedError, AuthForbiddenError]);
export type AuthError = Static<typeof AuthError>;

export class AuthService {
	constructor(public headers: Record<string, string | undefined>) {}

	async getUser(): Promise<Result<User, AuthError>> {
		if (
			env.ENVIRONMENT === "dev" &&
			this.headers.authorization?.startsWith("Basic ")
		) {
			console.log("[DEV] Using mock auth");
			const [_, rawToken] = this.headers.authorization.split(" ");

			if (!rawToken) {
				return err("missing-authorization");
			}
			const token = Buffer.from(rawToken, "base64").toString("utf-8");
			const [studentId, ...time] = token.split(":");

			console.log("[DEV] Mock student ID:", studentId);
			console.log("[DEV] Mock time:", time.join(":") || "now");

			const rightVerifyResult = await this.verifyRight(studentId);
			if (rightVerifyResult.isErr()) return rightVerifyResult;

			return ok({
				studentId,
				currentTime: time ? new Date(time.join(":")) : new Date(),
			});
		}

		const [_, idToken] = this.headers.authorization?.split(" ") ?? [];
		// if (!idToken) {
		// 	return err("missing-authorization");
		// }

		const authResult = await this.getStudentId(idToken);

		if (authResult.isErr()) {
			return err(authResult.error);
		}

		return ok({
			studentId: authResult.value.studentId,
			currentTime: new Date(),
		});
	}

	async getStudentId(idToken: string) {
		const auth = Auth.getOrInitialize(
			env.FIREBASE_PROJECT_ID,
			new NoKVStore(),
			// if we want to cache the public key used to verify the Firebase ID we can use this
			// WorkersKVStoreSingle.getOrInitialize(env.PUBLIC_JWK_CACHE_KEY, env.PUBLIC_JWK_CACHE_KV)
		);

		const token = await ResultAsync.fromPromise(
			auth.verifyIdToken(idToken),
			() => [],
		);

		if (token.isErr()) {
			return err("invalid-token");
		}

		const { email } = token.value;
		if (!email) {
			// wtf did you use to sign in
			return err("invalid-token");
		}

		const [studentId, domain] = email.split("@");
		if (!domain.endsWith("chula.ac.th")) {
			return err("not-chula");
		}

		const rightVerifyResult = await this.verifyRight(studentId);
		if (rightVerifyResult.isErr()) {
			return rightVerifyResult;
		}

		return ok({ studentId });
	}

	async verifyRight(studentId: string) {
		if (studentId.length !== 10) {
			return err("invalid-student-id");
		}

		// xxxxxxxx23 for science students
		if (!/^\d{8}23$/.test(studentId)) {
			return err("not-science-student");
		}

		return ok();
	}
}

export const auth = () =>
	new Elysia({ aot: false, name: "auth" }).derive(
		{ as: "scoped" },
		async ({ headers }) => {
			const auth = new AuthService(headers);
			const user = await auth.getUser();
			return {
				auth,
				user,
			};
		},
	);
