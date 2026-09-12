export const MINIMUM_SOL_BALANCE = 2;

// Primary RPC – set to api.mainnet-beta.solana.com
// Locked to mainnet per product requirement – do not allow devnet/testnet.
export const MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com';
export const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const MAINNET_WS_URL = 'wss://api.mainnet-beta.solana.com';

// Public mainnet fallbacks used when the primary RPC returns 403/429 or is blocked.
// All are mainnet-beta endpoints – never devnet/testnet.
export const MAINNET_FALLBACK_RPCS: string[] = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet.solana.com',
];

const envRpc = (import.meta.env.VITE_SOLANA_RPC_URL || '').trim();
const envNetwork = (import.meta.env.VITE_SOLANA_NETWORK || '').trim();

// Allow VITE_SOLANA_RPC_URL override for any mainnet HTTP(S) URL (e.g. Helius/Alchemy/QuickNode).
// Block devnet/testnet overrides per product requirement – app is mainnet-only.
function isDevnetUrl(url: string): boolean {
  return /devnet|testnet/i.test(url);
}

if (envRpc && isDevnetUrl(envRpc)) {
  console.warn(`[Solana] VITE_SOLANA_RPC_URL=${envRpc} looks like devnet/testnet – ignoring, forcing ${MAINNET_RPC_URL}.`);
}
if (envNetwork && envNetwork !== 'mainnet-beta' && envNetwork !== 'mainnet') {
  console.warn(`[Solana] VITE_SOLANA_NETWORK=${envNetwork} ignored – forcing mainnet-beta.`);
}

export const DEFAULT_SOLANA_RPC =
  envRpc && !isDevnetUrl(envRpc) && /^https?:\/\//.test(envRpc) ? envRpc : MAINNET_RPC_URL;

export const DEFAULT_SOLANA_NETWORK = 'mainnet-beta';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';
