export interface ManifestItem { path: string; size: number; hash: string; }
export interface DiffItem { path: string; status: 'added' | 'removed' | 'modified'; }
export interface ArtifactItem { path: string; kind: string; reason: string; }
export interface SecurityItem { severity: 'LOW' | 'MED' | 'HIGH'; rule: string; file: string; }

export interface ScanResult {
  id: string;
  timestamp: string;
  // F1: npm package retrieval
  pkg: { name: string; version: string; tarballUrl: string; shasum: string; verified: boolean };
  // F2: Safe archive extraction
  extraction: { safe: boolean; filesCount: number; totalBytes: number; error?: string };
  // F3: Source repository retrieval
  source: { repoUrl: string; commit: string; tag: string; match: boolean };
  // F4: File manifest generation
  manifest: ManifestItem[];
  // F5: Source/package comparison
  diff: DiffItem[];
  // F6: Build-artifact classification
  artifacts: ArtifactItem[];
  // F7: Security analysis
  security: SecurityItem[];
  // F8: Provenance verification
  provenance: { signed: boolean; attestationUrl?: string; verified: boolean };
  // F9: Evidence-based risk scoring
  risk: { score: number; level: 'SAFE' | 'WARN' | 'CRITICAL'; notes: string[] };
  // F10: AI explanations
  aiExplanation: { summary: string; points: string[]; recommendation: string };
}

