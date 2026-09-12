import React from 'react';
import { TokenConfig, EligibilityStatus, RegistrationResponse } from '../types';
import { SaleStatus } from './SaleStatus';
import { Countdown } from './Countdown';
import { SaleMetrics } from './SaleMetrics';
import { EligibilityCard } from './EligibilityCard';
import { ParticipantForm } from './ParticipantForm';
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
  onSuccess: (res: RegistrationResponse, formData: { email: string; telegramId: string; walletAddress: string; fullName: string; commitAmount: number; commitCurrency: string }) => void;
  onError: (msg: string) => void;
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
  onError,
}) => {
  const { sale } = token;

  // Determine timer label & target date
  const isUpcoming = sale.status === 'upcoming';
  const isLive = sale.status === 'live';
  const isEnded = sale.status === 'ended';

  const countdownTarget = isUpcoming ? sale.startAt : sale.endAt;
  const countdownLabel = isUpcoming ? 'Sale Starts In' : isLive ? 'Sale Ends In' : 'Sale Status';

  // Single SOL price source for entire card — sharing prevents form unmount/remount
  // and ensures SaleMetrics + ParticipantForm stay in sync on refresh.
  const { priceUsd: solPriceUsd, loading: solPriceLoading, error: solPriceError, refresh: refreshSolPrice } = useSolPrice();

  return (
    <div className="space-y-6">
      {/* Top Main Sale Header Widget */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
              Private Allocation Sale
            </span>
            <h2 className="text-2xl font-extrabold text-white">{token.name} Private Round</h2>
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

      {/* Registration Form Section */}
      {/* Show form ONLY when eligible (>= 2 SOL) and sale is not ended */}
      {eligibilityStatus === 'eligible' && !isEnded && (
        <ParticipantForm
          tokenSlug={token.slug}
          tokenName={token.name}
          tokenSymbol={token.symbol}
          tokenPrice={token.sale.tokenPrice}
          priceCurrency={token.sale.priceCurrency}
          minimumPurchase={token.sale.minimumPurchase}
          maximumPurchase={token.sale.maximumPurchase}
          balanceSol={balanceSol}
          solPriceUsd={solPriceUsd}
          solPriceLoading={solPriceLoading}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {/* Ended Sale notice */}
      {isEnded && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 text-center text-slate-400">
          <Lock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <h4 className="text-base font-bold text-white mb-1">Private Sale Ended</h4>
          <p className="text-xs text-slate-400">Registration for {token.name} is now closed.</p>
        </div>
      )}
    </div>
  );
};
