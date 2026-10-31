export interface ManifestItem { path: string; size: number; hash: string; }
export interface DiffItem { path: string; status: 'added' | 'removed' | 'modified'; }
export interface ArtifactItem { path: string; kind: string; reason: string; }
export interface SecurityItem { severity: 'LOW' | 'MED' | 'HIGH'; rule: string; file: string; }

export interface ScanResult {
  id: string;
  timestamp: string;

  pkg: { name: string; version: string; tarballUrl: string; shasum: string; verified: boolean };

  extraction: { safe: boolean; filesCount: number; totalBytes: number; error?: string };

  source: { repoUrl: string; commit: string; tag: string; match: boolean };

  manifest: ManifestItem[];

  diff: DiffItem[];

  artifacts: ArtifactItem[];

  security: SecurityItem[];

  provenance: { signed: boolean; attestationUrl?: string; verified: boolean };

  risk: { score: number; level: 'SAFE' | 'WARN' | 'CRITICAL'; notes: string[] };

  aiExplanation: { summary: string; points: string[]; recommendation: string };
}

