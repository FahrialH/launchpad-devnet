import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToken } from '../hooks/useToken';
import { Header } from '../components/Header';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { Rocket, ArrowRight } from 'lucide-react';
import { SaleStatus } from '../components/SaleStatus';

export const DirectoryPage: React.FC = () => {
  const { allTokens } = useToken();
  const { balanceSol } = useWalletBalance();

  useEffect(() => {
    document.title = 'IDOpenTech Launchpad | Verified Solana Private Sales';
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Header balanceSol={balanceSol} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-slate-800 p-8 sm:p-12 text-center sm:text-left shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-4">
              <Rocket className="w-3.5 h-3.5" />
              Solana Private Sale Launchpad
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Discover Next-Gen Solana Tokens
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Participate in exclusive verified Solana token private sales. Connect your wallet, verify your SOL balance (≥ 2 SOL), and join whitelist allocations.
            </p>
          </div>
        </div>

        {/* Tokens List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white">Active Launchpad Tokens</h2>
            <span className="text-xs font-semibold text-slate-400 font-mono">{allTokens.length} Projects</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTokens.map((t) => (
              <Link
                key={t.slug}
                to={`/${t.slug}`}
                className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-xl hover:shadow-purple-900/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-purple-500 to-emerald-400 shadow-md">
                      <img
                        src={t.logo}
                        alt={t.name}
                        className="w-full h-full object-contain p-1 rounded-[14px] bg-slate-950"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                        }}
                      />
                    </div>
                    <SaleStatus status={t.sale.status} />
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {t.name}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-800 text-slate-300">
                      ${t.symbol}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {t.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Token Price</span>
                      <span className="font-bold text-white font-mono">{t.sale.tokenPrice} {t.sale.priceCurrency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hard Cap</span>
                      <span className="font-bold text-white font-mono">{t.sale.hardCap}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300 pt-2">
                    <span>View Sale Page</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 pt-6 pb-2 text-center text-xs text-slate-500">
        <p>© 2026 IDOpenTech Launchpad. Solana Ecosystem.</p>
      </footer>
    </div>
  );
};
