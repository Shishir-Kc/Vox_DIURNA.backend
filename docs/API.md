# Vox DIURNA API

Base URL: `https://api.blog.shishirkhatri.com.np`

All payloads and responses use JSON. Post IDs are UUIDs. The API stores `featured` as a boolean in JSON and as an integer in D1. `id` and `date` are generated on creation and cannot be changed by clients. `image` is an optional absolute `http` or `https` URL; use `null` when there is no cover image. Existing posts have `image: null`.

## Routes

| Method | Path | Purpose | API key |
|---|---|---|---|
| GET | `/api/v1/ping` | Liveness check | No |
| GET | `/api/v1/health` | D1 health check | No |
| GET | `/api/v1/posts` | List post previews | No |
| GET | `/api/v1/posts/{slug}/{id}` | Read one post | No |
| POST | `/api/v1/posts` | Create a post | Yes |
| PUT | `/api/v1/posts/{slug}/{id}` | Replace editable post fields | Yes |
| PATCH | `/api/v1/posts/{slug}/{id}` | Update selected post fields | Yes |
| DELETE | `/api/v1/posts/{slug}/{id}` | Delete a post | Yes |

Create, update, and delete share a limit of 5 requests per minute per IP. Post listing is limited to 5 requests per minute per IP.

## Post schemas

### Create request

`POST /api/v1/posts` requires each field below except `image`, which is optional and nullable. `title` must contain 1–255 characters. `slug`, `category`, and `readingTime` must not be empty. `excerpt` and `content` may be empty strings. Unknown fields are rejected.

```json
{
  "slug": "a-new-post",
  "title": "A new post",
  "excerpt": "A short summary",
  "content": "Full post content in Markdown",
  "category": "Technology",
  "readingTime": "4 min read",
  "featured": false,
  "image": "https://images.example.com/posts/a-new-post.jpg"
}
```

Omit `image` or send `null` for a post without a cover image. The server returns `image: null` for older posts and new posts without an image.

### Update request

`PUT` requires the complete create schema. `PATCH` accepts one or more of those fields and changes only the supplied fields. The URL uses the post's current slug and ID; a supplied `slug` can rename it. Neither method accepts `id` or `date`.

### Post response

```json
{
  "id": "267b9be9-ff57-42f8-a16a-a3691db1bcf5",
  "slug": "a-new-post",
  "title": "A new post",
  "excerpt": "A short summary",
  "date": "2026-09-26T08:00:00.000Z",
  "content": "Full post content in Markdown",
  "category": "Technology",
  "readingTime": "4 min read",
  "featured": false,
  "image": "https://images.example.com/posts/a-new-post.jpg"
}
```

The list route returns an array of previews with the same fields except `content`. The detail, create, and update routes return the full post.

## Implementing CRUD in a client

1. Set the base URL to `https://api.blog.shishirkhatri.com.np`.
2. Load the list with `GET /api/v1/posts`; use `id` and `slug` to link to a detail page.
3. Load a detail with `GET /api/v1/posts/{slug}/{id}`.
4. For create, send the create schema to `POST /api/v1/posts` with the `X-API-KEY` header.
5. For edits, send all editable fields with `PUT`, or only changed fields with `PATCH`, to `/api/v1/posts/{currentSlug}/{id}`.
6. For delete, send `DELETE` to `/api/v1/posts/{slug}/{id}`. Ask for confirmation in the UI before sending the request.
7. After a successful write, refresh the list/detail data. If a slug changed, use the returned post's new slug.

Example authenticated update:

```sh
curl -X PATCH 'https://api.blog.shishirkhatri.com.np/api/v1/posts/a-new-post/267b9be9-ff57-42f8-a16a-a3691db1bcf5' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"title":"Updated title","featured":true}'
```

Example delete:

```sh
curl -X DELETE 'https://api.blog.shishirkhatri.com.np/api/v1/posts/a-new-post/267b9be9-ff57-42f8-a16a-a3691db1bcf5' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## Responses and errors

- `GET` list/detail: `200`; a missing detail is `404`.
- `POST /api/v1/posts`: `201` with the created post.
- `PUT`/`PATCH`: `200` with the updated post; missing post is `404`.
- `DELETE`: `200` with `{"status":200}`; missing post is `404`.
- Missing/invalid key: `401`. Invalid body or UUID: `422`. Rate limit exceeded: `429`.

The legacy `POST /api/v1/upload/post` route remains available for existing clients and returns its prior `{"status":202}` response. New clients should use `POST /api/v1/posts`.

## Configure the API key

Store the key as a Cloudflare Worker secret; do not place it in source code or a public frontend build. From this backend repository, run:

```sh
bunx wrangler secret put API_KEY
```

Wrangler prompts for the secret value and deploys the secret. Send the same value in `X-API-KEY` from a trusted admin client. If `API_KEY` is not configured, all write routes reject requests.
