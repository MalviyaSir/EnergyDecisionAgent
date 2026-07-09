import { useEffect, useState } from 'react';
import type { ObservationsResponse } from '@shared/energy';
import { fetchObservations } from '@/lib/api';

type ObservationsState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: ObservationsResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useObservations(refreshMs = 10000) {
  const [state, setState] = useState<ObservationsState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;

    async function loadObservations() {
      try {
        const data = await fetchObservations();

        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load observations',
          });
        }
      }
    }

    void loadObservations();
    const timer = window.setInterval(loadObservations, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return state;
}
