# Notes

## Completed (Feb 3)

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
- [x] Portfolio window showing all tracked positions
- [x] Fixed infinite loop bug in cross-component sync

### UI Fixes
- [x] Enabled scrolling on swap panel
- [x] Fixed gray scrollbar issues

### Infrastructure
- [x] Created wSOL ATA for fee collection: `Y9iFHfDZ4gVcHS2Es5ZtxAVtZUfCuqyT3nPaK7yfJ7B`
- [x] Using Helius RPC for mainnet (fixes 403 errors from public RPC)

### Pending
- [ ] Re-enable swap fees (currently disabled due to error 6014)
- [ ] Server-side position storage (for cross-device persistence)
- [ ] Production deployment (API key security, CORS, builds)

## Tomorrow (Feb 1)
- [ ] Get everything ready for Solana mainnet
- [ ] Test token-gated watermark removal with $SHITPOST tokens (requires 1,000+ tokens)
- [ ] Full mainnet testing pass
