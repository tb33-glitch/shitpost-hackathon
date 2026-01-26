# shitpost.pro

**The onchain meme studio. Make memes. Mint NFTs. Any chain.**

A Windows 98-themed web application for creating, minting, and burning NFT memes across multiple blockchains.

![shitpost.pro](frontend/public/images/boot-logo.png)

---

## Features

### Meme Creation Studio
- **Canvas Editor** - Draw pixel art with a full color palette including seasonal colors
- **Object Canvas** - Add images, text, stickers, and templates to create memes
- **Meme Templates** - Pre-built templates that can be customized
- **AI Background Removal** - Remove backgrounds from imported images using ONNX runtime
- **Twitter/X Integration** - Import images directly from tweets
- **Layer Management** - Reorder, lock, and manage multiple objects

### NFT Minting
- **Multi-Chain Support** - Mint on Solana, Ethereum, Base, Avalanche, BNB Chain, and Hemi
- **IPFS Storage** - Metadata and images stored on IPFS via Pinata
- **On-Chain Metadata** - Full NFT metadata stored on-chain

### NFT Burning & Sacred Waste Pit
- **Burn to Gallery** - Burn NFTs and they're recorded in an on-chain gallery
- **Sacred Waste Pit** - Special burn destination with leaderboard and stats
- **Cross-Chain Burns** - View burns from all supported chains in one gallery
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
shitpost.pro-main/
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
│   │   │   ├── BurnedGallery/   # Gallery of burned NFTs
│   │   │   ├── BurnLeaderboard/ # Sacred Waste Pit stats
│   │   │   └── Windows98/       # UI component library
│   │   ├── hooks/
│   │   │   ├── useShitpostPro.js      # EVM minting hook
│   │   │   ├── useSolanaMint.js       # Solana minting hook
│   │   │   ├── useSolanaNFTs.js       # Fetch Solana NFTs
│   │   │   ├── useSolanaBurn.js       # Solana burning hook
│   │   │   ├── useSolanaBurnedArt.js  # Fetch Solana burned NFTs
│   │   │   ├── useOwnedNFTs.js        # Fetch EVM NFTs
│   │   │   ├── useBurn.js             # EVM burning hook
│   │   │   ├── useAllChainBurns.js    # Cross-chain burn aggregation
│   │   │   ├── useJupiterSwap.js      # Jupiter swap integration
│   │   │   └── usePumpCoins.js        # Pump.fun API
│   │   ├── config/
│   │   │   ├── chains.js        # EVM chain configurations
│   │   │   ├── solana.js        # Solana network config
│   │   │   └── constants.js     # Contract addresses, colors
│   │   ├── contracts/
│   │   │   ├── abi/             # EVM contract ABIs
│   │   │   └── idl/             # Solana Anchor IDL
│   │   └── utils/
│   │       ├── ipfs.js          # IPFS/Pinata utilities
│   │       └── extractors/      # Social media importers
│   └── public/                  # Static assets
│
└── contracts/
    ├── src/                     # EVM Solidity contracts
    │   ├── ShitpostPro.sol      # Main NFT contract
    │   └── SacredWastePit.sol   # Burn gallery contract
    ├── script/                  # Foundry deployment scripts
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

## Smart Contracts

### EVM Contracts (Solidity)

#### ShitpostPro.sol
- ERC721 NFT contract with on-chain metadata
- Free minting with optional premium tier
- Integrated burn function that records to gallery
- Sacred Waste Pit integration for special burns
- Owner controls for treasury and pit configuration

#### SacredWastePit.sol
- Receives and records burned NFTs from authorized contracts
- Tracks per-address burn counts
- Maintains recent burns list for display
- Cross-chain burn deposit support

### Solana Program (Anchor/Rust)

#### shitpost_pro
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

## Supported Chains

| Chain | Status | Chain ID | Contract |
|-------|--------|----------|----------|
| **Solana Devnet** | ✅ Live | - | `62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ` |
| Ethereum Sepolia | 🔜 Ready to deploy | 11155111 | - |
| Hemi Sepolia | 🔜 Ready to deploy | 743111 | - |
| Base | 🔜 Ready to deploy | 8453 | - |
| Avalanche | 🔜 Ready to deploy | 43114 | - |
| BNB Chain | 🔜 Ready to deploy | 56 | - |
| Ethereum Mainnet | 🔜 Ready to deploy | 1 | - |
| Hemi Mainnet | 🔜 Ready to deploy | 43111 | - |
| Solana Mainnet | 🔜 Ready to deploy | - | - |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Rust + Cargo (for Solana development)
- Anchor CLI 0.29+ (for Solana development)
- Foundry (for EVM development)

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

