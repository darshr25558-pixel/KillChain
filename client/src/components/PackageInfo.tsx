import type { ScanResult } from '../types';

export function PackageInfo({ data }: { data: ScanResult['pkg'] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">01</span>
        <h3 className="card-title">npm Package Retrieval & Registry Integrity</h3>
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 220 }}><strong>Package Identifier</strong></td>
            <td><code>{data.name}@{data.version}</code></td>
          </tr>
          <tr>
            <td><strong>Registry Tarball</strong></td>
            <td><code>{data.tarballUrl}</code></td>
          </tr>
          <tr>
            <td><strong>Integrity Shasum</strong></td>
            <td><code>{data.shasum}</code></td>
          </tr>
          <tr>
            <td><strong>Registry Verification</strong></td>
            <td>
              <span className={`badge ${data.verified ? 'badge-safe' : 'badge-crit'}`}>
                {data.verified ? 'VERIFIED' : 'FAILED'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
