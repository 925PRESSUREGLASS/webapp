"""Query pgvector embeddings with BGE-small."""

import argparse
import os
import textwrap

from pgvector.psycopg import Vector, register_vector
from psycopg import connect
from sentence_transformers import SentenceTransformer


MODEL_NAME = 'BAAI/bge-small-en-v1.5'


def search(conn, query_embed, k, source_like):
  where = ''
  params = [Vector(query_embed.tolist())]
  if source_like:
    clauses = []
    for pattern in source_like:
      clauses.append('source ILIKE %s')
      params.append(pattern)
    where = 'WHERE ' + ' OR '.join(clauses)
  params.append(Vector(query_embed.tolist()))
  params.append(k)
  sql = """
    SELECT source,
           chunk,
           1 - (embedding <=> %s) AS score,
           created_at
    FROM doc_chunks
    {where}
    ORDER BY embedding <=> %s
    LIMIT %s;
  """.format(where=where)
  with conn.cursor() as cur:
    cur.execute(sql, params)
    return cur.fetchall()


def format_result(row):
  source, chunk, score, created_at = row
  preview = textwrap.shorten(' '.join(chunk.split()), width=220, placeholder=' ...')
  return '%0.4f | %s | %s\n%s\n' % (score, created_at.date(), source, preview)


def main():
  parser = argparse.ArgumentParser(description='Query pgvector doc embeddings.')
  parser.add_argument('question', help='User question or query text.')
  parser.add_argument('--dsn', default=os.environ.get('DATABASE_URL') or os.environ.get('PGVECTOR_URL'), help='Postgres connection string (uses DATABASE_URL or PGVECTOR_URL if unset).')
  parser.add_argument('--k', type=int, default=5, help='How many results to return.')
  parser.add_argument('--source-like', nargs='*', default=None, help='Optional SQL ILIKE patterns to filter sources (e.g., docs/%%).')
  args = parser.parse_args()

  if not args.dsn:
    raise SystemExit('DATABASE_URL or PGVECTOR_URL is required.')

  model = SentenceTransformer(MODEL_NAME)
  query_embed = model.encode([args.question], normalize_embeddings=True, convert_to_numpy=True)[0]

  conn = connect(args.dsn)
  register_vector(conn)
  rows = search(conn, query_embed, args.k, args.source_like)
  conn.close()

  if not rows:
    print('No results.')
    return

  for row in rows:
    print(format_result(row))


if __name__ == '__main__':
  main()
