import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Database, ServerCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ModulePageProps = {
  title: string;
  summary: string;
  endpoint: string;
};

export function ModulePage({ title, summary, endpoint }: ModulePageProps) {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(endpoint)
      .then((response) => response.json())
      .then(setPayload)
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{summary}</CardDescription>
            </div>
            <Badge tone="teal">API connected</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            [Database, 'Data source', 'Local JSON files today, swappable repository layer later.'],
            [Bot, 'Agent slot', 'Placeholder response shape prepared for future AI orchestration.'],
            [ServerCog, 'Contract', endpoint],
          ].map(([Icon, label, detail]) => {
            const ModuleIcon = Icon as typeof Database;
            return (
              <div key={String(label)} className="rounded-lg border border-white/60 bg-white/45 p-4">
                <ModuleIcon className="mb-3 h-5 w-5 text-teal-700" />
                <p className="font-semibold">{String(label)}</p>
                <p className="mt-1 text-sm text-slate-600">{String(detail)}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder Response</CardTitle>
          <CardDescription>Visible contract for judges and future implementation work.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[28rem] overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-teal-50">
            {loading ? 'Loading...' : JSON.stringify(payload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </motion.div>
  );
}
