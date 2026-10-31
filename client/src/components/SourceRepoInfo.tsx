import { ScanResult } from '../types';

export function SourceRepoInfo({ data }: { data: ScanResult['source'] }) {
  return (
    <div className="card">
      <h3>3. Source Repository Retrieval</h3>
      <table>
        <tbody>
          <tr>
            <td><strong>Repository URL</strong></td>
            <td>
              <a href={data.repoUrl} target="_blank" rel="noreferrer">
                {data.repoUrl}
              </a>
            </td>
          </tr>
          <tr>
            <td><strong>Release Tag</strong></td>
            <td><code>{data.tag}</code></td>
          </tr>
          <tr>
            <td><strong>Release Commit</strong></td>
            <td><code>{data.commit}</code></td>
          </tr>
          <tr>
            <td><strong>Source Commit Match</strong></td>
            <td>
              <span className={`badge ${data.match ? 'badge-safe' : 'badge-warn'}`}>
                {data.match ? 'MATCHED' : 'UNVERIFIED'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

