import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { MINIMUM_SOL_BALANCE } from '../lib/constants';
import { EligibilityStatus } from '../types';
import { Wallet, ShieldAlert, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { formatAddress } from '../lib/solana';

interface EligibilityCardProps {
  balanceSol: number | null;
  loading: boolean;
  error: string | null;
  eligibilityStatus: EligibilityStatus;
  refreshBalance: () => void;
  setBalanceSol: (val: number) => void;
}

export const EligibilityCard: React.FC<EligibilityCardProps> = ({
  balanceSol,
  loading,
  error,
  eligibilityStatus,
  refreshBalance,
  setBalanceSol,
}) => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const walletAddr = publicKey ? publicKey.toBase58() : null;

  // 1. Wallet Not Connected State
  if (!connected || !walletAddr) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 text-center shadow-xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Check Sale Eligibility</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
          Connect your Solana wallet to verify your SOL balance and qualify for the private sale whitelist.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 mb-6">
          <span>Requirement:</span>
          <span className="text-purple-400 font-bold">≥ {MINIMUM_SOL_BALANCE} SOL</span>
        </div>

        <div>
          <button
            onClick={() => setVisible(true)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span>Connect Solana Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (loading && balanceSol === null) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center shadow-xl">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
        <h4 className="text-lg font-bold text-white mb-1">Verifying SOL Balance...</h4>
        <p className="text-xs text-slate-400">Querying Solana blockchain RPC network...</p>
      </div>
    );
  }

  const currentSol = balanceSol ?? 0;

  // 3. Not Eligible State (< 2 SOL)
  if (eligibilityStatus === 'not_eligible') {
    return (
      <div className="rounded-3xl bg-red-950/20 border border-red-500/30 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-red-500/20 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 block">Eligibility Status</span>
              <h3 className="text-base font-bold text-white">Not Eligible</h3>
            </div>
          </div>

          <button
            onClick={refreshBalance}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400">Connected Wallet</span>
            <span className="text-xs font-mono font-medium text-slate-200">{formatAddress(walletAddr)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-[11px] text-red-300 font-medium block">Your Balance</span>
              <span className="text-xl font-bold font-mono text-red-400">{currentSol.toFixed(2)} SOL</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Minimum Required</span>
              <span className="text-xl font-bold font-mono text-purple-300">{MINIMUM_SOL_BALANCE} SOL</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-red-300 text-center mb-5 leading-relaxed bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          You need at least {MINIMUM_SOL_BALANCE} SOL in your connected wallet to join this private sale.
        </p>

        {/* Demo/Testing Helper for reviewers without mainnet SOL */}
        {/* <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
          <span className="text-[11px] text-slate-400 text-center">Testing on Devnet / Mainnet preview?</span>
          <button
            onClick={() => setBalanceSol(3.5)}
            className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate ≥ 2 SOL Balance for Testing</span>
          </button>
        </div> */}
      </div>
    );
  }

  // 4. Eligible State (>= 2 SOL)
  return (
    <div className="rounded-3xl bg-emerald-950/20 border border-emerald-500/30 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Eligibility Status</span>
            <h3 className="text-base font-bold text-white">✓ Whitelist Eligible</h3>
          </div>
        </div>

        <button
          onClick={refreshBalance}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <span className="text-[11px] text-emerald-300 font-medium block">Verified SOL Balance</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{currentSol.toFixed(2)} SOL</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">Required Threshold</span>
          <span className="text-xl font-bold font-mono text-purple-300">≥ {MINIMUM_SOL_BALANCE} SOL</span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400">Connected Public Key</span>
        <span className="font-mono font-medium text-emerald-300">{formatAddress(walletAddr)}</span>
      </div>
    </div>
  );
};
