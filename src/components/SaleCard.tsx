import React from 'react';
import { TokenConfig } from '../types';
import { BuyTokenForm } from './BuyTokenForm';
import { Lock } from 'lucide-react';
import { useSolPrice } from '../hooks/useSolPrice';

interface SaleCardProps {
  token: TokenConfig;
  balanceSol: number | null;
  loadingBalance?: boolean;
  balanceError?: string | null;
  refreshBalance: () => void;
  setBalanceSol?: (val: number) => void;
  onSuccess?: (txSig: string, amount: number) => void;
  onError?: (msg: string) => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({
  token,
  balanceSol,
  refreshBalance,
  onSuccess,
}) => {
  const { sale } = token;
  const isEnded = sale.status === 'ended';

  // Live SOL price in USD
  const { priceUsd: solPriceUsd, loading: solPriceLoading } = useSolPrice();

  if (isEnded) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center text-slate-400 shadow-2xl backdrop-blur-xl">
        <Lock className="w-10 h-10 mx-auto mb-3 text-slate-500" />
        <h4 className="text-xl font-bold text-white mb-2">Token Sale Ended</h4>
        <p className="text-sm text-slate-400">Sale allocation for {token.name} is now closed.</p>
      </div>
    );
  }

  // Side panel exclusively renders the token buying form
  return (
    <BuyTokenForm
      token={token}
      balanceSol={balanceSol}
      solPriceUsd={solPriceUsd}
      solPriceLoading={solPriceLoading}
      refreshBalance={refreshBalance}
      onPurchaseSuccess={onSuccess}
    />
  );
};
