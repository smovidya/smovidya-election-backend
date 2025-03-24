import { Auth, type KeyStorer } from "firebase-auth-cloudflare-workers";
// firebase-admin wont run on cf worker so i use this instead
import { env } from "cloudflare:workers";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { z } from "zod";

class NoKVStore implements KeyStorer {
	async get() {
		return null;
	}
	async put(value: string, expirationTtl: number) {}
}

export class AuthService {
	async authenticate(
		idToken: string,
	): Promise<Result<{ studentId: string }, AuthError>> {
		const auth = Auth.getOrInitialize(
			env.FIREBASE_PROJECT_ID,
			new NoKVStore(),
			// if we want to cache the public key used to verify the Firebase ID we can use this
			// WorkersKVStoreSingle.getOrInitialize(env.PUBLIC_JWK_CACHE_KEY, env.PUBLIC_JWK_CACHE_KV)
		);

		const token = await ResultAsync.fromPromise(
			auth.verifyIdToken(idToken),
			() => "",
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

		if (studentId.length !== 10) {
			return err("invalid-student-id");
		}

		// xxxxxxxx23 for science students
		if (!/^\d{8}23$/.test(studentId)) {
			return err("not-science-student");
		}

		return ok({ studentId });
	}
}
