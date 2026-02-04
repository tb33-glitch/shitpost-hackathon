# Notes

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

### Pending
- [ ] Server-side position storage (for cross-device persistence)
- [ ] Production deployment (API key security, CORS, builds)
- [ ] Run buyback in watch mode on server for auto-buyback
