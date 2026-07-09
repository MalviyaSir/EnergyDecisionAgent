import { BatteryCharging, PlugZap, SunMedium } from 'lucide-react';
import type { EnergySource } from '@shared/energy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EnergySourceCardProps = {
  sources: EnergySource[];
};

const sourceMeta = {
  Grid: { icon: PlugZap, color: 'bg-sky-300', text: 'text-sky-200' },
  Solar: { icon: SunMedium, color: 'bg-amber-300', text: 'text-amber-200' },
  Battery: { icon: BatteryCharging, color: 'bg-emerald-300', text: 'text-emerald-200' },
};

export function EnergySourceCard({ sources }: EnergySourceCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white">Energy Source</CardTitle>
        <CardDescription className="text-slate-400">Grid, solar, and battery share for the latest day.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {sources.map((source) => {
          const meta = sourceMeta[source.name];
          const Icon = meta.icon;

          return (
            <div key={source.name}>
              <div className="mb-2 flex items-center justify-between">
                <div className={cn('flex items-center gap-2 font-semibold', meta.text)}>
                  <Icon className="h-4 w-4" />
                  {source.name}
                </div>
                <span className="text-sm font-bold text-white">{source.percentage}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', meta.color)}
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
