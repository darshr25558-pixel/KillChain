import { Package } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';

export function PackageInfo({ data }: { data: ScanResult['pkg'] }) {
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
      <DataRow label="Integrity Shasum">
        <CodeBlock truncate copyable>{data.shasum}</CodeBlock>
      </DataRow>
      <DataRow label="Registry Status">
        <span style={{ fontSize: 13, color: data.verified ? 'var(--safe)' : 'var(--crit)' }}>
          {data.verified
            ? '✓ Tarball matches published registry shasum'
            : '✗ Shasum mismatch detected against registry'}
        </span>
      </DataRow>
    </Card>
  );
}
