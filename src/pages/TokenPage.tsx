import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useToken } from '../hooks/useToken';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { useEligibility } from '../hooks/useEligibility';
import { Header } from '../components/Header';
import { TokenHero } from '../components/TokenHero';
import { SaleCard } from '../components/SaleCard';
import { Tokenomics } from '../components/Tokenomics';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorAlert } from '../components/ErrorAlert';
import { RegistrationResponse } from '../types';

export const TokenPage: React.FC = () => {
  const { tokenSlug } = useParams<{ tokenSlug: string }>();
  const { token } = useToken(tokenSlug);

  const { balanceSol, loading: loadingBalance, error: balanceError, refreshBalance, setBalanceSol } = useWalletBalance();
  const { eligibilityStatus } = useEligibility(balanceSol, loadingBalance);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    email: string;
    telegramId: string;
    walletAddress: string;
    fullName: string;
    commitAmount: number;
    commitCurrency: string;
    solBalance: number | null;
  }>({
    email: '',
    telegramId: '',
    walletAddress: '',
    fullName: '',
    commitAmount: 0,
    commitCurrency: '',
    solBalance: null,
  });

  if (!token) {
    return <Navigate to="/404" replace />;
  }

  const handleRegistrationSuccess = (
    _res: RegistrationResponse,
    formData: { email: string; telegramId: string; walletAddress: string; fullName: string; commitAmount: number; commitCurrency: string }
  ) => {
    setSuccessData({
      ...formData,
      solBalance: balanceSol,
    });
    setSuccessModalOpen(true);
  };

  const handleRegistrationError = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      <Header balanceSol={balanceSol} networkName={`${token.network} ${token.chainId}`} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Token Hero Banner */}
        <TokenHero token={token} />

        {/* Desktop 2-column layout (Left: Project & Tokenomics, Right: Sale & Registration) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Project Overview & Tokenomics */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            {/* Tokenomics Component */}
            <Tokenomics tokenomics={token.tokenomics} symbol={token.symbol} />

            {/* About Project Section */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xl font-bold text-white mb-4">About {token.name}</h3>
              <p className="text-sm text-slate-300 leading-relaxed space-y-3">
                {token.description}
              </p>
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Chain ID</span>
                  <span className="text-slate-200 font-mono font-semibold">{token.chainId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Sale Type</span>
                  <span className="text-purple-300 font-semibold">{token.sale.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Min Balance</span>
                  <span className="text-emerald-400 font-bold font-mono">2 SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sale Status, Eligibility & Form */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <SaleCard
              token={token}
              balanceSol={balanceSol}
              loadingBalance={loadingBalance}
              balanceError={balanceError}
              eligibilityStatus={eligibilityStatus}
              refreshBalance={refreshBalance}
              setBalanceSol={setBalanceSol}
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 IDOpenTech Launchpad. Built for Solana Ecosystem.</p>
        </div>
      </footer>

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        tokenName={token.name}
        telegramLink={token.links.telegram}
        data={successData}
      />

      {/* Error Alert */}
      <ErrorAlert
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </div>
  );
};
