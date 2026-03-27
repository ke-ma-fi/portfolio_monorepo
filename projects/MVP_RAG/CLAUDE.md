# RAG Challenge – Next.js + Supabase

## Role & Mission
Expert AI & Fullstack Engineer working on a minimal, performant Retrieval-Augmented-Generation (RAG) system. This is a recruiting challenge (2–4h scope). Focus: clean code, simple architecture, zero bugs.

## Tech Stack (STRICT)
- **Framework:** Next.js (App Router, TypeScript)
- **Package Manager:** pnpm
- **Database / Vector Store:** Supabase (PostgreSQL + `pgvector` in `extensions` schema)
- **LLM & Embeddings:** OpenAI (`gpt-4o-mini` for text, `text-embedding-3-small` for vectors)
- **AI Orchestration:** Vercel AI SDK v6 (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- **DB Client:** `@supabase/supabase-js`
- **Styling:** Tailwind CSS v4

## Roadmap
- [x] Step 1: Supabase Setup (`documents` table with `extensions.vector(1536)` and `match_documents` RPC exist)
- [x] Step 2: Ingestion Script (`scripts/ingest.ts` + `data/faq-data.json`, run with `pnpm run ingest`)
- [x] Step 3: RAG API Route (`src/app/api/chat/route.ts`)
- [x] Step 4: Frontend (`src/app/page.tsx` with `useChat` hook + workspace selector)
- [x] Step 5: README

## Architecture Rules (DOs)
1. **Multi-tenancy (bonus):** Every RAG query and every DB insert MUST respect `workspace_id`.
2. **Minimalism:** Use only the Vercel AI SDK and the native Supabase client.
3. **Streaming:** LLM responses MUST be streamed to the frontend via `streamText` from the Vercel AI SDK.
4. **Error handling:** Catch API and DB errors cleanly (try/catch); return meaningful error messages to the frontend.
5. **Types:** Write clean TypeScript interfaces for Supabase responses and the JSON data model.

## Strict Constraints (DON'Ts)
1. **NO LangChain or LlamaIndex** — too heavy for this scope. Use raw `@supabase/supabase-js` for vector search and `@ai-sdk/openai` for LLM generation.
2. **NO ORMs for vector search** — no Prisma or Drizzle. Use `.rpc('match_documents')` via the Supabase client.
3. **NO web scraping / PDF parsing** — knowledge base lives in `faq-data.json` locally. No complex loaders.
4. **NO secrets in code or git** — `.env.local` MUST be in `.gitignore`. Always maintain `.env.example`. API keys must never be exposed to the frontend.

## Database Schema Reference
- **pgvector:** lives in the `extensions` schema (not `public`).
- **Table `documents` (public schema):**
  - `id` — bigint
  - `content` — text
  - `embedding` — extensions.vector(1536)
  - `workspace_id` — text
- **RPC function:**
  ```sql
  match_documents(
    query_embedding extensions.vector(1536),
    match_threshold  float,
    match_count      int,
    filter_workspace_id text
  )
  ```

## Key File Locations
- Knowledge base: `data/faq-data.json`
- Ingestion script: `scripts/ingest.ts`
- API route: `src/app/api/chat/route.ts`
- Chat UI: `src/app/page.tsx`
- Supabase types: `src/lib/types.ts`
- Supabase client (server): `src/lib/supabase.ts`

## Environment Variables
Required in `.env.local` (never commit):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
OPENAI_API_KEY=
```
`OPENAI_API_KEY` is server-only — never expose to the client bundle.
