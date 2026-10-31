interface Props {
  currentTab: 'scan' | 'history' | 'results';
  onNavigate: (tab: 'scan' | 'history') => void;
}

export function Navbar({ currentTab, onNavigate }: Props) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo">
            <span className="brand-dot" />
            KILLCHAIN
          </div>
          <span className="brand-tag">Supply Chain Integrity Analyzer</span>
        </div>
        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'scan' ? 'active' : ''}`}
            onClick={() => onNavigate('scan')}
          >
            New Scan
          </button>
          <button
            className={`nav-btn ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            History
          </button>
        </nav>
      </div>
    </header>
  );
}
