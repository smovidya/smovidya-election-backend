# SMO Vidya Election 2025

## Development

```sh
bun install
bun run dev
```

There are two version of API Documentation:
- OpenAPI: http://localhost:8787/reference/json
- Scalar (recommended): http://localhost:8787/reference

## Environment Variables

Create a `.dev.vars` file in the root of the project with the following content (contact the project owner for the values):

```conf
FIREBASE_API_KEY=""
FIREBASE_AUTH_DOMAIN=""
FIREBASE_PROJECT_ID=""
FIREBASE_STORAGE_BUCKET=""
FIREBASE_MESSAGING_SERVICE_ID=""
FIREBASE_APP_ID=""
```

## Deployment

We use Cloudflare workers to deploy the site.

To deploy the site, create D1 and KV namespaces on Cloudflare and set value in the `wrangler.jsonc` file.

After setting up the namespaces, run the following command to deploy the site:

```sh
bun run deploy
```

### Database

To getting started with the database, seed the database with the following command:

```sh
bun db:excute --local --file=./src/db/seed.sql
```

In case you need to interact with the *remote* database, you can use the following command:

```sh
bun db:execute --remote --command "SELECT * FROM votes"
```

`db:execute` is a wrapper around `wrangler d1 execute DB` command. You can use it to run any SQL command on the database.

## API Authorization

To authorize the API, you need to set the `Authorization` header with the value of the `idToken` from the Firebase authentication as an `Bearer` token like this:

```http
GET /api/v1/votes HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1...NiIsImtpZCI6IjQ2ZjIwZjIz
```

The token will be then verified by the API to authenticate the user if they have the right to vote or not.

### Simulate the vote

You can simulate authentication by creating a mock token to represent any student ID and the current time to test the API. This is useful for checking whether a voter has the correct permissions and if the current time falls within the voting period. Below is an example using JavaScript's `fetch`:

```js
const mockStudentId = "6730000023";
const mockCurrentTime = new Date("2025-04-24T12:00:00+07:00").toISOString(); // Local time

const response = await fetch('http://localhost:8787/api/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(`${mockStudentId}:${mockCurrentTime}`)
  },
})

console.log(await response.json())
// {
//   "success": true,
//   "studentId": "6730000023",
//   "currentTime": "2025-04-24T05:00:00.000Z" // UTC time
// }
```

Change student ID and current time to test different scenarios in each API endpoint.

- Student ID: `6730000023` (valid voter)
- Student ID: `6730000021` (`not-science-student`)
- Time: `2025-04-23T06:00:00+07:00` (before voting period)
- Time: `2025-04-23T12:00:00+07:00` (within voting period)
- Time: `2025-04-23T17:00:00+07:00` (after voting closed)
- Time: `2025-04-24T00:00:00+07:00` (result announced)

> [!NOTE] 
> The mock time is not required, you can just use the student ID to test the API.
