import { useMemo } from 'react';
import tokensData from '../data/tokens.json';
import { TokenConfig } from '../types';

export function useToken(tokenSlug?: string): { token: TokenConfig | null; allTokens: TokenConfig[] } {
  const allTokens = tokensData as TokenConfig[];

  const token = useMemo(() => {
    if (!tokenSlug) return null;
    return allTokens.find(t => t.slug.toLowerCase() === tokenSlug.toLowerCase()) || null;
  }, [tokenSlug, allTokens]);

  return { token, allTokens };
}
