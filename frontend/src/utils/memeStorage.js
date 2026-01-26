/**
 * localStorage utilities for coin meme storage
 * Stores community memes associated with pump.fun coins
 */

const STORAGE_KEY = 'shitpost_coin_memes'
const STORAGE_VERSION = 1

// Generate UUID v4
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Get stored data with version check
function getStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: STORAGE_VERSION, memes: [], userVotes: [] }
    }

    const data = JSON.parse(raw)

    // Version migration if needed
    if (data.version !== STORAGE_VERSION) {
      // For now, just reset on version mismatch
      return { version: STORAGE_VERSION, memes: [], userVotes: [] }
    }

    return data
  } catch (err) {
    console.error('Failed to read meme storage:', err)
    return { version: STORAGE_VERSION, memes: [], userVotes: [] }
  }
}

// Save storage
function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    console.error('Failed to save meme storage:', err)
    return false
  }
}

/**
 * Get all memes for a specific coin
 * @param {string} coinMint - The coin's mint address
 * @returns {Array} Memes for the coin, sorted by upvotes descending
 */
export function getMemesByCoin(coinMint) {
  const storage = getStorage()
  return storage.memes
    .filter(meme => meme.coinMint === coinMint)
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
}

/**
 * Get all memes (for gallery view)
 * @returns {Array} All memes, sorted by creation date descending
 */
export function getAllMemes() {
  const storage = getStorage()
  return storage.memes.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  )
}

/**
 * Add a new meme
 * @param {Object} meme - Meme data
 * @param {string} meme.coinMint - The coin's mint address
 * @param {string} meme.imageUrl - Base64 data URL or IPFS URL
 * @param {string} meme.creatorWallet - Creator's wallet address
 * @param {string} [meme.coinSymbol] - Coin symbol for display
 * @param {string} [meme.coinName] - Coin name for display
 * @returns {Object|null} The created meme or null on failure
 */
export function addMeme(meme) {
  const storage = getStorage()

  const newMeme = {
    id: generateId(),
    coinMint: meme.coinMint,
    imageUrl: meme.imageUrl,
    creatorWallet: meme.creatorWallet || 'anonymous',
    coinSymbol: meme.coinSymbol || '',
    coinName: meme.coinName || '',
    upvotes: 0,
    createdAt: new Date().toISOString(),
  }

  storage.memes.push(newMeme)

  if (saveStorage(storage)) {
    return newMeme
  }
  return null
}

/**
 * Upvote a meme
 * @param {string} memeId - The meme's ID
 * @returns {Object|null} Updated meme or null if already voted or not found
 */
export function upvoteMeme(memeId) {
  const storage = getStorage()

  // Check if user already voted
  if (storage.userVotes.includes(memeId)) {
    return null
  }

  const meme = storage.memes.find(m => m.id === memeId)
  if (!meme) {
    return null
  }

  meme.upvotes = (meme.upvotes || 0) + 1
  storage.userVotes.push(memeId)

  if (saveStorage(storage)) {
    return meme
  }
  return null
}

/**
 * Remove upvote from a meme
 * @param {string} memeId - The meme's ID
 * @returns {Object|null} Updated meme or null if not voted or not found
 */
export function removeUpvote(memeId) {
  const storage = getStorage()

  const voteIndex = storage.userVotes.indexOf(memeId)
  if (voteIndex === -1) {
    return null
  }

  const meme = storage.memes.find(m => m.id === memeId)
  if (!meme) {
    return null
  }

  meme.upvotes = Math.max(0, (meme.upvotes || 0) - 1)
  storage.userVotes.splice(voteIndex, 1)

  if (saveStorage(storage)) {
    return meme
  }
  return null
}

/**
 * Check if user has voted for a meme
 * @param {string} memeId - The meme's ID
 * @returns {boolean}
 */
export function hasUserVoted(memeId) {
  const storage = getStorage()
  return storage.userVotes.includes(memeId)
}

/**
 * Delete a meme (by creator)
 * @param {string} memeId - The meme's ID
 * @param {string} walletAddress - Requester's wallet address
 * @returns {boolean} Success
 */
export function deleteMeme(memeId, walletAddress) {
  const storage = getStorage()

  const memeIndex = storage.memes.findIndex(m => m.id === memeId)
  if (memeIndex === -1) {
    return false
  }

  const meme = storage.memes[memeIndex]

  // Only allow creator to delete (or anonymous memes by anyone)
  if (meme.creatorWallet !== 'anonymous' && meme.creatorWallet !== walletAddress) {
    return false
  }

  storage.memes.splice(memeIndex, 1)

  // Also remove from user votes
  const voteIndex = storage.userVotes.indexOf(memeId)
  if (voteIndex !== -1) {
    storage.userVotes.splice(voteIndex, 1)
  }

  return saveStorage(storage)
}

/**
 * Get meme count for a coin
 * @param {string} coinMint - The coin's mint address
 * @returns {number}
 */
export function getMemeCount(coinMint) {
  const storage = getStorage()
  return storage.memes.filter(m => m.coinMint === coinMint).length
}

/**
 * Get total meme count
 * @returns {number}
 */
export function getTotalMemeCount() {
  const storage = getStorage()
  return storage.memes.length
}
