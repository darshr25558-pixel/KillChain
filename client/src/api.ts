import { ScanResult } from './types';

const API_BASE = '/api';

export async function startScan(name: string, version?: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, version: version || 'latest' }),
  });
  if (!res.ok) throw new Error(`Scan request failed: ${res.statusText}`);
  return res.json();
}

export async function getScanResult(id: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${id}`);
  if (!res.ok) throw new Error(`Fetch scan failed: ${res.statusText}`);
  return res.json();
}

export async function getPastScans(): Promise<Array<{ id: string; name: string; version: string; score: number }>> {
  const res = await fetch(`${API_BASE}/scans`);
  if (!res.ok) throw new Error(`Fetch history failed: ${res.statusText}`);
  return res.json();
}

