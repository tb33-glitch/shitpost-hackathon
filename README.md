# shitpost.pro

**The onchain meme studio. Make memes. Mint NFTs. Solana-native.**

A Windows XP-themed web application for creating and minting NFT memes on Solana.

![shitpost.pro](frontend/public/images/boot-logo.png)

---

## Features

- **Meme Creation Studio** - Create memes with templates, stickers, text, and AI background removal
- **NFT Minting** - Mint your creations as NFTs on Solana
- **Token Explorer** - Browse and trade tokens with integrated Jupiter swaps
- **Retro Desktop** - Authentic Windows 98 UI with draggable windows and desktop icons

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Frontend
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Visit `http://localhost:5173`

---

## Tech Stack

- React + Vite
- Solana + Anchor
- Jupiter Aggregator
- IPFS via Pinata

---

## License

MIT
