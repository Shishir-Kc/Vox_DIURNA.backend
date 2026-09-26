export {};

type Preview = { id: string; slug: string };
type Post = {
  id: string; slug: string; title: string; excerpt: string; date: string;
  content: string; category: string; readingTime: string; featured: boolean;
};

const api = (process.env.LEGACY_API_URL ?? 'https://vox-diurnabackend.fastapicloud.dev/api/v1').replace(/\/$/, '');
const response = await fetch(`${api}/posts`);
if (!response.ok) throw new Error(`Legacy post list returned HTTP ${response.status}`);
const previews = await response.json() as Preview[];
if (!Array.isArray(previews)) throw new Error('Legacy post list was not an array.');

const posts = await Promise.all(previews.map(async ({ id, slug }) => {
  const result = await fetch(`${api}/posts/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`);
  if (!result.ok) throw new Error(`Failed to fetch ${id} (${slug}): HTTP ${result.status}`);
  const post = await result.json() as Post;
  for (const key of ['id', 'slug', 'title', 'excerpt', 'date', 'content', 'category', 'readingTime'] as const) {
    if (typeof post[key] !== 'string') throw new Error(`Post ${id} has invalid ${key}.`);
  }
  if (post.id !== id || post.slug !== slug || typeof post.featured !== 'boolean') throw new Error(`Post identity or featured value mismatch for ${id}.`);
  return post;
}));

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const statements = posts.map((post) => `INSERT INTO posts (id, slug, title, excerpt, content, date, category, readingTime, featured) VALUES (${[
  post.id, post.slug, post.title, post.excerpt, post.content, post.date, post.category, post.readingTime,
].map(quote).join(', ')}, ${post.featured ? 1 : 0}) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, excerpt=excluded.excerpt, content=excluded.content, date=excluded.date, category=excluded.category, readingTime=excluded.readingTime, featured=excluded.featured;`);
await Bun.write('/tmp/vox-diurna-posts-import.sql', statements.join('\n'));
console.log(`Fetched ${posts.length} full posts (${statements.join('\n').length} SQL characters).`);
console.log('Import file: /tmp/vox-diurna-posts-import.sql');
