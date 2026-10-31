import type { ManifestItem } from '../types';

export function FileManifest({ items }: { items: ManifestItem[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">04</span>
        <h3 className="card-title">File Manifest & Cryptographic Hashes</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Relative Path</th>
            <th>Size</th>
            <th>Cryptographic Digest (SHA-256)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((file) => (
            <tr key={file.path}>
              <td><code>{file.path}</code></td>
              <td>{file.size.toLocaleString()} B</td>
              <td><code>{file.hash}</code></td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="empty-state">No manifest entries recorded.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
