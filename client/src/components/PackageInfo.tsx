import { ScanResult } from '../types';

export function PackageInfo({ data }: { data: ScanResult['pkg'] }) {
  return (
    <div className="card">
      <h3>1. Package Retrieval & Integrity</h3>
      <table>
        <tbody>
          <tr>
            <td><strong>Package</strong></td>
            <td>{data.name}@{data.version}</td>
          </tr>
          <tr>
            <td><strong>Tarball URL</strong></td>
            <td><code>{data.tarballUrl}</code></td>
          </tr>
          <tr>
            <td><strong>Shasum / Hash</strong></td>
            <td><code>{data.shasum}</code></td>
          </tr>
          <tr>
            <td><strong>Integrity Status</strong></td>
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

