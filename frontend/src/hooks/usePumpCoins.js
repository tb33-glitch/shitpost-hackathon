import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchCurrentlyLive,
  fetchTopRunners,
  fetchNearGraduation,
  fetchGraduated,
  searchTokens as pumpSearch,
  fetchKingOfTheHill,
  fetchTokenByMint,
} from './usePumpFunAPI'
import { SHITPOST_TOKEN_MINT } from '../config/solana'

/**
 * Unified hook for fetching coins from pump.fun + DexScreener
 * Supports multiple data sources and filter modes
 */

// Data source tabs
export const DATA_SOURCES = {
  TRENDING: 'trending',      // Top runners from pump.fun
  NEW: 'new',                // Recently created on pump.fun
  GRADUATING: 'graduating',  // Near bonding curve completion
  GRADUATED: 'graduated',    // Completed, on Raydium
  BOOSTED: 'boosted',        // DexScreener boosted tokens
  KOTH: 'koth',              // King of the Hill
}

// Sort options within each tab
export const SORT_OPTIONS = {
  MARKET_CAP: 'marketCap',
  VOLUME: 'volume',
  GAINERS: 'gainers',
  LOSERS: 'losers',
  NEWEST: 'newest',
  BONDING: 'bonding',        // By bonding curve progress
  LIQUIDITY: 'liquidity',
}

// Pinned coins that always appear first
// For Solana pump.fun tokens, just provide the mint address
const PINNED_SOLANA_TOKENS = [
  SHITPOST_TOKEN_MINT, // $SHITPOST token
]

// Pinned coins for EVM chains (fetched from GeckoTerminal)
const PINNED_COINS = []

// Build DexScreener image URL
function getDexScreenerImage(tokenAddress, chain = 'solana') {
  return `https://dd.dexscreener.com/ds-data/tokens/${chain}/${tokenAddress}.png`
}

// Fetch pinned coin data from GeckoTerminal
async function fetchPinnedCoinData(pinnedCoin) {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/search/pools?query=${pinnedCoin.address}`
    )
    if (!response.ok) return null

    const data = await response.json()
    const poolData = data.data?.find(p =>
      p.id?.startsWith(`${pinnedCoin.chain}_`) &&
      p.attributes?.name
    )
    if (!poolData) return null

    const pool = poolData.attributes
    const baseToken = pool.name?.split(' / ')[0] || 'Unknown'

    return {
      mint: pinnedCoin.address,
      name: baseToken,
      symbol: baseToken,
      description: '',
      image_uri: pinnedCoin.imageUrl || getDexScreenerImage(pinnedCoin.address, pinnedCoin.chain),
      twitter: null,
      telegram: null,
      website: null,
      price: parseFloat(pool.base_token_price_usd) || 0,
      market_cap: parseFloat(pool.fdv_usd) || 0,
      volume24h: parseFloat(pool.volume_usd?.h24) || 0,
      liquidity: parseFloat(pool.reserve_in_usd) || 0,
      priceChange5m: parseFloat(pool.price_change_percentage?.m5) || 0,
      priceChange1h: parseFloat(pool.price_change_percentage?.h1) || 0,
      priceChange6h: parseFloat(pool.price_change_percentage?.h6) || 0,
      priceChange24h: parseFloat(pool.price_change_percentage?.h24) || 0,
      boostAmount: Infinity,
      created_timestamp: new Date(pool.pool_created_at).getTime() || Date.now(),
      dexId: 'uniswap',
      pairAddress: pool.address,
      chain: pinnedCoin.chain,
      isPinned: true,
      source: 'geckoterminal',
    }
  } catch (err) {
    console.warn('Failed to fetch pinned coin data:', err)
    return null
  }
}

// Fetch market data from DexScreener for enrichment
async function fetchDexScreenerData(tokenAddresses) {
  try {
    const chunks = []
    for (let i = 0; i < tokenAddresses.length; i += 30) {
      chunks.push(tokenAddresses.slice(i, i + 30))
    }

    const allPairs = []
    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.dexscreener.com/tokens/v1/solana/${chunk.join(',')}`
      )
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          allPairs.push(...data)
        }
      }
    }

    // Map to best pair per token
    const tokenDataMap = {}
    allPairs.forEach(pair => {
      const addr = pair.baseToken?.address
      if (!addr) return
      if (!tokenDataMap[addr] || (pair.liquidity?.usd || 0) > (tokenDataMap[addr].liquidity?.usd || 0)) {
        tokenDataMap[addr] = pair
      }
    })

    return tokenDataMap
  } catch (err) {
    console.warn('Failed to fetch DexScreener data:', err)
    return {}
  }
}

// Fetch boosted tokens from DexScreener
async function fetchDexScreenerBoosted() {
  try {
    const boostResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1')
    if (!boostResponse.ok) return { tokens: [], boostAmounts: {} }

    const boostData = await boostResponse.json()
    const tokens = (boostData || [])
      .filter(token => token.chainId === 'solana')
      .slice(0, 100)

    const boostAmounts = {}
    tokens.forEach(token => {
      boostAmounts[token.tokenAddress] = token.totalAmount || 0
    })

    return { tokens, boostAmounts }
  } catch (err) {
    console.warn('Failed to fetch boosted tokens:', err)
    return { tokens: [], boostAmounts: {} }
  }
}

