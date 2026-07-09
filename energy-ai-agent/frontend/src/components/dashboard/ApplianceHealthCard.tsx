import type { ApplianceHealth } from '@shared/energy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ApplianceHealthCardProps = {
  appliances: ApplianceHealth[];
};

const statusStyles = {
  Normal: 'bg-emerald-400/15 text-emerald-200',
  High: 'bg-amber-400/15 text-amber-200',
  Critical: 'bg-rose-400/15 text-rose-200',
};

const barStyles = {
  Normal: 'bg-emerald-300',
  High: 'bg-amber-300',
  Critical: 'bg-rose-300',
};

export function ApplianceHealthCard({ appliances }: ApplianceHealthCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white">Appliance Health</CardTitle>
        <CardDescription className="text-slate-400">Load, status, and daily cost by major appliance.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {appliances.map((appliance) => (
          <div key={appliance.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{appliance.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {appliance.currentUsage} kWh · ${appliance.estimatedDailyCost.toFixed(2)} daily
                </p>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', statusStyles[appliance.status])}>
                {appliance.status}
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barStyles[appliance.status])}
                style={{ width: `${appliance.loadPercent}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
