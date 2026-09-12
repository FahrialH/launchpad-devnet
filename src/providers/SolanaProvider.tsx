import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { MAINNET_RPC_URL, MAINNET_WS_URL, MAINNET_GENESIS_HASH } from '../lib/constants';
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

const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqaHM';
const TESTNET_GENESIS = '4uhcVJyU9pJkvQyS88uRDisw22GZE';

function isMainnetGenesis(hash: string | null): boolean {
  return hash === MAINNET_GENESIS_HASH;
}

/**
 * Guard that enforces mainnet-only usage:
 * - Locks app RPC to api.mainnet-beta.solana.com (configured in provider)
 * - Verifies connection genesis hash is mainnet; if devnet/testnet detected via
 *   genesis hash mismatch, shows blocking modal asking user to switch network or disconnect.
 */
const MainnetGuard: FC<{ children: ReactNode }> = ({ children }) => {
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
        const isMainnet = isMainnetGenesis(hash);
        if (!isMainnet) {
          console.error(`[Solana] Connected to non-mainnet genesis ${hash}. Expected ${MAINNET_GENESIS_HASH}.`);
          setWrongNetwork(true);
        } else {
          setWrongNetwork(false);
        }
      } catch (err) {
        console.warn('[Solana] getGenesisHash failed – assuming mainnet RPC is correct', err);
        setWrongNetwork(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    checkGenesis();
    return () => { cancelled = true; };
  }, [connection, connected]);

  // Also watch for wallet that explicitly reports devnet/testnet
  useEffect(() => {
    if (connected && genesisHash && !isMainnetGenesis(genesisHash)) {
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
        await adapter.switchNetwork('mainnet-beta');
      } else if (adapter && typeof adapter.switchChain === 'function') {
        attempted = true;
        await adapter.switchChain('solana:mainnet-beta');
      } else if (win.solana && typeof win.solana.switchNetwork === 'function') {
        attempted = true;
        await win.solana.switchNetwork('mainnet-beta');
      } else if (win.solflare && typeof win.solflare.switchNetwork === 'function') {
        attempted = true;
        await win.solflare.switchNetwork('mainnet-beta');
      }

      if (!attempted) {
        setSwitchMessage('Programmatic network switching is not supported by your extension version. Please open extension Settings → Change Network to Mainnet-Beta.');
      } else {
        const hash = await connection.getGenesisHash();
        if (isMainnetGenesis(hash)) {
          setWrongNetwork(false);
        }
      }
    } catch (err: any) {
      console.warn('[Solana] Switch network error:', err);
      setSwitchMessage(err?.message || 'Please switch network to Mainnet-Beta in extension settings.');
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
    const isDevnet = genesisHash === DEVNET_GENESIS;
    const isTestnet = genesisHash === TESTNET_GENESIS;
    const detected = isDevnet ? 'Devnet' : isTestnet ? 'Testnet' : 'non-Mainnet';
    return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/30 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Wrong Network Detected</h2>
            <p className="text-sm text-slate-300 mb-2">
              Your wallet connection is set to <span className="font-semibold text-red-300">{detected}</span>, but this launchpad only supports <span className="font-semibold text-emerald-300">Solana Mainnet-Beta</span>.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              RPC endpoint is locked to <code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">api.mainnet-beta.solana.com</code>.
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-left text-xs text-slate-300 mb-4 space-y-1">
              <p className="font-semibold text-slate-200">To switch to Mainnet:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click <span className="text-purple-400 font-medium">Switch Network</span> below (if supported by wallet)</li>
                <li>Or open extension (Phantom / Solflare) → Settings → Network → <span className="text-emerald-400 font-semibold">Mainnet-Beta</span></li>
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
                <span>{switching ? 'Switching Network...' : 'Switch Network to Mainnet'}</span>
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

  // Optional subtle banner while checking (non-blocking)
  if (checking && connected) {
    // don't block, just show small indicator via console – no UI flicker
  }

  return <>{children}</>;
};

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // Strictly locked to mainnet – no env override, no devnet/testnet.
  const endpoint = useMemo(() => MAINNET_RPC_URL, []);

  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as const,
    wsEndpoint: MAINNET_WS_URL,
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
          <MainnetGuard>
            {children}
          </MainnetGuard>
        </WalletModalProviderComp>
      </WalletProviderComp>
    </ConnectionProviderComp>
  );
};
