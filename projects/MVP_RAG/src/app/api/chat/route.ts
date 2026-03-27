import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { embed, streamText, convertToModelMessages } from 'ai';
import { createServerClient } from '@/lib/supabase';
import type { MatchedDocument, ChatRequestBody } from '@/lib/types';

// supabase-js requires Node.js APIs — not compatible with the Edge runtime
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, workspace_id } = body;

    if (!workspace_id) {
      return new Response('Missing workspace_id', { status: 400 });
    }

    // Extract text from the latest user message
    const lastMessage = messages.at(-1);
    const queryText = lastMessage?.parts
      .filter((p) => p.type === 'text')
      .map((p) => ('text' in p ? (p.text as string) : ''))
      .join(' ')
      .trim();

    if (!queryText) {
      return new Response('Empty query', { status: 400 });
    }

    // 1. Embed the query
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: queryText,
    });

    // 2. Vector similarity search — scoped to the requested workspace
    const supabase = createServerClient();
    const { data: docs, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2,
      match_count: 5,
      filter_workspace_id: workspace_id,
    });

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      return new Response('Vector search failed', { status: 500 });
    }

    // 3. Build context string from retrieved chunks
    const context = (docs as MatchedDocument[])
      .map((d) => d.content)
      .join('\n\n');

    // 4. Stream a grounded response with gpt-4o-mini
    //    convertToModelMessages is async in SDK v6
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful assistant. Answer the user's question using ONLY the information in the context below.
If the answer is not present in the context, say "I don't have that information in the current workspace."
Be concise and accurate.

Context:
${context}`,
      messages: await convertToModelMessages(messages),
    });

    // toUIMessageStreamResponse() is required for useChat in SDK v6
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('Chat route error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
