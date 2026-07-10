import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requestJson } from '@/lib/api';

const events = [
  ['Feedback captured', 'User accepted off-peak EV charging recommendation.', CheckCircle2],
  ['Preference learned', 'User prefers comfort-preserving HVAC actions before aggressive savings.', MessageSquare],
  ['Ranking updated', 'Future agent can boost low-effort actions with high acceptance.', TrendingUp],
];

export function LearningHistoryPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('Placeholder trail showing where feedback-driven behavior will live.');

  async function submitFeedback() {
    setStatus('sending');

    try {
      const response = await requestJson<{ message: string }>('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: 'rec-ev-shift',
          rating: 5,
          comment: 'Accepted for pilot.',
        }),
      });

      setMessage(response.message);
      setStatus('sent');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send feedback right now.');
      setStatus('error');
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Learning History</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {events.map(([title, detail, Icon]) => {
            const EventIcon = Icon as typeof CheckCircle2;
            return (
              <div key={String(title)} className="flex gap-3 rounded-lg border border-white/60 bg-white/45 p-4">
                <EventIcon className="mt-0.5 h-5 w-5 text-teal-700" />
                <div>
                  <p className="font-semibold">{String(title)}</p>
                  <p className="text-sm text-slate-600">{String(detail)}</p>
                </div>
              </div>
            );
          })}
          {status === 'error' ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">
              <AlertTriangle className="h-4 w-4" />
              Feedback could not be recorded. The placeholder history is still available.
            </div>
          ) : null}
          <Button className="mt-2 w-fit" onClick={submitFeedback} disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Feedback Sent' : 'Send Sample Feedback'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
