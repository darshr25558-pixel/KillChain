import { ArtifactItem } from '../types';

export function BuildArtifacts({ items }: { items: ArtifactItem[] }) {
  function getBadgeClass(kind: string) {
    if (kind === 'unexpected') return 'badge-crit';
    if (kind === 'minified') return 'badge-warn';
    return 'badge-safe';
  }

  return (
    <div className="card">
      <h3>6. Build-Artifact Classification</h3>
      <table>
        <thead>
          <tr>
            <th>File Path</th>
            <th>Classification</th>
            <th>Reason / Explanation</th>
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
              <td colSpan={3}>No build artifacts or extra files classified.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

