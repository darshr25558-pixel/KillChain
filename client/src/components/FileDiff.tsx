import type { DiffItem } from '../types';

export function FileDiff({ diffs }: { diffs: DiffItem[] }) {
  function getBadgeClass(status: DiffItem['status']) {
    if (status === 'added') return 'badge-crit';
    if (status === 'modified') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">05</span>
        <h3 className="card-title">Source vs. Package Comparison</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 140 }}>Difference Type</th>
            <th>File Path</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map((d) => (
            <tr key={d.path}>
              <td>
                <span className={`badge ${getBadgeClass(d.status)}`}>
                  {d.status.toUpperCase()}
                </span>
              </td>
              <td><code>{d.path}</code></td>
            </tr>
          ))}
          {diffs.length === 0 && (
            <tr>
              <td colSpan={2} className="empty-state">No file discrepancies detected between source repository and package.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
