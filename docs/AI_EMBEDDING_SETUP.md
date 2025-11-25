# AI Embedding Setup (BGE + pgvector)

Dependencies (Python 3.10+):
- `pip install -r ai/requirements.txt`

Database:
- Postgres with the `vector` extension available (pgvector installed).
- Enable once: `CREATE EXTENSION IF NOT EXISTS vector;`

Ingest docs into pgvector:
```
export DATABASE_URL=postgresql://user:pass@localhost:5432/ai
python ai/ingest.py \
  --include docs/**/*.md *.md \
  --exclude-dirs .git node_modules test-results vendor
```
- Model: `BAAI/bge-small-en-v1.5` (384 dims, normalized).
- Schema is created automatically; chunks are deduped by SHA.
- Chunking defaults: 800 chars, 120 overlap; adjust with `--chunk-size` / `--overlap`.

Query:
```
python ai/query.py "How do I run tests?" --k 5 --source-like docs/%%
```
- Returns top matches with cosine-based scores.
- Filter by source using SQL ILIKE patterns (`--source-like`).

API bridge (FastAPI):
```
export DATABASE_URL=postgresql://user:pass@localhost:5432/ai
uvicorn ai.api:app --host 0.0.0.0 --port 8000
```
- Health: `GET /health`
- Ask: `POST /ask` with JSON `{"question": "...", "k": 5, "sources": ["docs/%"]}`
- Returns scores, chunks, sources, timestamps for easy MetaBuild/925stackai integration.
- Quick smoke test:
```
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"How do I run tests?","k":3,"sources":["docs/%"]}'
```
If you see top matches with scores and file paths, the pipeline is wired correctly.

Meta API proxy (apps/meta-api):
- Env: set `AI_EMBEDDINGS_URL=http://localhost:8000` (FastAPI host) and optional `AI_EMBEDDINGS_TIMEOUT_MS=8000`.
- Endpoint: `POST http://localhost:4000/ai/ask` with the same payload as above; returns the upstream JSON or 503 if not configured.
- This keeps the PWA calling MetaBuild only; MetaBuild calls the embedding service.

Notes:
- Re-run `ingest.py` after updating docs to refresh embeddings.
- Index uses ivfflat with `lists=100`; adjust inside `ingest.py` if your corpus grows.
