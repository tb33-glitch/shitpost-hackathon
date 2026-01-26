# trash.art - Complete Project Documentation

## Project Overview

**trash.art** is a Windows XP-themed meme creation and NFT minting platform built on the Hemi blockchain. Users can create memes using a Canva-style editor, add text/stickers/images, and mint their creations as NFTs.

### Tech Stack
- **Frontend:** React + Vite
- **Styling:** CSS (Windows 98/XP theme via 98.css)
- **Blockchain:** Hemi Sepolia testnet
- **Wallet:** wagmi + RainbowKit
- **Storage:** Pinata IPFS

---

## File Structure

```
frontend/
├── public/
│   ├── images/           # Static images (clippy, wallpaper)
│   └── templates/        # Local meme template images
├── src/
│   ├── App.jsx           # Main app with wallet providers
│   ├── main.jsx          # Entry point
│   ├── components/
│   │   ├── Desktop/      # Windows XP desktop UI
│   │   ├── ObjectCanvas/ # Main meme editor (Canva-style)
│   │   ├── Canvas/       # Legacy pixel art canvas
│   │   ├── Editor/       # Meme editor components
│   │   ├── Mint/         # NFT minting modal
│   │   ├── MyNFTs/       # User's NFT gallery
│   │   ├── Wallet/       # Wallet connection
│   │   ├── Windows98/    # Window component wrappers
│   │   └── OutlookExpress/ # Email notifications UI
│   ├── hooks/            # Custom React hooks
│   ├── config/           # Constants, chains, templates
│   ├── contracts/        # Contract ABIs
│   ├── styles/           # Global CSS
│   └── utils/            # Helper functions
```

---

## Core Components

### Desktop (`components/Desktop/`)

The main Windows XP desktop experience.

**Desktop.jsx** - Main desktop container
- Manages window state (open, minimized, position, size)
- Renders desktop icons, taskbar, and windows
- Handles drag-to-recycle-bin burn feature
- Uses `useOwnedNFTs` hook for user's NFTs

**Key state:**
```javascript
const [windows, setWindows] = useState({})      // Window states
const [activeWindow, setActiveWindow] = useState(null)
const [viewingNFT, setViewingNFT] = useState(null)
const [burningNFT, setBurningNFT] = useState(null)
```

**Taskbar.jsx** - Windows XP taskbar
- Start button, open window buttons, clock
- Double-click window button to center window

**DesktopIcon.jsx** - Clickable desktop icons
- Opens corresponding windows

**NFTDesktopIcon.jsx** - Draggable NFT icons
- Can be dragged to RecycleBin to burn
- Sets drag data: `e.dataTransfer.setData('application/json', JSON.stringify(nft))`

**RecycleBin.jsx** - Drop target for burning NFTs
- Receives dropped NFT data, triggers burn modal

**BurnModal.jsx** - Confirms and executes NFT burn
- Uses `useBurn` hook to transfer NFT to dead address

**Clippy.jsx** - Animated Clippy assistant
- Shows random tips and messages

---

### MemeStudio (`components/ObjectCanvas/`)

The main Canva-style meme editor.

**MemeStudio.jsx** - Editor container
- Top bar with undo/redo, clear, export, mint buttons
- Left toolbar, canvas, properties panel layout
- Manages drawing mode, crop mode, zoom state
- Exports canvas to PNG or calls `onMint` with data URL

**ObjectCanvas.jsx** - The actual canvas renderer
- Renders objects (images, text, stickers) to HTML canvas
- Handles selection, drag, resize, rotate interactions
- Drawing layer for freehand drawing
- Crop mode with draggable edge handles
- Selection overlay with resize/rotate handles

**Key props:**
```javascript
objects           // Array of canvas objects
selectedId        // Currently selected object ID
backgroundColor   // Canvas background color
isDrawingMode     // Whether drawing tool is active
isCropMode        // Whether crop mode is active
zoom              // Zoom level (0.25 to 1.5)
```

**LeftToolbar.jsx** - Tool palette
- Upload image, add template, add text, add sticker
- Drawing tool with color picker
- Background color picker

