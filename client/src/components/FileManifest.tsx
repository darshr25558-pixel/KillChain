import { FileText } from 'lucide-react';
import type { ManifestItem } from '../types';
import { Card } from './ui/Card';
import { CodeBlock } from './ui/CodeBlock';
import { EmptyState } from './ui/EmptyState';

function ManifestTable({ files }: { files: ManifestItem[] }) {
  return (
    <div className="table-responsive-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Relative Path</th>
            <th style={{ width: 120 }}>Size</th>
            <th style={{ width: 160 }}>File Type</th>
            <th>SHA-256</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.path}>
              <td><code>{file.path}</code></td>
              <td>{file.size.toLocaleString()} B</td>
              <td>{file.type || 'unknown'}</td>
              <td><CodeBlock truncate copyable>{file.hash}</CodeBlock></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FileManifest({
  items,
  sourceItems,
  artifactId,
  sourceCommit,
}: {
  items: ManifestItem[];
  sourceItems: ManifestItem[];
  artifactId?: string | null;
  sourceCommit?: string | null;
}) {
  return (
    <Card
      step="04"
      title="File Manifest & Cryptographic Hashes"
      icon={FileText}
      badge={<span className="brand-tag">{items.length} files indexed</span>}
    >
      <div className="manifest-identifiers">
        <p><strong>Published artifact SHA-256:</strong> <CodeBlock truncate copyable>{artifactId || 'Unavailable'}</CodeBlock></p>
        <p><strong>Source commit:</strong> <CodeBlock truncate copyable>{sourceCommit || 'Unavailable'}</CodeBlock></p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No published manifest entries recorded" description="The extracted package archive contains no regular files." />
      ) : (
        <>
          <h3>Published package ({items.length} files)</h3>
          <ManifestTable files={items} />
        </>
      )}
      <details className="source-manifest-details">
        <summary>Source repository manifest ({sourceItems.length} files)</summary>
        {sourceItems.length ? (
          <ManifestTable files={sourceItems} />
        ) : (
          <EmptyState title="Source manifest unavailable" description="No source archive was retrieved for this release." />
        )}
      </details>
    </Card>
  );
}
