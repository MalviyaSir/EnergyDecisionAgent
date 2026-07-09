import React, { useState } from 'react';

import { requestJson } from '@/lib/api';

type ChatResponse = {
  answer: string;
  suggested_actions: string[];
  summary?: string;
  root_cause?: string;
  key_findings?: string[];
  top_recommendations?: string[];
  estimated_savings?: string;
  carbon_reduction?: string;
  business_impact?: string;
  priority?: string;
  confidence?: number;
  next_best_action?: string;
};

export function ChatPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ChatResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResponse(null);

    const trimmed = message.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      // Backend endpoint (FastAPI): POST /chat
      const data = await requestJson<ChatResponse>('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Energy Consultant Chat</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full resize-y rounded border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about energy waste, bill reduction, or building health..."
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </form>

      {response ? (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Answer</h2>
            <div className="whitespace-pre-wrap rounded border bg-white p-3 text-sm">
              {response.answer}
            </div>
          </div>

          {response.suggested_actions?.length ? (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Suggested actions</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {response.suggested_actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

