interface Props {
  currentTab: 'home' | 'scan' | 'history' | 'results';
  onNavigate: (tab: 'home' | 'scan' | 'history') => void;
}

export function Navbar({ currentTab, onNavigate }: Props) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" onClick={() => onNavigate('home')}>
          <div className="brand-logo">
            <span className="brand-dot" />
            KILLCHAIN
          </div>
          <span className="brand-tag">Supply Chain Integrity</span>
        </div>
        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            className={`nav-btn ${currentTab === 'scan' || currentTab === 'results' ? 'active' : ''}`}
            onClick={() => onNavigate('scan')}
          >
            Scanner
          </button>
          <button
            className={`nav-btn ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            History
          </button>
          <a
            href="https://github.com/darshr25558-pixel/KillChain"
            target="_blank"
            rel="noreferrer"
            className="nav-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
