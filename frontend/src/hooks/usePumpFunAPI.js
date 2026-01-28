import { useState, useCallback, useRef } from 'react'

/**
 * Pump.fun API Integration Hook
 * Fetches token data directly from pump.fun's frontend API
 * Uses a Vite proxy in development to avoid CORS issues
 */

// Use proxy in dev, direct URL in production
const PUMP_API_V3 = import.meta.env.DEV
  ? '/api/pump'
  : 'https://frontend-api-v3.pump.fun'

// Request headers for pump.fun API
const getHeaders = () => ({
  'Accept': 'application/json',
})

// Cache for API responses (5 minute TTL)
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function getCached(key) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Fetch a single token by mint address
 */
export async function fetchTokenByMint(mintAddress) {
  const cacheKey = `token:${mintAddress}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(
      `${PUMP_API_V3}/coins/${mintAddress}`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch token: ${response.status}`)
    }

    const data = await response.json()
    const normalized = normalizeToken(data)
    setCache(cacheKey, normalized)
    return normalized
  } catch (err) {
    console.warn('[PumpFun] fetchTokenByMint error:', err)
    return null
  }
}

/**
 * Fetch currently live tokens (still on bonding curve)
 */
export async function fetchCurrentlyLive(limit = 50, offset = 0, includeNsfw = false) {
  const cacheKey = `live:${limit}:${offset}:${includeNsfw}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(
      `${PUMP_API_V3}/coins/currently-live?limit=${limit}&offset=${offset}&includeNsfw=${includeNsfw}`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch live tokens: ${response.status}`)
    }

    const data = await response.json()
    const normalized = (data || []).map(normalizeToken).filter(Boolean)
    setCache(cacheKey, normalized)
    return normalized
  } catch (err) {
    console.warn('[PumpFun] fetchCurrentlyLive error:', err)
    return []
  }
}

/**
 * Fetch top performing tokens (top runners)
 * Note: This endpoint returns items wrapped in { coin: {...}, description: "..." }
 */
export async function fetchTopRunners(limit = 50, offset = 0) {
  const cacheKey = `runners:${limit}:${offset}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(
      `${PUMP_API_V3}/coins/top-runners?limit=${limit}&offset=${offset}`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      // Fallback to currently-live sorted by market cap
      console.warn('[PumpFun] top-runners failed, falling back to currently-live')
      return fetchCurrentlyLive(limit, offset)
    }

    const data = await response.json()
    // Top runners wraps each token in { coin: {...} }
    const normalized = (data || [])
      .map(item => normalizeToken(item.coin || item))
      .filter(Boolean)
    setCache(cacheKey, normalized)
    return normalized
  } catch (err) {
    console.warn('[PumpFun] fetchTopRunners error:', err)
    return []
  }
}

/**
 * Fetch king of the hill (highest market cap on bonding curve)
 */
export async function fetchKingOfTheHill() {
  const cacheKey = 'koth'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(
      `${PUMP_API_V3}/coins/king-of-the-hill`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      console.warn('[PumpFun] KOTH endpoint failed:', response.status)
      return null
    }

    const data = await response.json()
    // KOTH might also be wrapped
    const normalized = normalizeToken(data.coin || data)
    setCache(cacheKey, normalized)
    return normalized
  } catch (err) {
    console.warn('[PumpFun] fetchKingOfTheHill error:', err)
    return null
  }
}

/**
 * Search tokens by name, symbol, or mint
 */
export async function searchTokens(query, limit = 20) {
  if (!query || query.trim().length < 2) return []

  const cacheKey = `search:${query}:${limit}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    // Check if it's a mint address (32-44 chars base58)
    const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query.trim())

    if (isAddress) {
      // Direct lookup
      const token = await fetchTokenByMint(query.trim())
      return token ? [token] : []
    }

    // Search by name/symbol - try the search endpoint
    const response = await fetch(
      `${PUMP_API_V3}/coins/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      console.warn('[PumpFun] Search endpoint failed:', response.status)
      return []
    }

    const data = await response.json()
    const normalized = (data || [])
      .map(item => normalizeToken(item.coin || item))
      .filter(Boolean)
    setCache(cacheKey, normalized)
    return normalized
  } catch (err) {
    console.warn('[PumpFun] searchTokens error:', err)
    return []
  }
}

/**
 * Fetch tokens near graduation (approaching bonding curve completion)
 * Lower threshold since most tokens are under 50% progress
 */
export async function fetchNearGraduation(minProgress = 30) {
  const cacheKey = `graduating:${minProgress}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    // Fetch a larger batch and filter for incomplete tokens with highest progress
    const tokens = await fetchCurrentlyLive(200, 0)

    const graduating = tokens
      .filter(t => !t.complete && t.bonding_progress >= minProgress)
      .sort((a, b) => b.bonding_progress - a.bonding_progress)

    setCache(cacheKey, graduating)
    return graduating
  } catch (err) {
    console.warn('[PumpFun] fetchNearGraduation error:', err)
    return []
  }
}

