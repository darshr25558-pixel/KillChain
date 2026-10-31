import type { ScanResult } from './types';

const API_BASE = '/api';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 404) {
      throw new Error('API endpoint returned 404. Check that FastAPI backend is running on port 8000.');
    }
    throw new Error(
      `Backend returned non-JSON response (${res.status} ${res.statusText}). Make sure FastAPI backend is running on port 8000.`
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
