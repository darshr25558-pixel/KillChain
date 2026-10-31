import { useEffect, useState } from 'react';
import { History, Plus, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { getPastScans } from '../api';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { CodeBlock } from '../components/ui/CodeBlock';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

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

  function getBadgeVariant(score: number): BadgeVariant {
    if (score >= 70) return 'crit';
    if (score >= 40) return 'warn';
    return 'safe';
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="ui-card-header-left">
          <span className="card-step-badge">HISTORY</span>
          <div className="ui-card-header-icon">
            <History size={16} />
          </div>
          <div className="ui-card-title-group">
            <h2 className="card-title">Audit Trail & Past Scans</h2>
            <span className="ui-card-subtitle">Previously executed package verification sessions</span>
          </div>
        </div>
        <button className="btn-secondary" onClick={onNewScan}>
          <Plus size={14} />
          <span>New Scan</span>
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </div>
      )}

      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && scans.length === 0 && !error && (
        <EmptyState
          icon={Clock}
          title="No Prior Scans Found"
          description="You haven't run any package analyses in this session yet. Launch a scan to verify your first dependency."
          action={
            <button className="btn-primary" onClick={onNewScan}>
              <span>Scan First Package</span>
              <ArrowRight size={14} />
            </button>
          }
        />
      )}

      {scans.length > 0 && (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Scan ID</th>
                <th>Target Package</th>
                <th style={{ width: 160 }}>Threat Index</th>
                <th style={{ width: 130, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id}>
                  <td>
                    <CodeBlock copyable={false}>{s.id}</CodeBlock>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{s.name}</strong>
                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13, marginLeft: 4 }}>
                      @{s.version}
                    </span>
                  </td>
                  <td>
                    <Badge variant={getBadgeVariant(s.score)}>
                      {s.score} / 100
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary" onClick={() => onSelectScan(s.id)}>
                      <span>View Report</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
