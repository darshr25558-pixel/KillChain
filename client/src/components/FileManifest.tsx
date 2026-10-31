import { ManifestItem } from '../types';

export function FileManifest({ items }: { items: ManifestItem[] }) {
  return (
    <div className="card">
      <h3>4. File Manifest</h3>
      <table>
        <thead>
          <tr>
            <th>Path</th>
            <th>Size (bytes)</th>
            <th>Cryptographic Hash</th>
          </tr>
        </thead>
        <tbody>
          {items.map((file) => (
            <tr key={file.path}>
              <td><code>{file.path}</code></td>
              <td>{file.size.toLocaleString()}</td>
              <td><code>{file.hash}</code></td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3}>No manifest items found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

