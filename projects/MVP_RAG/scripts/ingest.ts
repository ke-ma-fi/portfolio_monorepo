import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { FaqEntry } from '../src/lib/types.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

const embeddingModel = openai.embedding('text-embedding-3-small');

async function ingest() {
  const raw = readFileSync(resolve(process.cwd(), 'data/faq-data.json'), 'utf-8');
  const entries: FaqEntry[] = JSON.parse(raw);

  console.log(`Ingesting ${entries.length} entries...`);

  // Truncate first so the script is idempotent — safe to re-run
  const { error: deleteError } = await supabase.from('documents').delete().neq('id', 0);
  if (deleteError) {
    console.error('Failed to clear documents table:', deleteError.message);
    process.exit(1);
  }

  for (const entry of entries) {
    const { embedding } = await embed({
      model: embeddingModel,
      value: entry.content,
    });

    const { error } = await supabase.from('documents').insert({
      content: entry.content,
      embedding,            // number[1536] — supabase-js serialises to pgvector format
      workspace_id: entry.workspace_id,
    });

    if (error) {
      console.error(`  ✗ [${entry.workspace_id}] ${entry.topic}: ${error.message}`);
    } else {
      console.log(`  ✓ [${entry.workspace_id}] ${entry.topic}`);
    }
  }

  console.log('\nIngestion complete.');
}

ingest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
