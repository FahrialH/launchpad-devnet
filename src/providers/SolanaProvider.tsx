import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { DEFAULT_SOLANA_RPC, DEFAULT_SOLANA_NETWORK, EXPECTED_GENESIS_HASH, IS_DEVNET } from '../lib/constants';
import { forceDisconnectWallet } from '../lib/solana';

// Default styles for Solana Wallet Adapter UI
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProviderProps {
  children: ReactNode;
}

// Cast provider types for React 18 JSX compatibility
const ConnectionProviderComp = ConnectionProvider as unknown as React.FC<{
  endpoint: string;
  config?: { commitment?: 'processed' | 'confirmed' | 'finalized'; wsEndpoint?: string };
  children: ReactNode;
}>;
const WalletProviderComp = WalletProvider as unknown as React.FC<{ wallets: any[]; autoConnect?: boolean; children: ReactNode }>;
const WalletModalProviderComp = WalletModalProvider as unknown as React.FC<{ children: ReactNode }>;

function isValidGenesis(hash: string | null): boolean {
  if (!hash) return true;
  return hash === EXPECTED_GENESIS_HASH;
}

/**
 * Guard that verifies connection genesis hash matches configured network (devnet/mainnet).
 */
const NetworkGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const { connected, disconnect, select, publicKey, wallet } = useWallet();
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkGenesis() {
      setChecking(true);
      try {
        const hash = await connection.getGenesisHash();
        if (cancelled) return;
        setGenesisHash(hash);
        const valid = isValidGenesis(hash);
        if (!valid) {
          console.error(`[Solana] Connected to unexpected genesis ${hash}. Expected ${EXPECTED_GENESIS_HASH}.`);
          setWrongNetwork(true);
        } else {
          setWrongNetwork(false);
        }
      } catch (err) {
        console.warn('[Solana] getGenesisHash query completed:', err);
        setWrongNetwork(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    checkGenesis();
    return () => { cancelled = true; };
  }, [connection, connected]);

  // Also watch for wallet that explicitly reports unexpected genesis
  useEffect(() => {
    if (connected && genesisHash && !isValidGenesis(genesisHash)) {
      setWrongNetwork(true);
    }
  }, [connected, genesisHash]);

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    setSwitchMessage(null);
    try {
      const adapter = wallet?.adapter as any;
      const win = typeof window !== 'undefined' ? (window as any) : {};
      
      let attempted = false;
      if (adapter && typeof adapter.switchNetwork === 'function') {
        attempted = true;
        await adapter.switchNetwork(DEFAULT_SOLANA_NETWORK);
      } else if (adapter && typeof adapter.switchChain === 'function') {
        attempted = true;
        await adapter.switchChain(`solana:${DEFAULT_SOLANA_NETWORK}`);
      } else if (win.solana && typeof win.solana.switchNetwork === 'function') {
        attempted = true;
        await win.solana.switchNetwork(DEFAULT_SOLANA_NETWORK);
      } else if (win.solflare && typeof win.solflare.switchNetwork === 'function') {
        attempted = true;
        await win.solflare.switchNetwork(DEFAULT_SOLANA_NETWORK);
      }

      if (!attempted) {
        setSwitchMessage(`Please open your wallet extension Settings → Change Network to ${DEFAULT_SOLANA_NETWORK}.`);
      } else {
        const hash = await connection.getGenesisHash();
        if (isValidGenesis(hash)) {
          setWrongNetwork(false);
        }
      }
    } catch (err: any) {
      console.warn('[Solana] Switch network error:', err);
      setSwitchMessage(err?.message || `Please switch network to ${DEFAULT_SOLANA_NETWORK} in wallet extension.`);
    } finally {
      setSwitching(false);
    }
  };

  const handleDisconnect = async () => {
    setSwitching(true);
    try {
      await forceDisconnectWallet(wallet, disconnect, select);
      setWrongNetwork(false);
    } finally {
      setSwitching(false);
    }
  };

  if (wrongNetwork) {
    return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/30 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Wrong Network Detected</h2>
            <p className="text-sm text-slate-300 mb-2">
              Please switch your wallet to <span className="font-semibold text-emerald-300">{DEFAULT_SOLANA_NETWORK}</span> to participate in this sale.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Active RPC: <code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">{DEFAULT_SOLANA_RPC}</code>
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-left text-xs text-slate-300 mb-4 space-y-1">
              <p className="font-semibold text-slate-200">To switch network:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click <span className="text-purple-400 font-medium">Switch Network</span> below</li>
                <li>Or open extension (Phantom / Solflare) → Settings → Developer Settings → Change Network to <span className="text-emerald-400 font-semibold">{DEFAULT_SOLANA_NETWORK}</span></li>
              </ol>
            </div>

            {switchMessage && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left leading-relaxed">
                {switchMessage}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSwitchNetwork}
                disabled={switching}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${switching ? 'animate-spin' : ''}`} />
                <span>{switching ? 'Switching Network...' : `Switch Network to ${DEFAULT_SOLANA_NETWORK}`}</span>
              </button>

              <button
                onClick={handleDisconnect}
                disabled={switching}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>

            {publicKey && wallet && (
              <p className="mt-3.5 text-[11px] text-slate-500 truncate">
                Wallet: {wallet.adapter.name} ({publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)})
              </p>
            )}
          </div>
        </div>
        <div className="opacity-20 pointer-events-none select-none">{children}</div>
      </>
    );
  }

  return <>{children}</>;
};

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  const endpoint = useMemo(() => DEFAULT_SOLANA_RPC, []);

  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as const,
  }), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProviderComp endpoint={endpoint} config={connectionConfig}>
      <WalletProviderComp wallets={wallets} autoConnect>
        <WalletModalProviderComp>
          <NetworkGuard>
            {children}
          </NetworkGuard>
        </WalletModalProviderComp>
      </WalletProviderComp>
    </ConnectionProviderComp>
  );
};
