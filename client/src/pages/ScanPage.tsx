import { useState, FormEvent } from 'react';
import { startScan } from '../api';

export function ScanPage({ onScanComplete }: { onScanComplete: (id: string) => void }) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await startScan(name.trim(), version.trim());
      onScanComplete(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Scan Package</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Package Name: </label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. lodash" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Version: </label>
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="latest" />
        </div>
        <button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Scanning...' : 'Start Scan'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

