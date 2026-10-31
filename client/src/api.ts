import type { ScanResult } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/api' : 'https://killchain.onrender.com/api');

export interface RepositoryManifest {
  path: string;
  directory: string;
  valid: boolean;
  error?: string | null;
  name?: string | null;
  version?: string | null;
  repository?: unknown;
  main?: unknown;
  module?: unknown;
  types?: unknown;
  exports?: unknown;
  files?: unknown;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: unknown;
  content: string;
}

export interface RepositoryInspection {
  repository: {
    url: string;
    canonicalUrl: string;
    name: string | null;
    description: string | null;
    defaultBranch: string;
    defaultBranchCommit: string;
    private: boolean;
    updatedAt: string | null;
  };
  branches: Array<{ name: string; commit?: string }>;
  tags: Array<{ name: string; commit?: string }>;
  releases: Array<{ name?: string | null; tag: string; url?: string | null; publishedAt?: string | null }>;
  branchesComplete: boolean;
  tagsComplete: boolean;
  releasesComplete: boolean;
  manifests: RepositoryManifest[];
  listingComplete: boolean;
}

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

export async function inspectRepository(repositoryUrl: string): Promise<RepositoryInspection> {
  const res = await fetch(`${API_BASE}/repositories/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repository_url: repositoryUrl }),
  });
  return parseJsonResponse<RepositoryInspection>(res);
}

export async function startRepositoryScan(input: {
  repositoryUrl: string;
  manifestPath: string;
  name: string;
  version: string;
  revision?: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/repositories/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repository_url: input.repositoryUrl,
      manifest_path: input.manifestPath,
      name: input.name,
      version: input.version,
      revision: input.revision || null,
    }),
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
