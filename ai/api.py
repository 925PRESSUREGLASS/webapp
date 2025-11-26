"""Tiny FastAPI bridge for pgvector doc search with BGE-small embeddings."""

import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pgvector.psycopg import Vector, register_vector
from psycopg import connect
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel, Field


MODEL_NAME = 'BAAI/bge-small-en-v1.5'


def get_dsn():
  return os.environ.get('DATABASE_URL') or os.environ.get('PGVECTOR_URL')


def load_model():
  return SentenceTransformer(MODEL_NAME)


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


app = FastAPI(title='Doc Q&A Bridge', version='0.1.0')
model = load_model()


@app.get('/health')
def health():
  return {'status': 'ok', 'model': MODEL_NAME}


class AskPayload(BaseModel):
  question: str = Field(..., description='User question or query text.')
  k: int = Field(5, description='How many results to return.')
  sources: Optional[List[str]] = Field(None, description='Optional SQL ILIKE patterns.')


@app.post('/ask')
def ask(payload: AskPayload):
  dsn = get_dsn()
  if not dsn:
    raise HTTPException(status_code=500, detail='DATABASE_URL or PGVECTOR_URL is required.')
  if not payload.question:
    raise HTTPException(status_code=400, detail='question is required.')

  query_embed = model.encode(
    [payload.question],
    normalize_embeddings=True,
    convert_to_numpy=True,
  )[0]

  conn = connect(dsn)
  register_vector(conn)
  try:
    rows = search(conn, query_embed, payload.k or 5, payload.sources)
  finally:
    conn.close()

  results = []
  for source, chunk, score, created_at in rows:
    results.append(
      {
        'score': float(score),
        'source': source,
        'chunk': chunk,
        'created_at': created_at.isoformat(),
      }
    )
  return {'question': payload.question, 'results': results}
