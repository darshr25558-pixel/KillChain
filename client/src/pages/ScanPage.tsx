import { useState, type FormEvent } from 'react';
import { Package, Tag, ArrowRight, Loader2, AlertOctagon, Sparkles, Shield } from 'lucide-react';
import { startScan } from '../api';

export function ScanPage({ onScanComplete }: { onScanComplete: (id: string) => void }) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const samplePackages = ['lodash', 'express', 'chalk', 'event-stream'];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await startScan(name.trim(), version.trim());
      onScanComplete(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan request failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(pkg: string) {
    setName(pkg);
    setVersion('');
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="ui-card-header-left">
          <span className="card-step-badge">SCANNER</span>
          <div className="ui-card-title-group">
            <h2 className="card-title">Analyze Published Package</h2>
            <span className="ui-card-subtitle">Zero code execution — fully deterministic supply chain verification</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="pkg-name">Package Name (npm)</label>
          <div className="form-input-wrapper">
            <Package size={16} className="form-input-icon" />
            <input
              id="pkg-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. lodash, express, axios, event-stream"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pkg-version">Version (optional, defaults to latest)</label>
          <div className="form-input-wrapper">
            <Tag size={16} className="form-input-icon" />
            <input
              id="pkg-version"
              className="form-input"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 4.17.21 (blank for latest)"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 24, marginBottom: 8 }}>
          <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Loader2 size={16} className="badge-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing Package...</span>
              </>
            ) : (
              <>
                <Shield size={16} />
                <span>Start Integrity Scan</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="presets-container">
        <span className="presets-label">
          <Sparkles size={13} />
          Quick picks:
        </span>
        {samplePackages.map((pkg) => (
          <button
            key={pkg}
            type="button"
            className="preset-chip"
            onClick={() => handleSelectPreset(pkg)}
          >
            {pkg}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner">
          <AlertOctagon size={18} className="badge-icon" />
          <div>
            <strong>Scan Failed:</strong> {error}
          </div>
        </div>
      )}
    </div>
  );
}
