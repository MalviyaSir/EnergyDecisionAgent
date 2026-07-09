import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MeterDataRecord } from '@shared/energy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type EnergyChartProps = {
  data: MeterDataRecord[];
};

export function EnergyChart({ data }: EnergyChartProps) {
  const chartData = data.map((record) => ({
    day: new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    consumption: record.energyConsumed,
    solar: record.solarGeneration,
    price: record.electricityPrice * 100,
  }));

  return (
    <Card className="min-h-[24rem]">
      <CardHeader>
        <CardTitle>Smart Meter Signal</CardTitle>
        <CardDescription>Daily consumption, solar generation, and tariff pressure.</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="consumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.38} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="solar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.9)',
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="consumption" stroke="#0f766e" fill="url(#consumption)" strokeWidth={2} />
            <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#solar)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
