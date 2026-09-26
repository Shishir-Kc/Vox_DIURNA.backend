import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context, MiddlewareHandler } from 'hono';

type Env = {
  Bindings: {
    DB: D1Database;
    API_KEY: string;
    POSTS_LIMITER: RateLimit;
    UPLOAD_LIMITER: RateLimit;
  };
};
type Post = { id: string; slug: string; title: string; excerpt: string; date: string; category: string; readingTime: string; featured: number; image: string | null };
type PostFields = Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'readingTime' | 'image'> & { content: string; featured: boolean };
const app = new Hono<Env>();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const postFieldNames = ['slug', 'title', 'excerpt', 'content', 'category', 'readingTime', 'featured', 'image'] as const;

app.use('*', cors({
  origin: ['https://vox-diurna.pages.dev', 'https://vox-studio.kc-dev-py.workers.dev', 'http://localhost:5173', 'https://shishirkhatri.com.np', 'https://blog.shishirkhatri.com.np', 'https://vox.shishirkhatri.com.np'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-KEY'],
  credentials: true,
}));

function limiter(binding: 'POSTS_LIMITER' | 'UPLOAD_LIMITER'): MiddlewareHandler<Env> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const result = await c.env[binding].limit({ key: ip });
    if (!result.success) return c.json({ detail: 'Rate limit exceeded' }, 429);
    await next();
  };
}
const authenticate: MiddlewareHandler<Env> = async (c, next) => {
  const expected = c.env.API_KEY;
  const provided = c.req.header('X-API-KEY');
  if (!expected || !provided || !(await verifyApiKey(provided, expected))) return c.json({ detail: 'Invalid API KEY' }, 401);
  await next();
};
async function verifyApiKey(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}
const preview = (row: Post) => ({ ...row, featured: Boolean(row.featured) });
function validatePostFields(value: unknown, partial = false): { data?: Partial<PostFields>; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Request body must be a JSON object' };
  const input = value as Record<string, unknown>;
  const unknownFields = Object.keys(input).filter((key) => !postFieldNames.includes(key as typeof postFieldNames[number]));
  if (unknownFields.length) return { error: `Unknown fields: ${unknownFields.join(', ')}` };
  if (!partial) {
    const missing = postFieldNames.filter((key) => key !== 'image' && !(key in input));
    if (missing.length) return { error: `Missing fields: ${missing.join(', ')}` };
  } else if (Object.keys(input).length === 0) {
    return { error: 'PATCH body must contain at least one post field' };
  }
  for (const key of postFieldNames) {
    if (!(key in input)) continue;
    const field = input[key];
    if (key === 'image') {
      if (field === null) continue;
      if (typeof field !== 'string') return { error: 'image must be a URL string or null' };
      if (!field.trim()) { input.image = null; continue; }
      try {
        const imageUrl = new URL(field);
        if (imageUrl.protocol !== 'https:' && imageUrl.protocol !== 'http:') return { error: 'image must use http or https' };
      } catch { return { error: 'image must be an absolute URL' }; }
    } else if (key === 'featured') {
      if (typeof field !== 'boolean') return { error: 'featured must be a boolean' };
    } else if (typeof field !== 'string') {
      return { error: `${key} must be a string` };
    } else if (key === 'title' && (field.trim().length === 0 || field.length > 255)) {
      return { error: 'title must be between 1 and 255 characters' };
    } else if ((key === 'slug' || key === 'category' || key === 'readingTime') && field.trim().length === 0) {
      return { error: `${key} must not be empty` };
    }
  }
  return { data: input as Partial<PostFields> };
}
async function readJsonBody(c: Context<Env>): Promise<unknown | null> {
  try { return await c.req.json(); } catch { return null; }
}

