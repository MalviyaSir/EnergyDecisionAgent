import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { LiveMeterReading } from '@shared/energy';
import { ApplianceHealthCard } from '@/components/dashboard/ApplianceHealthCard';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EnergySourceCard } from '@/components/dashboard/EnergySourceCard';
import { LiveMeterFeed } from '@/components/dashboard/LiveMeterFeed';
import { DashboardCharts } from '@/components/dashboard/charts/DashboardCharts';
import { Card } from '@/components/ui/card';
import { useLiveMeterSimulation } from '@/hooks/useLiveMeterSimulation';
import { useSmartDashboard } from '@/hooks/useSmartDashboard';

const EMPTY_LIVE_READINGS: LiveMeterReading[] = [];

export function DashboardPage() {
  const dashboard = useSmartDashboard();
  const liveReadings = useLiveMeterSimulation(dashboard.data?.liveMeterFeed ?? EMPTY_LIVE_READINGS);

  if (dashboard.status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (dashboard.status === 'error') {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{dashboard.error}</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <DashboardHero kpis={dashboard.data.kpis} />
      <DashboardCharts charts={dashboard.data.charts} />
      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <ApplianceHealthCard appliances={dashboard.data.applianceHealth} />
        <div className="grid gap-5">
          <EnergySourceCard sources={dashboard.data.energySources} />
          <LiveMeterFeed readings={liveReadings} />
        </div>
      </section>
    </motion.div>
  );
}
