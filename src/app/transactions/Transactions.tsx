import React, { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type TxItem = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  feeWei?: string;
  timestamp: number;
};

const PAGE_SIZES = [20, 30, 50];

function expBackoffDelay(attempt: number) {
  return Math.min(1000 * 2 ** attempt, 15000);
}

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

// Detect anomalies
function detectAnomalies(items: TxItem[]) {
  const highFeeHashes = new Set<string>();
  const outlierHashes = new Set<string>();

  if (items.length === 0) return { highFeeHashes, outlierHashes };

  const values = items.map((i) => Number(i.value));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  );

  for (const tx of items) {
    const val = Number(tx.value);
    if (std > 0 && Math.abs(val - mean) > 3 * std) outlierHashes.add(tx.hash);
    const fee = tx.feeWei ? Number(tx.feeWei) : 0;
    if (fee > mean * 0.05) highFeeHashes.add(tx.hash);
  }

  return { highFeeHashes, outlierHashes };
}

export async function fetchTransactions(
  address: string,
  opts: { page: number; pageSize: number; sort: 'asc' | 'desc' }
): Promise<{ items: TxItem[]; total: number; fromCsv: boolean }> {
  let allItems: TxItem[] = [];
  let fromCsv = false;

  // Try Etherscan first
  if (ETHERSCAN_API_KEY) {
    try {
      const res = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=${opts.sort}&apikey=${ETHERSCAN_API_KEY}`
      );
      const data = await res.json();
      if (Array.isArray(data.result) && data.result.length > 0) {
        allItems = data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to || null,
          value: tx.value,
          feeWei:
            tx.gasUsed && tx.gasPrice
              ? String(BigInt(tx.gasUsed) * BigInt(tx.gasPrice))
              : undefined,
          timestamp: Number(tx.timeStamp) * 1000,
        }));
      }
    } catch (err) {
      console.warn('Etherscan fetch failed, fallback to CSV', err);
    }
  }

  // Fallback CSV
  if (allItems.length === 0) {
    const res = await fetch('/transactions.csv');
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    allItems = (parsed.data as any[]).map((row) => ({
      hash: row.hash,
      from: row.from,
      to: row.to || null,
      value: row.value,
      feeWei: row.feeWei,
      timestamp: Number(row.timestamp),
    }));
    fromCsv = true;
  }

  // Sorting
  allItems.sort((a, b) => {
    if (opts.sort === 'desc') {
      if (b.timestamp < a.timestamp) return 1;
      if (b.timestamp > a.timestamp) return -1;
      return 0;
    } else {
      if (a.timestamp < b.timestamp) return 1;
      if (a.timestamp > b.timestamp) return -1;
      return 0;
    }
  });

  // Pagination
  const start = (opts.page - 1) * opts.pageSize;
  const end = start + opts.pageSize;
  const pagedItems = allItems.slice(start, end);

  return { items: pagedItems, total: allItems.length, fromCsv };
}

export const Transactions: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [queryStr, setQueryStr] = useState('');

  const txQuery = useQuery({
    queryKey: ['txs', address, page, pageSize, sort],
    enabled: !!address,
    retry: 3,
    retryDelay: expBackoffDelay,
    queryFn: () => fetchTransactions(address!, { page, pageSize, sort }),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });

  const items = txQuery.data?.items ?? [];
  const fromCsv = txQuery.data?.fromCsv ?? false;

  const { highFeeHashes, outlierHashes } = useMemo(
    () => detectAnomalies(items),
    [items]
  );

  const filtered = useMemo(() => {
    const q = queryStr.trim().toLowerCase();
    if (!q) return items;
    return items.filter((tx) =>
      [tx.hash, tx.from, tx.to ?? '', tx.value, tx.feeWei ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [items, queryStr]);

  const anyHighFee = filtered.some((tx) => highFeeHashes.has(tx.hash));
  const anyOutlier = filtered.some((tx) => outlierHashes.has(tx.hash));

  const totalItems = txQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (!isConnected)
    return <div>Please connect your wallet to see transactions.</div>;

  return (
    <div>
      <h2>Transactions</h2>
      {items.length === 0 ? (
        <p>No transactions found for this wallet.</p>
      ) : fromCsv ? (
        <p>
          Showing test transactions from CSV because no real transactions were
          found.
        </p>
      ) : null}

      {txQuery.isError && (
        <p style={{ color: 'red' }}>
          Failed to load transactions. Please try again.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <label>
          Sort:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
            style={{ marginLeft: 6 }}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </label>
        <label>
          Page Size:
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(+e.target.value);
              setPage(1);
            }}
            style={{ marginLeft: 6 }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        >
          Next
        </button>
      </div>

      <input
        value={queryStr}
        onChange={(e) => setQueryStr(e.target.value)}
        placeholder="Search hash/from/to/value/fee"
        style={{ marginBottom: 8, padding: 6, width: '100%' }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 2fr 2fr 2fr',
          gap: 8,
        }}
      >
        {['Hash', 'From', 'To', 'Value', 'Fee'].map((h) => (
          <div key={h}>
            <strong>{h}</strong>
          </div>
        ))}
        {filtered.map((tx) => {
          const highlight = highFeeHashes.has(tx.hash)
            ? '#ff7b00ff'
            : outlierHashes.has(tx.hash)
              ? '#ff0000ff'
              : undefined;
          return (
            <React.Fragment key={tx.hash}>
              <div style={{ background: highlight }}>{tx.hash ?? '-'}</div>
              <div style={{ background: highlight }}>{tx.from ?? '-'}</div>
              <div style={{ background: highlight }}>{tx.to ?? '-'}</div>
              <div style={{ background: highlight }}>{tx.value ?? '-'}</div>
              <div style={{ background: highlight }}>{tx.feeWei ?? '-'}</div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        {anyHighFee && (
          <p style={{ color: 'orange' }}>
            Transactions highlighted in orange have unusually high fees compared
            to the average.
          </p>
        )}
        {anyOutlier && (
          <p style={{ color: 'red' }}>
            Transactions highlighted in red are outliers with unusually high or
            low amounts.
          </p>
        )}
      </div>
    </div>
  );
};

export default Transactions;
