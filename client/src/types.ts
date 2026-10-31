export interface ManifestItem { path: string; size: number; hash: string; type?: string; }
export interface FileManifestData {
  artifactId: string | null;
  sourceCommit: string | null;
  files: ManifestItem[];
}
export interface DiffItem {
  path: string;
  status: 'added' | 'removed' | 'modified';
  textDiff?: string | null;
}
export interface ArtifactItem { path: string; kind: string; reason: string; }
export interface SecurityItem {
  severity: 'LOW' | 'MED' | 'HIGH';
  rule: string;
  file: string;
  evidence?: string;
  description?: string;
  confidence?: string;
}

export interface ScanResult {
  id: string;
  timestamp: string;

  pkg: {
    name: string;
    version: string;
    tarballUrl: string;
    shasum: string;
    shasumVerified?: boolean;
    integrity?: string;
    artifactId?: string;
    verified: boolean;
  };

  extraction: { safe: boolean; filesCount: number; totalBytes: number; error?: string };

  source: {
    repoUrl: string;
    commit: string;
    tag: string;
    match: boolean;
    error?: string | null;
    directory?: string | null;
  };

  manifest: ManifestItem[];
  publishedManifest?: FileManifestData;
  sourceManifest?: FileManifestData;

  diff: DiffItem[];

  artifacts: ArtifactItem[];

  security: SecurityItem[];

  provenance: {
    signed: boolean;
    attestationUrl?: string;
    verified: boolean;
    status?: string;
    note?: string;
  };

  risk: { score: number; level: 'SAFE' | 'WARN' | 'CRITICAL'; notes: string[] };

  aiExplanation: { summary: string; points: string[]; recommendation: string };
}
