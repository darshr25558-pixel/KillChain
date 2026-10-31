import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { Badge } from './ui/Badge';

export function ProvenanceCheck({ data }: { data: ScanResult['provenance'] }) {
  return (
    <Card
      step="08"
      title="Provenance & Build Attestation"
      icon={BadgeCheck}
      badge={
        <Badge variant={data.verified ? 'safe' : 'warn'}>
          {data.verified ? 'ATTESTATION VERIFIED' : data.signed ? 'ATTESTATION FOUND' : 'NOT AVAILABLE'}
        </Badge>
      }
    >
      <DataRow label="Cryptographic Signature">
        <Badge variant="warn">
          {data.signed ? 'METADATA PRESENT; SIGNATURE UNVERIFIED' : 'NO ATTESTATION METADATA'}
        </Badge>
      </DataRow>
      <DataRow label="Source-to-Build Verification">
        <span style={{ fontSize: 13, color: data.verified ? 'var(--safe)' : 'var(--crit)' }}>
          {data.verified
            ? '✓ Provenance claims were verified'
            : data.signed
              ? 'Attestation metadata exists, but this scanner does not verify its signature or claims.'
              : 'No verified build attestation was available; this is not evidence that a package is unsigned.'}
        </span>
      </DataRow>
      {data.note && <DataRow label="Verification Notes">{data.note}</DataRow>}
      {data.attestationUrl && (
        <DataRow label="Attestation Ledger">
          <a
            href={data.attestationUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{data.attestationUrl}</span>
            <ExternalLink size={13} />
          </a>
        </DataRow>
      )}
    </Card>
  );
}
