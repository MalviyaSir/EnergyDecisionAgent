import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Gauge, Thermometer, SunMedium, BatteryCharging, Lightbulb, Fan, Waves, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requestJson } from '@/lib/api';

type LiveDataState = {
  temperature: number;
  power: number;
  humidity: number;
  current: number;
  voltage: number;
  occupancy: number;
  hvacState: string;
  lighting: number;
  solar: number;
  battery: number;
  fan: string;
  energy: number;
};

const initialState: LiveDataState = {
  temperature: 28,
  power: 18.2,
  humidity: 58,
  current: 82,
  voltage: 230,
  occupancy: 61,
  hvacState: 'ON',
  lighting: 6.4,
  solar: 7.5,
  battery: 72,
  fan: 'ON',
  energy: 124.8,
};

export function LiveDataPage() {
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);

  async function saveTelemetry() {
    try {
      await requestJson('/api/live-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setSaved(false);
    }
  }

  function updateField<K extends keyof LiveDataState>(field: K, value: LiveDataState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Live Sensor Console</CardTitle>
          <CardDescription>Simulate real IoT telemetry and push it to the live energy workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <Field label="Temperature" icon={Thermometer} value={form.temperature} unit="°C" onChange={(value) => updateField('temperature', Number(value))} />
            <Field label="Power" icon={Activity} value={form.power} unit="kW" onChange={(value) => updateField('power', Number(value))} />
            <Field label="Humidity" icon={Waves} value={form.humidity} unit="%" onChange={(value) => updateField('humidity', Number(value))} />
            <Field label="Current" icon={Gauge} value={form.current} unit="A" onChange={(value) => updateField('current', Number(value))} />
            <Field label="Voltage" icon={Gauge} value={form.voltage} unit="V" onChange={(value) => updateField('voltage', Number(value))} />
          </div>
          <div className="grid gap-3">
            <Field label="Occupancy" icon={Activity} value={form.occupancy} unit="%" onChange={(value) => updateField('occupancy', Number(value))} />
            <Field label="HVAC State" icon={Thermometer} value={form.hvacState} onChange={(value) => updateField('hvacState', String(value))} />
            <Field label="Lighting" icon={Lightbulb} value={form.lighting} unit="kW" onChange={(value) => updateField('lighting', Number(value))} />
            <Field label="Solar" icon={SunMedium} value={form.solar} unit="kW" onChange={(value) => updateField('solar', Number(value))} />
            <Field label="Battery" icon={BatteryCharging} value={form.battery} unit="%" onChange={(value) => updateField('battery', Number(value))} />
            <Field label="Fan" icon={Fan} value={form.fan} onChange={(value) => updateField('fan', String(value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col justify-between gap-4 pt-6 md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-white">Push telemetry into the dashboard</p>
            <p className="text-sm text-slate-400">The live dashboard, recommendations, and AI chat will immediately use these values.</p>
          </div>
          <div className="flex items-center gap-3">
            {saved ? <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />Telemetry saved</span> : null}
            <Button onClick={saveTelemetry}>Save telemetry</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, icon: Icon, value, unit, onChange }: { label: string; icon: typeof Gauge; value: number | string; unit?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm text-slate-300">
      <span className="flex items-center gap-2 font-semibold text-white"><Icon className="h-4 w-4" />{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
      />
      {unit ? <span className="text-xs text-slate-500">{unit}</span> : null}
    </label>
  );
}