**PropertiesPanel.jsx** - Object properties editor
- Text: content, font, size, color, stroke
- Image: preview, size, opacity, crop, rotation
- Layer order, duplicate, delete buttons

---

### useObjectCanvas Hook (`hooks/useObjectCanvas.js`)

State management for the canvas editor.

**State:**
```javascript
objects           // Array of all canvas objects
selectedId        // Currently selected object ID
backgroundColor   // Canvas background
canUndo/canRedo   // History state
```

**Object types:**
```javascript
OBJECT_TYPES = {
  IMAGE: 'image',
  TEXT: 'text',
  STICKER: 'sticker',
}
```

**Image object structure:**
```javascript
{
  id, type: 'image',
  x, y, width, height, rotation,
  src,              // Image URL or data URL
  opacity,          // 0-1
  cropTop, cropBottom, cropLeft, cropRight,  // 0-0.45 each
}
```

**Text object structure:**
```javascript
{
  id, type: 'text',
  x, y, width, height, rotation,
  text,             // Text content
  fontSize,         // In pixels
  fontFamily,       // CSS font family
  color,            // Fill color
  strokeColor,      // Outline color
  strokeWidth,      // Outline width
}
```

**Key functions:**
- `addImage(template)` - Add image from template
- `addText(text)` - Add text object (auto-sized)
- `addSticker(sticker)` - Add pixel art sticker
- `updateObject(id, updates)` - Update object properties
- `deleteSelected()` - Delete selected object
- `duplicateSelected()` - Duplicate selected object
- `bringForward(id)` / `sendBackward(id)` - Z-order
- `undo()` / `redo()` - History navigation

---

### NFT Minting (`components/Mint/`)

**MintModal.jsx** - NFT minting flow
1. Upload image to IPFS via Pinata
2. Create metadata JSON, upload to IPFS
3. Call contract's `mint(tokenURI)` function
4. Wait for transaction confirmation
5. Show success with explorer link

**useMint hook** (`hooks/useMint.js`)
- Uses wagmi's `useWriteContract` and `useWaitForTransactionReceipt`
- Calls TrashArt contract's mint function

---

### NFT Management

**useOwnedNFTs hook** (`hooks/useOwnedNFTs.js`)
- Fetches user's NFTs from Hemi explorer API
- Returns: `{ nfts, isLoading, error, refetch }`

**NFT structure:**
```javascript
{
  tokenId,
  contractAddress,
  name,
  description,
  image,        // IPFS gateway URL
  metadata,
}
```

**useBurn hook** (`hooks/useBurn.js`)
- Burns NFT by transferring to dead address `0x...dEaD`
- Uses ERC721 `transferFrom(from, to, tokenId)`

---

### Template System

**Sources:**

1. **Imgflip API** (`hooks/useImgflip.js`)
   - Endpoint: `https://api.imgflip.com/get_memes`
   - Returns top 50 meme templates

2. **Reddit/Meme API** (`hooks/useRedditMemes.js`)
   - Primary: `https://meme-api.com/gimme/{subreddit}/10`
   - Fallback: Direct Reddit API
   - Fallback: 30 hardcoded imgflip URLs
   - Filters: No GIFs, videos, or NSFW

3. **Local templates** (`public/templates/`)
   - Custom meme images

**MemeTemplatePicker** (`components/Editor/MemeTemplatePicker.jsx`)
- Categorized template browser
- Tabs for different sources

---

## Configuration

**constants.js:**
```javascript
CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
CANVAS_SIZE = 320        // For pixel art mode
CANVAS_SCALE = 1.5
ALL_COLORS = [...]       // Color palette
```

**chains.js:**
```javascript
hemiSepolia = {
  id: 743111,
  name: 'Hemi Sepolia',
  rpcUrls: ['https://testnet.rpc.hemi.network/rpc'],
  blockExplorers: ['https://testnet.explorer.hemi.xyz'],
}
```

**wagmi.js:**
- RainbowKit config
- Wallet connectors (MetaMask, WalletConnect, etc.)

---

