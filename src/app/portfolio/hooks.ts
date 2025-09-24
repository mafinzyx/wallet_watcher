import { useMemo } from 'react';
import { useReadContracts, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { TOKENS, erc20Abi } from './constants';
import { fetchTokenPrices, type CoinPrice } from './adapter';

export function useTokenBalances(address?: `0x${string}`) {
  const contracts = useMemo(() => {
    if (!address) return [];
    return TOKENS.flatMap((t) => [
      {
        address: t.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: 1,
      },
      {
        address: t.address,
        abi: erc20Abi,
        functionName: 'decimals',
        args: [],
        chainId: 1,
      },
    ]);
  }, [address]);

  const query = useReadContracts({
    contracts,
    query: { enabled: !!address && contracts.length > 0 },
  });

  return useMemo(() => {
    if (!query.data) return [];
    return TOKENS.map((t, i) => {
      const bal = query.data[i * 2]?.result as bigint | undefined;
      const dec = query.data[i * 2 + 1]?.result as number | undefined;
      const decimals = dec ?? 18;
      let amount;
      if (bal) {
        amount = Number(formatUnits(bal, decimals));
      } else {
        amount = Math.floor(Math.random() * 1000); // for test
      }
      return { symbol: t.symbol, coingeckoId: t.coingeckoId, amount };
    });
  }, [query.data]);
}

export function useTokenPrices(ids: string[]) {
  return useQuery<CoinPrice>({
    queryKey: ['prices', ids],
    queryFn: () => fetchTokenPrices(ids),
    refetchInterval: 1000 * 60, // 60 seconds
  });
}

export function useEthBalance(address?: `0x${string}`) {
  return useBalance({ address, query: { enabled: !!address } });
}
