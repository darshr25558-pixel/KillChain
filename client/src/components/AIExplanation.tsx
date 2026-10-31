import type { ScanResult } from '../types';

export function AIExplanation({ data }: { data: ScanResult['aiExplanation'] }) {
  return (
    <div className="card ai-card">
      <div className="card-header">
        <span className="card-step-badge">10</span>
        <h3 className="card-title">AI Security Explanation & Context</h3>
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 180, verticalAlign: 'top' }}><strong>Executive Summary</strong></td>
            <td>{data.summary}</td>
          </tr>
          <tr>
            <td style={{ verticalAlign: 'top' }}><strong>Key Scanner Evidence</strong></td>
            <td>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {data.points.map((pt, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{pt}</li>
                ))}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="ai-recommendation-box">
        <strong>Recommendation:</strong> {data.recommendation}
      </div>
    </div>
  );
}
