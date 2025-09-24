import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export const WalletConnect = () => {
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [loadingConnectorId, setLoadingConnectorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fakeConnector = { id: 'fake', name: 'Fake Wallet' };

  const handleConnect = async (c: typeof connectors[number] | typeof fakeConnector) => {
    setLoadingConnectorId(c.id);
    setError(null);
    try {
      if (c.id === 'fake') {
        throw new Error('Simulated connection error');
      }
      await connectAsync({ connector: c as typeof connectors[number] });
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || 'Failed to connect');
    } finally {
      setLoadingConnectorId(null);
    }
  };

  const networkName = connector?.name ?? 'Unknown';

  if (isConnected) {
    return (
      <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
        <div>Connected to {address}</div>
        <div>Network: {networkName}</div>
        <button onClick={() => disconnect()} style={{ marginTop: 8 }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {connectors.map((c) => (
        <button
          key={c.id}
          onClick={() => handleConnect(c)}
          disabled={loadingConnectorId === c.id}
        >
          {loadingConnectorId === c.id ? `Connecting to ${c.name}...` : `Connect with ${c.name}`}
        </button>
      ))}

      {/* Test Error handling */}
      <button
        onClick={() => handleConnect(fakeConnector)}
        disabled={loadingConnectorId === fakeConnector.id}
        style={{ background: '#faa', marginTop: 4 }}
      >
        {loadingConnectorId === fakeConnector.id ? 'Connecting...' : 'Connect with Fake Wallet (test error)'}
      </button>

      {error && <div style={{ color: 'red', marginTop: 8 }}>Error: {error}</div>}
    </div>
  );
};
