import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { ScanResult } from '../types';
import { Card } from './ui/Card';
import { DataRow } from './ui/DataRow';

export function AIExplanation({ data }: { data: ScanResult['aiExplanation'] }) {
  return (
    <Card
      step="10"
      title="AI Security Explanation & Context"
      subtitle="Plain-language synthesis grounded in deterministic findings"
      icon={Sparkles}
      accent="indigo"
      badge={<span className="brand-tag">Gemma 2 Analysis</span>}
    >
      <DataRow label="Executive Summary">
        <p style={{ lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
      </DataRow>

      <DataRow label="Key Scanner Evidence">
        <ul className="risk-notes-list">
          {data.points.map((pt, idx) => (
            <li key={idx} className="risk-note-item">
              <CheckCircle2 size={15} className="risk-note-icon" style={{ color: 'var(--info)' }} />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </DataRow>

      <div className="ai-recommendation-box">
        <Sparkles size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Actionable Recommendation: </strong>
          <span>{data.recommendation}</span>
        </div>
      </div>

      <div className="ai-badge-gemma">
        Generated with Google Gemma · Grounded in verifiable static scan evidence
      </div>
    </Card>
  );
}
