import type { ArtifactItem } from '../types';

export function BuildArtifacts({ items }: { items: ArtifactItem[] }) {
  function getBadgeClass(kind: string) {
    if (kind === 'unexpected') return 'badge-crit';
    if (kind === 'minified') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">06</span>
        <h3 className="card-title">Build-Artifact Classification</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>File Path</th>
            <th style={{ width: 160 }}>Artifact Category</th>
            <th>Classification Reason</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.path}>
              <td><code>{item.path}</code></td>
              <td>
                <span className={`badge ${getBadgeClass(item.kind)}`}>
                  {item.kind.toUpperCase()}
                </span>
              </td>
              <td>{item.reason}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="empty-state">No extra build artifacts detected.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
