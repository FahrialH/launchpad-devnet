export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidTelegramId = (telegram: string): boolean => {
  const trimmed = telegram.trim();
  if (trimmed.length < 2 || trimmed.length > 64) {
    return false;
  }
  // Optional @ prefix or alphanumeric/underscore
  const telegramRegex = /^@?[a-zA-Z0-9_]{2,64}$/;
  return telegramRegex.test(trimmed);
};

export const isValidSolanaAddress = (address: string): boolean => {
  const trimmed = address.trim();
  // Solana Base58 public keys are usually 32 to 44 characters
  const b58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return b58Regex.test(trimmed);
};

export const isValidFullName = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  // Allow letters, spaces, hyphen, apostrophe, dot – must contain at least 2 letters
  return /^[A-Za-zÀ-ÿ\s'.-]{2,80}$/.test(trimmed) && /[A-Za-zÀ-ÿ]{2}/.test(trimmed);
};

export const parsePurchaseAmount = (amountStr: string): number | null => {
  // Extract numeric part from strings like "100 USDC" or "5,000"
  if (!amountStr) return null;
  const numeric = amountStr.replace(/[^0-9.]/g, '');
  const val = parseFloat(numeric);
  return Number.isFinite(val) ? val : null;
};

export const isValidCommitAmount = (
  value: string,
  minimumPurchase?: string,
  maximumPurchase?: string
): { valid: boolean; error?: string; parsed?: number } => {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return { valid: false, error: 'Commitment amount is required.' };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { valid: false, error: 'Enter a valid positive number.' };
  }
  const min = minimumPurchase ? parsePurchaseAmount(minimumPurchase) : null;
  const max = maximumPurchase ? parsePurchaseAmount(maximumPurchase) : null;

  if (min !== null && parsed < min) {
    return { valid: false, error: `Minimum commitment is ${minimumPurchase}.`, parsed };
  }
  if (max !== null && parsed > max) {
    return { valid: false, error: `Maximum commitment is ${maximumPurchase}.`, parsed };
  }
  return { valid: true, parsed };
};
