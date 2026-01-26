# shitpost.pro - Pump Fund Hackathon Build

**The onchain meme studio. Make memes. Mint NFTs. Solana-native.**

A Windows 98-themed web application for creating and minting NFT memes on Solana.

![shitpost.pro](frontend/public/images/boot-logo.png)

---

## Hackathon: Pump Fund (Deadline: Feb 18)

This is a Solana-only fork optimized for the Pump Fund hackathon.

### Core Loops

1. **Create → Share** - Free tier meme creation with watermark
2. **Meme Armory** - Pull live memecoin data for branded meme templates
3. **Token Flywheel** - Mint fees → buyback $SHITPOST → burn

---

## Features

### Meme Creation Studio
- **Object Canvas** - Add images, text, stickers, and templates to create memes
- **Meme Templates** - Pre-built templates that can be customized
- **AI Background Removal** - Remove backgrounds from imported images using ONNX runtime
- **Twitter/X Integration** - Import images directly from tweets
- **Layer Management** - Reorder, lock, and manage multiple objects
- **Video Support** - Add video backgrounds and export as video

### NFT Minting (Solana)
- **Solana Native** - Mint NFTs using Metaplex standard
- **IPFS Storage** - Metadata and images stored on IPFS via Pinata
- **On-Chain Metadata** - Full NFT metadata stored on-chain
- **Premium Minting** - Optional fee-based minting for revenue

### NFT Burning & Sacred Waste Pit
- **Burn to Gallery** - Burn NFTs and they're recorded in an on-chain gallery
- **Sacred Waste Pit** - Special burn destination with leaderboard and stats
- **Burner Ranks** - Earn titles based on number of burns (Initiate → Inferno Lord)

### DeFi Features
- **Jupiter Swap** - Swap tokens on Solana via Jupiter aggregator
- **Pump.fun Explorer** - Browse and trade pump.fun tokens
- **Token Charts** - View price charts and token info

### Desktop Experience
- **Windows 98 UI** - Authentic retro desktop with draggable windows
- **Desktop Icons** - NFTs appear as draggable icons on desktop
- **Recycle Bin** - Drag NFTs to burn them
- **Multiple Windows** - Open multiple apps simultaneously
- **Clippy Assistant** - Guided onboarding tutorial

---

## Project Structure

```
shitpost-hackathon/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Desktop/         # Desktop, icons, taskbar, recycle bin
│   │   │   ├── ObjectCanvas/    # Meme studio with layers and objects
│   │   │   ├── MemeStudio/      # Legacy pixel art canvas
│   │   │   ├── Mint/            # Minting modal and flow
│   │   │   ├── Wallet/          # Wallet connection UI
│   │   │   ├── SwapWindow/      # Jupiter swap interface
│   │   │   ├── CoinExplorer/    # Pump.fun token browser
│   │   │   └── Windows98/       # UI component library
│   │   ├── hooks/
│   │   │   ├── useSolanaMint.js       # Solana minting hook
│   │   │   ├── useSolanaNFTs.js       # Fetch Solana NFTs
│   │   │   ├── useSolanaBurn.js       # Solana burning hook
│   │   │   ├── useSolanaBurnedArt.js  # Fetch Solana burned NFTs
│   │   │   ├── useJupiterSwap.js      # Jupiter swap integration
│   │   │   └── usePumpCoins.js        # Pump.fun API
│   │   ├── config/
│   │   │   ├── solana.js        # Solana network config
│   │   │   └── constants.js     # Canvas settings, colors
│   │   ├── contracts/
│   │   │   └── idl/             # Solana Anchor IDL
│   │   └── utils/
│   │       ├── ipfs.js          # IPFS/Pinata utilities
│   │       └── extractors/      # Social media importers
│   └── public/                  # Static assets
│
└── contracts/
    └── solana/                  # Solana Anchor program
        ├── programs/
        │   └── shitpost_pro/
        │       └── src/
        │           └── lib.rs   # Main program
        ├── scripts/             # Initialization scripts
        └── target/
            └── idl/             # Generated IDL
```

---

## Solana Program

### shitpost_pro

- **Program ID (Devnet):** `62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ`
- Metaplex-compatible NFT minting
- On-chain collection configuration
- Burn recording with artist attribution
- Sacred Waste Pit integration
- Premium minting with fee collection

