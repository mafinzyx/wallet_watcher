import './App.css';
// import TestComponents from '../components/TestComponents'
import { WalletConnect } from '../components/WalletConnect';
import Portfolio from './portfolio/Portfolio';
import Transactions from './transactions/Transactions';

function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Wallet Watcher</h1>

      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}
      >
        <WalletConnect />
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
          <div className="box">
            <Portfolio />
          </div>
          <div className="box">
            <Transactions />
          </div>
      </div>
      {/* <TestComponents /> */}
    </div>
  );
}

export default App;
