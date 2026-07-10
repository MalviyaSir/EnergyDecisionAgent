import type { LiveMeterReading } from '@shared/energy';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type LiveMeterFeedProps = {
  readings: LiveMeterReading[];
};

export function LiveMeterFeed({ readings }: LiveMeterFeedProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-white">Live Meter Feed</CardTitle>
            <CardDescription className="text-slate-400">Latest 10 readings, refreshed every 5 seconds.</CardDescription>
          </div>
          <Badge tone="teal">Auto</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr] bg-white/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <span>Time</span>
            <span>Units</span>
            <span>Voltage</span>
            <span>Current</span>
            <span>Temp</span>
            <span>Status</span>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr] border-t border-white/10 px-4 py-3 text-sm text-slate-200"
              >
                <span>{reading.time}</span>
                <span>{reading.units} kWh</span>
                <span>{reading.voltage} V</span>
                <span>{reading.current} A</span>
                <span>{reading.temperature} C</span>
                <span>
                  <span className={statusClass(reading.status)}>{reading.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusClass(status: LiveMeterReading['status']) {
  if (status === 'Watch') {
    return 'rounded-full bg-rose-400/15 px-2 py-1 text-xs font-bold text-rose-200';
  }

  if (status === 'Elevated') {
    return 'rounded-full bg-amber-400/15 px-2 py-1 text-xs font-bold text-amber-200';
  }

  return 'rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-bold text-emerald-200';
}
