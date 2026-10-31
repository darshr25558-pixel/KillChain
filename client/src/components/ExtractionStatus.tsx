import type { ScanResult } from '../types';

export function ExtractionStatus({ data }: { data: ScanResult['extraction'] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">02</span>
        <h3 className="card-title">Safe Archive Extraction</h3>
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 220 }}><strong>Extraction Safety</strong></td>
            <td>
              <span className={`badge ${data.safe ? 'badge-safe' : 'badge-crit'}`}>
                {data.safe ? 'ISOLATED & SAFE' : 'EXTRACTION FAILED'}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Extracted File Count</strong></td>
            <td>{data.filesCount} files extracted</td>
          </tr>
          <tr>
            <td><strong>Total Uncompressed Size</strong></td>
            <td>{(data.totalBytes / 1024).toFixed(1)} KB ({data.totalBytes.toLocaleString()} bytes)</td>
          </tr>
          {data.error && (
            <tr>
              <td><strong>Extraction Error</strong></td>
              <td style={{ color: '#be123c' }}>{data.error}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
