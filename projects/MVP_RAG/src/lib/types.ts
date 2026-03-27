// Shape of each entry in data/faq-data.json
export interface FaqEntry {
  workspace_id: string;
  topic: string;
  content: string;
}

// Shape of a row returned from the match_documents RPC
export interface MatchedDocument {
  id: number;
  content: string;
  workspace_id: string;
  similarity: number;
}

// Shape of the POST body sent to /api/chat
import type { UIMessage } from 'ai';

export interface ChatRequestBody {
  messages: UIMessage[];
  workspace_id: string;
}
