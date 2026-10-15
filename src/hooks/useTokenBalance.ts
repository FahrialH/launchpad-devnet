import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';

export function useTokenBalance(mintAddressStr?: string, decimals: number = 9) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenBalance = useCallback(async () => {
    if (!connected || !publicKey || !mintAddressStr) {
      setTokenBalance(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mintPubkey = new PublicKey(mintAddressStr);
      const buyerAta = getAssociatedTokenAddressSync(mintPubkey, publicKey);
      const ataInfo = await getAccount(connection, buyerAta);
      const rawUnits = Number(ataInfo.amount);
      const divisor = 10 ** decimals;
      setTokenBalance(rawUnits / divisor);
    } catch {
      // If ATA doesn't exist yet or is empty, user holds 0 tokens
      setTokenBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, mintAddressStr, connection, decimals]);

  useEffect(() => {
    fetchTokenBalance();

    if (connected && publicKey && mintAddressStr) {
      const interval = setInterval(() => {
        fetchTokenBalance();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, mintAddressStr, fetchTokenBalance]);

  return {
    tokenBalance,
    loading,
    error,
    refreshTokenBalance: fetchTokenBalance,
    setTokenBalance,
  };
}
