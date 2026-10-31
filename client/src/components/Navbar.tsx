import { useState } from 'react';
import { ShieldCheck, Home, Search, History, ExternalLink, Menu, X } from 'lucide-react';

interface Props {
  currentTab: 'home' | 'scan' | 'history' | 'results';
  onNavigate: (tab: 'home' | 'scan' | 'history') => void;
}

export function Navbar({ currentTab, onNavigate }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNav(tab: 'home' | 'scan' | 'history') {
    onNavigate(tab);
    setMobileMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" onClick={() => handleNav('home')}>
          <div className="brand-logo">
            <span className="brand-icon-wrapper">
              <ShieldCheck size={16} />
            </span>
            <span>KILLCHAIN</span>
          </div>
          <span className="brand-tag">Supply Chain Integrity</span>
        </div>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'is-open' : ''}`}>
          <button
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            <Home size={14} />
            <span>Home</span>
          </button>
          <button
            className={`nav-btn ${currentTab === 'scan' || currentTab === 'results' ? 'active' : ''}`}
            onClick={() => handleNav('scan')}
          >
            <Search size={14} />
            <span>Scanner</span>
          </button>
          <button
            className={`nav-btn ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => handleNav('history')}
          >
            <History size={14} />
            <span>History</span>
          </button>
          <a
            href="https://github.com/darshr25558-pixel/KillChain"
            target="_blank"
            rel="noreferrer"
            className="nav-btn"
          >
            <span>GitHub</span>
            <ExternalLink size={13} />
          </a>
        </nav>
      </div>
    </header>
  );
}
