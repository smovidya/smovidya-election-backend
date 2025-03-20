# SMO Vidya Election 2025

## Development

```sh
bun install
bun run dev
```

## Deployment

We use Cloudflare workers to deploy the site.

```sh
bun run deploy
```

## Database

To getting started with the database, seed the database with the following command:

```sh
bun db:excute --local --file=./src/db/seed.sql
```

In case you need to interact with the *remote* database, you can use the following command:

```sh
bun db:execute --remote --commands "SELECT * FROM votes"
```

`db:execute` is a wrapper around `wrangler d1 execute DB` command. You can use it to run any SQL command on the database.
