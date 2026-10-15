import React from 'react';
import { Link } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { Rocket, ShieldCheck } from 'lucide-react';
import { IS_DEVNET } from '../lib/constants';

interface HeaderProps {
  balanceSol: number | null;
  tokenBalance?: number | null;
  tokenSymbol?: string;
  networkName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  balanceSol,
  tokenBalance,
  tokenSymbol,
  networkName = IS_DEVNET ? 'Solana Devnet' : 'Solana Mainnet',
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">IDOpenTech</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Token Sale
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Solana Verified Token Launchpad</p>
          </div>
        </Link>

        {/* Right: Network & Wallet Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{networkName}</span>
          </div>

          <WalletButton
            balanceSol={balanceSol}
            tokenBalance={tokenBalance}
            tokenSymbol={tokenSymbol}
          />
        </div>
      </div>
    </header>
  );
};
