import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { formatAddress, forceDisconnectWallet } from '../lib/solana';

interface WalletButtonProps {
  balanceSol: number | null;
}

export const WalletButton: React.FC<WalletButtonProps> = ({ balanceSol }) => {
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
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/50 text-slate-100 font-medium transition-all shadow-md"
      >
        {/* SOL Balance pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-200 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{balanceSol !== null ? `${balanceSol.toFixed(2)} SOL` : 'Fetching...'}</span>
        </div>

        {/* Shortened address */}
        <div className="flex items-center gap-1.5 px-2 text-sm font-mono text-slate-200">
          {wallet?.adapter?.icon && (
            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4" />
          )}
          <span>{formatAddress(address)}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connected Wallet</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Solana
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

            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400">SOL Balance</span>
              <span className="text-sm font-bold text-white">
                {balanceSol !== null ? `${balanceSol.toFixed(4)} SOL` : 'Loading...'}
              </span>
            </div>

            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-purple-400 hover:text-purple-300 py-1 transition-colors"
            >
              <span>View on Solscan</span>
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
