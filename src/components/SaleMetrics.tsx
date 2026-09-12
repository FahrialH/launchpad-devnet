import React from 'react';
import { SaleConfig } from '../types';
import { Tag, Coins, ShieldAlert, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import { solToUsd, parsePurchaseAmount } from '../hooks/useSolPrice';

interface SaleMetricsProps {
  sale: SaleConfig;
  solPriceUsd: number | null;
  solPriceLoading: boolean;
  solPriceError: string | null;
  refreshSolPrice: () => void;
}

export const SaleMetrics: React.FC<SaleMetricsProps> = ({ sale, solPriceUsd, solPriceLoading, solPriceError, refreshSolPrice }) => {
  const tokenPriceUsd = solToUsd(sale.tokenPrice, solPriceUsd);
  const minSol = parsePurchaseAmount(sale.minimumPurchase);
  const maxSol = parsePurchaseAmount(sale.maximumPurchase);
  const minUsd = minSol !== null ? solToUsd(minSol, solPriceUsd) : null;
  const maxUsd = maxSol !== null ? solToUsd(maxSol, solPriceUsd) : null;
  const hardCapSol = parsePurchaseAmount(sale.hardCap);
  const hardCapUsd = hardCapSol !== null ? solToUsd(hardCapSol, solPriceUsd) : null;

  const solPriceLabel = solPriceUsd ? `1 SOL ≈ $${solPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Token Price</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {sale.tokenPrice} <span className="text-xs text-slate-400 font-sans">{sale.priceCurrency}</span>
          </div>
          <div className="text-[11px] font-medium mt-1 flex items-center gap-1">
            {tokenPriceUsd !== null ? (
              <span className="text-emerald-300 inline-flex items-center gap-1.5">≈ ${tokenPriceUsd < 0.01 ? tokenPriceUsd.toFixed(4) : tokenPriceUsd.toFixed(2)} USDC <span className="text-slate-500 font-normal">per token</span>{solPriceLoading && <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />}</span>
            ) : solPriceLoading ? (
              <span className="text-slate-500 inline-flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> fetching SOL price…</span>
            ) : (
              <span className="text-slate-500">USD estimate unavailable</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Allocation</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {sale.allocation}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hard Cap</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {sale.hardCap}
          </div>
          {hardCapUsd !== null && !solPriceLoading && (
            <div className="text-[11px] text-emerald-300 font-medium mt-1">≈ ${hardCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Min / Max</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-200 font-mono">
            {sale.minimumPurchase} - {sale.maximumPurchase}
          </div>
          {minUsd !== null && maxUsd !== null && !solPriceLoading && (
            <div className="text-[11px] text-emerald-300 font-medium mt-1">≈ ${minUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${maxUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</div>
          )}
        </div>
      </div>

      {/* SOL Payment explainer */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-emerald-950/30 border border-purple-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Pay with SOL <span className="normal-case tracking-normal font-medium text-[11px] text-emerald-300 ml-2">USD / USDC Cost Info</span></h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              {solPriceLoading
                ? 'Fetching live SOL price to calculate USD cost estimate…'
                : tokenPriceUsd !== null
                  ? `1 token = ${sale.tokenPrice} SOL (≈ $${tokenPriceUsd < 0.01 ? tokenPriceUsd.toFixed(4) : tokenPriceUsd.toFixed(2)} USDC) • ${solPriceLabel}${solPriceError ? ' (estimate)' : ''}`
                  : `Token price is ${sale.tokenPrice} SOL per token. USD cost estimate based on live SOL market rate.`}
            </p>
            {solPriceError && !solPriceLoading && (
              <p className="text-[11px] text-amber-300/80 mt-1">{solPriceError}</p>
            )}
            {/* {minUsd !== null && maxUsd !== null && !solPriceLoading && (
              <p className="text-[11px] text-slate-400 mt-1">
                Cost Info: <span className="text-slate-200 font-medium">{sale.minimumPurchase}</span> → <span className="text-emerald-300 font-mono font-bold">≈ ${minUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</span> • <span className="text-slate-200 font-medium">{sale.maximumPurchase}</span> → <span className="text-emerald-300 font-mono font-bold">≈ ${maxUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</span>
              </p>
            )} */}
          </div>
        </div>
        {!solPriceLoading ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              refreshSolPrice();
            }}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors shrink-0"
            title="Refresh SOL price"
            aria-label="Refresh SOL price"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        ) : (
          <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-500 shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Updating…
          </span>
        )}
      </div>
    </div>
  );
};
