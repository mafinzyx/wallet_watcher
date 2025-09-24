// Portfolio.tsx
import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { TOKENS } from './constants';
import { useTokenBalances, useTokenPrices, useEthBalance } from './hooks';
import { formatUnits } from 'viem';

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const eth = useEthBalance(address);
  const balances = useTokenBalances(address);

  const priceIds = useMemo(
    () => ['ethereum', ...TOKENS.map((t) => t.coingeckoId)],
    []
  );
  const prices = useTokenPrices(priceIds);

  const rows = useMemo(() => {
    const items: Array<{
      symbol: string;
      amount: number;
      usdPrice: number;
      usdValue: number;
    }> = [];

    // ETH
    const ethAmount = eth.data?.value
      ? Number(formatUnits(eth.data.value, eth.data.decimals))
      : 0;
    const ethPrice = prices.data?.['ethereum']?.usd ?? 0;
    items.push({
      symbol: 'ETH',
      amount: ethAmount,
      usdPrice: ethPrice,
      usdValue: ethAmount * ethPrice,
    });

    // ERC20
    for (const b of balances) {
      const price = prices.data?.[b.coingeckoId]?.usd ?? 0;
      items.push({
        symbol: b.symbol,
        amount: b.amount,
        usdPrice: price,
        usdValue: b.amount * price,
      });
    }
    return items;
  }, [eth.data, balances, prices.data]);

  const totalUsd = rows.reduce((acc, r) => acc + r.usdValue, 0);

  if (!isConnected) return <p>Please connect your wallet.</p>;

  if (eth.isFetching || prices.isFetching) return <p>Loading...</p>;
  if (eth.isError || prices.isError)
    return <p style={{ color: 'red' }}>Error loading data</p>;

  return (
    <div>
      <h2>Portfolio</h2>
      <p>
        <strong>Total:</strong> ${totalUsd}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '8px',
          alignItems: 'baseline',
        }}
      >
        <div>
          <strong>Asset</strong>
        </div>
        <div>
          <strong>Amount</strong>
        </div>
        <div>
          <strong>Price (USD)</strong>
        </div>
        <div>
          <strong>Value (USD)</strong>
        </div>

        {rows.map((r) => (
          <React.Fragment key={r.symbol}>
            <div>{r.symbol}</div>
            <div>{r.amount}</div>
            <div>${r.usdPrice}</div>
            <div>${r.usdValue}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
