# Notes

## Completed (Feb 6)

### Motion Path Visualization for Keyframe Animation
- [x] Added `MotionPathOverlay` component in ObjectCanvas.jsx
- [x] Visualizes keyframe positions with color-coded dots:
  - Green dot for first keyframe (start)
  - Red dot for last keyframe (end)
  - Orange dots for intermediate keyframes
- [x] Draws SVG path lines connecting keyframe positions
- [x] Shows for all objects with keyframes, highlights selected object's path

### Motion Paths Toggle
- [x] Added "Show Motion Paths" toggle in View Options section of PropertiesPanel
- [x] Created `ViewOptionsSection` component that appears when video is loaded
- [x] Toggle state managed in MemeStudio.jsx and passed to ObjectCanvas

### Multi-Video Support
- [x] Canvas now supports multiple videos simultaneously
- [x] Removed code that deleted existing videos when adding new one
- [x] Primary video (longest duration) drives the timeline
- [x] All videos sync playback (play/pause/seek) via `videoRefsMap` in useVideoPlayback.js
- [x] Updated `registerVideo` callback to accept objectId for proper video tracking

### Multiline Text Bounding Box Fix
- [x] Fixed `measureText()` in useObjectCanvas.js to handle newlines
- [x] Text box now dynamically expands height based on line count
- [x] Uses `text.split('\n')` to count lines and calculate total height

### Admin Panel Fixes
- [x] Fixed header visibility with inline styles and CSS positioning
- [x] Added `position: fixed` to admin-container for full viewport coverage
- [x] Added `position: sticky; top: 0` to admin-header to keep it visible when scrolling

---

## Completed (Feb 5)

### Metaplex Direct Minting (replaces Anchor contract) ✅
- [x] Replaced old Anchor-based `useSolanaMint.js` with `useMetaplexMint.js`
- [x] Pure Umi implementation: `transactionBuilder()` chains `transferSol` + `createNft` atomically
- [x] 0.015 SOL mint fee collected to treasury in same tx as NFT creation
- [x] Switched from devnet to **mainnet** — confirmed working with fee collection verified on-chain
- [x] Registered `mplTokenMetadata()` and `mplToolbox()` plugins (required for mainnet)
- [x] Using Helius RPC for mainnet (avoids 403 from public RPC)
- [x] Deleted old `useSolanaMint.js`, kept Anchor/IDL for burn hooks

### NFT Card System ✅
- [x] **Trait system** (`backend/src/lib/nft/traits.js`)
  - Aura (5 types): Basic 50%, Shiny 25%, Holographic 15%, Cursed 7%, Ascended 3%
  - Tier (5 types): Shitpost 40%, Mid 25%, Classic 20%, Iconic 10%, Fire 5%
  - Class (5 types): Tech 30%, Finance 25%, Investments 20%, It's Complicated 15%, I Trade JPEGs 10%
- [x] **Metadata generator** (`backend/src/lib/nft/metadata.js`) — Metaplex-compatible JSON
- [x] **Frame generator** (`scripts/generate-placeholder-frames.js`) — 5 aura PNG frames (1000x1000)
- [x] **Compositor** (`backend/src/lib/nft/compositor.js`) — composites meme into card frame with text overlays
  - Layout: 12px borders, 34px title bar, 30px status bar, 976x920 meme area
  - ~50ms per card

### Provably Fair Trait Rolling ✅
- [x] **Cryptographic randomness**: `crypto.randomBytes` replaces `Math.random()`
- [x] **Deterministic seeded rolling**: `rollTraitsFromSeed(seedHex)` — same seed always = same traits
- [x] **Commit-reveal scheme**:
  1. Server generates nonce, publishes `commitment = sha256(nonce)` before mint
  2. User mints → gets `txSignature`
  3. Server computes `seed = sha256(txSignature + nonce)`, rolls traits deterministically
  4. Server reveals nonce — anyone can verify: `verifyTraits(txSignature, nonce, claimedTraits)`
- [x] **Verification function**: `verifyTraits()` recomputes seed → traits, confirms match
- [x] All tested: determinism, verification (valid + invalid), nonce generation, commitment hashing

### Provably Fair — Two-Step Mint+Reveal Flow (Proposed)
The chicken-and-egg problem: need tx signature to generate seed for traits, but need traits to composite the card image, but need image URI to mint the NFT.

