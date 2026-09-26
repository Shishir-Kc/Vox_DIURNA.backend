import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Set DATABASE_URL to the legacy PostgreSQL connection string.');
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const columns = await client.query<{ column_name: string }>(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'post'",
  );
  const names = new Set(columns.rows.map((row) => row.column_name));
  const featuredColumn = names.has('featured') ? 'featured' : names.has('fatured') ? 'fatured' : null;
  if (!featuredColumn) throw new Error("Legacy post table has neither 'featured' nor 'fatured'.");
  const required = ['id', 'slug', 'title', 'excerpt', 'content', 'date', 'category', 'readingTime'];
  for (const column of required) if (!names.has(column)) throw new Error(`Legacy post table is missing '${column}'.`);
  const rows = await client.query(
    `SELECT id, slug, title, excerpt, content, date, category, "readingTime", "${featuredColumn}" AS featured FROM post ORDER BY date, id`,
  );
  // Use D1's supported local import mechanism by generating a repeatable SQL file.
  // Applying with --remote keeps this import separate from the legacy source database.
  const esc = (value: unknown) => value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
  const statements = rows.rows.map((row) => `INSERT OR REPLACE INTO posts (id, slug, title, excerpt, content, date, category, readingTime, featured) VALUES (${[
    row.id, row.slug, row.title, row.excerpt, row.content,
    row.date instanceof Date ? row.date.toISOString() : row.date,
    row.category, row.readingTime, row.featured ? 1 : 0,
  ].map((value, index) => index === 8 ? (value ? '1' : '0') : esc(value)).join(', ')});`);
  await Bun.write('/tmp/vox-diurna-posts-import.sql', statements.join('\n'));
  console.log(`Exported ${rows.rowCount ?? 0} posts to /tmp/vox-diurna-posts-import.sql.`);
  console.log('Apply with: bunx wrangler d1 execute vox-diurna --remote --file=/tmp/vox-diurna-posts-import.sql');
} finally {
  await client.end();
}
