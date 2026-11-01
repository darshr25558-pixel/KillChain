import { Lock } from 'lucide-react';
import type { PackageScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { Badge } from './ui/Badge';

export function ExtractionStatus({ data }: { data: PackageScanResult['extraction'] }) {
  return (
    <Card
      step="02"
      title="Safe Archive Extraction"
      icon={Lock}
      badge={
        <Badge variant={data.safe ? 'safe' : 'crit'}>
          {data.safe ? 'ISOLATED & SAFE' : 'EXTRACTION FAILED'}
        </Badge>
      }
    >
      <DataRow label="Extraction Safety">
        <span style={{ fontSize: 13, color: data.safe ? 'var(--safe)' : 'var(--crit)' }}>
          {data.safe
            ? '✓ Unpacked in zero-execution sandbox without postinstall hooks'
            : '✗ Sandbox violation or extraction aborted'}
        </span>
      </DataRow>
      <DataRow label="Extracted Files">
        <span>{data.filesCount.toLocaleString()} files recorded</span>
      </DataRow>
      <DataRow label="Total Size">
        <span>
          {(data.totalBytes / 1024).toFixed(1)} KB ({data.totalBytes.toLocaleString()} bytes)
        </span>
      </DataRow>
      {data.error && (
        <DataRow label="Extraction Error">
          <span style={{ color: 'var(--crit)', fontWeight: 600 }}>{data.error}</span>
        </DataRow>
      )}
    </Card>
  );
}