// Enrich pump.fun data with DexScreener market data
async function enrichWithDexScreener(pumpCoins) {
  if (!pumpCoins || pumpCoins.length === 0) return pumpCoins

  const mints = pumpCoins.map(c => c.mint).filter(Boolean)
  const dexData = await fetchDexScreenerData(mints)

  return pumpCoins.map(coin => {
    const dex = dexData[coin.mint]
    if (!dex) return coin

    // Merge DexScreener data (prefer DexScreener for price data if available)
    return {
      ...coin,
      // Use DexScreener price data if available and seems more accurate
      price: dex.priceUsd ? parseFloat(dex.priceUsd) : coin.price,
      market_cap: dex.marketCap || dex.fdv || coin.market_cap,
      volume24h: dex.volume?.h24 || coin.volume24h,
      liquidity: dex.liquidity?.usd || coin.liquidity,
      // Price changes from DexScreener
      priceChange5m: dex.priceChange?.m5 ?? coin.priceChange5m,
      priceChange1h: dex.priceChange?.h1 ?? coin.priceChange1h,
      priceChange6h: dex.priceChange?.h6 ?? coin.priceChange6h,
      priceChange24h: dex.priceChange?.h24 ?? coin.priceChange24h,
      // Additional DexScreener data
      dexId: dex.dexId || coin.dexId,
      pairAddress: dex.pairAddress || coin.pairAddress,
      // Chart embed URL
      chart_url: `https://dexscreener.com/solana/${coin.mint}?embed=1`,
    }
  })
}

