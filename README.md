# Solana Private Sale Launchpad

A modern, high-performance Web3 Launchpad built for Solana token presales and private sales. Featuring seamless Solana wallet integration, presale eligibility verification, anti-sybil safeguards, and a secure server-side registration pipeline powered by **Supabase Edge Functions** and **Supabase Database (PostgreSQL)**.

---

## 🌟 Features

- 🔌 **Solana Wallet Integration**: Full support for Phantom, Solflare, Backpack, and other standard Solana wallet adapters via `@solana/wallet-adapter-react`.
- ⚡ **Server-Side Balance & Eligibility Validation**: Prevents manipulation by checking wallet SOL balances directly on-chain via Solana RPC within a Supabase Edge Function before accepting registration.
- 🛡️ **Anti-Sybil & Unique Constraints**: Database-level unique constraints and indexes prevent duplicate registrations per email or Solana wallet address for any presale token.
- 🔒 **Row Level Security (RLS)**: Public client writes are blocked by default. Only authenticated Supabase Edge Functions using the `service_role` key can write participant records.
- 🔄 **Local Preview / Simulation Mode**: Built-in fallback that allows front-end testing even without active Supabase credentials configured.
- 🎨 **Modern Responsive UI**: Crafted with React 18, TypeScript, Vite, Tailwind CSS, and Lucide React icons.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Web3 Libraries**: `@solana/web3.js`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`
- **Backend / Database**: Supabase PostgreSQL, Row Level Security (RLS)
- **Serverless / Edge**: Supabase Edge Functions (Deno runtime)

---

## 📁 Repository Structure

```text
├── src/
│   ├── components/         # UI components (Header, Footer, Token Cards, Registration Modal, etc.)
│   ├── data/               # Token presale configuration (tokens.json)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Supabase client, Solana connection, and validation helpers
│   ├── pages/              # Token listing and detail pages
│   ├── providers/          # Solana Wallet Provider wrapper
│   └── types/              # TypeScript interfaces and type definitions
├── supabase/
│   ├── schema.sql          # Database table creation, unique indexes, and RLS policies
│   └── functions/
│       └── register-participant/ # Deno Edge Function for registration verification
├── .env                    # Local environment variables configuration
├── package.json
└── vite.config.ts
```

---

## 🚀 Local Development Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or `yarn` / `pnpm`
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, required for Edge Function deployment)

### 2. Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-org/solana-private-sale-launchpad.git
cd solana-private-sale-launchpad
npm install
```

### 3. Configure Environment Variables

Create or update your `.env` file in the root directory:

```env
# Supabase Credentials (from Supabase Project Settings > API)
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Solana RPC Configuration
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_NETWORK=mainnet
```

> **Note**: If `VITE_SUPABASE_URL` is omitted, the frontend automatically operates in **Local Simulation Mode**, using `localStorage` for testing without needing a live backend.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 How to Deploy to Supabase

Deploying the launchpad backend to Supabase involves two main parts:
1. Setting up the PostgreSQL database table & RLS policies (`schema.sql`).
2. Deploying the registration Edge Function (`register-participant`).

### Step 1: Create a Supabase Project

1. Log into [Supabase Dashboard](https://database.new) and create a new project.
2. Note your **Project URL**, **Anon (public) Key**, and **Service Role Key** under **Project Settings > API**.

---

### Step 2: Deploy the Database Schema

You can execute the database migration using either the Supabase Dashboard SQL Editor or the Supabase CLI.

#### Option A: Using Supabase Dashboard SQL Editor (Quickest)
1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Copy the contents of [`supabase/schema.sql`](file:///home/wan/sc/evgo/tokens-page/supabase/schema.sql) into the editor.
3. Click **Run**.

#### Option B: Using Supabase CLI
```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Apply the SQL migration
supabase db execute --file ./supabase/schema.sql
```

What this creates:
- `participants` table to store registered users.
- Unique composite indexes on `(token_slug, wallet_address)` and `(token_slug, email)` to prevent duplicate entries.
- Row Level Security (RLS) policy `"Service role access only"` that denies direct anonymous client inserts and reserves database operations exclusively to the Edge Function.

---

### Step 3: Deploy the Edge Function (`register-participant`)

The `register-participant` Edge Function validates input parameters, queries the Solana RPC on-chain to verify the wallet balance meets the presale threshold (e.g. 2 SOL minimum), and safely inserts the participant using Supabase service-role privileges.

#### 1. Install & Authenticate Supabase CLI
```bash
npm install -g supabase
supabase login
```

#### 2. Link your CLI to your Supabase Project
```bash
supabase link --project-ref <your-project-ref>
```

#### 3. Set Edge Function Secrets
The Edge Function requires access to your Supabase credentials and a Solana RPC endpoint:

```bash
supabase secrets set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

> **Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected into Deno Edge Functions by Supabase platform. If deploying manually or locally, set them via `supabase secrets set`.

#### 4. Deploy the Edge Function
Deploy the function using the CLI:

```bash
supabase functions deploy register-participant --no-verify-jwt
```

> **Why `--no-verify-jwt`?**: The registration endpoint is publicly accessible to prospective presale buyers (authenticated via Solana wallet address rather than Supabase Auth users). Authorization is handled via the `apikey` / `Authorization: Bearer <ANON_KEY>` header supplied by the frontend client.

---

### Step 4: Wire Frontend Environment & Build

1. Update your `.env` file with your production Supabase URL and Anon Key:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_NETWORK=mainnet
```

2. Test the production build locally:

```bash
npm run build
npm run preview
```

---

### Step 5: Deploy Frontend Application

The frontend build output (`dist/`) can be hosted on any static hosting platform:

- **Vercel**: Import repository, set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SOLANA_RPC_URL`), build command: `npm run build`, output directory: `dist`.
- **Netlify**: Build command: `npm run build`, publish directory: `dist`.
- **Cloudflare Pages**: Framework preset `Vite`, build command `npm run build`, build output directory `dist`.

---

## 📜 Database Schema Reference

The `participants` table schema in Supabase:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique participant record ID |
| `token_slug` | `text` | `NOT NULL` | Presale token identifier (e.g. `sol-ai`) |
| `email` | `text` | `NOT NULL` | Participant's email address |
| `telegram_id` | `text` | `NOT NULL` | Participant's Telegram handle |
| `wallet_address` | `text` | `NOT NULL` | Solana public key |
| `sol_balance` | `numeric` | `NOT NULL` | Verified SOL balance at time of registration |
| `eligible` | `boolean` | `NOT NULL DEFAULT false` | Balance eligibility status |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Registration timestamp |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Record update timestamp |

---

## 📄 License

MIT License. See `LICENSE` for details.
