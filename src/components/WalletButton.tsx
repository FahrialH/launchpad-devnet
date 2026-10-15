import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check, ChevronDown, ExternalLink, Coins } from 'lucide-react';
import { formatAddress, forceDisconnectWallet } from '../lib/solana';
import { IS_DEVNET } from '../lib/constants';

interface WalletButtonProps {
  balanceSol: number | null;
  tokenBalance?: number | null;
  tokenSymbol?: string;
}

// Format SOL balance so tiny devnet balances (< 0.01 SOL) don't round down to 0.00 SOL
const formatDisplaySol = (sol: number | null): string => {
  if (sol === null) return '...';
  if (sol === 0) return '0.00 SOL';
  if (sol < 0.001) return '<0.001 SOL';
  if (sol < 0.01) return `${sol.toFixed(4)} SOL`;
  if (sol < 1) return `${sol.toFixed(3)} SOL`;
  return `${sol.toFixed(2)} SOL`;
};

export const WalletButton: React.FC<WalletButtonProps> = ({
  balanceSol,
  tokenBalance,
  tokenSymbol,
}) => {
  const { publicKey, connected, disconnect, select, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const address = publicKey ? publicKey.toBase58() : null;

  const handleDisconnect = async () => {
    setDropdownOpen(false);
    await forceDisconnectWallet(wallet, disconnect, select);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected || !address) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/50 text-slate-100 font-medium transition-all shadow-md text-xs sm:text-sm"
      >
        {/* SOL Balance pill */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold font-mono text-[11px] sm:text-xs">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{formatDisplaySol(balanceSol)}</span>
        </div>

        {/* Token Balance pill (when on a token page and balance available) */}
        {tokenSymbol && tokenBalance !== null && (
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-700/50 text-purple-200 font-bold font-mono text-[11px] sm:text-xs shadow-sm">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
            <span>{tokenBalance.toLocaleString()} {tokenSymbol}</span>
          </div>
        )}

        {/* Shortened address */}
        <div className="flex items-center gap-1 px-1 sm:px-2 text-xs font-mono text-slate-300">
          {wallet?.adapter?.icon && (
            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span className="hidden md:inline">{formatAddress(address)}</span>
          <span className="md:hidden">{address.slice(0, 3)}..{address.slice(-3)}</span>
          <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connected Wallet</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {IS_DEVNET ? 'Devnet' : 'Mainnet'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400">Address</span>
              <div className="flex items-center justify-between gap-2 mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-200">
                <span className="truncate">{address}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* SOL Balance */}
            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400">SOL Balance</span>
              <span className="text-sm font-bold text-white font-mono">
                {balanceSol !== null ? `${balanceSol.toFixed(4)} SOL` : 'Loading...'}
              </span>
            </div>

            {/* Purchased Token Balance */}
            {tokenSymbol && (
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/50">
                <span className="text-xs text-purple-300 font-medium flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-purple-400" />
                  <span>{tokenSymbol} Balance</span>
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {tokenBalance !== null ? `${tokenBalance.toLocaleString()} ${tokenSymbol}` : '0 ' + tokenSymbol}
                </span>
              </div>
            )}

            <a
              href={`https://explorer.solana.com/address/${address}?cluster=${IS_DEVNET ? 'devnet' : 'mainnet-beta'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-purple-400 hover:text-purple-300 py-1 transition-colors"
            >
              <span>View on Solana Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleDisconnect}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
