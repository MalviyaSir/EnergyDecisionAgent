import { useEffect, useMemo, useState } from 'react';
import type { LiveMeterReading } from '@shared/energy';

const EMPTY_READINGS: LiveMeterReading[] = [];

export function useLiveMeterSimulation(seedReadings: LiveMeterReading[] = []) {
  const stableSeedReadings = seedReadings.length > 0 ? seedReadings : EMPTY_READINGS;
  const seedKey = useMemo(() => stableSeedReadings.map((reading) => reading.id).join('|'), [stableSeedReadings]);
  const [readings, setReadings] = useState(stableSeedReadings);

  useEffect(() => {
    setReadings((current) => (current === stableSeedReadings ? current : stableSeedReadings));
  }, [seedKey, stableSeedReadings]);

  useEffect(() => {
    if (stableSeedReadings.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setReadings((current) => {
        const latest = current[0] ?? stableSeedReadings[0];
        const drift = (Math.random() - 0.45) * 0.4;
        const units = Math.max(1.8, Math.min(24, latest.units + drift));
        const voltage = Math.round(Math.max(220, Math.min(238, latest.voltage + (Math.random() - 0.5) * 2)));
        const currentValue = Math.round((units / voltage) * 10000) / 10;
        const temperature = Math.round((latest.temperature + (Math.random() - 0.45) * 0.5) * 10) / 10;
        const status = currentValue > 88 ? 'Watch' : temperature > 36 ? 'Elevated' : 'Stable';

        const nextReading: LiveMeterReading = {
          id: `live-${Date.now()}`,
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
          units: Math.round(units * 10) / 10,
          voltage,
          current: currentValue,
          temperature,
          status,
        };

        return [nextReading, ...current].slice(0, 10);
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [seedKey, stableSeedReadings]);

  return readings;
}
