const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

export interface CoinPrice {
  [id: string]: { usd: number };
}

export async function fetchTokenPrices(ids: string[]): Promise<CoinPrice> {
  if (ids.length === 0) return {};

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;

  try {
    const res = await fetch(url, {
      headers: COINGECKO_API_KEY
        ? { 'X-Coingecko-Api-Key': COINGECKO_API_KEY }
        : undefined,
    });
    if (!res.ok)
      throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
    const data: CoinPrice = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to fetch token prices:', err);
    return {};
  }
}
