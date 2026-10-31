import { ShieldAlert } from 'lucide-react';
import type { SecurityItem } from '../types';
import { Card } from './ui/Card';
import { Badge, type BadgeVariant } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export function SecurityFindings({ findings }: { findings: SecurityItem[] }) {
  function getSeverityVariant(sev: SecurityItem['severity']): BadgeVariant {
    if (sev === 'HIGH') return 'crit';
    if (sev === 'MED') return 'warn';
    return 'safe';
  }

  return (
    <Card
      step="07"
      title="Security & Suspicious Code Analysis"
      icon={ShieldAlert}
      accent={findings.some((f) => f.severity === 'HIGH') ? 'crit' : 'none'}
      badge={
        <span className="brand-tag">
          {findings.length} {findings.length === 1 ? 'finding' : 'findings'}
        </span>
      }
    >
      {findings.length === 0 ? (
        <EmptyState
          title="Zero Suspicious Findings"
          description="No obfuscated code patterns, backdoors, unauthorized network calls, or unexpected fs operations detected."
        />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Severity</th>
                <th style={{ width: 220 }}>Security Rule</th>
                <th>Target Location</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <Badge variant={getSeverityVariant(item.severity)}>
                      {item.severity}
                    </Badge>
                  </td>
                  <td><strong>{item.rule}</strong></td>
                  <td><code>{item.file}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
