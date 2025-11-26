"""Ingest docs into pgvector using BGE-small embeddings."""

import argparse
import glob
import hashlib
import os
import uuid

from pgvector.psycopg import Vector, register_vector
from psycopg import connect
from sentence_transformers import SentenceTransformer


MODEL_NAME = 'BAAI/bge-small-en-v1.5'
EMBED_DIM = 384
DEFAULT_INCLUDE = [
  'docs/**/*.md',
  '*.md',
  'PROJECT_STATE.md',
  'ERROR_CATALOG.md',
]
DEFAULT_EXCLUDE_DIRS = {
  '.git',
  'node_modules',
  'test-results',
  'vendor',
}


def chunk_text(text, size, overlap):
  start = 0
  text_len = len(text)
  while start < text_len:
    end = min(text_len, start + size)
    yield text[start:end]
    start += max(1, size - overlap)


def iter_files(include_globs, exclude_dirs):
  seen = set()
  for pattern in include_globs:
    for path in glob.glob(pattern, recursive=True):
      if not os.path.isfile(path):
        continue
      parts = set(path.split(os.sep))
      if parts & exclude_dirs:
        continue
      full_path = os.path.abspath(path)
      if full_path in seen:
        continue
      seen.add(full_path)
      yield full_path


def ensure_schema(conn):
  with conn.cursor() as cur:
    cur.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    cur.execute(
      """
      CREATE TABLE IF NOT EXISTS doc_chunks (
        id uuid PRIMARY KEY,
        source text NOT NULL,
        chunk text NOT NULL,
        sha text NOT NULL UNIQUE,
        embedding vector({dim}) NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      """.format(dim=EMBED_DIM)
    )
    cur.execute(
      """
      CREATE INDEX IF NOT EXISTS doc_chunks_source_idx ON doc_chunks (source);
      """
    )
    cur.execute(
      """
      CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
      ON doc_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
      """
    )
  conn.commit()


def insert_chunks(conn, rows):
  sql = """
    INSERT INTO doc_chunks (id, source, chunk, sha, embedding)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (sha) DO NOTHING;
  """
  with conn.cursor() as cur:
    cur.executemany(sql, rows)
  conn.commit()


def collect_rows(model, files, chunk_size, overlap, batch_size):
  buffer = []
  for path in files:
    with open(path, 'r', encoding='utf-8', errors='ignore') as handle:
      text = handle.read()
    for chunk in chunk_text(text, chunk_size, overlap):
      clean = chunk.strip()
      if not clean:
        continue
      sha = hashlib.sha1((path + clean).encode('utf-8')).hexdigest()
      buffer.append((path, clean, sha))
      if len(buffer) >= batch_size:
        for batch in yield_embeddings(model, buffer):
          yield batch
        buffer = []
  if buffer:
    for batch in yield_embeddings(model, buffer):
      yield batch


def yield_embeddings(model, buffer):
  texts = [item[1] for item in buffer]
  embeds = model.encode(
    texts,
    normalize_embeddings=True,
    convert_to_numpy=True,
  )
  rows = []
  for (path, chunk, sha), embed in zip(buffer, embeds):
    rows.append(
      (
        uuid.uuid4(),
        path,
        chunk,
        sha,
        Vector(embed.tolist()),
      )
    )
  yield rows


def main():
  parser = argparse.ArgumentParser(description='Ingest docs into pgvector.')
  parser.add_argument('--dsn', default=os.environ.get('DATABASE_URL') or os.environ.get('PGVECTOR_URL'), help='Postgres connection string (uses DATABASE_URL or PGVECTOR_URL if unset).')
  parser.add_argument('--include', nargs='+', default=DEFAULT_INCLUDE, help='Glob patterns to include.')
  parser.add_argument('--exclude-dirs', nargs='+', default=sorted(DEFAULT_EXCLUDE_DIRS), help='Directory names to skip.')
  parser.add_argument('--chunk-size', type=int, default=800, help='Chunk size in characters.')
  parser.add_argument('--overlap', type=int, default=120, help='Chunk overlap in characters.')
  parser.add_argument('--batch-size', type=int, default=32, help='How many chunks to embed before writing.')
  args = parser.parse_args()

  if not args.dsn:
    raise SystemExit('DATABASE_URL or PGVECTOR_URL is required.')

  print('Loading model %s ...' % MODEL_NAME)
  model = SentenceTransformer(MODEL_NAME)

  files = list(iter_files(args.include, set(args.exclude_dirs)))
  if not files:
    raise SystemExit('No files matched include globs: %s' % args.include)

  conn = connect(args.dsn)
  register_vector(conn)
  ensure_schema(conn)

  total = 0
  for rows in collect_rows(model, files, args.chunk_size, args.overlap, args.batch_size):
    insert_chunks(conn, rows)
    total += len(rows)
    print('Inserted %d chunks...' % total)

  conn.close()
  print('Done. Total chunks inserted: %d' % total)


if __name__ == '__main__':
  main()