## IPFS Integration (`utils/ipfs.js`, `hooks/useIPFS.js`)

**uploadToIPFS(file):**
1. Creates FormData with file
2. POSTs to Pinata API with JWT auth
3. Returns IPFS hash (CID)

**uploadJSONToIPFS(json):**
- Same flow but for JSON metadata

**ipfsToGateway(ipfsUrl):**
- Converts `ipfs://` URL to HTTP gateway URL
- Uses Pinata gateway or public fallbacks

---

## Contract Integration

**TrashArt.sol** (ERC721)
- `mint(string tokenURI)` - Mint new NFT with metadata URI
- Standard ERC721 functions

**ABI location:** `contracts/abi/TrashArt.json`

---

## Key Features

### 1. Canva-Style Editor
- Drag, resize, rotate any object
- Multi-layer support with z-ordering
- Crop images with edge handles
- Opacity control for images
- Text with customizable font, size, colors, stroke

### 2. Windows XP Theme
- Authentic Windows XP desktop experience
- Draggable, resizable windows
- Taskbar with window management
- Clippy assistant

### 3. NFT Minting
- One-click mint to Hemi blockchain
- IPFS storage via Pinata
- View minted NFTs in "My Computer"

### 4. NFT Burning
- Drag NFT icon to Recycle Bin
- Confirmation modal
- Transfers to burn address

### 5. Template Library
- Live templates from Imgflip API
- Fresh memes from Reddit
- Local custom templates

---

## State Flow

```
User Action → Component → Hook → State Update → Re-render

Example (Add Text):
1. User clicks "Add Text" in LeftToolbar
2. LeftToolbar calls onAddText()
3. MemeStudio passes to useObjectCanvas.addText()
4. addText() creates text object, updates objects array
5. ObjectCanvas re-renders with new text
6. Text is auto-selected for editing
```

---

## Canvas Rendering

ObjectCanvas renders objects in z-order (first = bottom):

```javascript
objects.forEach(obj => {
  ctx.save()
  // Apply rotation around center
  ctx.translate(cx, cy)
  ctx.rotate(rotation * Math.PI / 180)
  ctx.translate(-cx, -cy)

  if (obj.type === 'image') {
    // Apply opacity, crop via clipping, draw image
  } else if (obj.type === 'text') {
    // Set font, draw stroke, draw fill
  } else if (obj.type === 'sticker') {
    // Draw pixel grid
  }

  ctx.restore()
})
```

---

## Export/Mint Flow

```javascript
// Create offscreen canvas at full resolution
const canvas = document.createElement('canvas')
canvas.width = CANVAS_WIDTH   // 1080
canvas.height = CANVAS_HEIGHT // 1080

// Draw background
ctx.fillStyle = backgroundColor
ctx.fillRect(0, 0, width, height)

// Draw all objects (same as display rendering)
objects.forEach(obj => { /* render */ })

// Draw drawing layer on top
if (drawingLayerRef.current) {
  ctx.drawImage(drawingCanvas, 0, 0)
}

// Export
const dataUrl = canvas.toDataURL('image/png')
// For download: create link and click
// For mint: pass to onMint callback
```

---

## Environment Variables

```bash
VITE_CONTRACT_ADDRESS=0x...    # TrashArt contract
VITE_PINATA_JWT=...            # Pinata API key
VITE_PINATA_GATEWAY=...        # Pinata gateway domain
VITE_WALLETCONNECT_PROJECT_ID= # Optional
```

---

## Common Patterns

### Adding a new tool:
1. Add button to LeftToolbar.jsx
2. Add handler function
3. Connect to useObjectCanvas if needed
4. Add properties UI in PropertiesPanel.jsx

### Adding a new object type:
1. Add to OBJECT_TYPES in useObjectCanvas.js
2. Create factory function (createXxxObject)
3. Add render logic in ObjectCanvas.jsx
4. Add hit test logic if needed
5. Add properties panel section

### Adding API integration:
1. Create hook in hooks/ folder
2. Handle loading, error, data states
3. Use in component with destructuring
4. Add fallback data for reliability
