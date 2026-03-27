---
theme: default
title: RAG-System — Technischer Deep Dive
author: Kevin Fischer
highlighter: shiki
lineNumbers: true
colorSchema: light
fonts:
  sans: Inter
  mono: Fira Code
---

# RAG-System
## Technischer Deep Dive

**Next.js · Supabase pgvector · OpenAI · Vercel AI SDK**

<div class="mt-8 text-sm text-gray-400">
Recruiting-Challenge — Umgesetzt in ~3h
</div>

---

# Die Aufgabe

Ein **produktionsreifes RAG-System** von Grund auf bauen.

<div class="grid grid-cols-2 gap-8 mt-8">
<div>

### Anforderungen
- Mandantenfähige Wissensbasis
- Semantische Suche über Dokumente
- Gestreamte LLM-Antworten
- Sauberes TypeScript durchgehend

</div>
<div>

### Rahmenbedingungen
- Kein LangChain oder LlamaIndex
- Kein ORM für die Vektorsuche
- Nur nativer Supabase-Client + AI SDK
- Scope: 2–4 Stunden

</div>
</div>

---

# Architektur

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│          Next.js · useChat · DefaultChatTransport       │
└────────────────────┬────────────────────────────────────┘
                     │  POST /api/chat  { messages, workspace_id }
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    API Route (Node.js)                  │
│                                                         │
│  1. embed(query)  →  text-embedding-3-small (1536-dim)  │
│  2. supabase.rpc('match_documents', { workspace_id })   │
│  3. build context string from top-k chunks              │
│  4. streamText(gpt-4o-mini, system + context)           │
│  5. toUIMessageStreamResponse()  →  stream to client    │
└──────────┬──────────────────────────────────┬───────────┘
           │                                  │
           ▼                                  ▼
  ┌─────────────────┐               ┌──────────────────┐
  │   Supabase DB   │               │      OpenAI      │
  │  pgvector RPC   │               │  gpt-4o-mini     │
  │  cosine sim.    │               │  streaming       │
  └─────────────────┘               └──────────────────┘
```

---

# Tech-Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| Framework | Next.js 15 App Router | Dateibasiertes Routing, RSC, edge-fähig |
| Datenbank | Supabase PostgreSQL | Managed, pgvector integriert |
| Vektorspeicher | `extensions.vector(1536)` + RPC | Kein ORM nötig, Cosine Similarity |
| Embeddings | `text-embedding-3-small` | Schnell, günstig, 1536-dimensional |
| LLM | `gpt-4o-mini` | Bestes Preis-Leistungs-Verhältnis für Q&A |
| KI-Orchestrierung | Vercel AI SDK v6 | `streamText`, `useChat`, `embed` |
| Styling | Tailwind CSS v4 | Utility-first, kein Konfigurationsaufwand |

---

# Die RAG-Pipeline

<div class="grid grid-cols-2 gap-6">
<div>

**Schritt 1 — Query einbetten**
```ts
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: queryText,
});
```

**Schritt 2 — Vektorsuche (mandantenspezifisch)**
```ts
const { data: docs } = await supabase
  .rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
    filter_workspace_id: workspace_id,
  });
```

</div>
<div>

**Schritt 3 — Kontext aufbauen**
```ts
const context = docs
  .map((d) => d.content)
  .join('\n\n');
```

**Schritt 4 — Fundierte Antwort streamen**
```ts
const result = streamText({
  model: openai('gpt-4o-mini'),
  system: `Answer using ONLY the context below.
If not found, say so.

Context:\n${context}`,
  messages: await convertToModelMessages(messages),
});
```

**Schritt 5 — Stream zurückgeben**
```ts
return result.toUIMessageStreamResponse();
```

</div>
</div>

---

# Mandantenfähigkeit

Jede Operation ist an eine `workspace_id` gebunden. Kein Mandant sieht die Daten eines anderen.

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**Beim Ingest** (`scripts/ingest.ts`)
```ts
await supabase.from('documents').insert({
  content: item.content,
  embedding: vector,
  workspace_id: item.workspace_id,  // ← gespeichert
});
```

**Bei der Abfrage** (`/api/chat`)
```ts
supabase.rpc('match_documents', {
  filter_workspace_id: workspace_id, // ← erzwungen
  ...
})
```

</div>
<div>

**Zwei Demo-Workspaces**

`acme-hr` — HR-Wissensbasis
- Urlaubsregelung
- Leistungsbeurteilungen
- Remote-Work-Policy
- Gesundheitsleistungen
- Onboarding-Programm

`acme-eng` — Engineering-Dokumentation
- API-Rate-Limits
- Authentifizierung
- Webhooks
- Offizielle SDKs
- Umgebungen

**UI** setzt das Gespräch beim Workspace-Wechsel zurück.

</div>
</div>

---

# Frontend — `useChat` mit Workspace-Injektion

```tsx {all|7-14|16-19}
export default function ChatPage() {
  const [workspaceId, setWorkspaceId] = useState('acme-hr');
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  const { messages, sendMessage, status } = useChat({
    transport: useMemo(
      () => new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, ...body, workspace_id: workspaceIdRef.current },
        }),
      }),
      []
    ),
  });

  useEffect(() => {
    setMessages([]);         // Gespräch bei Workspace-Wechsel leeren
  }, [workspaceId]);
