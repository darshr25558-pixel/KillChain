import type { ScanResult } from '../types';

export function RiskScore({ data }: { data: ScanResult['risk'] }) {
  function getBadgeClass(level: ScanResult['risk']['level']) {
    if (level === 'CRITICAL') return 'badge-crit';
    if (level === 'WARN') return 'badge-warn';
    return 'badge-safe';
  }

  function getBarColor(score: number) {
    if (score >= 70) return '#e11d48';
    if (score >= 40) return '#d97706';
    return '#10b981';
  }

  return (
    <div className="card risk-summary-card">
      <div className="card-header">
        <span className="card-step-badge">09</span>
        <h3 className="card-title">Evidence-Based Risk Scoring</h3>
      </div>

      <div className="risk-score-display">
        <div className="score-circle">
          {data.score}
          <span style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}> / 100</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Calculated Threat Index</span>
            <span className={`badge ${getBadgeClass(data.level)}`}>{data.level}</span>
          </div>
          <div className="score-progress-bar">
            <div
              className="score-progress-fill"
              style={{
                width: `${data.score}%`,
                backgroundColor: getBarColor(data.score),
              }}
            />
          </div>
        </div>
      </div>

      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 180, verticalAlign: 'top' }}><strong>Identified Factors</strong></td>
            <td>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {data.notes.map((note, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{note}</li>
                ))}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
