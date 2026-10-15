export const MINIMUM_SOL_BALANCE = 0.001;

// Primary RPC configuration
export const MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com';
export const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

export const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

const envRpc = (import.meta.env.VITE_SOLANA_RPC_URL || '').trim();
const envNetwork = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet').trim();

export const IS_DEVNET = envNetwork.toLowerCase() === 'devnet';

export const DEFAULT_SOLANA_NETWORK = IS_DEVNET ? 'devnet' : 'mainnet-beta';

export const DEFAULT_SOLANA_RPC =
  envRpc || (IS_DEVNET ? DEVNET_RPC_URL : MAINNET_RPC_URL);

export const EXPECTED_GENESIS_HASH = IS_DEVNET
  ? DEVNET_GENESIS_HASH
  : MAINNET_GENESIS_HASH;

// Public fallbacks
export const MAINNET_FALLBACK_RPCS: string[] = IS_DEVNET
  ? ['https://api.devnet.solana.com']
  : [
      'https://solana-rpc.publicnode.com',
      'https://api.mainnet.solana.com',
    ];

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';