/**
 * Fetch graduated tokens (completed bonding curve, now on Raydium/PumpSwap)
 */
export async function fetchGraduated(limit = 50, offset = 0) {
  const cacheKey = `graduated:${limit}:${offset}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    // Get currently-live tokens and filter for complete ones
    // The currently-live endpoint includes both complete and incomplete tokens
    const liveTokens = await fetchCurrentlyLive(200, 0)
    const graduated = liveTokens
      .filter(t => t.complete)
      .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
      .slice(offset, offset + limit)

    setCache(cacheKey, graduated)
    return graduated
  } catch (err) {
    console.warn('[PumpFun] fetchGraduated error:', err)
    return []
  }
}

/**
 * Normalize pump.fun token response to our standard format
 * Handles both direct token objects and wrapped { coin: {...} } format
 */
function normalizeToken(token) {
  if (!token) return null
  if (!token.mint) return null

  // Calculate bonding progress
  // Pump.fun graduates at ~$69k USD market cap (around 400 SOL at typical prices)
  // The bonding curve completes when virtual_sol_reserves reaches ~115 SOL
  const GRADUATION_THRESHOLD_USD = 69000
  const usdMarketCap = token.usd_market_cap || 0
  const isComplete = token.complete === true

  let bondingProgress = 0
  if (isComplete) {
    bondingProgress = 100
  } else if (usdMarketCap > 0) {
    bondingProgress = Math.min(99, Math.round((usdMarketCap / GRADUATION_THRESHOLD_USD) * 100))
  }

  return {
    // Core identity
    mint: token.mint,
    name: token.name || 'Unknown',
    symbol: token.symbol || '???',
    description: token.description || '',
    image_uri: token.image_uri || null,

    // Market data - use usd_market_cap for USD value
    price: token.price || 0,
    market_cap: token.usd_market_cap || token.market_cap || 0,
    usd_market_cap: token.usd_market_cap || 0,
    volume24h: token.volume_24h || 0,
    liquidity: token.liquidity || 0,

    // Price changes (pump.fun may not have all timeframes)
    priceChange5m: token.price_change_5m || 0,
    priceChange1h: token.price_change_1h || 0,
    priceChange6h: token.price_change_6h || 0,
    priceChange24h: token.price_change_24h || 0,

    // Bonding curve status
    bonding_progress: bondingProgress,
    complete: isComplete,
    raydium_pool: token.raydium_pool || token.pump_swap_pool || null,

    // Metadata
    created_timestamp: token.created_timestamp || Date.now(),
    creator: token.creator || null,

    // Social links
    twitter: token.twitter || null,
    telegram: token.telegram || null,
    website: token.website || null,

    // ATH data
    ath_market_cap: token.ath_market_cap || 0,

    // Source tracking
    source: 'pumpfun',
  }
}

/**
 * React hook for pump.fun API
 */
export default function usePumpFunAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const fetchWithState = useCallback(async (fetchFn, ...args) => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn(...args)
      setIsLoading(false)
      return result
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setIsLoading(false)
      }
      return null
    }
  }, [])

  return {
    isLoading,
    error,

    // Wrapped fetchers with loading state
    getTokenByMint: useCallback(
      (mint) => fetchWithState(fetchTokenByMint, mint),
      [fetchWithState]
    ),
    getCurrentlyLive: useCallback(
      (limit, offset) => fetchWithState(fetchCurrentlyLive, limit, offset),
      [fetchWithState]
    ),
    getTopRunners: useCallback(
      (limit, offset) => fetchWithState(fetchTopRunners, limit, offset),
      [fetchWithState]
    ),
    getKingOfTheHill: useCallback(
      () => fetchWithState(fetchKingOfTheHill),
      [fetchWithState]
    ),
    search: useCallback(
      (query, limit) => fetchWithState(searchTokens, query, limit),
      [fetchWithState]
    ),
    getNearGraduation: useCallback(
      (minProgress) => fetchWithState(fetchNearGraduation, minProgress),
      [fetchWithState]
    ),
    getGraduated: useCallback(
      (limit, offset) => fetchWithState(fetchGraduated, limit, offset),
      [fetchWithState]
    ),

    // Direct fetchers (no loading state management)
    fetchTokenByMint,
    fetchCurrentlyLive,
    fetchTopRunners,
    fetchKingOfTheHill,
    searchTokens,
    fetchNearGraduation,
    fetchGraduated,
  }
}
