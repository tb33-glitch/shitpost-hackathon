# Notes

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
