import { useEffect, useState } from 'react';
import { getPastScans } from '../api';

interface Props {
  onSelectScan: (id: string) => void;
  onNewScan: () => void;
}

export function HistoryPage({ onSelectScan, onNewScan }: Props) {
  const [scans, setScans] = useState<Array<{ id: string; name: string; version: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPastScans()
      .then(setScans)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch scan history'))
      .finally(() => setLoading(false));
  }, []);

  function getBadgeClass(score: number) {
    if (score >= 70) return 'badge-crit';
    if (score >= 40) return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="card-step-badge">HISTORY</span>
          <h2 className="card-title">Past Security Scans</h2>
        </div>
        <button className="btn-secondary" onClick={onNewScan}>
          + Run New Scan
        </button>
      </div>

      {loading && <p className="empty-state">Loading scan history...</p>}

      {error && (
        <div className="error-banner">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {!loading && scans.length === 0 && !error && (
        <div className="empty-state">
          <p>No previous scans found in this session.</p>
          <button className="btn-primary" onClick={onNewScan} style={{ marginTop: 8 }}>
            Analyze Your First Package
          </button>
        </div>
      )}

      {scans.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Target Package</th>
              <th>Threat Score</th>
              <th style={{ width: 100 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id}>
                <td><code>{s.id}</code></td>
                <td><strong>{s.name}</strong>@{s.version}</td>
                <td>
                  <span className={`badge ${getBadgeClass(s.score)}`}>
                    {s.score} / 100
                  </span>
                </td>
                <td>
                  <button className="btn-secondary" onClick={() => onSelectScan(s.id)}>
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
