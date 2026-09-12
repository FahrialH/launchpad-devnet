# SPEC.md — Solana Private Sale Launchpad

## 1. Overview

Build a lightweight **Solana token private-sale launchpad** inspired by the project/pool experience of Kommunitas PublicCross, but implemented as a standalone **Vite + React + Tailwind CSS** frontend with **Supabase Edge Function** persistence.

Reference UX: [Kommunitas Launchpad](https://kommunitas.net/launchpad?utm_source=chatgpt.com)

The application must support:

* Token sale pages using clean dynamic routes.
* Token/project information loaded entirely from local JSON.
* Solana wallet connection.
* Automatic wallet address detection.
* Automatic SOL balance verification.
* Eligibility requirement: **wallet balance ≥ 2 SOL**.
* Participant registration with:

  * Email
  * Telegram ID
  * Connected wallet address
  * Verified SOL balance
* Supabase Edge Function for participant submission.
* No traditional backend server.
* No authentication/password system required for MVP.

Solana's current documentation supports Wallet Standard-based wallet discovery through the React wallet ecosystem. ([Solana][1])

---

# 2. Product Goal

The product should make the journey:

> **Discover token → understand sale → connect wallet → verify eligibility → submit participation**

as frictionless as possible.

The main CTA should be:

**Connect Wallet**

After successful connection:

**Check Eligibility**

After eligibility verification:

**Join Private Sale**

The user should never be able to submit participant information before connecting a wallet and passing the SOL requirement.

---

# 3. Technology Stack

## Frontend

* Vite
* React
* TypeScript
* Tailwind CSS
* React Router
* FontAwesome or Lucide icons
* Solana wallet integration
* `@solana/web3.js` or current Solana Kit-compatible approach
* Supabase JS client

Recommended legacy-compatible packages if using Wallet Adapter:

```text
@solana/web3.js
@solana/wallet-adapter-base
@solana/wallet-adapter-react
@solana/wallet-adapter-react-ui
```

Solana's documentation currently recommends Wallet Standard discovery so applications can support major wallets without manually registering every wallet adapter. ([Solana][1])

---

# 4. Application Structure

```text
/
├── /
│   └── optional landing / token directory
│
├── /:tokenSlug
│   └── Token Sale Page
│
└── /404
```

Examples:

```text
https://domain.com/ljt
https://domain.com/my-token
https://domain.com/solana-ai
```

The route parameter is:

```typescript
tokenSlug
```

React Router resolves the slug and loads the corresponding token configuration from JSON.

---

# 5. Token Configuration

No backend is required for token/project metadata.

Create:

```text
src/data/tokens.json
```

Example:

```json
[
  {
    "slug": "ljt",
    "name": "LJT",
    "symbol": "LJT",
    "description": "LJT is a community-driven token built on Solana.",
    "logo": "/tokens/ljt.png",
    "network": "Solana",
    "chainId": "mainnet-beta",

    "sale": {
      "type": "Private Sale",
      "status": "upcoming",

      "startAt": "2026-10-01T12:00:00Z",
      "endAt": "2026-10-07T12:00:00Z",

      "tokenPrice": 0.01,
      "priceCurrency": "USDC",

      "allocation": "5,000,000 LJT",
      "hardCap": "50,000 USDC",

      "minimumPurchase": "100 USDC",
      "maximumPurchase": "5,000 USDC"
    },

    "tokenomics": {
      "totalSupply": "1,000,000,000",
      "privateSale": "5%",
      "liquidity": "15%",
      "team": "10%",
      "ecosystem": "40%",
      "marketing": "10%",
      "treasury": "20%"
    },

    "links": {
      "website": "https://example.com",
      "twitter": "https://x.com/example",
      "telegram": "https://t.me/example",
      "discord": "https://discord.gg/example",
      "whitepaper": "https://example.com/whitepaper"
    }
  }
]
```

The JSON should be treated as **read-only project configuration**.

---

# 6. Token Page UX

The page should have a professional Web3 launchpad aesthetic.

## Desktop layout

```text
┌─────────────────────────────────────────────────────────────┐
│ LOGO                              Network     Connect Wallet │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [ TOKEN LOGO ]                                 │
│                                                             │
│              LJT                                            │
│              LJT Token                                      │
│                                                             │
│              Community-driven Solana token                  │
│                                                             │
│              [ Private Sale ] [ Solana ]                    │
│                                                             │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│ PROJECT INFORMATION          │ PRIVATE SALE                │
│                              │                              │
│ Description                 │ Status: UPCOMING             │
│                              │                              │
│ Token Price                 │ $0.01 USDC                   │
│ Allocation                  │ 5,000,000 LJT                │
│ Hard Cap                    │ $50,000                      │
│                              │                              │
│                              │ [ CONNECT WALLET ]           │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘

                 TOKENOMICS

        ┌───────────────────────────────┐
        │       Token Distribution       │
        └───────────────────────────────┘
```

---

# 7. Header

Header contains:

### Left

Project/platform logo.

### Right

```text
Solana Mainnet
[ Connect Wallet ]
```

When connected:

```text
[ 5.21 SOL ] [ 7x3...k9P ]
```

Wallet address should be shortened:

```text
7x3...k9P
```

Clicking the wallet should expose:

* Full wallet address
* SOL balance
* Disconnect

---

# 8. Sale Status

Sale status is derived from JSON.

Possible states:

```text
UPCOMING
LIVE
ENDED
```

Rules:

```typescript
if (now < startAt)
  UPCOMING

if (now >= startAt && now <= endAt)
  LIVE

if (now > endAt)
  ENDED
```

CTA behavior:

| Status              | CTA                     |
| ------------------- | ----------------------- |
| Upcoming            | Notify / Connect Wallet |
| Live + disconnected | Connect Wallet          |
| Live + <2 SOL       | Not Eligible            |
| Live + ≥2 SOL       | Join Private Sale       |
| Ended               | Sale Ended              |

---

# 9. Wallet Connection

Wallet connection is mandatory.

The application must **not provide a manually editable wallet address field**.

The wallet address must come directly from the connected wallet provider.

Example state:

```typescript
interface WalletState {
  connected: boolean;
  address: string | null;
  balanceSol: number | null;
  eligible: boolean;
}
```

After connection:

```text
Wallet Connected

7x3d...k9P

Balance
2.84 SOL

Eligibility
✓ Eligible
```

---

# 10. SOL Balance Verification

Use the connected wallet public key to query the Solana network.

Conceptually:

```typescript
const lamports = await connection.getBalance(publicKey)

const balanceSol = lamports / LAMPORTS_PER_SOL
```

Solana exposes native SOL balance information through its wallet infrastructure. ([Solana Developer Platform][2])

Eligibility:

```typescript
const MIN_SOL_BALANCE = 2;

const eligible = balanceSol >= MIN_SOL_BALANCE;
```

Important:

**The frontend must never be the final authority for eligibility.**

The Edge Function must independently verify the wallet balance before accepting the registration.

This prevents a malicious user from simply modifying frontend JavaScript.

---

# 11. Eligibility UI

## Wallet not connected

```text
PRIVATE SALE

Connect your Solana wallet to check eligibility.

[ Connect Wallet ]
```

## Balance below threshold

```text
NOT ELIGIBLE

Your wallet balance:

1.42 SOL

Minimum required:

2 SOL

You need at least 2 SOL to participate.
```

CTA:

```text
Not Eligible
```

Disabled.

## Eligible

```text
ELIGIBLE

Wallet Balance

5.82 SOL

Minimum Required

2 SOL

✓ You are eligible for this private sale.
```

CTA:

```text
Join Private Sale
```

---

# 12. Participant Form

Only display the form after wallet connection and successful eligibility verification.

Fields:

```text
Email
[ your@email.com ]

Telegram ID
[ @username ]

Wallet
[ 7x3...k9P ]
```

Wallet field:

* Read-only
* Cannot be edited
* Obtained from wallet connection

CTA:

```text
Join Private Sale
```

---

# 13. Form Validation

Email:

```typescript
required
valid email format
```

Telegram:

```typescript
required
2–64 characters
```

Wallet:

```typescript
required
connected wallet public key
```

SOL:

```typescript
balance >= 2
```

Client-side validation is for UX only.

Server-side validation is authoritative.

---

# 14. Supabase Architecture

Use Supabase Edge Functions.

```text
React
  │
  │ HTTPS POST
  ▼
Supabase Edge Function
  │
  ├── Validate payload
  ├── Query Solana RPC
  ├── Verify wallet balance
  ├── Check duplicate wallet
  ├── Check duplicate email
  └── Insert participant
          │
          ▼
      Supabase Postgres
```

---

# 15. Supabase Database

Create:

```sql
create table participants (
  id uuid primary key default gen_random_uuid(),

  token_slug text not null,

  email text not null,

  telegram_id text not null,

  wallet_address text not null,

  sol_balance numeric not null,

  eligible boolean not null default false,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create unique index participants_token_wallet_unique
on participants(token_slug, wallet_address);

create index participants_email_idx
on participants(email);

create index participants_telegram_idx
on participants(telegram_id);
```

---

# 16. Important Database Security

Do **not** allow the browser to directly insert participants into Supabase.

The browser should call:

```text
Supabase Edge Function
```

The Edge Function performs the insert using server-side credentials.

Supabase service-role credentials must never be exposed to Vite.

Never put:

```text
SUPABASE_SERVICE_ROLE_KEY
```

inside:

```text
VITE_*
```

environment variables.

---

# 17. Edge Function

Create:

```text
supabase/functions/register-participant/index.ts
```

Endpoint:

```text
POST /functions/v1/register-participant
```

Payload:

```json
{
  "tokenSlug": "ljt",
  "email": "user@example.com",
  "telegramId": "@username",
  "walletAddress": "7x3..."
}
```

The client should **not submit `solBalance` as an authoritative value**.

The server obtains it independently.

---

# 18. Edge Function Processing

Pseudo-flow:

```typescript
receive request

validate tokenSlug
validate email
validate telegramId
validate walletAddress

load token configuration

connect to Solana RPC

get wallet balance

balanceSol = lamports / LAMPORTS_PER_SOL

if balanceSol < 2:
    return 403

check duplicate wallet

if duplicate:
    return 409

check duplicate email for token

if duplicate:
    return 409

insert participant

return success
```

Response:

### Success

```json
{
  "success": true,
  "eligible": true,
  "walletAddress": "7x3...",
  "solBalance": 4.21
}
```

### Not eligible

```json
{
  "success": false,
  "eligible": false,
  "reason": "MINIMUM_BALANCE_NOT_MET",
  "requiredBalance": 2,
  "currentBalance": 1.73
}
```

---

# 19. Race Conditions

The database uniqueness constraint is the final protection.

Do not rely only on:

```typescript
SELECT → INSERT
```

because two simultaneous requests could pass the SELECT.

The unique index:

```sql
(token_slug, wallet_address)
```

must remain authoritative.

Handle Postgres unique constraint errors gracefully.

---

# 20. CORS

The Edge Function must support:

```text
OPTIONS
POST
```

CORS should allow only configured production origins.

Development may allow:

```text
http://localhost:5173
```

Production:

```text
https://domain.com
```

Do not use:

```text
Access-Control-Allow-Origin: *
```

in production if avoidable.

---

# 21. Security Requirements

## Wallet spoofing

Never trust:

```json
{
  "walletAddress": "..."
}
```

by itself.

The wallet must first be connected in the browser.

For stronger anti-spoofing, the MVP should support **wallet message signing**.

Recommended flow:

```text
Connect Wallet
       ↓
Get wallet address
       ↓
Request signature
       ↓
Server verifies signature
       ↓
Check SOL balance
       ↓
Register participant
```

This proves the participant controls the wallet rather than merely knowing its public address.

For MVP, signing can be feature-flagged, but the architecture should allow it.

---

# 22. Recommended Signature Message

Example:

```text
Join LJT Private Sale

Wallet: 7x3...
Nonce: 8f3c...
Timestamp: 2026-09-08T12:00:00Z
```

The nonce should be generated server-side.

This prevents replay attacks.

Future architecture:

```text
GET /nonce?wallet=...
       ↓
sign message
       ↓
POST /register
       ↓
verify signature
```

---

# 23. Anti-Abuse

Implement:

* Rate limiting at Edge Function level where practical.
* Server-side validation.
* Unique wallet constraint.
* Unique email-per-token constraint.
* Request size limit.
* Strict CORS.
* Server-side SOL verification.
* Optional signature verification.
* No service-role credentials in frontend.

Do not rely on hiding frontend code or disabling browser controls.

---

# 24. Form Submission UX

### Loading

```text
Verifying eligibility...
```

Then:

```text
Submitting registration...
```

### Success

Display modal:

```text
REGISTRATION COMPLETE

You are registered for the LJT private sale.

Wallet
7x3...k9P

Balance
5.82 SOL

Email
user@example.com

Telegram
@username

[ Join Telegram ]
```

### Duplicate wallet

```text
ALREADY REGISTERED

This wallet has already registered for this sale.
```

### Duplicate email

```text
EMAIL ALREADY REGISTERED

This email is already registered for this sale.
```

### Balance changed

If the wallet had ≥2 SOL in the frontend but falls below 2 SOL when the Edge Function checks:

```text
NOT ELIGIBLE

Your current wallet balance is below the 2 SOL minimum.

Please ensure your wallet has at least 2 SOL and try again.
```

---

# 25. Responsive Design

Mobile-first.

Desktop:

```text
max-width: 1200px
```

Mobile:

```text
single-column layout
```

The wallet CTA should remain highly visible.

Mobile hierarchy:

```text
Token
↓
Sale status
↓
Price / allocation
↓
Connect wallet
↓
Eligibility
↓
Registration
↓
Tokenomics
↓
Project information
```

---

# 26. Visual Design

Use a modern launchpad aesthetic:

* Dark background
* Large token logo
* Glass / elevated cards
* Subtle gradients
* Thin borders
* High contrast typography
* Green success states
* Red eligibility failure states
* Purple/blue Solana/Web3 accent
* Large numerical sale metrics

Avoid excessive animations.

Use animations only for:

* Wallet connection state
* Loading
* Countdown
* Success
* Progress indicators

---

# 27. Components

Suggested component structure:

```text
src/
├── components/
│   ├── Header.tsx
│   ├── WalletButton.tsx
│   ├── TokenHero.tsx
│   ├── SaleCard.tsx
│   ├── SaleStatus.tsx
│   ├── SaleMetrics.tsx
│   ├── EligibilityCard.tsx
│   ├── ParticipantForm.tsx
│   ├── Tokenomics.tsx
│   ├── ProjectLinks.tsx
│   ├── Countdown.tsx
│   ├── SuccessModal.tsx
│   └── ErrorAlert.tsx
│
├── data/
│   └── tokens.json
│
├── hooks/
│   ├── useToken.ts
│   ├── useWalletBalance.ts
│   └── useEligibility.ts
│
├── lib/
│   ├── solana.ts
│   ├── supabase.ts
│   └── validation.ts
│
├── pages/
│   ├── TokenPage.tsx
│   └── NotFound.tsx
│
├── providers/
│   └── SolanaProvider.tsx
│
├── App.tsx
└── main.tsx
```

---

# 28. React Router

Routes:

```tsx
<Routes>
  <Route path="/:tokenSlug" element={<TokenPage />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

Token resolution:

```typescript
const token = tokens.find(
  token => token.slug === tokenSlug
);
```

If unavailable:

```text
Token Not Found
```

---

# 29. Environment Variables

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SOLANA_RPC_URL=
VITE_SOLANA_NETWORK=mainnet-beta
```

Supabase Edge Function secrets:

```env
SOLANA_RPC_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

---

# 30. Solana Network

Default:

```text
mainnet-beta
```

The token JSON can optionally specify:

```json
"network": "mainnet-beta"
```

The implementation should make network configurable.

For development:

```text
devnet
```

For production:

```text
mainnet-beta
```

---

# 31. Balance Threshold

Centralize the rule:

```typescript
export const MINIMUM_SOL_BALANCE = 2;
```

Never scatter:

```typescript
balance >= 2
```

through multiple components.

This makes future requirements easy to change:

```text
2 SOL
5 SOL
10 SOL
```

---

# 32. Eligibility Architecture

Use three states:

```typescript
type EligibilityStatus =
  | "unknown"
  | "checking"
  | "eligible"
  | "not_eligible";
```

Flow:

```text
unknown
   │
   ▼
wallet connected
   │
   ▼
checking
   │
   ├── >= 2 SOL ──→ eligible
   │
   └── < 2 SOL ───→ not_eligible
```

---

# 33. Sale Lifecycle

The frontend must distinguish between:

```text
PROJECT STATUS
```

and:

```text
WALLET ELIGIBILITY
```

For example:

```text
LIVE
Wallet Connected
5.2 SOL
Eligible
```

or:

```text
LIVE
Wallet Connected
1.4 SOL
Not Eligible
```

Do not simply disable the entire sale card when the wallet is ineligible.

The user should understand **why**.

---

# 34. Tokenomics

Render tokenomics dynamically from JSON.

Example:

```text
TOTAL SUPPLY
1,000,000,000

Private Sale      5%
Liquidity        15%
Team             10%
Ecosystem        40%
Marketing        10%
Treasury         20%
```

Use a donut chart or horizontal allocation visualization.

---

# 35. Countdown

If:

```text
status === upcoming
```

display:

```text
SALE STARTS IN

03
Days

12
Hours

41
Minutes

22
Seconds
```

If live:

```text
SALE ENDS IN
```

If ended:

```text
SALE ENDED
```

Countdown must be derived from the ISO timestamps in JSON.

---

# 36. Accessibility

Requirements:

* Semantic buttons.
* Proper form labels.
* Keyboard navigation.
* Visible focus states.
* Accessible modal.
* `aria-live` for eligibility/status changes.
* Do not communicate status using color alone.

---

# 37. Error Handling

Handle:

```text
Wallet unavailable
Wallet rejected connection
Wallet disconnected
RPC unavailable
RPC timeout
Invalid token
Sale ended
Sale not started
Insufficient SOL
Duplicate registration
Invalid email
Invalid Telegram ID
Supabase unavailable
Unknown server error
```

Errors should be human-readable.

Never expose raw RPC or database errors to users.

---

# 38. Analytics

MVP can track basic frontend events:

```text
token_page_view
connect_wallet_clicked
wallet_connected
eligibility_check
eligible
not_eligible
registration_started
registration_success
registration_duplicate
registration_error
```

Do not store unnecessary personal data.

---

# 39. Admin Requirements

No admin dashboard is required for MVP.

Participants can be managed through Supabase.

Future:

```text
/admin
```

could provide:

* Participant count
* Eligible participants
* Wallet list
* Export CSV
* Token-specific statistics
* Registration timeline

---

# 40. Multi-Token Architecture

The application must be designed so adding another token requires only:

```text
tokens.json
```

and optionally:

```text
/public/tokens/new-token.png
```

Example:

```json
[
  {
    "slug": "ljt"
  },
  {
    "slug": "abc"
  },
  {
    "slug": "xyz"
  }
]
```

Then:

```text
domain.com/ljt
domain.com/abc
domain.com/xyz
```

all work automatically.

No new React page should be created per token.

---

# 41. Important MVP Boundary

This application is a **private-sale registration / whitelist launchpad**, not the actual token-sale smart contract.

MVP does **not** implement:

* Token purchase transaction
* Token distribution
* Vesting contract
* Claim contract
* Treasury management
* Allocation calculation
* Refund mechanism
* On-chain sale contract

Those can be implemented later.

The initial product only establishes:

```text
Qualified Wallet
        ↓
Participant Registration
        ↓
Private Sale Whitelist
```

---

# 42. Future Sale Contract Integration

The architecture should leave room for:

```text
Join Private Sale
        ↓
Purchase Transaction
        ↓
Transaction Signature
        ↓
On-chain Confirmation
        ↓
Allocation
```

The participant record could later be extended with:

```sql
purchase_amount
purchase_currency
transaction_signature
allocation
claimable_amount
claimed_amount
```

Do not add these fields until the actual sale mechanism is defined.

---

# 43. Definition of Done

The implementation is complete when:

* [ ] Vite React application runs locally.
* [ ] Tailwind CSS configured.
* [ ] Dynamic `/:tokenSlug` route works.
* [ ] Token data comes from JSON.
* [ ] Multiple tokens can be added without code changes.
* [ ] Solana wallet can connect.
* [ ] Connected wallet address is displayed.
* [ ] Wallet address cannot be manually edited.
* [ ] SOL balance is fetched.
* [ ] Balance is displayed in SOL.
* [ ] `< 2 SOL` displays Not Eligible.
* [ ] `>= 2 SOL` displays Eligible.
* [ ] Registration form is hidden until eligibility is confirmed.
* [ ] Email validation works.
* [ ] Telegram ID validation works.
* [ ] Supabase Edge Function receives registration.
* [ ] Edge Function independently verifies wallet balance.
* [ ] Edge Function rejects `< 2 SOL`.
* [ ] Edge Function rejects duplicate wallet/token registrations.
* [ ] Edge Function rejects duplicate email/token registrations.
* [ ] Participant is saved to Supabase.
* [ ] Success state is displayed.
* [ ] Error states are handled.
* [ ] CORS is configured.
* [ ] Service-role key never reaches browser.
* [ ] Responsive mobile UI works.
* [ ] Production build succeeds.

---

# 44. Critical Security Principle

The most important architectural rule is:

> **The frontend determines what the user sees; the Edge Function determines whether the user is actually eligible.**

Therefore:

```text
Frontend
    ↓
Connect wallet
    ↓
Display balance
    ↓
UX eligibility check
    ↓
Submit
    ↓
Edge Function
    ↓
Verify wallet
    ↓
Query Solana RPC
    ↓
Verify >= 2 SOL
    ↓
Verify uniqueness
    ↓
Insert participant
```

A user modifying the frontend, request payload, or browser state must **not** be able to bypass the 2 SOL requirement.

For a production launchpad, adding wallet-signature verification is strongly recommended so possession of the wallet is cryptographically demonstrated rather than merely supplying a public address.

[1]: https://solana.com/uk/developers/cookbook/wallets/connect-wallet-react?utm_source=chatgpt.com "How to Connect a Wallet with React | Solana"
[2]: https://platform.solana.com/docs/wallet-operations/balances?utm_source=chatgpt.com "Wallet balances"
