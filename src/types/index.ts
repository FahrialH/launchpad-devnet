export type SaleStatusType = 'upcoming' | 'live' | 'ended';

export interface SaleConfig {
  type: string;
  status: SaleStatusType;
  startAt: string; // ISO timestamp
  endAt: string;   // ISO timestamp
  tokenPrice: number;
  priceCurrency: string;
  allocation: string;
  hardCap: string;
  minimumPurchase: string;
  maximumPurchase: string;
}

export interface TokenomicsConfig {
  totalSupply: string;
  privateSale?: string;
  liquidity?: string;
  team?: string;
  ecosystem?: string;
  marketing?: string;
  treasury?: string;
  [key: string]: string | undefined;
}

export interface ProjectLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  telegramChat?: string;
  instagram?: string;
  discord?: string;
  whitepaper?: string;
}

export interface TokenConfig {
  slug: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  banner?: string;
  network: string;
  chainId: string;
  sale: SaleConfig;
  tokenomics: TokenomicsConfig;
  links: ProjectLinks;
}

export type EligibilityStatus = 'unknown' | 'checking' | 'eligible' | 'not_eligible';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balanceSol: number | null;
  eligible: boolean;
  eligibilityStatus: EligibilityStatus;
}

export interface ParticipantFormPayload {
  tokenSlug: string;
  email: string;
  telegramId: string;
  walletAddress: string;
  fullName: string;
  commitAmount: number;
  commitCurrency: string;
  signature?: string;
}

export interface ParticipantFormSuccessData {
  email: string;
  telegramId: string;
  walletAddress: string;
  fullName: string;
  commitAmount: number;
  commitCurrency: string;
}

export interface RegistrationSuccessResponse {
  success: true;
  eligible: true;
  walletAddress: string;
  solBalance: number;
  message?: string;
}

export interface RegistrationErrorResponse {
  success: false;
  eligible?: boolean;
  reason: 'MINIMUM_BALANCE_NOT_MET' | 'DUPLICATE_WALLET' | 'DUPLICATE_EMAIL' | 'INVALID_INPUT' | 'SERVER_ERROR';
  message: string;
  requiredBalance?: number;
  currentBalance?: number;
}

export type RegistrationResponse = RegistrationSuccessResponse | RegistrationErrorResponse;
