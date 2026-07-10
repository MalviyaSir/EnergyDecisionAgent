import type { MeterDataRecord } from '@shared/energy';
import type { ObservationsResponse, RecommendationsResponse, ReasoningResponse, SavingsResponse, SmartDashboardResponse } from '@shared/energy';

export type MeterDataResponse = {
  source: string;
  records: MeterDataRecord[];
};

type RequestOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 8000, retries = 1, ...fetchOptions } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(userMessageForStatus(response.status));
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isRetryableError(error)) {
        break;
      }

      await wait(350 * (attempt + 1));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw normalizeRequestError(lastError);
}

export async function fetchMeterData(): Promise<MeterDataResponse> {
  return requestJson<MeterDataResponse>('/api/meter-data');
}

export async function fetchSmartDashboard(): Promise<SmartDashboardResponse> {
  return requestJson<SmartDashboardResponse>('/api/dashboard');
}

export async function fetchObservations(): Promise<ObservationsResponse> {
  return requestJson<ObservationsResponse>('/api/observations');
}

export async function fetchReasoning(): Promise<ReasoningResponse> {
  return requestJson<ReasoningResponse>('/api/reasoning');
}

export async function fetchRecommendations(): Promise<RecommendationsResponse> {
  return requestJson<RecommendationsResponse>('/api/recommendations');
}

export async function fetchSavings(): Promise<SavingsResponse> {
  return requestJson<SavingsResponse>('/api/savings');
}

function isRetryableError(error: unknown) {
  return error instanceof DOMException || error instanceof TypeError;
}

function normalizeRequestError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('The request timed out. Please try again.');
  }

  if (error instanceof TypeError) {
    return new Error('Unable to reach the energy agent API. Please check that the server is running.');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Something went wrong while loading data.');
}

function userMessageForStatus(status: number) {
  if (status === 404) {
    return 'The requested energy agent endpoint was not found.';
  }

  if (status >= 500) {
    return 'The energy agent API is temporarily unavailable.';
  }

  return 'Unable to complete the request.';
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
