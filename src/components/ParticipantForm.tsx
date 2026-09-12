import React, { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { isValidEmail, isValidTelegramId, isValidFullName, isValidCommitAmount } from '../lib/validation';
import { submitRegistration } from '../lib/supabase';
import { ParticipantFormPayload, RegistrationResponse } from '../types';
import { Send, Mail, Wallet, Lock, Loader2, ArrowRight, User, Coins, RefreshCw, DollarSign } from 'lucide-react';
import { formatAddress } from '../lib/solana';
import { solToUsd } from '../hooks/useSolPrice';

interface ParticipantFormProps {
  tokenSlug: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
  priceCurrency: string;
  minimumPurchase: string;
  maximumPurchase: string;
  balanceSol: number | null;
  solPriceUsd: number | null;
  solPriceLoading: boolean;
  onSuccess: (response: RegistrationResponse, formData: { email: string; telegramId: string; walletAddress: string; fullName: string; commitAmount: number; commitCurrency: string }) => void;
  onError: (message: string) => void;
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
  tokenSlug,
  tokenName,
  tokenSymbol,
  tokenPrice,
  priceCurrency,
  minimumPurchase,
  maximumPurchase,
  balanceSol,
  solPriceUsd,
  solPriceLoading,
  onSuccess,
  onError,
}) => {
  const { publicKey } = useWallet();
  const walletAddress = publicKey ? publicKey.toBase58() : '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [commitAmount, setCommitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [commitError, setCommitError] = useState('');

  const estimatedTokens = useMemo(() => {
    const parsed = parseFloat(commitAmount.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0 || !tokenPrice) return null;
    return parsed / tokenPrice;
  }, [commitAmount, tokenPrice]);

  const estimatedUsd = useMemo(() => {
    const parsed = parseFloat(commitAmount.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    // commitAmount is denominated in SOL – convert to USD/USDC via live price
    return solToUsd(parsed, solPriceUsd);
  }, [commitAmount, solPriceUsd]);

  const validateForm = (): boolean => {
    let valid = true;

    if (!isValidFullName(fullName)) {
      setFullNameError('Please enter your full name (2–80 characters, letters only).');
      valid = false;
    } else {
      setFullNameError('');
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!isValidTelegramId(telegramId)) {
      setTelegramError('Telegram handle must be between 2 and 64 characters (e.g. @username).');
      valid = false;
    } else {
      setTelegramError('');
    }

    const commitCheck = isValidCommitAmount(commitAmount, minimumPurchase, maximumPurchase);
    if (!commitCheck.valid) {
      setCommitError(commitCheck.error || 'Invalid commitment amount.');
      valid = false;
    } else {
      setCommitError('');
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!walletAddress) {
      onError('Wallet address is missing. Please connect your Solana wallet.');
      return;
    }

    setSubmitting(true);

    const commitCheck = isValidCommitAmount(commitAmount, minimumPurchase, maximumPurchase);
    const parsedCommitAmount = commitCheck.parsed ?? parseFloat(commitAmount.replace(/,/g, ''));

    const payload: ParticipantFormPayload = {
      tokenSlug,
      email: email.trim().toLowerCase(),
      telegramId: telegramId.trim().startsWith('@') ? telegramId.trim() : `@${telegramId.trim()}`,
      walletAddress,
      fullName: fullName.trim(),
      commitAmount: parsedCommitAmount,
      commitCurrency: priceCurrency,
    };

    try {
      const result = await submitRegistration(payload, balanceSol);
      setSubmitting(false);

      if (result.success) {
        onSuccess(result, { email: payload.email, telegramId: payload.telegramId, walletAddress, fullName: payload.fullName, commitAmount: payload.commitAmount, commitCurrency: payload.commitCurrency });
      } else {
        onError(result.message || 'Registration failed');
      }
    } catch (err) {
      setSubmitting(false);
      onError(err instanceof Error ? err.message : 'An error occurred during submission.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Join {tokenName} Private Sale</h3>
          <p className="text-xs text-slate-400 mt-0.5">Submit your verified whitelist participation details</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Verified Wallet
        </span>
      </div>

      <div className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Full Name <span className="text-purple-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError('');
              }}
              placeholder="Jane Doe"
              autoComplete="name"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border ${
                fullNameError ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
              } text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all`}
            />
          </div>
          {fullNameError && <p className="text-xs text-red-400 mt-1.5">{fullNameError}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Email Address <span className="text-purple-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="your@email.com"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border ${
                emailError ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
              } text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all`}
            />
          </div>
          {emailError && <p className="text-xs text-red-400 mt-1.5">{emailError}</p>}
        </div>

        {/* Telegram ID Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Telegram ID <span className="text-purple-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Send className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={telegramId}
              onChange={(e) => {
                setTelegramId(e.target.value);
                if (telegramError) setTelegramError('');
              }}
              placeholder="@username"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border ${
                telegramError ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
              } text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all`}
            />
          </div>
          {telegramError && <p className="text-xs text-red-400 mt-1.5">{telegramError}</p>}
        </div>

        {/* Commitment Amount Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Commitment Amount <span className="text-purple-400">*</span>
            <span className="ml-2 normal-case font-normal text-[11px] text-slate-400 tracking-normal">({priceCurrency})</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              value={commitAmount}
              onChange={(e) => {
                // Allow digits, commas, dot
                const val = e.target.value;
                if (/^[0-9,.\s]*$/.test(val) || val === '') {
                  setCommitAmount(val);
                  if (commitError) setCommitError('');
                }
              }}
              placeholder={`${minimumPurchase} – ${maximumPurchase}`}
              className={`w-full pl-10 pr-20 py-3 rounded-2xl bg-slate-950 border ${
                commitError ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
              } text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">{priceCurrency}</span>
            </div>
          </div>
          {commitError ? (
            <p className="text-xs text-red-400 mt-1.5">{commitError}</p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1">
              <p className="text-[11px] text-slate-500">
                Range: <span className="text-slate-300 font-medium">{minimumPurchase}</span> – <span className="text-slate-300 font-medium">{maximumPurchase}</span> • Price: <span className="text-slate-300 font-medium">{tokenPrice} {priceCurrency} / {tokenSymbol}</span>
              </p>
              {(estimatedTokens !== null || estimatedUsd !== null) && !commitError && (
                <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 to-purple-950/30 border border-emerald-500/20 p-3 flex flex-col gap-1">
                  {estimatedTokens !== null && Number.isFinite(estimatedTokens) && estimatedTokens > 0 && (
                    <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      You receive: <span className="font-mono font-bold">{estimatedTokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tokenSymbol}</span>
                    </p>
                  )}
                  <p className="text-xs font-medium flex items-center gap-1.5 flex-wrap">
                    {estimatedUsd !== null ? (
                      <>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-300">USD / USDC Cost Info:</span>
                        <span className="font-mono font-bold text-emerald-300">≈ ${estimatedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                        {solPriceUsd && (
                          <span className="text-[11px] text-slate-500 font-normal">(1 SOL ≈ ${solPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>
                        )}
                        {solPriceLoading && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
                      </>
                    ) : solPriceLoading ? (
                      <span className="text-slate-400 inline-flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> fetching SOL price…</span>
                    ) : commitAmount ? (
                      <span className="text-slate-500 text-[11px]">Enter a SOL amount to see USD cost</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">USD cost estimate will appear here</span>
                    )}
                  </p>
                  {estimatedUsd !== null && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Calculated as <span className="text-slate-300 font-medium">{commitAmount} {priceCurrency}</span> × live SOL rate. Payment is settled in SOL.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connected Wallet Field (Read-only per SPEC) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Connected Wallet Address
            </label>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Read-Only
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <input
              type="text"
              readOnly
              disabled
              value={walletAddress ? `${walletAddress} (${formatAddress(walletAddress)})` : ''}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-xs cursor-not-allowed select-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold text-base shadow-xl shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Verifying & Submitting...</span>
            </>
          ) : (
            <>
              <span>Join Private Sale</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
