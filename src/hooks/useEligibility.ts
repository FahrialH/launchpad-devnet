import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MINIMUM_SOL_BALANCE } from '../lib/constants';
import { EligibilityStatus } from '../types';

export function useEligibility(balanceSol: number | null, isLoadingBalance: boolean) {
  const { connected } = useWallet();

  const eligibilityStatus = useMemo<EligibilityStatus>(() => {
    if (!connected) return 'unknown';
    if (isLoadingBalance && balanceSol === null) return 'checking';
    if (balanceSol === null) return 'checking';
    return balanceSol >= MINIMUM_SOL_BALANCE ? 'eligible' : 'not_eligible';
  }, [connected, isLoadingBalance, balanceSol]);

  const isEligible = eligibilityStatus === 'eligible';

  return {
    eligibilityStatus,
    isEligible,
    minRequired: MINIMUM_SOL_BALANCE,
  };
}
