import type { ScanResult } from '../types';

export function ProvenanceCheck({ data }: { data: ScanResult['provenance'] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-step-badge">08</span>
        <h3 className="card-title">Provenance & Build Attestation Verification</h3>
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td style={{ width: 220 }}><strong>Cryptographic Signature</strong></td>
            <td>
              <span className={`badge ${data.signed ? 'badge-safe' : 'badge-warn'}`}>
                {data.signed ? 'SIGNED (Sigstore / npm)' : 'UNSIGNED'}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Source-to-Build Verification</strong></td>
            <td>
              <span className={`badge ${data.verified ? 'badge-safe' : 'badge-crit'}`}>
                {data.verified ? 'ATTESTATION VERIFIED' : 'UNVERIFIED / CLAIMS MISMATCH'}
              </span>
            </td>
          </tr>
          {data.attestationUrl && (
            <tr>
              <td><strong>Attestation Ledger</strong></td>
              <td>
                <a href={data.attestationUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                  {data.attestationUrl}
                </a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
