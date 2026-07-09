import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SmartDashboardResponse } from '@shared/energy';
import { ChartCard } from '@/components/dashboard/ChartCard';

type DashboardChartsProps = {
  charts: SmartDashboardResponse['charts'];
};

const pieColors = ['#2dd4bf', '#f59e0b', '#38bdf8', '#a78bfa', '#fb7185'];

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(15,23,42,0.94)',
  color: '#f8fafc',
};

export function DashboardCharts({ charts }: DashboardChartsProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Hourly Consumption" description="Current day load curve by hour.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.hourlyConsumption}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="consumption" name="kWh" stroke="#2dd4bf" strokeWidth={3} dot={false} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Daily Consumption" description="One-month consumption profile.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.dailyConsumption}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="consumption" name="kWh" fill="#38bdf8" radius={[8, 8, 0, 0]} animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Appliance Consumption" description="Latest day appliance load distribution.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={charts.applianceConsumption} dataKey="usage" nameKey="label" innerRadius={62} outerRadius={102} paddingAngle={4} animationDuration={900}>
              {charts.applianceConsumption.map((entry, index) => (
                <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Solar vs Grid Usage" description="Renewable contribution against grid demand.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={charts.solarVsGridUsage}>
            <defs>
              <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.48} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.44} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#solarGradient)" strokeWidth={2} animationDuration={900} />
            <Area type="monotone" dataKey="grid" stroke="#38bdf8" fill="url(#gridGradient)" strokeWidth={2} animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Electricity Price Trend" description="Tariff movement across the month.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.electricityPriceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="price" name="cents/kWh" stroke="#fb7185" strokeWidth={3} dot={false} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Weekly Energy Usage" description="Aggregated weekly trend.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.weeklyEnergyUsage}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="usage" name="kWh" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
