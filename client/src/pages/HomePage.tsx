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
          KILLCHAIN verifies npm tarball integrity and compares published files with
          GitHub source snapshots. It reports evidence and uncertainty without
          executing package code or claiming that heuristic signals prove intent.
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
            <div><span className="cmd">$</span> killchain scan &lt;package&gt;@&lt;version&gt;</div>
            <div className="dim">├─ Fetching and verifying the npm tarball...</div>
            <div className="dim">├─ Extracting files without running package code...</div>
            <div className="dim">├─ Resolving a pinned GitHub source revision...</div>
            <div className="dim">├─ Building SHA-256 manifests and comparing paths...</div>
            <div className="dim">├─ Classifying common output and package exclusions...</div>
            <div className="dim">├─ Running limited static review rules...</div>
            <div className="dim">├─ Verifying supported npm SLSA provenance with Sigstore...</div>
            <div className="dim">└─ Calculating a transparent heuristic risk score...</div>
            <div><span className="ok">✓</span> Report includes evidence and known limitations</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
            <div className="stat-number">4</div>
            <div className="stat-label">Static Code Rules</div>
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
          <h2 className="section-title">Integrity Analysis Pipeline</h2>
          <p className="section-desc">
            Scans run deterministic checks and clearly mark unsupported verification
            stages instead of presenting them as completed.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box icon-accent">
              <Package size={20} />
            </div>
            <h3>1. Package Retrieval</h3>
            <p>Downloads the published npm tarball and checks its SHA-512/SHA-1 integrity metadata before analysis.</p>
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
            <p>Uses npm gitHead when available, otherwise resolves an exact version tag; the report distinguishes those confidence levels.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-info">
              <FileText size={20} />
            </div>
            <h3>4. File Manifest</h3>
            <p>Generates sorted source and published manifests with normalized paths, file types, sizes, and SHA-256 hashes.</p>
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
            <p>Uses package metadata, build configuration, and common output patterns to explain likely generated files and package exclusions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-crit">
              <ShieldAlert size={20} />
            </div>
            <h3>7. Security Analysis</h3>
            <p>Checks a limited set of static rules for dynamic evaluation, process execution, credential-like environment access, encoded payloads, and install hooks.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-safe">
              <BadgeCheck size={20} />
            </div>
            <h3>8. Provenance Verification</h3>
            <p>Verifies supported npm SLSA signatures and transparency proofs, then matches artifact digests and available source claims.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-accent">
              <Activity size={20} />
            </div>
            <h3>9. Risk Scoring</h3>
            <p>Computes a transparent heuristic score from integrity, source confidence, provenance availability, differences, and static signals.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box icon-info">
              <Sparkles size={20} />
            </div>
            <h3>10. Deterministic Explanation</h3>
            <p>Provides a rules-based summary of scanner evidence. An AI model is not configured or called by this version.</p>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading">
          <div className="section-label">Workflow</div>
          <h2 className="section-title">How KILLCHAIN Works</h2>
          <p className="section-desc">
            Three steps from package name to an evidence-based security report.
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
            <p>The scanner verifies archive integrity, compares files, reports limited static signals, and documents provenance verification gaps.</p>
          </div>
          <div className="step-item">
            <div className="step-number-circle">03</div>
            <h4>Evidence-Based Report</h4>
            <p>Review a structured report with file paths, hashes, diffs, heuristic classifications, and explicit limitations.</p>
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
          <span className="tech-pill"><span className="tech-dot" style={{ background: '#cb3837' }} /> npm Registry</span>
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
