import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import type { ApplianceUsage } from '@shared/energy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const colors = ['#0f766e', '#f59e0b', '#e11d48', '#2563eb', '#7c3aed'];

type ApplianceBreakdownProps = {
  usage: ApplianceUsage;
};

export function ApplianceBreakdown({ usage }: ApplianceBreakdownProps) {
  const data = Object.entries(usage).map(([name, value]) => ({ name, value }));

  return (
    <Card className="min-h-[24rem]">
      <CardHeader>
        <CardTitle>Load Attribution</CardTitle>
        <CardDescription>Latest day appliance usage mix.</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
