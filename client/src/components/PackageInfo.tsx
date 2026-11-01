import { Package } from 'lucide-react';
import type { PackageScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';

export function PackageInfo({ data }: { data: PackageScanResult['pkg'] }) {
  return (
    <Card
      step="01"
      title="Package Retrieval & Registry Integrity"
      icon={Package}
      badge={
        <Badge variant={data.verified ? 'safe' : 'crit'}>
          {data.verified ? 'VERIFIED' : 'INTEGRITY FAILED'}
        </Badge>
      }
    >
      <DataRow label="Package Identifier">
        <CodeBlock copyable>{`${data.name}@${data.version}`}</CodeBlock>
      </DataRow>
      <DataRow label="Registry Tarball">
        <CodeBlock truncate copyable>{data.tarballUrl}</CodeBlock>
      </DataRow>
      <DataRow label="Registry Integrity Digest">
        <CodeBlock truncate copyable>{data.integrity || data.shasum}</CodeBlock>
      </DataRow>
      <DataRow label={data.shasumVerified ? 'Verified Registry SHA-1' : 'Computed SHA-1'}>
        <CodeBlock truncate copyable>{data.shasum}</CodeBlock>
      </DataRow>
      <DataRow label="Registry Status">
        <span style={{ fontSize: 13, color: data.verified ? 'var(--safe)' : 'var(--crit)' }}>
          {data.verified
            ? data.shasumVerified
              ? '✓ Tarball matches the registry integrity digest and SHA-1 shasum'
              : '✓ Tarball matches the registry integrity digest'
            : '✗ Tarball does not match the registry digest'}
        </span>
      </DataRow>
      {data.artifactId && (
        <DataRow label="Artifact SHA-256">
          <CodeBlock truncate copyable>{data.artifactId}</CodeBlock>
        </DataRow>
      )}
    </Card>
  );
}
