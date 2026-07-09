import { useEffect, useState } from 'react';
import type { RecommendationsResponse } from '@shared/energy';
import { fetchRecommendations } from '@/lib/api';

type RecommendationsState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: RecommendationsResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useRecommendations(refreshMs = 12000) {
  const [state, setState] = useState<RecommendationsState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      try {
        const data = await fetchRecommendations();

        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load recommendations',
          });
        }
      }
    }

    void loadRecommendations();
    const timer = window.setInterval(loadRecommendations, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return state;
}
