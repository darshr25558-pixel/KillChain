import { useState, type FormEvent } from 'react';
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
        <span className="card-step-badge">SCANNER</span>
        <h2 className="card-title">Analyze Published Package</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Package Name (npm)</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. lodash, express, axios"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Version (optional, defaults to latest)</label>
          <input
            className="form-input"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 4.17.21"
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
            {loading ? 'Analyzing Package...' : 'Start Integrity Scan'}
          </button>
        </div>
      </form>

      <div className="presets-container">
        <span>Quick select:</span>
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
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
