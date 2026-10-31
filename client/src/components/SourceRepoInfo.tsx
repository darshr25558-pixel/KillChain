import { GitBranch, ExternalLink } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';

export function SourceRepoInfo({ data }: { data: ScanResult['source'] }) {
  const associationLabel = data.match
    ? 'NPM GITHEAD'
    : data.association === 'user-selected'
      ? 'USER-SELECTED REVISION'
      : data.association === 'release-tag'
        ? 'RELEASE TAG'
        : 'UNVERIFIED SOURCE';

  return (
    <Card
      step="03"
      title="Source Repository & Release Match"
      icon={GitBranch}
      badge={
        <Badge variant={data.match ? 'safe' : 'warn'}>{associationLabel}</Badge>
      }
    >
      <DataRow label="Source Repository">
        {data.repoUrl ? (
          <a
            href={data.repoUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{data.repoUrl}</span>
            <ExternalLink size={13} />
          </a>
        ) : 'Unavailable'}
      </DataRow>
      <DataRow label="Source Revision Reference">
        <CodeBlock copyable>{data.tag}</CodeBlock>
      </DataRow>
      {data.directory && <DataRow label="Package Source Directory">{data.directory}</DataRow>}
      <DataRow label="Target Commit SHA">
        <CodeBlock truncate copyable>{data.commit || 'Unavailable'}</CodeBlock>
      </DataRow>
      <DataRow label="Commit Match">
        <span style={{ fontSize: 13, color: data.match ? 'var(--safe)' : 'var(--warn)' }}>
          {data.match
            ? '✓ Commit is pinned by npm gitHead metadata'
            : data.association === 'user-selected'
              ? '⚠ This revision was selected manually and is not confirmed as the published source.'
              : data.association === 'release-tag'
                ? '⚠ Commit was resolved from a version tag, not pinned by npm gitHead.'
                : '⚠ The relationship between this source revision and the published package is unverified.'}
        </span>
      </DataRow>
      {data.npmRepositoryMatch !== undefined && data.npmRepositoryMatch !== null && (
        <DataRow label="npm Repository Match">
          <Badge variant={data.npmRepositoryMatch ? 'safe' : 'warn'}>
            {data.npmRepositoryMatch ? 'MATCH' : 'DIFFERENT OR UNDECLARED'}
          </Badge>
        </DataRow>
      )}
      {data.manifestPath && (
        <DataRow label="Selected Repository Manifest">{data.manifestPath}</DataRow>
      )}
      {data.error && <DataRow label="Source Retrieval">{data.error}</DataRow>}
    </Card>
  );
}
