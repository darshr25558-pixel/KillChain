import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Clock, Tag } from 'lucide-react';
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
import { Skeleton } from '../components/ui/Skeleton';
import { CodeBlock } from '../components/ui/CodeBlock';

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
      <div>
        <div className="results-header">
          <div>
            <Skeleton width={280} height={32} />
            <div className="results-meta" style={{ marginTop: 10 }}>
              <Skeleton width={140} height={20} />
              <Skeleton width={180} height={20} />
            </div>
          </div>
          <Skeleton width={120} height={38} />
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <Skeleton width={200} height={24} />
          <div style={{ marginTop: 20 }}>
            <Skeleton height={60} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Skeleton height={20} />
            <div style={{ marginTop: 8 }}>
              <Skeleton height={20} />
            </div>
          </div>
        </div>

        <div className="results-grid-2col">
          <div className="card" style={{ height: 200 }}>
            <Skeleton width={180} height={20} />
            <div style={{ marginTop: 20 }}><Skeleton height={80} /></div>
          </div>
          <div className="card" style={{ height: 200 }}>
            <Skeleton width={180} height={20} />
            <div style={{ marginTop: 20 }}><Skeleton height={80} /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
        <div style={{ marginTop: 20 }}>
          <button className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={14} />
            <span>Back to Scanner</span>
          </button>
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
            <span className="brand-tag">
              <Tag size={11} style={{ marginRight: 4 }} />
              <CodeBlock copyable={false}>{result.id}</CodeBlock>
            </span>
            <span className="results-timestamp">
              <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
              Scanned {result.timestamp}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={14} />
            <span>Scanner</span>
          </button>
          <button className="btn-primary" onClick={onBack}>
            <Plus size={14} />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Step 09: Threat Risk Score Hero */}
      <RiskScore data={result.risk} />

      {/* Step 10: AI Synthesis */}
      <AIExplanation data={result.aiExplanation} />

      {/* 2-Column Grid: Steps 01 & 02 */}
      <div className="results-grid-2col">
        <PackageInfo data={result.pkg} />
        <ExtractionStatus data={result.extraction} />
      </div>

      {/* 2-Column Grid: Steps 03 & 08 */}
      <div className="results-grid-2col">
        <SourceRepoInfo data={result.source} />
        <ProvenanceCheck data={result.provenance} />
      </div>

      {/* Step 04: File Manifest Full Width */}
      <FileManifest items={result.manifest} />

      {/* Step 05: File Diff Full Width */}
      <FileDiff diffs={result.diff} />

      {/* 2-Column Grid: Steps 06 & 07 */}
      <div className="results-grid-2col">
        <BuildArtifacts items={result.artifacts} />
        <SecurityFindings findings={result.security} />
      </div>
    </div>
  );
}
