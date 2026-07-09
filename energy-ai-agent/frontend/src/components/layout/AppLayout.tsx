import { useMemo, useState } from 'react';
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
  UserCircle,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const now = useClock();
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now),
    [now],
  );
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now),
    [now],
  );

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
              <div className="relative">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-200 to-sky-300 text-sm font-black text-slate-950 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-200/70"
                  aria-label="Open user profile"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  VM
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 z-20 mt-3 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-glass backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-100">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Vaibhav Malviya</p>
                        <p className="text-xs text-slate-400">Energy Ops Analyst</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-300">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Workspace</span>
                        <span className="font-semibold text-slate-100">Demo Site</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Auth</span>
                        <span className="font-semibold text-teal-100">Placeholder</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
