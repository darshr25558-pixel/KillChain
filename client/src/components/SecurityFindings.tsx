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
          title="No Configured Static Signals Matched"
          description="The limited static rules found no matches in the analyzed files. This is not a guarantee that the package is safe."
        />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Severity</th>
                <th style={{ width: 220 }}>Security Rule</th>
                <th>Target Location</th>
                <th>Evidence</th>
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
                  <td>
                    <span>{item.description}</span>
                    {item.evidence && (
                      <pre style={{ maxWidth: 320, margin: '6px 0 0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                        {item.evidence}
                      </pre>
                    )}
                    {item.confidence && <small>Confidence: {item.confidence}</small>}
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
