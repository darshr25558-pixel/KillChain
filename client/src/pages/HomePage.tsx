import {
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Package,
  Lock,
  GitBranch,
  FileText,
  GitCompare,
  Hammer,
  ShieldAlert,
  BadgeCheck,
  Activity,
  Sparkles,
  CheckCircle2,
  ShieldOff,
  Hash,
  Cpu,
} from 'lucide-react';

export function HomePage({ onStartScan }: { onStartScan: () => void }) {
  return (
    <div>
      <section className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={14} />
          <span>Open-Source Supply Chain Security</span>
        </div>

        <h1 className="hero-title">
          Verify Package Integrity<br />
          Before It Hits <span className="highlight">Production</span>
        </h1>

        <p className="hero-subtitle">
          KILLCHAIN is a deterministic security analyzer that compares published npm
          packages against their source repositories, detecting tampering, injected
          code, and supply chain attacks with evidence you can verify.
        </p>

        <div className="hero-actions">
          <button className="btn-primary hero-cta" onClick={onStartScan}>
            <span>Start Scanning</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="https://github.com/darshr25558-pixel/KillChain"
            target="_blank"
            rel="noreferrer"
            className="hero-cta-secondary"
          >
            <span>View on GitHub</span>
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="hero-visual">
          <div className="terminal-bar">
            <div className="terminal-dots">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
            </div>
            <div className="terminal-title">killchain-cli — bash</div>
          </div>
          <div className="terminal-output">
            <div><span className="cmd">$</span> killchain scan event-stream@3.3.6</div>
            <div className="dim">├─ Fetching tarball from npm registry...</div>
            <div className="dim">├─ Extracting archive in sandbox (no code execution)...</div>
            <div className="dim">├─ Resolving source repo: github.com/dominictarr/event-stream</div>
            <div className="dim">├─ Building file manifest &amp; SHA-256 hashes...</div>
            <div className="dim">├─ Comparing source ↔ package (4 added, 1 modified)...</div>
            <div className="dim">├─ Classifying build artifacts...</div>
            <div><span className="err">✗</span> <span className="flag">ALERT</span> Obfuscated payload detected in flatmap-stream/index.min.js</div>
            <div><span className="err">✗</span> <span className="flag">ALERT</span> Injected dependency not present in source repository</div>
            <div className="dim">├─ Verifying provenance &amp; attestations...</div>
            <div><span className="err">✗</span> No cryptographic signature or build attestation found</div>
            <div className="dim">└─ Computing risk score...</div>
            <div>&nbsp;</div>
            <div><span className="err">RISK SCORE: 85/100 — CRITICAL</span></div>
            <div><span className="ok">✓</span> Full report generated with evidence-backed findings</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
            <div className="stat-number">10</div>
            <div className="stat-label">Security Checks</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon"><ShieldOff size={20} /></div>
            <div className="stat-number">0</div>
            <div className="stat-label">Code Executed</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon"><Hash size={20} /></div>
            <div className="stat-number">SHA-256</div>
            <div className="stat-label">Hash Verification</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon"><Cpu size={20} /></div>
            <div className="stat-number">100%</div>
            <div className="stat-label">Deterministic</div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <div className="section-label">Capabilities</div>
          <h2 className="section-title">10-Stage Integrity Pipeline</h2>
          <p className="section-desc">
            Every scan runs through a sequential pipeline of deterministic checks.
            AI explains the findings — it never makes the security decisions.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box icon-accent">
              <Package size={20} />
            </div>
            <h3>1. Package Retrieval</h3>
            <p>Downloads the exact published tarball from the npm registry and verifies its shasum integrity hash against the registry metadata.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-safe">
              <Lock size={20} />
            </div>
            <h3>2. Safe Extraction</h3>
            <p>Extracts the archive in a sandboxed environment with zero code execution — no install scripts, no postinstall hooks run.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-accent">
              <GitBranch size={20} />
            </div>
            <h3>3. Source Retrieval</h3>
            <p>Identifies the linked GitHub repository and resolves the exact commit SHA corresponding to the published version tag.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-info">
              <FileText size={20} />
            </div>
            <h3>4. File Manifest</h3>
            <p>Generates a complete inventory of every file with path, byte size, and a SHA-256 cryptographic hash for audit trails.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-warn">
              <GitCompare size={20} />
            </div>
            <h3>5. Source Comparison</h3>
            <p>Performs a file-by-file diff between the source repository and the published package, flagging every addition, removal, and modification.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-warn">
              <Hammer size={20} />
            </div>
            <h3>6. Build Classification</h3>
            <p>Categorizes each file difference as expected build output (minified bundles, compiled assets) or unexpected and suspicious.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-crit">
              <ShieldAlert size={20} />
            </div>
            <h3>7. Security Analysis</h3>
            <p>Scans for obfuscated code, eval patterns, network calls, filesystem access, and other suspicious behaviors with severity ratings.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-safe">
              <BadgeCheck size={20} />
            </div>
            <h3>8. Provenance Verification</h3>
            <p>Checks for Sigstore signatures, npm provenance attestations, and verifies source-to-build claims against the transparency log.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-accent">
              <Activity size={20} />
            </div>
            <h3>9. Risk Scoring</h3>
            <p>Computes a transparent 0–100 threat index based on weighted evidence from all previous checks, with per-factor breakdown.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-info">
              <Sparkles size={20} />
            </div>
            <h3>10. AI Explanations</h3>
            <p>Uses AI models to translate deterministic scanner findings into plain-language security reports with actionable recommendations.</p>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading">
          <div className="section-label">Workflow</div>
          <h2 className="section-title">How KILLCHAIN Works</h2>
          <p className="section-desc">
            Three steps from package name to verified security report.
          </p>
        </div>

        <div className="steps-list">
          <div className="step-item">
            <div className="step-number-circle">01</div>
            <h4>Enter a Package</h4>
            <p>Type any npm package name and version. KILLCHAIN fetches both the published tarball and the linked source repository automatically.</p>
          </div>
          <div className="step-item">
            <div className="step-number-circle">02</div>
            <h4>Automated Analysis</h4>
            <p>The 10-stage pipeline runs deterministic checks: file comparison, hash verification, security scanning, provenance validation, and risk scoring.</p>
          </div>
          <div className="step-item">
            <div className="step-number-circle">03</div>
            <h4>Evidence-Based Report</h4>
            <p>Review a structured report with every finding backed by file paths, hashes, and diffs. AI provides explanations grounded in the actual evidence.</p>
          </div>
        </div>
      </section>

      <section className="tech-section">
        <div className="section-heading">
          <div className="section-label">Built With</div>
          <h2 className="section-title">Technology Stack</h2>
        </div>

        <div className="tech-pills">
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#3178c6' }} /> TypeScript</span>
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#61dafb' }} /> React 19</span>
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#646cff' }} /> Vite</span>
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#009688' }} /> FastAPI</span>
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#3776ab' }} /> Python</span>
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#10b981' }} /> Google Gemma</span>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Verify Your Dependencies?</h2>
        <p>
          Start scanning packages now. No account required. Deterministic and fast.
        </p>
        <button className="btn-primary hero-cta" onClick={onStartScan}>
          <span>Launch Scanner</span>
          <ArrowRight size={16} />
        </button>
      </section>

      <footer className="site-footer">
        KILLCHAIN — Built by Team SoloLeveling · <a href="https://github.com/darshr25558-pixel/KillChain" target="_blank" rel="noreferrer">GitHub Repository</a>
      </footer>
    </div>
  );
}