app.get('/api/v1/ping', (c) => c.json({ status: 200 }));
app.get('/api/v1/health', async (c) => {
  try { await c.env.DB.prepare('SELECT 1').first(); return c.json({ status: 'healthy', database: 'connected' }); }
  catch (e) { return c.json({ detail: `Database unavailable: ${String(e)}` }, 503); }
});
app.get('/api/v1/posts', limiter('POSTS_LIMITER'), async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, slug, title, excerpt, date, category, readingTime, featured, image FROM posts').all<Post>();
    return c.json(results.map(preview));
  } catch { return c.json([]); }
});
app.get('/api/v1/posts/:slug/:id', async (c) => {
  const { slug, id } = c.req.param();
  if (!uuidPattern.test(id)) return c.json({ detail: 'Invalid UUID' }, 422);
  const row = await c.env.DB.prepare('SELECT id, slug, title, excerpt, date, content, category, readingTime, featured, image FROM posts WHERE slug = ? AND id = ?').bind(slug, id).first<Post & { content: string }>();
  if (!row) return c.json({ detail: 'Post not found' }, 404);
  return c.json(preview(row));
});
const createPost: MiddlewareHandler<Env> = async (c) => {
  const body = await readJsonBody(c);
  if (body === null) return c.json({ detail: 'Invalid JSON request body' }, 422);
  const validated = validatePostFields(body);
  if (!validated.data) return c.json({ detail: validated.error }, 422);
  const post = validated.data as PostFields;
  const id = crypto.randomUUID();
  const date = new Date().toISOString();
  try {
    await c.env.DB.prepare('INSERT INTO posts (id, slug, title, excerpt, content, date, category, readingTime, featured, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, post.slug, post.title, post.excerpt, post.content, date, post.category, post.readingTime, post.featured ? 1 : 0, post.image ?? null).run();
  } catch { return c.json({ detail: 'Unable to create post' }, 400); }
  if (c.req.path === '/api/v1/upload/post') return c.json({ status: 202 }, 200);
  return c.json({ id, ...post, image: post.image ?? null, date }, 201);
};
app.post('/api/v1/posts', limiter('UPLOAD_LIMITER'), authenticate, createPost);
app.post('/api/v1/upload/post', limiter('UPLOAD_LIMITER'), authenticate, createPost);

const updatePost: MiddlewareHandler<Env> = async (c) => {
  const slug = c.req.param('slug');
  const id = c.req.param('id');
  if (!slug || !id) return c.json({ detail: 'Post not found' }, 404);
  if (!uuidPattern.test(id)) return c.json({ detail: 'Invalid UUID' }, 422);
  const partial = c.req.method === 'PATCH';
  const body = await readJsonBody(c);
  if (body === null) return c.json({ detail: 'Invalid JSON request body' }, 422);
  const validated = validatePostFields(body, partial);
  if (!validated.data) return c.json({ detail: validated.error }, 422);
  const fields = Object.entries(validated.data) as [keyof PostFields, PostFields[keyof PostFields]][];
  const assignments = fields.map(([key]) => `${key} = ?`).join(', ');
  const values = fields.map(([key, value]) => key === 'featured' ? (value ? 1 : 0) : value);
  try {
    const result = await c.env.DB.prepare(`UPDATE posts SET ${assignments} WHERE slug = ? AND id = ?`).bind(...values, slug, id).run();
    if (result.meta.changes === 0) return c.json({ detail: 'Post not found' }, 404);
    const row = await c.env.DB.prepare('SELECT id, slug, title, excerpt, date, content, category, readingTime, featured, image FROM posts WHERE id = ?').bind(id).first<Post & { content: string }>();
    if (!row) return c.json({ detail: 'Post not found' }, 404);
    return c.json(preview(row));
  } catch { return c.json({ detail: 'Unable to update post' }, 500); }
};
app.put('/api/v1/posts/:slug/:id', limiter('UPLOAD_LIMITER'), authenticate, updatePost);
app.patch('/api/v1/posts/:slug/:id', limiter('UPLOAD_LIMITER'), authenticate, updatePost);

app.delete('/api/v1/posts/:slug/:id', limiter('UPLOAD_LIMITER'), authenticate, async (c) => {
  const { slug, id } = c.req.param();
  if (!uuidPattern.test(id)) return c.json({ detail: 'Invalid UUID' }, 422);
  try {
    const result = await c.env.DB.prepare('DELETE FROM posts WHERE slug = ? AND id = ?').bind(slug, id).run();
    if (result.meta.changes === 0) return c.json({ detail: 'Post not found' }, 404);
    return c.json({ status: 200 });
  } catch { return c.json({ detail: 'Unable to delete post' }, 500); }
});

export default app;
