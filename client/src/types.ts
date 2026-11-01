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
export interface RiskAssessment {
  score: number;
  level: 'SAFE' | 'WARN' | 'CRITICAL';
  notes: string[];
  model?: string;
}
export interface ScanExplanation {
  summary: string;
  points: string[];
  recommendation: string;
}

export interface PackageScanResult {
  id: string;
  timestamp: string;
  scanType?: 'package-integrity';

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
    association?: 'npm-gitHead' | 'release-tag' | 'user-selected' | 'unverified';
    npmRepositoryMatch?: boolean | null;
    manifestPath?: string | null;
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
    cryptographicVerified?: boolean;
    artifactDigestMatch?: boolean;
    packageIdentityMatch?: boolean;
    sourceRepositoryMatch?: boolean | null;
    sourceCommitMatch?: boolean | null;
    signerRepositoryMatch?: boolean | null;
    signerIdentity?: string;
    issuer?: string;
    sourceRepository?: string | null;
    sourceCommit?: string | null;
    workflow?: string | null;
  };

  risk: RiskAssessment;
  aiExplanation: ScanExplanation;
}

export interface DependencyAuditVulnerability {
  id: string;
  aliases: string[];
  summary: string;
  severity: string;
  published?: string;
  modified?: string;
  url: string;
}

export interface AuditedDependency {
  name: string;
  version: string | null;
  versionSpec?: string[];
  direct: boolean;
  development: boolean;
  dependencyTypes: string[];
  manifests: string[];
  lockfilePaths: string[];
  installPaths: string[];
  resolved: boolean;
  vulnerabilities: DependencyAuditVulnerability[];
}

export interface RepositoryDependencyScanResult {
  id: string;
  timestamp: string;
  scanType: 'repository-dependencies';
  pkg: { name: string; version: string };
  risk: RiskAssessment;
  aiExplanation: ScanExplanation;
  dependencyAudit: {
    repository: {
      url: string;
      name: string;
      branch: string;
      commit: string;
    };
    lockfiles: string[];
    manifests: Array<{ path: string; name?: string | null; version?: string | null }>;
    summary: {
      dependencies: number;
      direct: number;
      transitive: number;
      queried: number;
      unresolved: number;
      vulnerabilities: number;
      affectedDependencies: number;
      localDependenciesExcluded: number;
    };
    advisorySource: string;
    dependencies: AuditedDependency[];
  };
}

export type ScanResult = PackageScanResult | RepositoryDependencyScanResult;
