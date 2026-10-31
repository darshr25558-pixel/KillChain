import { useState } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const [tab, setTab] = useState<'home' | 'scan' | 'history' | 'results'>('home');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  function handleScanComplete(id: string) {
    setActiveScanId(id);
    setTab('results');
  }

  function handleSelectScan(id: string) {
    setActiveScanId(id);
    setTab('results');
  }

  return (
    <div className="app-wrapper">
      <Navbar currentTab={tab} onNavigate={(nextTab) => setTab(nextTab)} />
      {tab === 'home' && <HomePage onStartScan={() => setTab('scan')} />}
      {tab !== 'home' && (
        <main className="main-content">
          {tab === 'scan' && <ScanPage onScanComplete={handleScanComplete} />}
          {tab === 'history' && (
            <HistoryPage onSelectScan={handleSelectScan} onNewScan={() => setTab('scan')} />
          )}
          {tab === 'results' && activeScanId && (
            <ResultsPage scanId={activeScanId} onBack={() => setTab('scan')} />
          )}
        </main>
      )}
    </div>
  );
}
