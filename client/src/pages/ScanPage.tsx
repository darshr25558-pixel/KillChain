import { useState, type FormEvent } from 'react';
import {
  Package,
  Tag,
  ArrowRight,
  Loader2,
  AlertOctagon,
  Sparkles,
  Shield,
  GitBranch,
  Search,
} from 'lucide-react';
import {
  inspectRepository,
  startRepositoryDependencyScan,
  startRepositoryScan,
  startScan,
  type RepositoryInspection,
  type RepositoryManifest,
} from '../api';

type ScanMode = 'package' | 'repository' | 'dependencies';

export function ScanPage({ onScanComplete }: { onScanComplete: (id: string) => void }) {
  const [mode, setMode] = useState<ScanMode>('package');
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [revision, setRevision] = useState('');
  const [inspection, setInspection] = useState<RepositoryInspection | null>(null);
  const [selectedManifestPath, setSelectedManifestPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState('');

  const selectedManifest = inspection?.manifests.find(
    (manifest) => manifest.path === selectedManifestPath,
  );
  const declaredDependencyCount = inspection?.manifests.reduce(
    (total, manifest) =>
      total
      + Object.keys(manifest.dependencies ?? {}).length
      + Object.keys(manifest.devDependencies ?? {}).length
      + Object.keys(manifest.optionalDependencies ?? {}).length
      + Object.keys(manifest.peerDependencies ?? {}).length,
    0,
  ) ?? 0;
  const samplePackages = ['lodash', 'express', 'chalk', 'event-stream'];

  async function handlePackageSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await startScan(name.trim(), version.trim());
      onScanComplete(result.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Scan request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleInspectRepository(event: FormEvent) {
    event.preventDefault();
    if (!repositoryUrl.trim()) return;
    setInspecting(true);
    setError('');
    setInspection(null);
    setSelectedManifestPath('');
    setName('');
    setVersion('');
    try {
      const result = await inspectRepository(repositoryUrl.trim());
      setInspection(result);
      if (result.manifests.length === 1 && result.manifests[0].valid) {
        selectManifest(result.manifests[0]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Repository inspection failed');
    } finally {
      setInspecting(false);
    }
  }

  async function handleRepositoryScan(event: FormEvent) {
    event.preventDefault();
    if (!selectedManifest || !name.trim() || !version.trim() || !inspection) return;
    setLoading(true);
    setError('');
    try {
      const result = await startRepositoryScan({
        repositoryUrl: inspection.repository.url,
        manifestPath: selectedManifest.path,
        name: name.trim(),
        version: version.trim(),
        revision: revision.trim(),
      });
      onScanComplete(result.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Repository scan failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRepositoryDependencyScan(event: FormEvent) {
    event.preventDefault();
    if (!inspection) return;
    setLoading(true);
    setError('');
    try {
      const result = await startRepositoryDependencyScan(inspection.repository.url);
      onScanComplete(result.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Dependency audit failed');
    } finally {
      setLoading(false);
    }
  }

  function selectManifest(manifest: RepositoryManifest) {
    setSelectedManifestPath(manifest.path);
    setName(manifest.name ?? '');
    setVersion(manifest.version ?? '');
  }

  function handleSelectPreset(pkg: string) {
    setName(pkg);
    setVersion('');
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="ui-card-header-left">
          <span className="card-step-badge">SCANNER</span>
          <div className="ui-card-title-group">
            <h2 className="card-title">
              {mode === 'package'
                ? 'Analyze Published Package'
                : mode === 'repository'
                  ? 'Compare Repository Package'
                  : 'Audit Repository Dependencies'}
            </h2>
            <span className="ui-card-subtitle">
              Zero code execution — deterministic supply-chain evidence
            </span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="presets-container" role="group" aria-label="Scan type">
          <button
            type="button"
            className="preset-chip"
            aria-pressed={mode === 'package'}
            onClick={() => {
              setMode('package');
              setError('');
            }}
          >
            <Package size={14} /> npm package
          </button>
          <button
            type="button"
            className="preset-chip"
            aria-pressed={mode === 'repository'}
            onClick={() => {
              setMode('repository');
              setError('');
            }}
          >
            <GitBranch size={14} /> package comparison
          </button>
          <button
            type="button"
            className="preset-chip"
            aria-pressed={mode === 'dependencies'}
            onClick={() => {
              setMode('dependencies');
              setError('');
            }}
          >
            <Shield size={14} /> dependency audit
          </button>
        </div>
      </div>

      {mode === 'package' ? (
        <form onSubmit={handlePackageSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="pkg-name">Package Name (npm)</label>
            <div className="form-input-wrapper">
              <Package size={16} className="form-input-icon" />
              <input
                id="pkg-name"
                className="form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. lodash, express, axios"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pkg-version">Version (optional, defaults to latest)</label>
            <div className="form-input-wrapper">
              <Tag size={16} className="form-input-icon" />
              <input
                id="pkg-version"
                className="form-input"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="e.g. 4.17.21"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 24, marginBottom: 8 }}>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 size={16} className="badge-icon" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Analyzing Package...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Start Integrity Scan</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={
            inspection
              ? mode === 'dependencies'
                ? handleRepositoryDependencyScan
                : handleRepositoryScan
              : handleInspectRepository
          }
        >
          <div className="form-group">
            <label className="form-label" htmlFor="repository-url">Public GitHub Repository URL</label>
            <div className="form-input-wrapper">
              <GitBranch size={16} className="form-input-icon" />
              <input
                id="repository-url"
                className="form-input"
                value={repositoryUrl}
                onChange={(event) => {
                  setRepositoryUrl(event.target.value);
                  setInspection(null);
                  setSelectedManifestPath('');
                }}
                placeholder="https://github.com/owner/repository"
                disabled={loading || inspecting}
              />
            </div>
          </div>

          {!inspection ? (
            <div className="form-group" style={{ marginTop: 24, marginBottom: 8 }}>
              <button type="submit" className="btn-primary" disabled={inspecting || !repositoryUrl.trim()}>
                {inspecting ? (
                  <>
                    <Loader2 size={16} className="badge-icon" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Inspecting Repository...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>{mode === 'dependencies' ? 'Inspect Repository' : 'Find npm Packages'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          ) : mode === 'dependencies' ? (
            <>
              <div className="form-group">
                <div className="form-label">Repository</div>
                <div>{inspection.repository.canonicalUrl}</div>
                <div className="ui-card-subtitle">
                  Audit snapshot: {inspection.repository.defaultBranch} at{' '}
                  <code>{inspection.repository.defaultBranchCommit.slice(0, 12)}</code>
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Dependency inventory</div>
                <div className="ui-card-subtitle">
                  Found {declaredDependencyCount} declared dependency entries across{' '}
                  {inspection.manifests.length} package manifest(s) and{' '}
                  {inspection.lockfiles?.length ?? 0} npm lockfile(s).
                </div>
                <div className="ui-card-subtitle">
                  Lockfiles resolve transitive dependencies to exact versions. Without a supported lockfile,
                  only exact versions declared directly can be checked; ranges remain explicitly unresolved.
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 24, marginBottom: 8 }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="badge-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Auditing Repository Dependencies...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      <span>Audit Dependencies with OSV</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <div className="form-label">Repository</div>
                <div>{inspection.repository.canonicalUrl}</div>
                <div className="ui-card-subtitle">
                  Default branch: {inspection.repository.defaultBranch} · latest commit{' '}
                  <code>{inspection.repository.defaultBranchCommit.slice(0, 12)}</code>
                </div>
                <div className="ui-card-subtitle">
                  The default-branch commit is informational and is not assumed to be the published source.
                  Found {inspection.branches.length}{inspection.branchesComplete ? '' : '+'} branches,{' '}
                  {inspection.tags.length}{inspection.tagsComplete ? '' : '+'} tags,{' '}
                  {inspection.releases.length}{inspection.releasesComplete ? '' : '+'} releases, and{' '}
                  {inspection.manifests.length} package.json file(s).
                </div>
              </div>

              {inspection.manifests.length === 0 ? (
                <div className="error-banner">
                  No package.json files were found; this repository cannot be identified as an npm package.
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="repository-manifest">
                    Select package manifest
                  </label>
                  <select
                    id="repository-manifest"
                    className="form-input"
                    value={selectedManifestPath}
                    onChange={(event) => {
                      const manifest = inspection.manifests.find(
                        (candidate) => candidate.path === event.target.value,
                      );
                      if (manifest) selectManifest(manifest);
                    }}
                    disabled={loading}
                  >
                    <option value="">Choose a package.json</option>
                    {inspection.manifests.map((manifest) => (
                      <option key={manifest.path} value={manifest.path} disabled={!manifest.valid}>
                        {manifest.path}
                        {manifest.name ? ` — ${manifest.name}` : ''}
                        {manifest.private ? ' (private)' : ''}
                        {!manifest.valid ? ' (invalid package manifest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedManifest && (
                <>
                  {selectedManifest.private && (
                    <div className="error-banner">
                      This manifest is marked private, so npm will not publish it. You can still compare an
                      earlier published version by entering its exact version; otherwise select a public npm
                      package manifest.
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label" htmlFor="repository-package-name">npm package</label>
                    <input
                      id="repository-package-name"
                      className="form-input"
                      value={name}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="repository-package-version">
                      Published npm version (manifest suggests {selectedManifest.version})
                    </label>
                    <div className="form-input-wrapper">
                      <Tag size={16} className="form-input-icon" />
                      <input
                        id="repository-package-version"
                        className="form-input"
                        value={version}
                        onChange={(event) => setVersion(event.target.value)}
                        placeholder="Enter an exact published version"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="source-revision">
                      Source revision (optional)
                    </label>
                    <input
                      id="source-revision"
                      list="repository-revisions"
                      className="form-input"
                      value={revision}
                      onChange={(event) => setRevision(event.target.value)}
                      placeholder="Blank uses npm gitHead or a matching version tag"
                      disabled={loading}
                    />
                    <datalist id="repository-revisions">
                      {inspection.tags.map((tag) => (
                        <option key={`tag-${tag.name}`} value={tag.name} />
                      ))}
                      {inspection.branches.map((branch) => (
                        <option key={`branch-${branch.name}`} value={branch.name} />
                      ))}
                    </datalist>
                    <div className="ui-card-subtitle">
                      Enter a commit, tag, or branch if the release source cannot be inferred. A manually selected
                      revision is reported as unverified unless npm metadata confirms that commit.
                    </div>
                  </div>
                  {inspection.releases.length > 0 && (
                    <div className="form-group">
                      <div className="form-label">GitHub releases</div>
                      <div className="ui-card-subtitle">
                        {inspection.releases.slice(0, 5).map((release, index) => (
                          <span key={release.tag}>
                            {index > 0 ? ' · ' : ''}
                            {release.name || release.tag} ({release.tag})
                          </span>
                        ))}
                        {inspection.releases.length > 5
                          ? ` · +${inspection.releases.length - 5} more`
                          : ''}
                      </div>
                    </div>
                  )}
                  <div className="form-group" style={{ marginTop: 24, marginBottom: 8 }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading || !name.trim() || !version.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="badge-icon" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Analyzing Repository & Package...</span>
                        </>
                      ) : (
                        <>
                          <Shield size={16} />
                          <span>Compare with Published Package</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>
      )}

      {mode === 'package' && (
        <div className="presets-container">
          <span className="presets-label">
            <Sparkles size={13} />
            Quick picks:
          </span>
          {samplePackages.map((pkg) => (
            <button
              key={pkg}
              type="button"
              className="preset-chip"
              onClick={() => handleSelectPreset(pkg)}
            >
              {pkg}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertOctagon size={18} className="badge-icon" />
          <div>
            <strong>Scan Failed:</strong> {error}
          </div>
        </div>
      )}
    </div>
  );
}
