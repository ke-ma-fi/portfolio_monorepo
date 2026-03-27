'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef, useMemo } from 'react';

const WORKSPACES = [
  { id: 'acme-hr', label: 'Acme HR' },
  { id: 'acme-eng', label: 'Acme Engineering' },
];

export default function ChatPage() {
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep workspace ID accessible inside the stable transport without recreating it
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: '/api/chat',
          // prepareSendMessagesRequest replaces the entire body — must include messages explicitly
          prepareSendMessagesRequest: ({ messages, body }) => ({
            body: { messages, ...body, workspace_id: workspaceIdRef.current },
          }),
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    ),
  });

  // Clear conversation when the user switches workspace
  useEffect(() => {
    setMessages([]);
  }, [workspaceId, setMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isLoading = status === 'submitted' || status === 'streaming';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  }

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4 gap-4">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">RAG Chat</h1>
          <a
            href="/slides/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View Slides
          </a>
        </div>
        <select
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm bg-white"
        >
          {WORKSPACES.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.label}
            </option>
          ))}
        </select>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask anything about the{' '}
            <strong>{WORKSPACES.find((w) => w.id === workspaceId)?.label}</strong> knowledge base.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg px-4 py-2 text-sm max-w-prose whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-100'
            }`}
          >
            {msg.parts
              .filter((p) => p.type === 'text')
              .map((p, i) => (
                <span key={i}>{(p as { type: 'text'; text: string }).text}</span>
              ))}
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-400 italic">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </form>
    </main>
  );
}
