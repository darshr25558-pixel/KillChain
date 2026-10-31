import { GitCompare } from 'lucide-react';
import type { DiffItem } from '../types';
import { Card } from './ui/Card';
import { Badge, type BadgeVariant } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export function FileDiff({ diffs }: { diffs: DiffItem[] }) {
  function getBadgeVariant(status: DiffItem['status']): BadgeVariant {
    if (status === 'added') return 'crit';
    if (status === 'modified') return 'warn';
    return 'safe';
  }

  return (
    <Card
      step="05"
      title="Source vs. Published Package Diff"
      icon={GitCompare}
      badge={
        <span className="brand-tag">
          {diffs.length} {diffs.length === 1 ? 'discrepancy' : 'discrepancies'}
        </span>
      }
    >
      {diffs.length === 0 ? (
        <EmptyState
          title="Clean Comparison"
          description="Zero file discrepancies detected between source repository and published npm package."
        />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Difference Type</th>
                <th>File Path</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((d) => (
                <tr key={d.path}>
                  <td>
                    <Badge variant={getBadgeVariant(d.status)}>
                      {d.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <code>{d.path}</code>
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
