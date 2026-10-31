import type { ScanResult } from './types';

const API_BASE = 'https://killchain.onrender.com/api';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 404) {
      throw new Error('API endpoint returned 404. Check that the backend is awake and running at https://killchain.onrender.com.');
    }
    throw new Error(
      `Backend returned non-JSON response (${res.status} ${res.statusText}). Make sure the backend at https://killchain.onrender.com is awake and reachable.`
    );
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function startScan(name: string, version?: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, version: version || 'latest' }),
  });
  return parseJsonResponse<{ id: string }>(res);
}

export async function getScanResult(id: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${id}`);
  return parseJsonResponse<ScanResult>(res);
}

export async function getPastScans(): Promise<Array<{ id: string; name: string; version: string; score: number }>> {
  const res = await fetch(`${API_BASE}/scans`);
  return parseJsonResponse<Array<{ id: string; name: string; version: string; score: number }>>(res);
}
