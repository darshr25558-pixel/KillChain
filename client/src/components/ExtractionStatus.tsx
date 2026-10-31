import { ScanResult } from '../types';

export function ExtractionStatus({ data }: { data: ScanResult['extraction'] }) {
  return (
    <div className="card">
      <h3>2. Safe Archive Extraction</h3>
      <table>
        <tbody>
          <tr>
            <td><strong>Status</strong></td>
            <td>
              <span className={`badge ${data.safe ? 'badge-safe' : 'badge-crit'}`}>
                {data.safe ? 'SAFE EXTRACTION' : 'EXTRACTION FAILED'}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Extracted Files</strong></td>
            <td>{data.filesCount} files</td>
          </tr>
          <tr>
            <td><strong>Total Size</strong></td>
            <td>{data.totalBytes.toLocaleString()} bytes</td>
          </tr>
          {data.error && (
            <tr>
              <td><strong>Extraction Error</strong></td>
              <td style={{ color: 'red' }}>{data.error}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

