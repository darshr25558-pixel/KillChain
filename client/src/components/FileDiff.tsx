import { DiffItem } from '../types';

export function FileDiff({ diffs }: { diffs: DiffItem[] }) {
  function getBadgeClass(status: DiffItem['status']) {
    if (status === 'added') return 'badge-crit';
    if (status === 'modified') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <h3>5. Source vs Package Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Status</th>
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
              <td colSpan={2}>No file differences detected. Package matches source exactly.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

