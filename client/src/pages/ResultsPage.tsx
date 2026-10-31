import { useEffect, useState } from 'react';
import { getScanResult } from '../api';
import type { ScanResult } from '../types';
import { PackageInfo } from '../components/PackageInfo';
import { ExtractionStatus } from '../components/ExtractionStatus';
import { SourceRepoInfo } from '../components/SourceRepoInfo';
import { FileManifest } from '../components/FileManifest';
import { FileDiff } from '../components/FileDiff';
import { BuildArtifacts } from '../components/BuildArtifacts';
import { SecurityFindings } from '../components/SecurityFindings';
import { ProvenanceCheck } from '../components/ProvenanceCheck';
import { RiskScore } from '../components/RiskScore';
import { AIExplanation } from '../components/AIExplanation';

export function ResultsPage({ scanId, onBack }: { scanId: string; onBack: () => void }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getScanResult(scanId)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch scan results'))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="card empty-state">
        <p>Loading security audit report for scan <code>{scanId}</code>...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-banner">
          <strong>Error loading report:</strong> {error}
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn-secondary" onClick={onBack}>
            ← Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {result.pkg.name} <span style={{ color: '#64748b', fontWeight: 400 }}>v{result.pkg.version}</span>
            </h2>
            <span className="brand-tag">ID: {result.id}</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Scanned on {result.timestamp}
          </p>
        </div>
        <button className="btn-primary" onClick={onBack}>
          + New Scan
        </button>
      </div>

      <RiskScore data={result.risk} />
      <AIExplanation data={result.aiExplanation} />
      <PackageInfo data={result.pkg} />
      <ExtractionStatus data={result.extraction} />
      <SourceRepoInfo data={result.source} />
      <FileManifest items={result.manifest} />
      <FileDiff diffs={result.diff} />
      <BuildArtifacts items={result.artifacts} />
      <SecurityFindings findings={result.security} />
      <ProvenanceCheck data={result.provenance} />
    </div>
  );
}
