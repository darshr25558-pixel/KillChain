import { useState } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { ScanPage } from './pages/ScanPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const [tab, setTab] = useState<'scan' | 'history' | 'results'>('scan');
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
      <main className="main-content">
        {tab === 'scan' && <ScanPage onScanComplete={handleScanComplete} />}
        {tab === 'history' && (
          <HistoryPage onSelectScan={handleSelectScan} onNewScan={() => setTab('scan')} />
        )}
        {tab === 'results' && activeScanId && (
          <ResultsPage scanId={activeScanId} onBack={() => setTab('scan')} />
        )}
      </main>
    </div>
  );
}
