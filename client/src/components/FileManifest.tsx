import { FileText } from 'lucide-react';
import type { ManifestItem } from '../types';
import { Card } from './ui/Card';
import { CodeBlock } from './ui/CodeBlock';
import { EmptyState } from './ui/EmptyState';

export function FileManifest({ items }: { items: ManifestItem[] }) {
  return (
    <Card
      step="04"
      title="File Manifest & Cryptographic Hashes"
      icon={FileText}
      badge={<span className="brand-tag">{items.length} files indexed</span>}
    >
      {items.length === 0 ? (
        <EmptyState title="No manifest entries recorded" description="The extracted package archive contains no readable files." />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Relative Path</th>
                <th style={{ width: 120 }}>Size</th>
                <th>Cryptographic Digest (SHA-256)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((file) => (
                <tr key={file.path}>
                  <td>
                    <code>{file.path}</code>
                  </td>
                  <td>{file.size.toLocaleString()} B</td>
                  <td>
                    <CodeBlock truncate copyable>{file.hash}</CodeBlock>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
