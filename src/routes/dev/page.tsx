import type { Component } from "@kitajs/html";
// @elysiajs/html dont export this
import { env } from "cloudflare:workers";
import { html, Html } from "@elysiajs/html";

const Layout: Component = ({ children }) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />

				<title>API test</title>
			</head>
			<body>{children}</body>
		</html>
	);
};

// if i make this a jsx, typescript will yell at me
const UserScript = () => `
    <script type="module">
        import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js'

        const firebaseConfig = {
            apiKey: "${env.FIREBASE_API_KEY}",
            authDomain: "${env.FIREBASE_AUTH_DOMAIN}",
            projectId: "${env.FIREBASE_PROJECT_ID}",
            storageBucket: "${env.FIREBASE_STORAGE_BUCKET}",
            messagingSenderId: "${env.FIREBASE_MESSAGING_SERVICE_ID}",
            appId: "${env.FIREBASE_APP_ID}"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
    </script>

    <script type="module" defer>
        import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js'

        const auth = getAuth()
        const provider = new GoogleAuthProvider();
        const signInButton = document.getElementById("sign-in")
        const signOutButton = document.getElementById("sign-out")
        const userInfoElement = document.getElementById("user-info")

        signInButton.addEventListener("click", e => {
            signInWithPopup(auth, provider)
        })

        signOutButton.addEventListener("click", e => {
            signOut(auth)
        })

        onAuthStateChanged(auth, async user => {
            if (user) {
                userInfoElement.innerText = "uid: " + user.uid
                userInfoElement.innerText += ", email: " + user.email
                userInfoElement.innerText += ", idToken: " + await user.getIdToken()
            } else {
                userInfoElement.innerText = "Not loggged in"
            }
        })

    </script>
`;

export const Page = () => {
	return (
		<Layout>
			<UserScript />
			<h1>
				Hello <s>Hono</s>Elysia!
			</h1>
			<h2> User info </h2>
			<p id="user-info">loading</p>
			<button id="sign-in" type="button">
				Sign in with google
			</button>
			<button id="sign-out" type="button">
				Sign out
			</button>
			<div>
				<a href="/reference">API references</a>
			</div>
		</Layout>
	);
};
