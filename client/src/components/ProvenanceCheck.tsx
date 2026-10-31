import { ScanResult } from '../types';

export function ProvenanceCheck({ data }: { data: ScanResult['provenance'] }) {
  return (
    <div className="card">
      <h3>8. Provenance Verification</h3>
      <table>
        <tbody>
          <tr>
            <td><strong>Cryptographic Signature</strong></td>
            <td>
              <span className={`badge ${data.signed ? 'badge-safe' : 'badge-warn'}`}>
                {data.signed ? 'SIGNED' : 'UNSIGNED'}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Source-to-Build Verification</strong></td>
            <td>
              <span className={`badge ${data.verified ? 'badge-safe' : 'badge-crit'}`}>
                {data.verified ? 'PASSED' : 'UNVERIFIED / FAILED'}
              </span>
            </td>
          </tr>
          {data.attestationUrl && (
            <tr>
              <td><strong>Attestation Link</strong></td>
              <td>
                <a href={data.attestationUrl} target="_blank" rel="noreferrer">
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

