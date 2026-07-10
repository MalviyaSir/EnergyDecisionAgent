import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bot, Database, ServerCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requestJson } from '@/lib/api';

type ModulePageProps = {
  title: string;
  summary: string;
  endpoint: string;
};

export function ModulePage({ title, summary, endpoint }: ModulePageProps) {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('local-json');
  const [agentSlot, setAgentSlot] = useState('forecast-agent');
  const [contract, setContract] = useState(endpoint);
  const contracts = useMemo(() => [{ label: endpoint, value: endpoint }], [endpoint]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    requestJson<unknown>(contract)
      .then((data) => {
        if (active) {
          setPayload({
            controls: {
              dataSource,
              agentSlot,
              contract,
            },
            response: data,
          });
        }
      })
      .catch((requestError: Error) => {
        if (active) {
          setError(requestError.message);
          setPayload(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [agentSlot, contract, dataSource]);

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
          <ControlCard icon={Database} label="Data source">
            <select
              value={dataSource}
              onChange={(event) => setDataSource(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/60 bg-white/70 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
            >
              <option value="local-json">Local JSON files</option>
              <option value="sample-meter-feed">Sample meter feed</option>
            </select>
          </ControlCard>
          <ControlCard icon={Bot} label="Agent slot">
            <select
              value={agentSlot}
              onChange={(event) => setAgentSlot(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/60 bg-white/70 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
            >
              <option value="forecast-agent">Forecast agent</option>
              <option value="peak-risk-agent">Peak-risk agent</option>
            </select>
          </ControlCard>
          <ControlCard icon={ServerCog} label="Contract">
            <select
              value={contract}
              onChange={(event) => setContract(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/60 bg-white/70 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
            >
              {contracts.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder Response</CardTitle>
          <CardDescription>Visible contract for judges and future implementation work.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : (
            <pre className="max-h-[28rem] overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-teal-50">
              {loading ? 'Loading predictions...' : JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ControlCard({ icon: Icon, label, children }: { icon: typeof Database; label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/60 bg-white/45 p-4">
      <Icon className="mb-3 h-5 w-5 text-teal-700" />
      <label className="grid gap-2">
        <span className="font-semibold">{label}</span>
        {children}
      </label>
    </div>
  );
}
