import { Hammer } from 'lucide-react';
import type { ArtifactItem } from '../types';
import { Card } from './ui/Card';
import { Badge, type BadgeVariant } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export function BuildArtifacts({ items }: { items: ArtifactItem[] }) {
  function getBadgeVariant(kind: string): BadgeVariant {
    if (kind === 'unexpected') return 'crit';
    if (kind === 'minified') return 'warn';
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
          title="No Extra Artifacts"
          description="All package files match expected source file definitions."
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
