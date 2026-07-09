import type { MeterDataRecord } from '@shared/energy';
import type { ObservationsResponse, SmartDashboardResponse } from '@shared/energy';

export type MeterDataResponse = {
  source: string;
  records: MeterDataRecord[];
};

export async function fetchMeterData(): Promise<MeterDataResponse> {
  const response = await fetch('/api/meter-data');

  if (!response.ok) {
    throw new Error('Unable to load meter data');
  }

  return response.json() as Promise<MeterDataResponse>;
}

export async function fetchSmartDashboard(): Promise<SmartDashboardResponse> {
  const response = await fetch('/api/dashboard');

  if (!response.ok) {
    throw new Error('Unable to load dashboard data');
  }

  return response.json() as Promise<SmartDashboardResponse>;
}

export async function fetchObservations(): Promise<ObservationsResponse> {
  const response = await fetch('/api/observations');

  if (!response.ok) {
    throw new Error('Unable to load observations');
  }

  return response.json() as Promise<ObservationsResponse>;
}
