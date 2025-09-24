import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import { WalletConnect } from '../WalletConnect';

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
    connector: undefined,
  }),
  useConnect: () => ({
    connectAsync: vi.fn(),
    connectors: [],
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
}));

// 1. Check if button renders
test('renders WalletConnect component', () => {
  render(<WalletConnect />);
  const fakeButton = screen.getByText(/Connect with Fake Wallet/i);
  expect(fakeButton).toBeInTheDocument();
});

// 2. Check if "Connect" button shows when disconnected
test('shows Connect button when wallet is disconnected', () => {
  render(<WalletConnect />);
  const connectButton = screen.getByText(/Connect with Fake Wallet/i);
  expect(connectButton).toBeInTheDocument();
});

// 3. Check if "Disconnect" button shows when connected
test('shows error message when fake wallet fails to connect', async () => {
  render(<WalletConnect />);
  const fakeButton = screen.getByText(/Connect with Fake Wallet/i);
  fireEvent.click(fakeButton);
  const errorMessage = await screen.findByText(/Simulated connection error/i);
  expect(errorMessage).toBeInTheDocument();
});
