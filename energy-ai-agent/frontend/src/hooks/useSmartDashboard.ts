import { useEffect, useState } from 'react';
import type { SmartDashboardResponse } from '@shared/energy';
import { fetchSmartDashboard } from '@/lib/api';

type DashboardState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: SmartDashboardResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useSmartDashboard() {
  const [state, setState] = useState<DashboardState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;

    fetchSmartDashboard()
      .then((data) => {
        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState({ status: 'error', data: null, error: error.message });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
