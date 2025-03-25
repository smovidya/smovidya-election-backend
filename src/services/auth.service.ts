import { Auth, type KeyStorer } from "firebase-auth-cloudflare-workers";
// firebase-admin wont run on cf worker so i use this instead
import { env } from "cloudflare:workers";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { type Static, t } from "elysia";

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

export const AuthError = t.UnionEnum([
	"invalid-token",
	"not-chula",
	"invalid-student-id",
	"not-science-student",
]);
export type AuthError = Static<typeof AuthError>;

export class AuthService {
	async authenticate(idToken: string) {
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
