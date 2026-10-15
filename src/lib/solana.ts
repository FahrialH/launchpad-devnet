import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEFAULT_SOLANA_RPC, FALLBACK_RPCS, MAINNET_FALLBACK_RPCS } from './constants';

// Primary is DEFAULT_SOLANA_RPC with network-appropriate fallbacks (devnet vs mainnet)
export const FALLBACK_RPC_ENDPOINTS = [
  DEFAULT_SOLANA_RPC,
  ...FALLBACK_RPCS,
].filter((url, index, self) => url && self.indexOf(url) === index) as string[];

// Re-export for edge-function parity checks
export { MAINNET_FALLBACK_RPCS };

export const getConnection = (customRpcUrl?: string): Connection => {
  const rpcUrl = customRpcUrl || DEFAULT_SOLANA_RPC;
  // Only derive wss for api.mainnet-beta/mainnet – other public RPCs (Ankr etc.)
  // are HTTP-only in this app to avoid noisy WSS failures. When wsEndpoint is
  // undefined, Connection auto-derives it, so we explicitly disable it for
  // non-mainnet hosts by pointing it to the same reliable mainnet WSS or disabling.
  const isMainnetBeta = rpcUrl.includes('api.mainnet');
  const wsEndpoint = isMainnetBeta
    ? rpcUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
    : undefined;

  // Pass wsEndpoint explicitly: for non-mainnet we set undefined and also
  // silence WS by not subscribing anywhere (see useWalletBalance). For mainnet
  // we provide the correct wss://api.mainnet.solana.com.
  if (isMainnetBeta && wsEndpoint) {
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint,
      confirmTransactionInitialTimeout: 15000,
    });
  }
  // HTTP-only connection – no WS attempt
  return new Connection(rpcUrl, 'confirmed');
};

export const formatAddress = (address: string, startChars = 4, endChars = 4): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Robust SOL balance fetcher with automatic RPC fallback cycling.
 * Uses plain HTTP JSON-RPC (no WebSocket) to avoid `wss://... failed` noise
 * on public nodes. Falls back across api.mainnet.solana.com endpoints.
 */
export async function fetchSolBalance(
  address: string,
  customRpcUrl?: string
): Promise<number> {
  const endpoints = customRpcUrl
    ? [customRpcUrl, ...FALLBACK_RPC_ENDPOINTS]
    : FALLBACK_RPC_ENDPOINTS;

  // Validate address early to surface clear error
  let pubkeyStr: string;
  try {
    pubkeyStr = new PublicKey(address).toBase58();
  } catch {
    throw new Error('Invalid wallet address');
  }

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      // HTTP JSON-RPC – no Connection / no WSS – 8s timeout per endpoint
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [pubkeyStr],
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(t));
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text.slice(0, 200)}` : ''}`);
      }
      const json = (await res.json()) as {
        result?: { value: number };
        error?: { message: string; code?: number };
      };
      if (json.error) throw new Error(json.error.message || `RPC error ${json.error.code}`);
      if (typeof json.result?.value !== 'number') throw new Error('Invalid RPC response');
      return json.result.value / LAMPORTS_PER_SOL;
    } catch (err) {
      // 403 Access forbidden from api.mainnet.solana.com – auto-rotate to next fallback
      console.warn(`RPC balance query failed on ${endpoint}:`, err);
      lastError = err;
    }
  }

  // Final fallback: try Connection HTTP (also avoids explicit WSS)
  for (const endpoint of endpoints) {
    try {
      const conn = new Connection(endpoint, 'confirmed');
      const pubKey = new PublicKey(address);
      const lamports = await conn.getBalance(pubKey, 'confirmed');
      return lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Solana RPC endpoints failed to respond.');
}

/**
 * Forcefully disconnect the wallet and deselect the adapter so the
 * wallet-adapter state is fully reset (avoids "still connected" ghost state).
 */
export async function forceDisconnectWallet(
  wallet: { adapter?: { name?: string } } | null,
  disconnect: () => Promise<void>,
  select: (walletName: null) => void
): Promise<void> {
  try {
    await disconnect();
  } catch {
    // ignore – adapter may already be disconnected
  }
  try {
    select(null);
  } catch {
    // ignore
  }
}
