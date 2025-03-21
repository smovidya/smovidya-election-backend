import { Auth, type KeyStorer } from "firebase-auth-cloudflare-workers";
import { err, ok, type Result, wrapAsync } from "../utils/result";
import { env } from "cloudflare:workers";
// firebase-admin wont run on cf worker so i use this instead

class NoKVStore implements KeyStorer {
	async get() {
		return null;
	}
	async put(value: string, expirationTtl: number) {}
}

export type AuthError = "user-not-found" | "not-chula" | "invalid-token";

export const authService = {
	async getStudentId(idToken: string): Promise<Result<string, AuthError>> {
		const auth = Auth.getOrInitialize(
			env.FIREBASE_PROJECT_ID,
			new NoKVStore(),
			// if we want to cache the public key used to verify the Firebase ID we can use this
			// WorkersKVStoreSingle.getOrInitialize(env.PUBLIC_JWK_CACHE_KEY, env.PUBLIC_JWK_CACHE_KV)
		);

		const token = await wrapAsync(() => auth.verifyIdToken(idToken));
		if (!token.ok) {
			return err("invalid-token");
		}

		const { email } = token.value;
		if (!email) {
			// wtf did you use to sign in
			return err("invalid-token");
		}

		const [id, domain] = email.split("@");
		if (!domain.endsWith("chula.ac.th")) {
			return err("not-chula");
		}

		return ok(id);
	},
};
