import { useEffect, useState } from 'react';
import type { SavingsResponse } from '@shared/energy';
import { fetchSavings } from '@/lib/api';

type SavingsState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: SavingsResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useSavings(refreshMs = 12000) {
  const [state, setState] = useState<SavingsState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;

    async function loadSavings() {
      try {
        const data = await fetchSavings();

        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load savings',
          });
        }
      }
    }

    void loadSavings();
    const timer = window.setInterval(loadSavings, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return state;
}
