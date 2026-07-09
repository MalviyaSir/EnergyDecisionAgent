import type { MeterDataRecord } from '@shared/energy';
import type { ObservationsResponse, RecommendationsResponse, ReasoningResponse, SavingsResponse, SmartDashboardResponse } from '@shared/energy';

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

export async function fetchReasoning(): Promise<ReasoningResponse> {
  const response = await fetch('/api/reasoning');

  if (!response.ok) {
    throw new Error('Unable to load reasoning');
  }

  return response.json() as Promise<ReasoningResponse>;
}

export async function fetchRecommendations(): Promise<RecommendationsResponse> {
  const response = await fetch('/api/recommendations');

  if (!response.ok) {
    throw new Error('Unable to load recommendations');
  }

  return response.json() as Promise<RecommendationsResponse>;
}

export async function fetchSavings(): Promise<SavingsResponse> {
  const response = await fetch('/api/savings');

  if (!response.ok) {
    throw new Error('Unable to load savings');
  }

  return response.json() as Promise<SavingsResponse>;
}
