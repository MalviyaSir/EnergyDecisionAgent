import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const events = [
  ['Feedback captured', 'User accepted off-peak EV charging recommendation.', CheckCircle2],
  ['Preference learned', 'User prefers comfort-preserving HVAC actions before aggressive savings.', MessageSquare],
  ['Ranking updated', 'Future agent can boost low-effort actions with high acceptance.', TrendingUp],
];

export function LearningHistoryPage() {
  async function submitFeedback() {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendationId: 'rec-ev-shift',
        rating: 5,
        comment: 'Accepted for pilot.',
      }),
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Learning History</CardTitle>
          <CardDescription>Placeholder trail showing where feedback-driven behavior will live.</CardDescription>
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
          <Button className="mt-2 w-fit" onClick={submitFeedback}>
            Send Sample Feedback
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
