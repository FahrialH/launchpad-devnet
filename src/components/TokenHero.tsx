import React from 'react';
import { TokenConfig } from '../types';
import { Layers, Shield } from 'lucide-react';
import { ProjectLinks } from './ProjectLinks';

interface TokenHeroProps {
  token: TokenConfig;
}

export const TokenHero: React.FC<TokenHeroProps> = ({ token }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Decorative gradient background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Token Logo */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-purple-500 via-indigo-500 to-emerald-400 shadow-xl shadow-purple-500/10">
              <img
                src={token.logo}
                alt={token.name}
                className="w-full h-full object-contain p-1 rounded-[14px] bg-slate-950"
                onError={(e) => {
                  // Fallback image if logo fails to load
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                }}
              />
            </div>
          </div>

          {/* Token Details */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {token.name}
              </h1>
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 text-purple-300 border border-slate-700">
                ${token.symbol}
              </span>
            </div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-4">
              {token.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Layers className="w-3.5 h-3.5" />
                {token.sale.type}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
                {token.network} ({token.chainId})
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="w-full md:w-auto flex md:flex-col items-end justify-between border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          <ProjectLinks links={token.links} />
        </div>
      </div>
    </div>
  );
};
