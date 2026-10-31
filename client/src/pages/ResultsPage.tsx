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
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="card empty-state">
        <p>Loading security audit report for <code>{scanId}</code>...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-banner"><strong>Error:</strong> {error}</div>
        <div style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onBack}>← Back to Scanner</button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div>
      <div className="results-header">
        <div>
          <h2 className="results-pkg-title">
            {result.pkg.name} <span className="results-pkg-version">v{result.pkg.version}</span>
          </h2>
          <div className="results-meta">
            <span className="brand-tag">ID: {result.id}</span>
            <span className="results-timestamp">Scanned {result.timestamp}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={onBack}>+ New Scan</button>
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
