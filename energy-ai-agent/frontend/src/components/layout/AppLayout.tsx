import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BatteryCharging,
  BrainCircuit,
  ChartSpline,
  CircleDollarSign,
  Gauge,
  History,
  Lightbulb,
  Bell,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClock } from '@/hooks/useClock';
import { cn } from '@/lib/utils';

const navigation = [
  { label: 'Dashboard', path: '/', icon: Gauge },
  { label: 'Observations', path: '/observations', icon: BarChart3 },
  { label: 'Predictions', path: '/predictions', icon: ChartSpline },
  { label: 'Reasoning', path: '/reasoning', icon: BrainCircuit },
  { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
  { label: 'Savings', path: '/savings', icon: CircleDollarSign },
  { label: 'What-if Simulator', path: '/what-if', icon: Route },
  { label: 'Learning History', path: '/learning-history', icon: History },
];

export function AppLayout() {
  const now = useClock();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  return (
    <div className="soft-grid min-h-screen p-4 text-slate-100 md:p-6">
      <div className="mx-auto grid max-w-[92rem] gap-5 lg:grid-cols-[17rem_1fr]">
        <aside className="glass-panel rounded-2xl p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-300 text-slate-950 shadow-lg shadow-teal-300/20">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-200">AI Energy</p>
              <h1 className="text-lg font-extrabold leading-tight text-white">Optimization Agent</h1>
            </div>
          </div>

          <nav className="grid gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition',
                    'hover:bg-white/10 hover:text-white',
                    isActive && 'bg-white/[0.12] text-teal-100 shadow-sm',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel mb-5 flex flex-col justify-between gap-4 rounded-2xl p-4 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <ShieldCheck className="h-6 w-6 text-teal-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Smart Energy Monitoring</p>
                <h2 className="text-xl font-bold text-white md:text-2xl">Commercial Energy Command Center</h2>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-slate-300">
                <span className="font-semibold text-white">{formattedDate}</span>
                <span className="mx-2 text-slate-600">|</span>
                {formattedTime}
              </div>
              <Badge tone="teal">Online</Badge>
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-200 transition hover:bg-white/[0.15]">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-200 to-sky-300 text-sm font-black text-slate-950">
                VM
              </div>
            </div>
          </motion.header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
