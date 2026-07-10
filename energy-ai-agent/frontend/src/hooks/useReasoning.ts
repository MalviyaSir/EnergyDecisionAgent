import { useEffect, useState } from 'react';
import type { ReasoningResponse } from '@shared/energy';
import { fetchReasoning } from '@/lib/api';

type ReasoningState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: ReasoningResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useReasoning(refreshMs = 12000) {
  const [state, setState] = useState<ReasoningState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;

    async function loadReasoning() {
      try {
        const data = await fetchReasoning();

        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load reasoning',
          });
        }
      }
    }

    void loadReasoning();
    const timer = window.setInterval(loadReasoning, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return state;
}
