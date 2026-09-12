import { useEffect, useState } from 'react';

export interface SolPriceState {
  priceUsd: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

// CoinGecko is public, no key required; fallback to Jupiter price API if needed.
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
const JUPITER_URL = 'https://price.jup.ag/v4/price?ids=SOL';
export const FALLBACK_SOL_PRICE_USD = 145;

export function useSolPrice(): SolPriceState {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      // Try CoinGecko first
      try {
        const res = await fetch(COINGECKO_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
        const data = await res.json();
        const usd = data?.solana?.usd;
        if (typeof usd === 'number' && usd > 0) {
          if (!cancelled) {
            setPriceUsd(usd);
            setLastUpdated(new Date());
            setLoading(false);
          }
          return;
        }
        throw new Error('Invalid CoinGecko payload');
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        console.warn('[useSolPrice] CoinGecko failed, trying Jupiter:', err);
      }

      // Fallback to Jupiter
      try {
        const res = await fetch(JUPITER_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Jupiter ${res.status}`);
        const data = await res.json();
        const usd = data?.data?.SOL?.price;
        if (typeof usd === 'number' && usd > 0) {
          if (!cancelled) {
            setPriceUsd(usd);
            setLastUpdated(new Date());
            setLoading(false);
          }
          return;
        }
        throw new Error('Invalid Jupiter payload');
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        console.warn('[useSolPrice] Jupiter failed:', err);
        if (!cancelled) {
          // Provide fallback estimate so UI still shows SOL cost
          setPriceUsd(FALLBACK_SOL_PRICE_USD);
          setLastUpdated(new Date());
          setError(`Live SOL price unavailable – showing estimate (~$${FALLBACK_SOL_PRICE_USD}).`);
          setLoading(false);
        }
      }
    };

    fetchPrice();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  return { priceUsd, loading, error, lastUpdated, refresh };
}

/**
 * Helper: convert a USDC/USDT/USD-denominated amount to SOL.
 * Returns null if solPrice is unavailable.
 */
export function usdToSol(usdAmount: number, solPriceUsd: number | null): number | null {
  if (!solPriceUsd || solPriceUsd <= 0 || !Number.isFinite(usdAmount) || usdAmount <= 0) return null;
  return usdAmount / solPriceUsd;
}

/**
 * Helper: convert a SOL-denominated amount to USD/USDC equivalent.
 * Returns null if solPrice is unavailable.
 */
export function solToUsd(solAmount: number, solPriceUsd: number | null): number | null {
  if (!solPriceUsd || solPriceUsd <= 0 || !Number.isFinite(solAmount) || solAmount <= 0) return null;
  return solAmount * solPriceUsd;
}

/**
 * Extract numeric value from "100 USDC" style strings.
 */
export function parsePurchaseAmount(raw: string): number | null {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}
