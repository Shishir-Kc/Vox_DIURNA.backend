CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) <= 255),
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  readingTime TEXT NOT NULL,
  featured INTEGER NOT NULL CHECK(featured IN (0, 1))
);

CREATE INDEX IF NOT EXISTS posts_slug_id_idx ON posts(slug, id);
