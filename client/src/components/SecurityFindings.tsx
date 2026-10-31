import { SecurityItem } from '../types';

export function SecurityFindings({ findings }: { findings: SecurityItem[] }) {
  function getSeverityClass(sev: SecurityItem['severity']) {
    if (sev === 'HIGH') return 'badge-crit';
    if (sev === 'MED') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <h3>7. Security Analysis</h3>
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Detection Rule</th>
            <th>File Location</th>
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
              <td colSpan={3}>No suspicious patterns or malicious behaviors detected.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

