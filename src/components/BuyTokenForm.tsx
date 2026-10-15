import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import {
  Coins,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import idl from '../idl/token_sale.json';
import { TokenConfig } from '../types';
import { solToUsd } from '../hooks/useSolPrice';
import { DEFAULT_SOLANA_NETWORK } from '../lib/constants';

interface BuyTokenFormProps {
  token: TokenConfig;
  balanceSol: number | null;
  solPriceUsd: number | null;
  solPriceLoading: boolean;
  refreshBalance: () => void;
  onPurchaseSuccess?: (txSig: string, amount: number) => void;
}

interface SaleOnChainState {
  treasury: PublicKey;
  priceLamportsPerWholeToken: number;
  tokenDecimals: number;
  allocation: number;
  sold: number;
  perWalletMax: number;
  paused: boolean;
  startTs: number;
  endTs: number;
}

export const BuyTokenForm: React.FC<BuyTokenFormProps> = ({
  token,
  balanceSol,
  solPriceUsd,
  refreshBalance,
  onPurchaseSuccess,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tokenAmountInput, setTokenAmountInput] = useState<string>('10');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchingState, setFetchingState] = useState<boolean>(true);
  const [saleState, setSaleState] = useState<SaleOnChainState | null>(null);
  const [buyerPurchasedCount, setBuyerPurchasedCount] = useState<number>(0);
  const [buyerTokenBalance, setBuyerTokenBalance] = useState<number | null>(null);
  const [txSuccessSig, setTxSuccessSig] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Addresses
  const mintAddressStr = token.mintAddress || 'BLytgDiEysfuneo9S1ojCUB3xBm9iJfaQnxATwtai2vu';
  const programIdStr = token.programId || (idl as any).address || 'DVGezEfHU5VwEGekdpc3PnUgUpfX2q6FdisG8hoGdF6c';

  const mintPubkey = useMemo(() => new PublicKey(mintAddressStr), [mintAddressStr]);
  const programPubkey = useMemo(() => new PublicKey(programIdStr), [programIdStr]);

  const [salePda] = useMemo(() => {
    if (token.salePda) {
      return [new PublicKey(token.salePda), 255];
    }
    return PublicKey.findProgramAddressSync(
      [Buffer.from('sale'), mintPubkey.toBuffer()],
      programPubkey
    );
  }, [token.salePda, mintPubkey, programPubkey]);

  // Load Anchor Program
  const program = useMemo(() => {
    // Read-only provider when wallet is not connected
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };
    const activeWallet = wallet.publicKey ? (wallet as any) : dummyWallet;
    const provider = new AnchorProvider(connection, activeWallet, {
      commitment: 'confirmed',
    });
    return new Program(idl as any, provider);
  }, [connection, wallet]);

  // Fetch On-chain Sale and Buyer State
  const fetchOnChainData = useCallback(async () => {
    setFetchingState(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Sale PDA state
      const saleAcc = await (program.account as any).sale.fetch(salePda);
      const decimals = saleAcc.tokenDecimals;
      const decimalsDivisor = 10 ** decimals;

      const state: SaleOnChainState = {
        treasury: saleAcc.treasury as PublicKey,
        priceLamportsPerWholeToken: Number(saleAcc.priceLamportsPerWholeToken),
        tokenDecimals: decimals,
        allocation: Number(saleAcc.allocation) / decimalsDivisor,
        sold: Number(saleAcc.sold) / decimalsDivisor,
        perWalletMax: Number(saleAcc.perWalletMax) / decimalsDivisor,
        paused: Boolean(saleAcc.paused),
        startTs: Number(saleAcc.startTs),
        endTs: Number(saleAcc.endTs),
      };
      setSaleState(state);

      // 2. Fetch Buyer Stats if wallet connected
      if (wallet.publicKey) {
        const [buyerStatsPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('buyer'), salePda.toBuffer(), wallet.publicKey.toBuffer()],
          programPubkey
        );

        try {
          const statsAcc = await (program.account as any).buyerStats.fetch(buyerStatsPda);
          setBuyerPurchasedCount(Number(statsAcc.totalPurchased) / decimalsDivisor);
        } catch {
          // Hasn't purchased yet; stats account not yet initialized
          setBuyerPurchasedCount(0);
        }

        // 3. Fetch Buyer Token ATA balance
        try {
          const buyerAta = getAssociatedTokenAddressSync(mintPubkey, wallet.publicKey);
          const ataInfo = await getAccount(connection, buyerAta);
          setBuyerTokenBalance(Number(ataInfo.amount) / decimalsDivisor);
        } catch {
          setBuyerTokenBalance(0);
        }
      }
    } catch (err: any) {
      console.error('Error fetching on-chain sale state:', err);
      // Fallback: derive from token configuration
      const allocClean = parseFloat((token.sale.allocation || '500000').replace(/[^0-9.]/g, '')) || 500000;
      const maxClean = parseFloat((token.sale.maximumPurchase || '10000').replace(/[^0-9.]/g, '')) || 10000;
      const priceLamports = Math.round((token.sale.tokenPrice || 0.001) * LAMPORTS_PER_SOL);
      const fallbackTreasury = token.treasuryAddress
        ? new PublicKey(token.treasuryAddress)
        : new PublicKey('A7dsZyqVQWuX72juKW6qD1PyPoNDo4FWWm9boqpYczt9');

      setSaleState({
        treasury: fallbackTreasury,
        priceLamportsPerWholeToken: priceLamports,
        tokenDecimals: 9,
        allocation: allocClean,
        sold: 0,
        perWalletMax: maxClean,
        paused: false,
        startTs: Math.floor(new Date(token.sale.startAt || Date.now()).getTime() / 1000),
        endTs: Math.floor(new Date(token.sale.endAt || Date.now() + 86400 * 7).getTime() / 1000),
      });
    } finally {
      setFetchingState(false);
    }
  }, [connection, mintPubkey, program, programPubkey, salePda, wallet.publicKey]);

  useEffect(() => {
    fetchOnChainData();
  }, [fetchOnChainData]);

  // Calculations
  const parsedTokens = useMemo(() => {
    const val = parseInt(tokenAmountInput.replace(/,/g, ''), 10);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [tokenAmountInput]);

  const priceInSol = useMemo(() => {
    const lamports = saleState?.priceLamportsPerWholeToken ?? 1000000;
    return lamports / LAMPORTS_PER_SOL;
  }, [saleState]);

  const totalCostSol = useMemo(() => {
    return parsedTokens * priceInSol;
  }, [parsedTokens, priceInSol]);

  const totalCostUsd = useMemo(() => {
    return solToUsd(totalCostSol, solPriceUsd);
  }, [totalCostSol, solPriceUsd]);

  const remainingTokens = useMemo(() => {
    if (!saleState) return 0;
    return Math.max(0, saleState.allocation - saleState.sold);
  }, [saleState]);

  const walletAllowanceRemaining = useMemo(() => {
    if (!saleState) return 0;
    return Math.max(0, saleState.perWalletMax - buyerPurchasedCount);
  }, [saleState, buyerPurchasedCount]);

  // Execute On-Chain Buy Instruction
  const handleBuyTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTxSuccessSig(null);

    if (!wallet.publicKey || !wallet.signTransaction) {
      setErrorMessage('Please connect your Solana wallet.');
      return;
    }

    if (parsedTokens <= 0) {
      setErrorMessage('Please enter a valid whole token amount (at least 1 token).');
      return;
    }

    if (!saleState) {
      setErrorMessage('Sale details not loaded from on-chain. Please refresh.');
      return;
    }

    if (saleState.paused) {
      setErrorMessage('The sale is currently paused by the administrator.');
      return;
    }

    const nowSecs = Math.floor(Date.now() / 1000);
    if (nowSecs < saleState.startTs) {
      setErrorMessage('The sale has not started yet.');
      return;
    }
    if (nowSecs >= saleState.endTs) {
      setErrorMessage('The sale has concluded.');
      return;
    }

    if (parsedTokens > remainingTokens) {
      setErrorMessage(`Insufficient sale allocation. Only ${remainingTokens.toLocaleString()} tokens remain.`);
      return;
    }

    if (parsedTokens > walletAllowanceRemaining) {
      setErrorMessage(
        `Exceeds maximum wallet cap. You can purchase up to ${walletAllowanceRemaining.toLocaleString()} more tokens.`
      );
      return;
    }

    const requiredSol = totalCostSol + 0.005; // cost + ATA rent / transaction buffer
    if (balanceSol === null || balanceSol < requiredSol) {
      setErrorMessage(
        `Insufficient SOL balance. Required: ~${requiredSol.toFixed(4)} SOL (including gas & account rent), Available: ${(balanceSol ?? 0).toFixed(4)} SOL.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Derive required accounts
      const vaultAta = token.vaultAddress
        ? new PublicKey(token.vaultAddress)
        : getAssociatedTokenAddressSync(mintPubkey, salePda, true);
      const buyerAta = getAssociatedTokenAddressSync(mintPubkey, wallet.publicKey);
      const [buyerStatsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('buyer'), salePda.toBuffer(), wallet.publicKey.toBuffer()],
        programPubkey
      );

      // 2. Base units (tokens * 10^decimals)
      const decimalsFactor = new BN(10).pow(new BN(saleState.tokenDecimals));
      const tokenAmountBaseUnits = new BN(parsedTokens).mul(decimalsFactor);

      // 3. Build & send Anchor instruction
      const txSig = await (program.methods as any)
        .buy(tokenAmountBaseUnits)
        .accounts({
          buyer: wallet.publicKey,
          sale: salePda,
          mint: mintPubkey,
          treasury: saleState.treasury,
          vault: vaultAta,
          buyerTokenAccount: buyerAta,
          buyerStats: buyerStatsPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setTxSuccessSig(txSig);
      refreshBalance();
      fetchOnChainData();

      if (onPurchaseSuccess) {
        onPurchaseSuccess(txSig, parsedTokens);
      }
    } catch (err: any) {
      console.error('Purchase transaction failed:', err);
      let msg = err?.message || 'Transaction failed.';
      if (msg.includes('User rejected')) {
        msg = 'Transaction cancelled in wallet.';
      } else if (msg.includes('6008') || msg.includes('AllocationExceeded')) {
        msg = 'Total sale allocation exceeded.';
      } else if (msg.includes('6009') || msg.includes('PerWalletMaxExceeded')) {
        msg = 'Per-wallet purchase limit exceeded.';
      } else if (msg.includes('6006') || msg.includes('SalePaused')) {
        msg = 'Sale is paused.';
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const setMaxAllowed = () => {
    const maxPossible = Math.min(remainingTokens, walletAllowanceRemaining);
    setTokenAmountInput(maxPossible.toString());
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Buy {token.name}</h3>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              On-Chain Devnet
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant SPL token delivery directly to your wallet ATA
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOnChainData}
          disabled={fetchingState}
          title="Refresh On-Chain State"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${fetchingState ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live On-Chain Parameters Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Token Price</span>
          <span className="text-sm font-extrabold text-white font-mono">
            {priceInSol} SOL
          </span>
          {solPriceUsd && (
            <span className="text-[10px] text-slate-400 block">
              ~${(priceInSol * solPriceUsd).toFixed(4)}
            </span>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Available</span>
          <span className="text-sm font-extrabold text-emerald-400 font-mono">
            {saleState ? `${remainingTokens.toLocaleString()}` : '...'}
          </span>
          <span className="text-[10px] text-slate-400 block">in vault</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Wallet Limit</span>
          <span className="text-sm font-extrabold text-purple-300 font-mono">
            {saleState ? `${walletAllowanceRemaining.toLocaleString()}` : '...'}
          </span>
          <span className="text-[10px] text-slate-400 block">remaining</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Your Tokens</span>
          <span className="text-sm font-extrabold text-white font-mono">
            {buyerTokenBalance !== null ? buyerTokenBalance.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-slate-400 block">{token.symbol}</span>
        </div>
      </div>

      {/* Success Notification */}
      {txSuccessSig && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Pembelian Berhasil! (Purchase Confirmed)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Selamat! Sebanyak <strong className="text-white font-mono">{parsedTokens.toLocaleString()} {token.symbol}</strong> telah berhasil ditransfer ke Associated Token Account (ATA) wallet Anda.
          </p>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-xs font-mono space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">Transaction Signature:</span>
            <div className="text-emerald-300 break-all select-all font-mono text-[11px]">
              {txSuccessSig}
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <a
              href={`https://explorer.solana.com/tx/${txSuccessSig}?cluster=${DEFAULT_SOLANA_NETWORK}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-950/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>🔍 Cek Manual di Solana Explorer ↗</span>
            </a>

            {wallet.publicKey && (
              <a
                href={`https://explorer.solana.com/address/${wallet.publicKey.toBase58()}?cluster=${DEFAULT_SOLANA_NETWORK}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>Cek Token di Wallet ↗</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3 text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200 mb-0.5">Purchase Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Buying Form */}
      <form onSubmit={handleBuyTokens} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-300">
              Quantity ({token.symbol})
            </label>
            <div className="flex items-center gap-1.5">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTokenAmountInput(amt.toString())}
                  className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                >
                  +{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={setMaxAllowed}
                className="px-2 py-0.5 text-[11px] rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold font-mono transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Coins className="w-5 h-5 text-purple-400" />
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={tokenAmountInput}
              onChange={(e) => setTokenAmountInput(e.target.value)}
              disabled={submitting}
              placeholder="Enter whole tokens (e.g. 10)"
              className="w-full pl-11 pr-20 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-base font-semibold"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-slate-400 font-mono">
              {token.symbol}
            </div>
          </div>
        </div>

        {/* Cost Summary Box */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-800 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Purchase Price:</span>
            <span className="text-white font-bold font-mono text-sm">
              {totalCostSol.toFixed(4)} SOL
            </span>
          </div>

          {totalCostUsd && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Estimated USD:</span>
              <span className="text-slate-300 font-mono">
                ~${totalCostUsd}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Your SOL Balance:
            </span>
            <span className="font-mono text-slate-300">
              {balanceSol !== null ? `${balanceSol.toFixed(4)} SOL` : '0.00 SOL'}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        {!wallet.connected ? (
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 mb-2">Connect your wallet above to enable buying</p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={submitting || parsedTokens <= 0 || (saleState?.paused ?? false)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming On-Chain...</span>
              </>
            ) : saleState?.paused ? (
              <span>Sale Paused</span>
            ) : (
              <>
                <span>Buy {parsedTokens > 0 ? `${parsedTokens.toLocaleString()} ${token.symbol}` : 'Tokens'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Atomic Settlement
          </span>
          <span>•</span>
          <span>Program: {programIdStr.slice(0, 4)}...{programIdStr.slice(-4)}</span>
        </div>
      </form>
    </div>
  );
};