# EVM Contracts (when deployed)
VITE_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_PIT_ADDRESS_SEPOLIA=0x...
VITE_CONTRACT_ADDRESS_HEMI_SEPOLIA=0x...
VITE_PIT_ADDRESS_HEMI_SEPOLIA=0x...
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

### EVM Development

```bash
cd contracts

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Build contracts
forge build

# Deploy to testnet
forge script script/Deploy.s.sol:DeployAll \
  --rpc-url https://rpc.sepolia.org \
  --broadcast \
  --private-key $PRIVATE_KEY

# Deploy to Hemi Sepolia
forge script script/Deploy.s.sol:DeployAll \
  --rpc-url https://testnet.rpc.hemi.network/rpc \
  --broadcast \
  --private-key $PRIVATE_KEY
```

---

## Architecture

### Frontend Stack
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| wagmi + viem | EVM wallet connection and contracts |
| @solana/wallet-adapter | Solana wallet connection |
| @coral-xyz/anchor 0.29 | Solana program interaction |
| 98.css | Windows 98 styling |
| onnxruntime-web | Client-side AI background removal |

### Wallet Support

**EVM Wallets:**
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow

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
| Alchemy | EVM NFT fetching via NFT API |

---

## User Flows

### Minting Flow
1. Create meme in Object Canvas or Pixel Editor
2. Click "Mint" button
3. Connect wallet (EVM or Solana)
4. Image uploads to IPFS
5. Metadata JSON uploads to IPFS
6. Transaction sent to mint NFT
7. NFT appears as icon on desktop

### Burning Flow
1. Drag NFT icon to Recycle Bin
2. Confirm burn in modal
3. Approve transaction in wallet
4. NFT burned and recorded in Sacred Waste Pit
5. Burn appears in gallery and leaderboard

### Swapping Flow (Solana)
1. Open Jupiter Swap window
2. Select input and output tokens
3. Enter amount
4. Get quote from Jupiter
5. Approve transaction
6. Swap executed

---

## Environment Variables

### Required
```env
# Pinata IPFS (required for minting)
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=gateway.pinata.cloud

# Solana (required for Solana support)
VITE_SOLANA_PROGRAM_ID_DEVNET=62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ
```

### Optional (per chain)
```env
# Ethereum Sepolia
VITE_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_PIT_ADDRESS_SEPOLIA=0x...

# Hemi Sepolia
VITE_CONTRACT_ADDRESS_HEMI_SEPOLIA=0x...
VITE_PIT_ADDRESS_HEMI_SEPOLIA=0x...

# Base
VITE_CONTRACT_ADDRESS_BASE=0x...
VITE_PIT_ADDRESS_BASE=0x...

# Mainnet addresses
VITE_CONTRACT_ADDRESS_MAINNET=0x...
VITE_PIT_ADDRESS_MAINNET=0x...
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
- [ ] Connect EVM wallet
- [ ] Connect Solana wallet (Phantom)
- [ ] Create meme in Object Canvas
- [ ] Mint NFT (Solana devnet)
- [ ] See NFT on desktop
- [ ] Drag NFT to Recycle Bin
- [ ] Confirm burn
- [ ] See burn in Sacred Waste Pit

---

## Deployment Checklist

### Solana Devnet ✅
- [x] Deploy program
- [x] Initialize collection config
- [x] Initialize Sacred Waste Pit
- [x] Test mint flow
- [x] Test burn flow

### EVM Testnets
- [ ] Deploy ShitpostPro.sol
- [ ] Deploy SacredWastePit.sol
- [ ] Set Sacred Waste Pit on ShitpostPro
- [ ] Update frontend .env
- [ ] Test mint flow
- [ ] Test burn flow

### Mainnet (when ready)
- [ ] Audit contracts
- [ ] Deploy to mainnets
- [ ] Update frontend for production
- [ ] DNS and hosting setup

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test on desktop and mobile
5. Submit PR

---

## License

MIT

---

## Links

- **Website:** [shitpost.pro](https://shitpost.pro)
- **Twitter:** [@shitpostpro](https://twitter.com/shitpostpro)

---

*Built with memes and mass onchain burns* 🎨🔥