**Instructions:**
| Instruction | Description |
|-------------|-------------|
| `initialize` | Set up collection config (name, symbol, treasury) |
| `mint` | Mint a new NFT with metadata URI |
| `mint_with_premium` | Mint with fee payment to treasury |
| `burn` | Burn NFT and record in gallery |
| `burn_to_waste` | Burn to Sacred Waste Pit with stats tracking |
| `initialize_pit` | Create Sacred Waste Pit PDA |
| `set_sacred_waste_pit` | Link pit to collection |
| `set_treasury` | Update treasury address |
| `set_premium_fee` | Update premium minting fee |

**Accounts:**
| Account | Description |
|---------|-------------|
| `CollectionConfig` | Collection metadata, counters, and settings |
| `BurnedArt` | Record of each burned NFT with artist and URI |
| `SacredWastePit` | Pit configuration and total burn count |
| `PitBurnRecord` | Individual pit burn entry |
| `BurnerStats` | Per-address burn counter |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Rust + Cargo (for Solana development)
- Anchor CLI 0.29+ (for Solana development)

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
# Solana
VITE_SOLANA_PROGRAM_ID_DEVNET=62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ

# Pinata IPFS
VITE_PINATA_JWT=your_jwt_token
VITE_PINATA_GATEWAY=gateway.pinata.cloud
```

Run development server:
```bash
npm run dev
# Access at http://localhost:5173
```

### Solana Development

```bash
cd contracts/solana

# Install dependencies
npm install

# Build program
anchor build

# Deploy to devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet

# Initialize collection (after deployment)
node scripts/init.mjs
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| @solana/wallet-adapter | Solana wallet connection |
| @coral-xyz/anchor 0.29 | Solana program interaction |
| 98.css | Windows 98 styling |
| onnxruntime-web | Client-side AI background removal |

### Wallet Support

**Solana Wallets:**
- Phantom
- Solflare
- Backpack
- All Wallet Standard compatible wallets

### API Integrations

| Service | Purpose |
|---------|---------|
| Pinata | IPFS storage for images and metadata |
| Jupiter | Solana token swaps via aggregator API |
| Pump.fun | Token listing and trading |

---

## User Flows

### Minting Flow
1. Create meme in Object Canvas
2. Click "Mint" button
3. Connect Solana wallet (Phantom, Solflare, Backpack)
4. Image uploads to IPFS
5. Metadata JSON uploads to IPFS
6. Transaction sent to mint NFT
7. NFT appears as icon on desktop

### Burning Flow
1. Drag NFT icon to Recycle Bin
2. Confirm burn in modal
3. Approve transaction in wallet
4. NFT burned and recorded in Sacred Waste Pit
5. Burn appears in gallery

### Swapping Flow
1. Open Jupiter Swap window
2. Select input and output tokens
3. Enter amount
4. Get quote from Jupiter
5. Approve transaction
6. Swap executed

---

## Environment Variables

```env
# Pinata IPFS (required for minting)
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=gateway.pinata.cloud

# Solana
VITE_SOLANA_PROGRAM_ID_DEVNET=62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ
VITE_SOLANA_PROGRAM_ID_MAINNET=...
```

---

## Development

### Code Style
- ES modules throughout
- Functional React components with hooks
- CSS files for component styling (no CSS-in-JS)
- No TypeScript (plain JavaScript)

### Building for Production
```bash
cd frontend
npm run build
# Output in dist/
```

### Testing Checklist
- [ ] Connect Solana wallet (Phantom)
- [ ] Create meme in Object Canvas
- [ ] Mint NFT (Solana devnet)
- [ ] See NFT on desktop
- [ ] Drag NFT to Recycle Bin
- [ ] Confirm burn
- [ ] See burn in Sacred Waste Pit
- [ ] Jupiter swap tokens
- [ ] Browse Pump.fun coins

---

## Deployment Status

### Solana Devnet
- [x] Deploy program
- [x] Initialize collection config
- [x] Initialize Sacred Waste Pit
- [x] Test mint flow
- [x] Test burn flow

### Solana Mainnet (when ready)
- [ ] Audit program
- [ ] Deploy to mainnet
- [ ] Update frontend for production
- [ ] DNS and hosting setup

---

## License

MIT

---

*Built for Pump Fund Hackathon 2025*
