import { Activity, AlertCircle } from 'lucide-react';
import type { ScanResult } from '../types';
import { Badge, type BadgeVariant } from './ui/Badge';

export function RiskScore({ data }: { data: ScanResult['risk'] }) {
  function getLevelVariant(level: ScanResult['risk']['level']): BadgeVariant {
    if (level === 'CRITICAL') return 'crit';
    if (level === 'WARN') return 'warn';
    return 'safe';
  }

  function getBarColor(score: number) {
    if (score >= 70) return 'var(--crit)';
    if (score >= 40) return 'var(--warn)';
    return 'var(--safe)';
  }

  return (
    <div className={`card risk-summary-card level-${data.level}`}>
      <div className="card-header">
        <div className="ui-card-header-left">
          <span className="card-step-badge">09</span>
          <div className="ui-card-header-icon">
            <Activity size={16} />
          </div>
          <div className="ui-card-title-group">
            <h3 className="card-title">Evidence-Based Threat Score</h3>
            <span className="ui-card-subtitle">Deterministic scoring engine based on verified pipeline evidence</span>
          </div>
        </div>
        <Badge variant={getLevelVariant(data.level)}>
          {data.level} THREAT
        </Badge>
      </div>

      <div className="risk-score-display">
        <div className="score-circle">
          <span style={{ color: getBarColor(data.score) }}>{data.score}</span>
          <span className="score-label"> / 100</span>
        </div>
        <div className="score-bar-wrapper">
          <div className="score-bar-header">
            <span className="score-bar-label">Threat Severity Level</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: getBarColor(data.score), fontFamily: 'var(--font-mono)' }}>
              {data.score >= 70 ? 'HIGH SEVERITY' : data.score >= 40 ? 'MODERATE WARNING' : 'LOW RISK / CLEAN'}
            </span>
          </div>
          <div className="score-progress-bar">
            <div
              className="score-progress-fill"
              style={{
                width: `${data.score}%`,
                backgroundColor: getBarColor(data.score),
                boxShadow: `0 0 14px ${getBarColor(data.score)}`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="risk-factors-container">
        <span className="form-label">Identified Risk Factors & Pipeline Insights</span>
        <ul className="risk-notes-list">
          {data.notes.map((note, idx) => (
            <li key={idx} className="risk-note-item">
              <AlertCircle size={15} className="risk-note-icon" style={{ color: getBarColor(data.score) }} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
