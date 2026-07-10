import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
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

const starterPrompts = [
  'How can I reduce today\'s energy bill?',
  'If I add two AC units what happens?',
  'What room is consuming the most power?',
  'What recommendations do you have?',
];

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
      const data = await requestJson<ChatResponse>('/api/chat', {
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-4 p-2">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/20 text-teal-200">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Energy Consultant</h1>
            <p className="text-sm text-slate-400">Ask natural questions and the assistant will explain recommendations using live telemetry.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <textarea
            className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-white outline-none focus:border-teal-300"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about energy waste, bill reduction, HVAC, occupancy, or forecast scenarios..."
          />

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} className="rounded-2xl bg-teal-400 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60">
              {loading ? 'Thinking…' : 'Ask the agent'}
            </button>
            {error ? <div className="text-sm text-rose-300">{error}</div> : null}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => setMessage(prompt)} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10">
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {response ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex items-center gap-2 text-teal-200">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Live response</span>
          </div>
          <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
            {response.answer}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h2 className="mb-2 font-semibold text-white">Summary</h2>
              <p className="text-sm text-slate-300">{response.summary ?? 'Live analysis is attached to this answer.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h2 className="mb-2 font-semibold text-white">Suggested actions</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                {response.suggested_actions?.map((action) => <li key={action}>{action}</li>)}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p className="text-slate-500">Estimated savings</p>
              <p className="mt-1 font-semibold text-white">{response.estimated_savings ?? 'Live model pending'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p className="text-slate-500">CO₂ impact</p>
              <p className="mt-1 font-semibold text-white">{response.carbon_reduction ?? 'Live model pending'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p className="text-slate-500">Priority</p>
              <p className="mt-1 font-semibold text-white">{response.priority ?? 'High'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

