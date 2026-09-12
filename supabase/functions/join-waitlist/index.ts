import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Minimum SOL balance required to join waitlist
const MIN_SOL_BALANCE = 2;
const FALLBACK_RPCS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
  "https://api.mainnet.solana.com",
];
function buildRpcList() {
  const primary = Deno.env.get('SOLANA_RPC_URL') || Deno.env.get('VITE_SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
  const list = [primary.trim(), ...FALLBACK_RPCS].filter(Boolean);
  return [...new Set(list)];
}
/**
 * Check Solana wallet balance via mainnet RPC with fallback rotation (403/429 recovery)
 */
async function checkSolanaBalance(walletAddress) {
  const rpcList = buildRpcList();
  let lastError = null;
  for (const rpcUrl of rpcList) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [walletAddress] }),
        signal: controller.signal,
      }).finally(() => clearTimeout(t));
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        lastError = `HTTP ${response.status} ${text.slice(0, 200)}`;
        console.warn(`[join-waitlist] RPC ${rpcUrl} failed:`, lastError);
        continue;
      }
      const data = await response.json().catch(() => null);
      if (!data) { lastError = "Invalid RPC JSON response"; continue; }
      if (data.error) { lastError = data.error.message || JSON.stringify(data.error); console.warn(`[join-waitlist] RPC ${rpcUrl} error:`, lastError); continue; }
      const lamports = data.result?.value ?? 0;
      if (typeof lamports !== "number") { lastError = "Unexpected RPC result shape"; continue; }
      const balanceSol = lamports / 1_000_000_000;
      return { balanceSol, hasMinimum: balanceSol >= MIN_SOL_BALANCE, error: null };
    } catch (err) {
      lastError = err.message || 'Failed to check balance';
      console.warn(`[join-waitlist] RPC ${rpcUrl} exception:`, lastError);
    }
  }
  return { balanceSol: 0, hasMinimum: false, error: lastError || 'All RPC endpoints failed' };
}
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { wallet_address } = body;
    if (!wallet_address) {
      return new Response(JSON.stringify({
        error: 'Missing wallet_address parameter'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase admin client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Server-side Solana balance verification (can't be bypassed from frontend)
    const balanceCheck = await checkSolanaBalance(wallet_address);
    if (balanceCheck.error) {
      return new Response(JSON.stringify({
        success: false,
        error: `Unable to verify wallet balance: ${balanceCheck.error}`
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!balanceCheck.hasMinimum) {
      return new Response(JSON.stringify({
        success: false,
        error: `Insufficient SOL balance. Your wallet has ${balanceCheck.balanceSol.toFixed(4)} SOL but a minimum of ${MIN_SOL_BALANCE} SOL is required.`,
        balance: balanceCheck.balanceSol,
        required: MIN_SOL_BALANCE
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if wallet is already registered
    const { data: existing } = await supabase.from('waitlist').select('id, entry_number, created_at, wallet_address').eq('wallet_address', wallet_address).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Wallet already registered on waitlist',
        entry: existing
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Query last position / max entry_number in the waitlist table
    const { data: lastRecord } = await supabase.from('waitlist').select('entry_number').order('entry_number', {
      ascending: false
    }).limit(1).maybeSingle();
    // Query count as secondary fallback
    const { count } = await supabase.from('waitlist').select('*', {
      count: 'exact',
      head: true
    });
    const lastPosition = lastRecord?.entry_number ? Number(lastRecord.entry_number) : count || 0;
    const newEntryNumber = lastPosition + 1;
    // Insert new waitlist record with running sequence entry_number
    const { data, error } = await supabase.from('waitlist').insert([
      {
        wallet_address,
        entry_number: newEntryNumber,
        network: 'solana',
        tier: 'Early Supporter VIP',
        created_at: new Date().toISOString()
      }
    ]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully registered for EV-GO TGE Waitlist',
      entry: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
