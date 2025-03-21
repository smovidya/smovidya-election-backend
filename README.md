# SMO Vidya Election 2025

## Development

```sh
bun install
bun run dev
```

There are two version of API Documentation:
- OpenAPI: http://localhost:8787/spec.json
- Scalar (recommended): http://localhost:8787/reference
- Swagger: http://localhost:8787/swagger

These are also available on the production site with the same path.

## Environment Variables
put this into `.dev.vars` at the root directory
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
bun db:execute --remote --commands "SELECT * FROM votes"
```

`db:execute` is a wrapper around `wrangler d1 execute DB` command. You can use it to run any SQL command on the database.
