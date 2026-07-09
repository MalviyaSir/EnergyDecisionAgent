import { Battery, CircleDollarSign, Gauge, Leaf, SunMedium, Zap } from 'lucide-react';
import type { DashboardKpi } from '@shared/energy';
import { PremiumKpiCard } from '@/components/dashboard/PremiumKpiCard';

type DashboardHeroProps = {
  kpis: DashboardKpi[];
};

const iconMap = {
  currentPowerUsage: Zap,
  todayConsumption: Gauge,
  estimatedMonthlyBill: CircleDollarSign,
  solarGeneration: SunMedium,
  batteryLevel: Battery,
  energyEfficiencyScore: Leaf,
};

const accents = {
  currentPowerUsage: 'bg-teal-300',
  todayConsumption: 'bg-sky-300',
  estimatedMonthlyBill: 'bg-amber-300',
  solarGeneration: 'bg-orange-300',
  batteryLevel: 'bg-emerald-300',
  energyEfficiencyScore: 'bg-lime-300',
};

export function DashboardHero({ kpis }: DashboardHeroProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <PremiumKpiCard key={kpi.id} kpi={kpi} icon={iconMap[kpi.id]} accent={accents[kpi.id]} />
      ))}
    </section>
  );
}
