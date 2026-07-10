import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { SavingsDistributionPoint, SavingsProjectionPoint } from '@shared/energy';
import { ChartCard } from '@/components/dashboard/ChartCard';

type SavingsChartsProps = {
  projection: SavingsProjectionPoint[];
  distribution: SavingsDistributionPoint[];
};

const pieColors = ['#2dd4bf', '#38bdf8', '#f59e0b', '#fb7185', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#facc15'];

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(15,23,42,0.94)',
  color: '#f8fafc',
};

export function SavingsCharts({ projection, distribution }: SavingsChartsProps) {
  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-2">
      <ChartCard title="Monthly Savings Projection" description="12-month cumulative savings from selected recommendations.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projection} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cumulative Savings']} />
            <Legend />
            <Line type="monotone" dataKey="cumulativeSavings" name="Savings" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Savings Distribution" description="Share of monthly savings by recommendation.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 8, bottom: 48, left: 8 }}>
            <Pie
              data={distribution}
              dataKey="value"
              nameKey="title"
              cx="50%"
              cy="46%"
              innerRadius="42%"
              outerRadius="68%"
              paddingAngle={4}
              animationDuration={900}
            >
              {distribution.map((entry, index) => (
                <Cell key={entry.recommendationId} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value, _name, props) => [`$${Number(value).toLocaleString()}`, `${props.payload.percentage}%`]} />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, lineHeight: '18px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
