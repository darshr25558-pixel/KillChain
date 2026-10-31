import type { ScanResult } from '../types';

export function SourceRepoInfo({ data }: { data: ScanResult['source'] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">03</span>
        <h3 className="card-title">Source Repository Retrieval & Release Matching</h3>
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 220 }}><strong>Source Repository</strong></td>
            <td>
              <a href={data.repoUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                {data.repoUrl}
              </a>
            </td>
          </tr>
          <tr>
            <td><strong>Release Git Tag</strong></td>
            <td><code>{data.tag}</code></td>
          </tr>
          <tr>
            <td><strong>Target Commit SHA</strong></td>
            <td><code>{data.commit}</code></td>
          </tr>
          <tr>
            <td><strong>Commit Match Status</strong></td>
            <td>
              <span className={`badge ${data.match ? 'badge-safe' : 'badge-warn'}`}>
                {data.match ? 'MATCHED RELEASE COMMIT' : 'UNVERIFIED TAG'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
