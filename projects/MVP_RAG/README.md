# RAG Chat — Next.js + Supabase

A minimal, end-to-end Retrieval-Augmented Generation (RAG) system built as a recruiting challenge. Users can ask questions through a streaming chat interface, and answers are grounded in a per-workspace knowledge base stored in Supabase with pgvector.

---

## Architecture

```
User query
    │
    ▼
[Frontend] useChat (Vercel AI SDK)
    │  POST /api/chat  { messages, workspace_id }
    ▼
[API Route] /api/chat
    ├─ 1. Embed query      → OpenAI text-embedding-3-small
    ├─ 2. Vector search    → Supabase RPC match_documents (pgvector cosine)
    ├─ 3. Build context    → top-k retrieved chunks, filtered by workspace_id
    └─ 4. Stream answer    → OpenAI gpt-4o-mini via Vercel AI SDK streamText
    │
    ▼
[Frontend] streamed response rendered in real time
```

**Multi-tenancy:** Every document insert and every vector query is scoped to a `workspace_id`. The frontend exposes a workspace selector dropdown — switching it clears the conversation and re-scopes all subsequent queries.

---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project with the following setup:

### Supabase Setup SQL

Run this in the Supabase SQL Editor:

```sql
-- Enable pgvector (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content     text NOT NULL,
  embedding   extensions.vector(1536),
  workspace_id text NOT NULL
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding   extensions.vector(1536),
  match_threshold   float,
  match_count       int,
  filter_workspace_id text
)
RETURNS TABLE (
  id            bigint,
  content       text,
  workspace_id  text,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    workspace_id,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.documents
  WHERE
    workspace_id = filter_workspace_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## Setup

1. **Clone and install**

```bash
git clone <repo-url>
cd MVP_RAG
pnpm install
```

2. **Configure environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
OPENAI_API_KEY=sk-...
```

Find `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` in your Supabase project under **Settings → API**.

> `OPENAI_API_KEY` is server-only and is never exposed to the client bundle.

3. **Run the ingestion script**

Embeds the FAQ knowledge base and stores it in Supabase:

```bash
pnpm run ingest
```

Expected output:
```
Ingesting 10 entries...
  ✓ [acme-hr] Annual Leave
  ✓ [acme-hr] Performance Reviews
  ...
  ✓ [acme-eng] Environments
Ingestion complete.
```

> Re-running the script is safe — it truncates the table before inserting.

4. **Start the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

The app includes two demo workspaces:

| Workspace | Topic | Example question |
|---|---|---|
| **Acme HR** | HR policies | "How many vacation days do I get?" |
| **Acme Engineering** | Developer platform | "What is the API rate limit?" |

Switch workspaces with the dropdown in the top-right corner. The conversation history resets on each switch. Try asking a question from one workspace while the other is selected — the assistant will say it doesn't have that information, demonstrating workspace isolation.

---

## Design Decisions

**No LangChain / LlamaIndex.** The RAG pipeline is ~30 lines of straightforward code. Bringing in an orchestration framework would add abstraction without value at this scope.

**Vercel AI SDK for everything AI-related.** `embed()` and `streamText()` from the SDK provide a clean, type-safe interface to OpenAI. `useChat` on the client handles streaming and message state out of the box.

**Supabase RPC for vector search.** Calling `.rpc('match_documents')` keeps the query logic in the database, makes the `workspace_id` filter explicit, and avoids any ORM overhead.

**Factory function for the Supabase client.** A factory (`createServerClient()`) instead of a module-level singleton ensures no state leaks between serverless function invocations.

**`runtime = 'nodejs'` on the API route.** `@supabase/supabase-js` depends on Node.js built-ins (`https`, `Buffer`) that are unavailable in the Vercel Edge runtime.

**`workspace_id` in every operation.** Multi-tenancy is enforced at the data layer (not just the UI) — every insert tags the row and every query filters by it.

**Single chunk per FAQ entry.** Each entry is a short, focused paragraph (80–150 tokens). No chunking strategy is needed at this scale. For longer documents, sentence-boundary splitting with overlap would be the next step.
