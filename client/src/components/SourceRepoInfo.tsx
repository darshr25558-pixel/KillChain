import { GitBranch, ExternalLink } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';

export function SourceRepoInfo({ data }: { data: ScanResult['source'] }) {
  return (
    <Card
      step="03"
      title="Source Repository & Release Match"
      icon={GitBranch}
      badge={
        <Badge variant={data.match ? 'safe' : 'warn'}>
          {data.match ? 'MATCHED RELEASE COMMIT' : 'UNVERIFIED TAG'}
        </Badge>
      }
    >
      <DataRow label="Source Repository">
        <a
          href={data.repoUrl}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>{data.repoUrl}</span>
          <ExternalLink size={13} />
        </a>
      </DataRow>
      <DataRow label="Release Git Tag">
        <CodeBlock copyable>{data.tag}</CodeBlock>
      </DataRow>
      <DataRow label="Target Commit SHA">
        <CodeBlock truncate copyable>{data.commit}</CodeBlock>
      </DataRow>
      <DataRow label="Commit Match">
        <span style={{ fontSize: 13, color: data.match ? 'var(--safe)' : 'var(--warn)' }}>
          {data.match
            ? '✓ Tag points directly to the published version commit'
            : '⚠ Commit hash could not be verified against official tags'}
        </span>
      </DataRow>
    </Card>
  );
}
