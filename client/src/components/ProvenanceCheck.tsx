import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { Badge } from './ui/Badge';

function claimBadge(value: boolean | null | undefined) {
  if (value === true) return <Badge variant="safe">MATCH</Badge>;
  if (value === false) return <Badge variant="crit">MISMATCH</Badge>;
  return <Badge variant="info">NOT VERIFIED</Badge>;
}

export function ProvenanceCheck({ data }: { data: ScanResult['provenance'] }) {
  const invalid = data.status === 'invalid' || data.status === 'verified-claims-mismatch';
  const statusLabels: Record<string, string> = {
    invalid: 'INVALID ATTESTATION',
    'verified-claims-mismatch': 'CLAIMS MISMATCH',
    'verification-unavailable': 'VERIFICATION UNAVAILABLE',
    unsupported: 'UNSUPPORTED ATTESTATION',
    'verified-claims-incomplete': 'CLAIMS INCOMPLETE',
  };
  const statusLabel = data.verified
    ? 'PROVENANCE VERIFIED'
    : statusLabels[data.status ?? ''] ?? (data.signed ? 'ATTESTATION FOUND' : 'NOT AVAILABLE');
  const statusVariant = data.verified ? 'safe' : invalid ? 'crit' : data.signed ? 'warn' : 'info';

  return (
    <Card
      step="08"
      title="Provenance & Build Attestation"
      icon={BadgeCheck}
      badge={
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      }
    >
      <DataRow label="Cryptographic Signature">
        <Badge
          variant={
            data.cryptographicVerified
              ? 'safe'
              : invalid
                ? 'crit'
                : data.signed
                  ? 'warn'
                  : 'info'
          }
        >
          {data.cryptographicVerified
            ? 'SIGSTORE SIGNATURE VERIFIED'
            : invalid
              ? 'SIGNATURE OR CLAIMS FAILED'
              : data.signed
                ? 'NOT CRYPTOGRAPHICALLY VERIFIED'
                : 'NO ATTESTATION METADATA'}
        </Badge>
      </DataRow>
      <DataRow label="Source-to-Build Verification">
        <span
          style={{
            fontSize: 13,
            color: data.verified
              ? 'var(--safe)'
              : invalid
                ? 'var(--crit)'
                : 'var(--text-secondary)',
          }}
        >
          {data.verified
            ? '✓ Signature, artifact, package, and available source claims were verified.'
            : data.cryptographicVerified
              ? data.status === 'verified-claims-mismatch'
                ? 'The signed statement does not match the scanned artifact or source claims.'
                : 'The signature is valid, but required source claims were incomplete.'
              : data.status === 'verification-unavailable'
                ? 'Provenance could not be verified because the registry evidence or Sigstore trust data was unavailable.'
                : data.signed
                  ? 'Attestation metadata exists, but its signature and claims were not verified.'
                  : 'No attestation was available; this is not evidence that the package is unsigned.'}
        </span>
      </DataRow>
      {data.cryptographicVerified && (
        <>
          <DataRow label="Artifact SHA-512">{claimBadge(data.artifactDigestMatch)}</DataRow>
          <DataRow label="Package Identity">{claimBadge(data.packageIdentityMatch)}</DataRow>
          <DataRow label="Source Repository">{claimBadge(data.sourceRepositoryMatch)}</DataRow>
          <DataRow label="Source Revision">{claimBadge(data.sourceCommitMatch)}</DataRow>
          {data.signerRepositoryMatch !== undefined && (
            <DataRow label="Signer / Workflow Repo">
              {claimBadge(data.signerRepositoryMatch)}
            </DataRow>
          )}
          {data.signerIdentity && (
            <DataRow label="Signing Identity">{data.signerIdentity}</DataRow>
          )}
          {data.issuer && <DataRow label="OIDC Issuer">{data.issuer}</DataRow>}
          {data.sourceRepository && (
            <DataRow label="Attested Repository">{data.sourceRepository}</DataRow>
          )}
          {data.sourceCommit && (
            <DataRow label="Attested Revision">{data.sourceCommit}</DataRow>
          )}
          {data.workflow && <DataRow label="Build Workflow">{data.workflow}</DataRow>}
        </>
      )}
      {data.note && <DataRow label="Verification Notes">{data.note}</DataRow>}
      {data.attestationUrl && (
        <DataRow label="npm Attestation Endpoint">
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
