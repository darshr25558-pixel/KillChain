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
        <Badge variant={data.verified ? 'safe' : data.signed ? 'warn' : 'crit'}>
          {data.verified ? 'ATTESTATION VERIFIED' : data.signed ? 'SIGNED ONLY' : 'UNSIGNED'}
        </Badge>
      }
    >
      <DataRow label="Cryptographic Signature">
        <Badge variant={data.signed ? 'safe' : 'warn'}>
          {data.signed ? 'SIGNED (Sigstore / npm)' : 'UNSIGNED'}
        </Badge>
      </DataRow>
      <DataRow label="Source-to-Build Verification">
        <span style={{ fontSize: 13, color: data.verified ? 'var(--safe)' : 'var(--crit)' }}>
          {data.verified
            ? '✓ Provenance verified: build generated directly from GitHub Actions runner'
            : '✗ No verified build attestation or claims mismatch'}
        </span>
      </DataRow>
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
