import { AlertTriangle, Boxes, PackageCheck, Shield } from 'lucide-react';
import type { RepositoryDependencyScanResult } from '../types';

export function DependencyAudit({ data }: { data: RepositoryDependencyScanResult['dependencyAudit'] }) {
  const { summary, repository, dependencies } = data;

  return (
    <>
      <section className="card dependency-audit-card">
        <div className="card-header">
          <div className="ui-card-title-group">
            <h3 className="card-title">Repository Dependency Audit</h3>
            <span className="ui-card-subtitle">
              {repository.name} · {repository.branch} · commit <code>{repository.commit}</code>
            </span>
          </div>
          <a href={repository.url} target="_blank" rel="noreferrer">
            View repository
          </a>
        </div>

        <div className="dependency-audit-summary">
          <div><Boxes size={16} /><strong>{summary.dependencies}</strong><span>dependency entries</span></div>
          <div><PackageCheck size={16} /><strong>{summary.direct}</strong><span>direct</span></div>
          <div><Shield size={16} /><strong>{summary.transitive}</strong><span>transitive</span></div>
          <div><AlertTriangle size={16} /><strong>{summary.vulnerabilities}</strong><span>advisory matches</span></div>
        </div>

        <p className="ui-card-subtitle">
          Checked {summary.queried} exact versions against {data.advisorySource}.{' '}
          {summary.unresolved} dependency entries had no exact version.{' '}
          {summary.localDependenciesExcluded} workspace/local references were excluded.
        </p>
        <p className="ui-card-subtitle">
          Lockfiles: {data.lockfiles.length ? data.lockfiles.join(', ') : 'none; transitive dependencies could not be resolved'}
        </p>
      </section>

      <section className="card dependency-audit-card">
        <div className="card-header">
          <h3 className="card-title">Dependency Findings</h3>
          <span className="ui-card-subtitle">
            Advisory matches are tied to the exact version in the lockfile when available.
          </span>
        </div>
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dependency</th>
                <th>Version</th>
                <th>Scope</th>
                <th>Advisories</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dependency) => (
                <tr key={`${dependency.name}@${dependency.version ?? 'unresolved'}:${dependency.installPaths.join('|')}`}>
                  <td>
                    <strong>{dependency.name}</strong>
                    {dependency.development && <div className="ui-card-subtitle">development dependency</div>}
                    {dependency.dependencyTypes.map((type) => (
                      <div className="ui-card-subtitle" key={type}>{type}</div>
                    ))}
                  </td>
                  <td>{dependency.version ?? dependency.versionSpec?.join(', ') ?? 'unresolved'}</td>
                  <td>{dependency.direct ? 'direct' : 'transitive'}</td>
                  <td>
                    {dependency.vulnerabilities.length
                      ? dependency.vulnerabilities.map((vulnerability) => (
                        <div className="dependency-audit-advisory" key={vulnerability.id}>
                          <a href={vulnerability.url} target="_blank" rel="noreferrer">
                            {vulnerability.id}
                          </a>
                          <span>{vulnerability.severity}</span>
                          <div>{vulnerability.summary}</div>
                          {vulnerability.aliases.length > 0 && (
                            <small>Aliases: {vulnerability.aliases.join(', ')}</small>
                          )}
                        </div>
                      ))
                      : dependency.resolved
                        ? 'No known advisory'
                        : 'Not checked — version unresolved'}
                  </td>
                  <td>
                    {dependency.manifests.map((path) => <div key={path}>{path}</div>)}
                    {dependency.installPaths.slice(0, 3).map((path) => <div key={path}>{path}</div>)}
                    {dependency.installPaths.length > 3 && (
                      <div className="ui-card-subtitle">
                        +{dependency.installPaths.length - 3} install paths
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