```

`workspaceIdRef` hält den Transport stabil und liest dennoch immer die aktuelle Workspace — kein veralteter Closure.

---

# API-Route — Server-only, Node.js-Runtime

```ts {all|1|8-13|15-21}
export const runtime = 'nodejs';  // supabase-js benötigt Node-APIs

export async function POST(req: NextRequest) {
  const { messages, workspace_id } = await req.json();

  // 1. Einbetten
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: queryText,
  });

  // 2. Ähnlichkeitssuche — mandantenspezifisch
  const { data: docs } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
    filter_workspace_id: workspace_id,
  });

  // 3. Fundierte Antwort streamen
  const result = streamText({ model: openai('gpt-4o-mini'), ... });
  return result.toUIMessageStreamResponse();
}
```

`OPENAI_API_KEY` verlässt niemals den Server. Der Supabase-Publishable-Key ist sicher exponierbar.

---

# Datenbankschema

```sql
-- pgvector liegt im extensions-Schema (nicht in public)
create table public.documents (
  id            bigint primary key generated always as identity,
  content       text        not null,
  embedding     extensions.vector(1536),
  workspace_id  text        not null
);

-- Cosine-Similarity-RPC — verwendet durch die API-Route
create or replace function match_documents(
  query_embedding     extensions.vector(1536),
  match_threshold     float,
  match_count         int,
  filter_workspace_id text
) returns table (id bigint, content text, similarity float)
language sql stable as $$
  select id, content,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where workspace_id = filter_workspace_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

---

# Live-Demo

<div class="text-center mt-8">

Das Chat-UI ausprobieren und fragen:

<div class="grid grid-cols-2 gap-8 mt-6 text-left">
<div class="bg-blue-50 rounded-lg p-4">

**Workspace: Acme HR**

- *„Wie viele Urlaubstage stehen mir zu?"*
- *„Kann ich vollständig im Homeoffice arbeiten?"*
- *„Wann ist die Anmeldefrist für Gesundheitsleistungen?"*

</div>
<div class="bg-green-50 rounded-lg p-4">

**Workspace: Acme Engineering**

- *„Was sind die API-Rate-Limits im Pro-Plan?"*
- *„Wie verifiziere ich die Authentizität von Webhooks?"*
- *„Gibt es ein offizielles Node.js-SDK?"*

</div>
</div>

<div class="mt-8 text-sm text-gray-500">
Antworten sind fundiert — wenn die Information im Workspace nicht vorhanden ist, sagt das Modell es klar.
</div>

</div>

---

# Was wurde umgesetzt

<div class="grid grid-cols-2 gap-6">
<div>

### Erledigt
- Supabase-Schema mit pgvector
- Ingestion-Skript (`pnpm run ingest`)
- RAG-API-Route mit Streaming
- Mandantenspezifische Workspace-Isolation
- Streaming-Chat-UI mit Workspace-Auswahl
- Einzelnes Vercel-Deployment

</div>
<div>

### Bewusste Kompromisse
- Keine Authentifizierung (außerhalb des Scopes)
- Statische Wissensbasis (JSON-Datei)
- Keine Quellenangaben im UI (Fokus auf RAG-Kern)
- Einzelne API-Route (kein unnötiger Service-Layer)

### Nächste Schritte
- Supabase Auth pro Workspace
- Dokument-Upload-UI
- Gestreamte Quellenangaben
- Retrieval-Qualitätsmetriken (MRR, Recall@k)

</div>
</div>

---

# Vielen Dank

<div class="text-center mt-12">

**Stack:** Next.js 15 · Supabase pgvector · OpenAI · Vercel AI SDK v6

**Ansatz:** Minimale, korrekte, produktionsreife Muster — keine Magie, keine Frameworks-in-Frameworks.

<div class="mt-8 text-sm text-gray-400">
Fragen willkommen.
</div>

</div>
