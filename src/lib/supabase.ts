import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, MINIMUM_SOL_BALANCE } from './constants';
import { ParticipantFormPayload, RegistrationResponse } from '../types';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Key rule: Service-role credentials MUST NEVER be exposed to Vite / frontend.
// Only anon key is used here to invoke the Edge Function.

export async function submitRegistration(
  payload: ParticipantFormPayload,
  clientSideSolBalance: number | null
): Promise<RegistrationResponse> {
  // If Supabase URL is configured, invoke the Edge Function
  if (SUPABASE_URL) {
    const functionUrl = `${SUPABASE_URL}/functions/v1/register-participant`;

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Edge Function invocation failed:', err);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      return {
        success: false,
        reason: 'SERVER_ERROR',
        message: isAbort
          ? 'Verification server timed out. Please try again.'
          : 'Could not connect to the verification server. Please check your connection and try again.',
      };
    }

    // Parse response body safely
    let rawText: string;
    try {
      rawText = await response.text();
    } catch {
      return {
        success: false,
        reason: 'SERVER_ERROR',
        message: 'Verification server returned an unreadable response. Please try again.',
      };
    }

    let data: Record<string, unknown>;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      console.error('Failed to parse Edge Function JSON:', rawText.slice(0, 500));
      return {
        success: false,
        reason: 'SERVER_ERROR',
        message: `Verification server error (${response.status}). Please try again later.`,
      };
    }

    // Handle Supabase gateway errors like WORKER_RESOURCE_LIMIT
    // Gateway returns { code, message } without success/reason fields
    if (!response.ok) {
      // If body already looks like a RegistrationResponse, return it
      if (typeof data.success === 'boolean' && typeof data.message === 'string') {
        return data as unknown as RegistrationResponse;
      }
      const gatewayMessage = typeof data.message === 'string' ? data.message : null;
      const gatewayCode = typeof (data as Record<string, unknown>).code === 'string' ? (data as Record<string, unknown>).code as string : null;

      // Map gateway resource limit / generic errors to retryable message
      if (gatewayCode === 'WORKER_RESOURCE_LIMIT') {
        return {
          success: false,
          reason: 'SERVER_ERROR',
          message: 'Verification service is temporarily overloaded. Please try again in a moment.',
        };
      }

      return {
        success: false,
        reason: 'SERVER_ERROR',
        message: gatewayMessage || `Verification failed (${response.status}). Please try again.`,
      };
    }

    // Success path: ensure shape is RegistrationResponse
    if (typeof data.success === 'boolean') {
      return data as unknown as RegistrationResponse;
    }

    // Unexpected shape but 2xx – wrap as success if possible
    if (data.error && typeof data.error === 'string') {
      return {
        success: false,
        reason: 'SERVER_ERROR',
        message: data.error,
      };
    }

    return data as unknown as RegistrationResponse;
  }

  // Local simulation mode when Supabase project is not configured in .env
  console.info('Supabase URL not provided. Running in local preview verification mode.');
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate RPC latency

  const balance = clientSideSolBalance ?? 0;
  if (balance < MINIMUM_SOL_BALANCE) {
    return {
      success: false,
      eligible: false,
      reason: 'MINIMUM_BALANCE_NOT_MET',
      message: `Your wallet balance (${balance.toFixed(2)} SOL) is below the minimum ${MINIMUM_SOL_BALANCE} SOL required.`,
      requiredBalance: MINIMUM_SOL_BALANCE,
      currentBalance: balance,
    };
  }

  // Simulate local duplicate check via localStorage for demo
  const storageKey = `registered_${payload.tokenSlug}_${payload.walletAddress}`;
  if (localStorage.getItem(storageKey)) {
    return {
      success: false,
      reason: 'DUPLICATE_WALLET',
      message: 'This wallet address has already registered for this sale.',
    };
  }

  const emailStorageKey = `registered_email_${payload.tokenSlug}_${payload.email.toLowerCase()}`;
  if (localStorage.getItem(emailStorageKey)) {
    return {
      success: false,
      reason: 'DUPLICATE_EMAIL',
      message: 'This email is already registered for this sale.',
    };
  }

  localStorage.setItem(storageKey, 'true');
  localStorage.setItem(emailStorageKey, 'true');

  return {
    success: true,
    eligible: true,
    walletAddress: payload.walletAddress,
    solBalance: balance,
    message: 'Registration successfully submitted!',
  };
}
