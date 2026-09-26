# Vox DIURNA API

TypeScript Hono API. Bun manages dependencies and local scripts; Cloudflare Workers runs production with D1.

## API contract

See [docs/API.md](docs/API.md) for the CRUD routes, JSON schemas, status codes, and copy-ready request examples. Writes require the `X-API-KEY` secret.

## Local development

1. Install Bun, then run `bun install`.
2. Create a D1 database with `bunx wrangler d1 create vox-diurna` and put its returned `database_id` in `wrangler.jsonc`.
3. Apply the schema with `bun run db:migrate:local`.
4. Add `API_KEY` to `.dev.vars` for local authenticated requests.
5. Run `bun run dev`.

## Import legacy PostgreSQL posts

Set `DATABASE_URL` to a read-only PostgreSQL connection string and run `bun run db:import`. This exports every row in the legacy `post` table to `/tmp/vox-diurna-posts-import.sql`; it supports either `featured` or the historical `fatured` column and preserves IDs, dates, and featured values. Review the export, then import it with `bunx wrangler d1 execute vox-diurna --remote --file=/tmp/vox-diurna-posts-import.sql`. The legacy database is only read.

## Deploy

Set up the Cloudflare account and D1 database ID in `wrangler.jsonc`, then set the secret and deploy:

```sh
bunx wrangler secret put API_KEY
bun run db:migrate:remote
bun run deploy
```

The API is available at `https://api.blog.shishirkhatri.com.np`. CORS allows the existing production frontend origins and Vox Studio. Rate limiting uses two Cloudflare Rate Limiting bindings, each set to five requests per minute per client IP.

Migration `0002_add_post_image.sql` adds a nullable cover image URL. Existing posts remain empty (`image: null`).
