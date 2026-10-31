import { Hammer } from 'lucide-react';
import type { ArtifactItem } from '../types';
import { Card } from './ui/Card';
import { Badge, type BadgeVariant } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export function BuildArtifacts({ items }: { items: ArtifactItem[] }) {
  function getBadgeVariant(kind: string): BadgeVariant {
    if (kind === 'unexplained' || kind === 'unexpected') return 'crit';
    if (['build-output', 'minified', 'source-map', 'declaration', 'platform-binary'].includes(kind)) return 'warn';
    return 'safe';
  }

  return (
    <Card
      step="06"
      title="Build-Artifact Classification"
      icon={Hammer}
      badge={<span className="brand-tag">{items.length} classified</span>}
    >
      {items.length === 0 ? (
        <EmptyState
          title="No File Differences to Classify"
          description="Check the source status and comparison summary to distinguish an exact match from an unavailable source."
        />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Path</th>
                <th style={{ width: 160 }}>Artifact Category</th>
                <th>Classification Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.path}>
                  <td><code>{item.path}</code></td>
                  <td>
                    <Badge variant={getBadgeVariant(item.kind)}>
                      {item.kind.toUpperCase()}
                    </Badge>
                  </td>
                  <td>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
