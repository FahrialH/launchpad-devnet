import React from 'react';
import { CheckCircle2, Send, X, ExternalLink, DollarSign } from 'lucide-react';
import { formatAddress } from '../lib/solana';
import { useSolPrice, solToUsd } from '../hooks/useSolPrice';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenName: string;
  telegramLink?: string;
  data: {
    email: string;
    telegramId: string;
    walletAddress: string;
    fullName: string;
    commitAmount: number;
    commitCurrency: string;
    solBalance: number | null;
  };
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  tokenName,
  telegramLink = 'https://t.me/example',
  data,
}) => {
  const { priceUsd: solPriceUsd } = useSolPrice();
  const usdCost = data.commitAmount ? solToUsd(data.commitAmount, solPriceUsd) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 text-center animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 block mb-1">
          Registration Complete
        </span>

        <h3 className="text-2xl font-black text-white mb-2">
          You're Whitelisted!
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          You are officially registered for the <span className="font-bold text-white">{tokenName}</span> private sale.
        </p>

        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs mb-6">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Wallet</span>
            <span className="font-mono text-emerald-300 font-medium">{formatAddress(data.walletAddress)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Verified Balance</span>
            <span className="font-mono text-white font-bold">{data.solBalance ? `${data.solBalance.toFixed(2)} SOL` : 'Verified'}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Name</span>
            <span className="text-slate-200 font-medium">{data.fullName}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Commitment</span>
            <span className="text-white font-bold">{data.commitAmount ? `${data.commitAmount.toLocaleString()} ${data.commitCurrency}` : '-'}</span>
          </div>

          {usdCost !== null && (
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 inline-flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /> USD / USDC Cost Info</span>
              <span className="font-mono text-emerald-300 font-bold">≈ ${usdCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
            </div>
          )}
          {solPriceUsd && usdCost !== null && (
            <div className="text-[11px] text-slate-500 text-right -mt-1 mb-1">at 1 SOL ≈ ${solPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          )}

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-200 font-medium truncate ml-4">{data.email}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-400">Telegram</span>
            <span className="text-purple-300 font-medium">{data.telegramId}</span>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-950/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Join Official Telegram Community</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
