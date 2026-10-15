import React from 'react';
import { TokenConfig, EligibilityStatus } from '../types';
import { SaleStatus } from './SaleStatus';
import { Countdown } from './Countdown';
import { SaleMetrics } from './SaleMetrics';
import { EligibilityCard } from './EligibilityCard';
import { BuyTokenForm } from './BuyTokenForm';
import { Lock } from 'lucide-react';
import { useSolPrice } from '../hooks/useSolPrice';

interface SaleCardProps {
  token: TokenConfig;
  balanceSol: number | null;
  loadingBalance: boolean;
  balanceError: string | null;
  eligibilityStatus: EligibilityStatus;
  refreshBalance: () => void;
  setBalanceSol: (val: number) => void;
  onSuccess?: (txSig: string, amount: number) => void;
  onError?: (msg: string) => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({
  token,
  balanceSol,
  loadingBalance,
  balanceError,
  eligibilityStatus,
  refreshBalance,
  setBalanceSol,
  onSuccess,
}) => {
  const { sale } = token;

  // Determine timer label & target date
  const isUpcoming = sale.status === 'upcoming';
  const isEnded = sale.status === 'ended';

  const countdownTarget = isUpcoming ? sale.startAt : sale.endAt;
  const countdownLabel = isUpcoming ? 'Sale Starts In' : !isEnded ? 'Sale Ends In' : 'Sale Status';

  // Single SOL price source for entire card
  const { priceUsd: solPriceUsd, loading: solPriceLoading, error: solPriceError, refresh: refreshSolPrice } = useSolPrice();

  return (
    <div className="space-y-6">
      {/* Top Main Sale Header Widget */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
              On-Chain Token Sale
            </span>
            <h2 className="text-2xl font-extrabold text-white">{token.name} Public Round</h2>
          </div>

          <SaleStatus status={sale.status} />
        </div>

        {/* Countdown */}
        {!isEnded && (
          <div className="mb-6">
            <Countdown targetDate={countdownTarget} label={countdownLabel} />
          </div>
        )}

        {/* Sale Metrics Grid */}
        <SaleMetrics
          sale={sale}
          solPriceUsd={solPriceUsd}
          solPriceLoading={solPriceLoading}
          solPriceError={solPriceError}
          refreshSolPrice={refreshSolPrice}
        />
      </div>

      {/* Wallet Eligibility Check Section */}
      <EligibilityCard
        balanceSol={balanceSol}
        loading={loadingBalance}
        error={balanceError}
        eligibilityStatus={eligibilityStatus}
        refreshBalance={refreshBalance}
        setBalanceSol={setBalanceSol}
      />

      {/* On-Chain Token Buying Form */}
      {!isEnded && (
        <BuyTokenForm
          token={token}
          balanceSol={balanceSol}
          solPriceUsd={solPriceUsd}
          solPriceLoading={solPriceLoading}
          refreshBalance={refreshBalance}
          onPurchaseSuccess={onSuccess}
        />
      )}

      {/* Ended Sale notice */}
      {isEnded && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 text-center text-slate-400">
          <Lock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <h4 className="text-base font-bold text-white mb-1">Private Sale Ended</h4>
          <p className="text-xs text-slate-400">Sale allocation for {token.name} is now closed.</p>
        </div>
      )}
    </div>
  );
};