**Proposed solution — two-step flow:**
1. **Step 1 (Mint)**: User mints with a placeholder/generic card image. Server publishes nonce commitment before mint.
2. **Step 2 (Reveal)**: After mint confirms, server uses `seed = sha256(txSignature + serverNonce)` to roll traits deterministically, composites the final card, uploads to IPFS, updates the NFT metadata URI.
3. **Verification**: Anyone can call `verifyTraits(txSignature, serverNonce, claimedTraits)` to prove the roll was fair.

**Status**: Trait system + verification built and tested. Mint flow changes need discussion before implementing (don't want to break existing mint UX).

---

## Completed (Feb 4)

### Coin Explorer Search Fix ✅
- [x] Search by address now returns **single result** (deduped by mint address)
- [x] Fixed field name mismatch (`marketCap` → `market_cap`) in search results
- [x] Added missing price change fields (5m, 1h, 6h, 24h) to search results
- [x] Uses DexScreener token endpoint for address lookups (more reliable)
- [x] Name/symbol searches dedupe by mint, keeping highest liquidity pair

### Live PnL Tracker ✅
- [x] **PnL now updates in real-time** (every 5 seconds)
- [x] Fetches live token price from DexScreener API
- [x] Fixed timing issue where position wasn't loading before PnL calculation
- [x] Switched from CoinGecko to DexScreener for SOL price (avoids CORS/rate limits)
- [x] PnL syncs with DexScreener chart embedded in UI

### Buyback
- [x] Buyback script running in watch mode (checks every 60s)
- [x] Treasury balance: ~0.01 SOL (needs more fees to trigger buyback)

---

## Completed (Feb 3)

### Fee Collection & Buyback ✅
- [x] **Bulletproof fee collection** - 0.5% on both buys AND sells
  - BUY: Fee transferred to treasury BEFORE swap
  - SELL: Fee transferred to treasury AFTER swap
  - No wSOL account needed (direct SOL transfers, always works)
- [x] **Buyback script** working end-to-end (`scripts/buyback/jupiter-buyback.ts`)
  - Converts collected fees → $SHITPOST via Jupiter
  - 70% of available SOL used for buyback, 30% retained
  - Optional token burn (currently holding, not burning)
  - Watch mode available: `npx tsx jupiter-buyback.ts --watch`
- [x] Treasury: `6tj7iWbyTmwcEg1R8gLmqNkJUxXBkRDcFZMYV4pEqtJn`
- [x] Current $SHITPOST holdings: ~10.8M tokens

### Jupiter Swap Integration
- [x] Integrated Jupiter DEX API v6 for token swaps
- [x] Added Buy/Sell toggle in swap UI
- [x] Clickable swap arrow (⇅) to toggle between buy/sell modes
- [x] Token balance fetching for sell mode (uses `getTokenAccountsByOwner` for Token-2022 compatibility)
- [x] Slippage controls (0.5%, 1%, 2%)

### PnL Tracker
- [x] Position tracking with localStorage persistence (`usePositions.js`)
- [x] Records buy/sell trades with cost basis tracking
- [x] PnL display in swap widget when user has position
- [x] PnL calculation uses actual wallet balance × avg cost per token
- [x] Removed Portfolio desktop icon (PnL stays in swap widget)

### UI Fixes
- [x] Enabled scrolling on swap panel
- [x] Fixed gray scrollbar issues

### Infrastructure
- [x] Using Helius RPC for mainnet (fixes 403 errors from public RPC)
- [x] PM2 buyback running locally: `pm2 start "npx tsx jupiter-buyback.ts --watch" --name shitpost-buyback`
- [x] Frontend deployed to Vercel: `https://frontend-lqqchyqfm-tylers-projects-56d96582.vercel.app`
- [x] CORS updated to allow test domains

### Current $SHITPOST Holdings
- Treasury: `6tj7iWbyTmwcEg1R8gLmqNkJUxXBkRDcFZMYV4pEqtJn`
- Balance: ~11.8M $SHITPOST tokens

---

## Left Off (Feb 4)

### Current State
- Frontend running locally on `localhost:5175`
- Backend running locally on `localhost:3001`
- Buyback script running in watch mode (local)

### Pending Before Production
- [ ] Deploy backend to Railway/Render
- [ ] Set custom domain `test.shitpost.pro` in Vercel
- [ ] Update frontend `VITE_API_URL` to point to deployed backend
- [ ] Move Helius API key to backend (currently exposed in frontend)
- [ ] Server-side position storage (optional)
- [ ] Run buyback on server (currently local)
