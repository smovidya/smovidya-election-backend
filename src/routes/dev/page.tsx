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
        const getDataButton = document.getElementById("get-data")
        const output = document.getElementById("output")

        const apiUrl = "/api/me"

        getDataButton.addEventListener("click", async e => {
            output.innerText = "Loading..."
            const token = await auth.currentUser?.getIdToken()
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json",
                },
            })
            const data = await response.json()
            if (response.ok) {
                output.innerText = JSON.stringify(data, null, 2)
            } else {
                output.innerText = "Error: " + data.error
            }
            console.log(data)
        })

        signInButton.addEventListener("click", e => {
            signInWithPopup(auth, provider)
        })

        signOutButton.addEventListener("click", e => {
            signOut(auth)
        })

        onAuthStateChanged(auth, async user => {
            if (user) {
                userInfoElement.innerHTML = "<b>uid:</b> " + user.uid + "<br>" +
                    "<b>email:</b> " + user.email + "<br>" +
                    "<b>name:</b> " + user.displayName + "<br>" +
                    "<b>idToken:</b> " + await user.getIdToken() + "<br>"
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
            <p id="user-info" style="font-family: monospace;word-break: break-all;">loading</p>
            <button id="sign-in" type="button">
                Sign in with google
            </button>
            <button id="get-data" type="button">
                Get data from /api/me
            </button>
            <button id="sign-out" type="button">
                Sign out
            </button>
            <div>
                <a href="/reference">API references</a>
            </div>
            <pre style="white-space: pre-wrap">
                <output id="output" />
            </pre>
        </Layout>
    );
};