export default function usePumpCoins(dataSource = DATA_SOURCES.TRENDING, sortOption = SORT_OPTIONS.MARKET_CAP) {
  const [coins, setCoins] = useState([])
  const [kingOfHill, setKingOfHill] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const sourceRef = useRef(dataSource)
  const sortRef = useRef(sortOption)

  useEffect(() => {
    sourceRef.current = dataSource
    sortRef.current = sortOption
  }, [dataSource, sortOption])

  // Fetch coins based on data source
  const fetchCoins = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch pinned Solana tokens from pump.fun and enrich with DexScreener
      let pinnedSolanaData = await Promise.all(
        PINNED_SOLANA_TOKENS.map(async (mint) => {
          const token = await fetchTokenByMint(mint)
          if (token) {
            token.isPinned = true
          }
          return token
        })
      )
      pinnedSolanaData = pinnedSolanaData.filter(Boolean)
      if (pinnedSolanaData.length > 0) {
        pinnedSolanaData = await enrichWithDexScreener(pinnedSolanaData)
      }
      const validPinnedSolana = pinnedSolanaData

      // Fetch pinned EVM coins from GeckoTerminal
      const pinnedCoinsData = await Promise.all(
        PINNED_COINS.map(coin => fetchPinnedCoinData(coin))
      )
      const validPinnedCoins = [...validPinnedSolana, ...pinnedCoinsData.filter(Boolean)]

      let fetchedCoins = []

      switch (dataSource) {
        case DATA_SOURCES.TRENDING:
          // Fetch top runners (curated, ~5 tokens) + currently live tokens
          // Combine for a fuller list, with top runners first
          const [topRunners, liveTokens] = await Promise.all([
            fetchTopRunners(10, 0),
            fetchCurrentlyLive(100, 0)
          ])

          // Merge: top runners first, then live tokens sorted by market cap (deduped)
          const topMints = new Set(topRunners.map(t => t.mint))
          const additionalTokens = liveTokens
            .filter(t => !topMints.has(t.mint))
            .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))

          fetchedCoins = [...topRunners, ...additionalTokens]
          fetchedCoins = await enrichWithDexScreener(fetchedCoins)
          break

        case DATA_SOURCES.NEW:
          // Fetch recently created tokens
          fetchedCoins = await fetchCurrentlyLive(100, 0)
          // Sort by creation time (newest first)
          fetchedCoins.sort((a, b) => b.created_timestamp - a.created_timestamp)
          fetchedCoins = await enrichWithDexScreener(fetchedCoins)
          break

        case DATA_SOURCES.GRADUATING:
          // Fetch tokens approaching graduation (sorted by progress)
          // Using lower threshold since most tokens are under 50%
          fetchedCoins = await fetchNearGraduation(20)
          fetchedCoins = await enrichWithDexScreener(fetchedCoins)
          break

        case DATA_SOURCES.GRADUATED:
          // Fetch graduated tokens
          fetchedCoins = await fetchGraduated(100, 0)
          fetchedCoins = await enrichWithDexScreener(fetchedCoins)
          break

        case DATA_SOURCES.BOOSTED:
          // Fetch DexScreener boosted tokens (original behavior)
          const { tokens: boostedTokens, boostAmounts } = await fetchDexScreenerBoosted()
          const tokenAddresses = boostedTokens.map(t => t.tokenAddress)

          if (tokenAddresses.length > 0) {
            const marketData = await fetchDexScreenerData(tokenAddresses)

            fetchedCoins = boostedTokens.map(token => {
              const pairData = marketData[token.tokenAddress]
              const baseToken = pairData?.baseToken || {}

              return {
                mint: token.tokenAddress,
                name: baseToken.name || token.description?.split(' ').slice(0, 3).join(' ') || 'Unknown',
                symbol: baseToken.symbol || token.tokenAddress?.slice(-4)?.toUpperCase() || '???',
                description: token.description || '',
                image_uri: getDexScreenerImage(token.tokenAddress),
                twitter: token.links?.find(l => l.type === 'twitter')?.url,
                telegram: token.links?.find(l => l.type === 'telegram')?.url,
                website: token.links?.find(l => l.url && !l.type)?.url,
                price: pairData?.priceUsd ? parseFloat(pairData.priceUsd) : 0,
                market_cap: pairData?.marketCap || pairData?.fdv || 0,
                volume24h: pairData?.volume?.h24 || 0,
                liquidity: pairData?.liquidity?.usd || 0,
                priceChange5m: pairData?.priceChange?.m5 || 0,
                priceChange1h: pairData?.priceChange?.h1 || 0,
                priceChange6h: pairData?.priceChange?.h6 || 0,
                priceChange24h: pairData?.priceChange?.h24 || 0,
                boostAmount: boostAmounts[token.tokenAddress] || 0,
                created_timestamp: pairData?.pairCreatedAt || Date.now(),
                dexId: pairData?.dexId || 'unknown',
                pairAddress: pairData?.pairAddress || '',
                source: 'dexscreener',
              }
            })
          }
          break

        case DATA_SOURCES.KOTH:
          // Fetch King of the Hill
          const koth = await fetchKingOfTheHill()
          if (koth) {
            setKingOfHill(koth)
            // Also show other top tokens
            fetchedCoins = await fetchTopRunners(50, 0)
            fetchedCoins = await enrichWithDexScreener(fetchedCoins)
          }
          break

        default:
          fetchedCoins = await fetchTopRunners(100, 0)
          fetchedCoins = await enrichWithDexScreener(fetchedCoins)
      }

      // Remove duplicates (pinned tokens might also appear in fetched results)
      const pinnedMints = new Set(validPinnedCoins.map(c => c.mint))
      const dedupedFetched = fetchedCoins.filter(c => !pinnedMints.has(c.mint))
      const allCoins = [...validPinnedCoins, ...dedupedFetched]
      setCoins(allCoins)
      setIsLoading(false)
    } catch (err) {
      console.warn('Failed to fetch coins:', err)
      setCoins([])
      setIsLoading(false)
      setError('Failed to load coins')
    }
  }, [dataSource])

  // Initial fetch and refetch on data source change
  useEffect(() => {
    fetchCoins()
  }, [fetchCoins])

  // Sort coins based on sort option
  const sortedCoins = useCallback(() => {
    const pinned = coins.filter(c => c.isPinned)
    const regular = [...coins.filter(c => !c.isPinned)]

    switch (sortOption) {
      case SORT_OPTIONS.MARKET_CAP:
        regular.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
        break
      case SORT_OPTIONS.VOLUME:
        regular.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        break
      case SORT_OPTIONS.GAINERS:
        regular.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
        break
      case SORT_OPTIONS.LOSERS:
        regular.sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0))
        break
      case SORT_OPTIONS.NEWEST:
        regular.sort((a, b) => (b.created_timestamp || 0) - (a.created_timestamp || 0))
        break
      case SORT_OPTIONS.BONDING:
        regular.sort((a, b) => (b.bonding_progress || 0) - (a.bonding_progress || 0))
        break
      case SORT_OPTIONS.LIQUIDITY:
        regular.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
        break
      default:
        break
    }

    return [...pinned, ...regular]
  }, [coins, sortOption])

  // Search coins (uses pump.fun search + local filter)
  const searchCoins = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      return sortedCoins()
    }

    const lowerQuery = query.toLowerCase().trim()

    // Check if it's a mint address
    const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(lowerQuery)

    if (isAddress) {
      // Search pump.fun by mint
      const results = await pumpSearch(lowerQuery)
      if (results && results.length > 0) {
        return enrichWithDexScreener(results)
      }
    }

    // Try pump.fun search first
    const pumpResults = await pumpSearch(query, 30)
    if (pumpResults && pumpResults.length > 0) {
      return enrichWithDexScreener(pumpResults)
    }

    // Fallback to local filter
    return coins.filter(coin =>
      coin.name?.toLowerCase().includes(lowerQuery) ||
      coin.symbol?.toLowerCase().includes(lowerQuery) ||
      coin.mint?.toLowerCase().includes(lowerQuery)
    )
  }, [coins, sortedCoins])

  // Refetch
  const refetch = useCallback(() => {
    fetchCoins()
  }, [fetchCoins])

  return {
    coins: sortedCoins(),
    allCoins: coins,
    kingOfHill,
    isLoading,
    error,
    isConnected: true,
    refetch,
    searchCoins,
    dataSource,
    sortOption,
  }
}
