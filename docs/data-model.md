# QuickNotes Data Model

## Entities

**users**: `id` BIGINT PK, `email` VARCHAR(255) unique, `password_hash` VARCHAR(255), `created_at` TIMESTAMPTZ.

**notes**: `id` BIGINT PK, `user_id` BIGINT FK -> users.id, `title` VARCHAR(100), `body` TEXT, `created_at`, `updated_at` TIMESTAMPTZ.

**tags**: `id` BIGINT PK, `user_id` BIGINT FK -> users.id, `name` VARCHAR(50); unique per user.

**note_tags**: `note_id` BIGINT FK -> notes.id, `tag_id` BIGINT FK -> tags.id; composite PK (`note_id`, `tag_id`).

## Relationships

- **One-to-many:** one user has many notes (`notes.user_id`), and one user has many tags (`tags.user_id`). Each note and tag belongs to exactly one user.
- **Many-to-many:** a note can have many tags and a tag can be on many notes. The join table `note_tags` stores one row per pair.

## CREATE TABLE statements (PostgreSQL)

```sql
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(100) NOT NULL CHECK (length(title) > 0),
  body       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  BIGINT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
```

## Example queries

```sql
-- 1. Latest 20 notes for a user (first page)
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 42
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 2. JOIN: notes with a given tag
SELECT n.id, n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t       ON t.id = nt.tag_id
WHERE n.user_id = 42 AND t.name = 'shopping'
ORDER BY n.created_at DESC;

-- 3. How many notes each tag has
SELECT t.name, COUNT(*) AS note_count
FROM tags t
JOIN note_tags nt ON nt.tag_id = t.id
WHERE t.user_id = 42
GROUP BY t.name
ORDER BY note_count DESC;

-- 4. Delete a note (only if it belongs to the caller)
DELETE FROM notes WHERE id = 8421 AND user_id = 42;
```

## Indexes

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC, id DESC);
CREATE INDEX idx_note_tags_tag      ON note_tags (tag_id, note_id);
```

- `idx_notes_user_created`: almost every request is "this user's newest notes". Without it the database scans hundreds of millions of rows; with it, query 1 reads 20 index entries.
- `idx_note_tags_tag`: the primary key already covers "tags of a note"; this covers the reverse, "notes with a tag" (query 2).
- `users.email` and `tags (user_id, name)` are indexed by their UNIQUE constraints.

## SQL vs NoSQL decision

We choose **PostgreSQL (SQL)**. Our data is clearly relational (users, notes, tags and a many-to-many link), we need integrity guarantees (foreign keys, unique emails, a note and its tags saved atomically in one transaction), and queries are simple and known in advance. Scale is not a reason to avoid SQL: about 365 GB of new data per year and a few hundred requests per second are well within one primary plus read replicas, and the data can later be sharded by `user_id` because no query crosses users. A NoSQL store would be reconsidered only if write volume grew by orders of magnitude or notes became schema-free documents.