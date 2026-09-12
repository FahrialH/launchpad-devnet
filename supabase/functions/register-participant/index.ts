// Supabase Edge Function: register-participant
// Deno environment - Lightweight version to avoid WORKER_RESOURCE_LIMIT
// Avoids heavy @solana/web3.js dependency; uses native fetch for RPC

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MINIMUM_SOL_BALANCE = 2;
const LAMPORTS_PER_SOL = 1_000_000_000;

interface RequestBody {
  tokenSlug?: string;
  email?: string;
  telegramId?: string;
  walletAddress?: string;
  fullName?: string;
  commitAmount?: number | string;
  commitCurrency?: string;
}

// Lightweight base58 validation (Solana addresses are 32-44 base58 chars)
function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  // Base58 alphabet without 0, O, I, l
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

const FALLBACK_RPCS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
  "https://api.mainnet.solana.com",
];

function buildRpcList(primary?: string): string[] {
  const list = [primary?.trim(), ...FALLBACK_RPCS].filter(Boolean) as string[];
  return [...new Set(list)];
}

async function fetchBalanceFromRpc(rpcUrl: string, walletAddress: string): Promise<{ lamports: number; error?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [walletAddress],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { lamports: 0, error: `RPC HTTP ${response.status}: ${text.slice(0, 200)}` };
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return { lamports: 0, error: "Invalid RPC JSON response" };
    }
    if (data.error) {
      return { lamports: 0, error: data.error.message || JSON.stringify(data.error) };
    }
    const lamports = data.result?.value;
    if (typeof lamports !== "number") {
      return { lamports: 0, error: "Unexpected RPC result shape" };
    }
    return { lamports };
  } catch (err) {
    return { lamports: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function getSolBalance(walletAddress: string): Promise<{ lamports: number; error?: string }> {
  const primary = Deno.env.get("SOLANA_RPC_URL") || Deno.env.get("VITE_SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";
  const rpcList = buildRpcList(primary);
  let lastError = "";
  for (const rpcUrl of rpcList) {
    const res = await fetchBalanceFromRpc(rpcUrl, walletAddress);
    if (!res.error) return res;
    console.warn(`[register-participant] RPC ${rpcUrl} failed:`, res.error);
    lastError = `${rpcUrl}: ${res.error}`;
    // 403/429 – try next fallback
  }
  return { lamports: 0, error: lastError || "All RPC endpoints failed" };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RequestBody = await req.json().catch(() => ({}));
    const { tokenSlug, email, telegramId, walletAddress, fullName, commitAmount, commitCurrency } = body;

    // 1. Input Validation
    if (!tokenSlug || typeof tokenSlug !== "string" || !tokenSlug.trim()) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Missing or invalid tokenSlug" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 80) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Full name must be 2–80 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Invalid email address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!telegramId || typeof telegramId !== "string" || telegramId.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Invalid Telegram ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!walletAddress || typeof walletAddress !== "string" || !isValidSolanaAddress(walletAddress.trim())) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Invalid Solana wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Commit amount validation – must be positive number
    const parsedCommit = typeof commitAmount === 'string' ? parseFloat(commitAmount.replace(/,/g, '')) : commitAmount;
    if (parsedCommit === undefined || parsedCommit === null || typeof parsedCommit !== 'number' || !Number.isFinite(parsedCommit) || parsedCommit <= 0) {
      return new Response(
        JSON.stringify({ success: false, reason: "INVALID_INPUT", message: "Commitment amount must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanTokenSlug = tokenSlug.trim();
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanTelegramId = telegramId.trim();
    const cleanWalletAddress = walletAddress.trim();
    const cleanCommitAmount = parsedCommit;
    // Commitment currency is the token symbol (e.g. CYRUS, not USDC)
    const cleanCommitCurrency = typeof commitCurrency === 'string' && commitCurrency.trim() ? commitCurrency.trim().toUpperCase() : cleanTokenSlug.toUpperCase();

    // 2. Query Solana RPC for authoritative wallet balance (with fallback rotation for 403/429)
    const { lamports, error: rpcError } = await getSolBalance(cleanWalletAddress);

    if (rpcError) {
      console.error("Solana RPC error:", rpcError);
      return new Response(
        JSON.stringify({ success: false, reason: "SERVER_ERROR", message: "Unable to verify Solana balance from RPC network" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const solBalance = lamports / LAMPORTS_PER_SOL;

    // 3. Authoritative Server-side Balance Eligibility Check
    if (solBalance < MINIMUM_SOL_BALANCE) {
      return new Response(
        JSON.stringify({
          success: false,
          eligible: false,
          reason: "MINIMUM_BALANCE_NOT_MET",
          message: `Wallet balance (${solBalance.toFixed(2)} SOL) is below the minimum ${MINIMUM_SOL_BALANCE} SOL required.`,
          requiredBalance: MINIMUM_SOL_BALANCE,
          currentBalance: solBalance,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Connect to Supabase using Service Role credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn("Supabase credentials missing on Edge Function, mock mode");
      return new Response(
        JSON.stringify({
          success: true,
          eligible: true,
          walletAddress: cleanWalletAddress,
          solBalance,
          message: "Registration accepted (Server simulation mode)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 5. Insert participant record into Database
    const { error: insertError } = await supabase.from("participants").insert({
      token_slug: cleanTokenSlug,
      full_name: cleanFullName,
      email: cleanEmail,
      telegram_id: cleanTelegramId,
      wallet_address: cleanWalletAddress,
      commit_amount: cleanCommitAmount,
      commit_currency: cleanCommitCurrency,
      sol_balance: solBalance,
      eligible: true,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      
      // Handle Unique Constraint Violations (Code 23505)
      if (insertError.code === "23505" || insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
        // Check if it's email or wallet duplicate by inspecting message/details/constraint
        const msg = `${insertError.message} ${insertError.details || ""} ${insertError.hint || ""}`.toLowerCase();
        if (msg.includes("email")) {
          return new Response(
            JSON.stringify({
              success: false,
              reason: "DUPLICATE_EMAIL",
              message: "This email is already registered for this sale.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            reason: "DUPLICATE_WALLET",
            message: "This wallet address has already registered for this sale.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          reason: "SERVER_ERROR",
          message: "Failed to store registration in database.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Return Success Response
    return new Response(
      JSON.stringify({
        success: true,
        eligible: true,
        walletAddress: cleanWalletAddress,
        solBalance,
        message: "Registration complete!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected Edge Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        reason: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
