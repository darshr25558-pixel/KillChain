import type { SecurityItem } from '../types';

export function SecurityFindings({ findings }: { findings: SecurityItem[] }) {
  function getSeverityClass(sev: SecurityItem['severity']) {
    if (sev === 'HIGH') return 'badge-crit';
    if (sev === 'MED') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">07</span>
        <h3 className="card-title">Security & Suspicious Code Analysis</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 120 }}>Severity</th>
            <th style={{ width: 220 }}>Security Rule</th>
            <th>Target Location</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((item, idx) => (
            <tr key={idx}>
              <td>
                <span className={`badge ${getSeverityClass(item.severity)}`}>
                  {item.severity}
                </span>
              </td>
              <td><strong>{item.rule}</strong></td>
              <td><code>{item.file}</code></td>
            </tr>
          ))}
          {findings.length === 0 && (
            <tr>
              <td colSpan={3} className="empty-state">No suspicious code patterns, backdoors, or malicious calls found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
