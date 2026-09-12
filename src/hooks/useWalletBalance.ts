import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { fetchSolBalance } from '../lib/solana';

export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalanceSol(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const address = publicKey.toBase58();

    try {
      // First try connected WalletProvider Connection
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalanceSol(sol);
    } catch (primaryErr) {
      console.warn('Primary WalletProvider RPC failed, trying fallback endpoints...', primaryErr);
      try {
        // Fallback endpoint cycling
        const fallbackSol = await fetchSolBalance(address);
        setBalanceSol(fallbackSol);
      } catch (fallbackErr) {
        console.error('All Solana RPC endpoints failed to query balance:', fallbackErr);
        setError('Solana RPC rate-limited or unavailable. Use simulation toggle or refresh.');
      }
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    fetchBalance();

    if (connected && publicKey) {
      // Polling only – no WSS subscription. api.mainnet.solana.com WSS is used
      // via SolanaProvider config; avoid noisy onAccountChange subscriptions.
      const interval = setInterval(() => {
        fetchBalance();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [connected, publicKey, connection, fetchBalance]);

  return {
    balanceSol,
    loading,
    error,
    refreshBalance: fetchBalance,
    setBalanceSol, // Allow manual testing toggle in UI for review
  };
}
