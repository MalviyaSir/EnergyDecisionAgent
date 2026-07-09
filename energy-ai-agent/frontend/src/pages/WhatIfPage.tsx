import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WhatIfPage() {
  const [result, setResult] = useState<unknown>(null);

  async function runSimulation() {
    const response = await fetch('/api/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperatureSetpoint: 26,
        shiftEvCharging: true,
        reduceLightingPercent: 15,
        batteryReservePercent: 40,
      }),
    });

    setResult(await response.json());
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-teal-700" />
            <div>
              <CardTitle>What-if Simulator</CardTitle>
              <CardDescription>Scenario controls are wired to the backend placeholder endpoint.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {['HVAC setpoint: 26C', 'EV charging shifted off peak', 'Lighting reduced by 15%', 'Battery reserve: 40%'].map((item) => (
            <div key={item} className="rounded-lg border border-white/60 bg-white/45 px-4 py-3 text-sm font-medium">
              {item}
            </div>
          ))}
          <Button onClick={runSimulation}>
            <Play className="h-4 w-4" />
            Run Simulation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Result</CardTitle>
          <CardDescription>Future AI logic can replace the calculation behind this response.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="min-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-teal-50">
            {result ? JSON.stringify(result, null, 2) : 'Run a scenario to see estimated impact.'}
          </pre>
        </CardContent>
      </Card>
    </motion.div>
  );
}
