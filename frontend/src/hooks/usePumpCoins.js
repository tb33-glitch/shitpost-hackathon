import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook for fetching Solana meme coins from DexScreener
 * Gets boosted tokens and fetches real market data
 */

// Pinned coins that always appear first (fetched from GeckoTerminal for EVM chains)
const PINNED_COINS = [
  {
    address: '0x31794fbb311adbdd7704ebdc77de9e872e21f90f',
    chain: 'eth',
    imageUrl: '/images/444str.svg',
  },
]

// Build DexScreener image URL
function getDexScreenerImage(tokenAddress, chain = 'solana') {
  return `https://dd.dexscreener.com/ds-data/tokens/${chain}/${tokenAddress}.png`
}

// Fetch pinned coin data from GeckoTerminal using search endpoint
async function fetchPinnedCoinData(pinnedCoin) {
  try {
    // Use search endpoint which works better for Uniswap V4 pools
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/search/pools?query=${pinnedCoin.address}`
    )
    if (!response.ok) return null

    const data = await response.json()
    // Find the pool on the correct network
    const poolData = data.data?.find(p =>
      p.id?.startsWith(`${pinnedCoin.chain}_`) &&
      p.attributes?.name
    )
    if (!poolData) return null

    const pool = poolData.attributes

    // Extract base token info
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
      // Market data from GeckoTerminal
      price: parseFloat(pool.base_token_price_usd) || 0,
      market_cap: parseFloat(pool.fdv_usd) || 0,
      volume24h: parseFloat(pool.volume_usd?.h24) || 0,
      liquidity: parseFloat(pool.reserve_in_usd) || 0,
      // Price changes
      priceChange5m: parseFloat(pool.price_change_percentage?.m5) || 0,
      priceChange1h: parseFloat(pool.price_change_percentage?.h1) || 0,
      priceChange6h: parseFloat(pool.price_change_percentage?.h6) || 0,
      priceChange24h: parseFloat(pool.price_change_percentage?.h24) || 0,
      // Metadata
      boostAmount: Infinity, // Always sort first
      created_timestamp: new Date(pool.pool_created_at).getTime() || Date.now(),
      dexId: 'uniswap',
      pairAddress: pool.address,
      chain: pinnedCoin.chain,
      isPinned: true,
    }
  } catch (err) {
    console.warn('Failed to fetch pinned coin data:', err)
    return null
  }
}

export default function usePumpCoins(filter = 'marketCap') {
  const [coins, setCoins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const filterRef = useRef(filter)

  // Update filter ref when filter changes
  useEffect(() => {
    filterRef.current = filter
  }, [filter])

  // Fetch market data for tokens from DexScreener
  const fetchMarketData = useCallback(async (tokenAddresses) => {
    try {
      // DexScreener allows up to 30 addresses per request
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

      return allPairs
    } catch (err) {
      console.warn('Failed to fetch market data:', err)
      return []
    }
  }, [])

  // Fetch coins from DexScreener
  const fetchCoins = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 0: Fetch pinned coins first (always shown at top)
      const pinnedCoinsData = await Promise.all(
        PINNED_COINS.map(coin => fetchPinnedCoinData(coin))
      )
      const validPinnedCoins = pinnedCoinsData.filter(Boolean)

      // Step 1: Get boosted/trending tokens
      const boostResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1')
      let boostedTokens = []
      let boostAmounts = {}

      if (boostResponse.ok) {
        const boostData = await boostResponse.json()
        boostedTokens = (boostData || [])
          .filter(token => token.chainId === 'solana')
          .slice(0, 100)

        // Store boost amounts for sorting
        boostedTokens.forEach(token => {
          boostAmounts[token.tokenAddress] = token.totalAmount || 0
        })
      }

      // Step 2: Get token addresses
      const tokenAddresses = boostedTokens.map(t => t.tokenAddress)

      if (tokenAddresses.length === 0) {
        setCoins([])
        setIsLoading(false)
        setError('No tokens found')
        return
      }

      // Step 3: Fetch real market data for these tokens
      const marketData = await fetchMarketData(tokenAddresses)

      // Step 4: Create a map of token address to best pair data
      const tokenDataMap = {}
      marketData.forEach(pair => {
        const addr = pair.baseToken?.address
        if (!addr) return

        // Keep the pair with highest liquidity for each token
        if (!tokenDataMap[addr] || (pair.liquidity?.usd || 0) > (tokenDataMap[addr].liquidity?.usd || 0)) {
          tokenDataMap[addr] = pair
        }
      })

      // Step 5: Map to our coin format with real data
      const mappedCoins = boostedTokens.map(token => {
        const pairData = tokenDataMap[token.tokenAddress]
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
          // Real market data
          price: pairData?.priceUsd ? parseFloat(pairData.priceUsd) : 0,
          market_cap: pairData?.marketCap || pairData?.fdv || 0,
          volume24h: pairData?.volume?.h24 || 0,
          liquidity: pairData?.liquidity?.usd || 0,
          // Price changes
          priceChange5m: pairData?.priceChange?.m5 || 0,
          priceChange1h: pairData?.priceChange?.h1 || 0,
          priceChange6h: pairData?.priceChange?.h6 || 0,
          priceChange24h: pairData?.priceChange?.h24 || 0,
          // Boost data
          boostAmount: boostAmounts[token.tokenAddress] || 0,
          // Metadata
          created_timestamp: pairData?.pairCreatedAt || Date.now(),
          dexId: pairData?.dexId || 'unknown',
          pairAddress: pairData?.pairAddress || '',
        }
      })

      // Prepend pinned coins to the list
      const allCoins = [...validPinnedCoins, ...mappedCoins]
      setCoins(allCoins)
      setIsLoading(false)
    } catch (err) {
      console.warn('Failed to fetch coins:', err)
      setCoins([])
      setIsLoading(false)
      setError('Failed to load coins')
    }
  }, [fetchMarketData])

  // Initial fetch
  useEffect(() => {
    fetchCoins()
  }, [fetchCoins])

  // Sort coins based on filter (pinned coins always first)
  const sortedCoins = useCallback(() => {
    // Separate pinned and regular coins
    const pinned = coins.filter(c => c.isPinned)
    const regular = coins.filter(c => !c.isPinned)

    switch (filter) {
      case 'marketCap':
        regular.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
        break
      case 'boosted':
        regular.sort((a, b) => (b.boostAmount || 0) - (a.boostAmount || 0))
        break
      case 'volume':
        regular.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        break
      case 'gainers':
        regular.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
        break
      case 'losers':
        regular.sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0))
        break
      case 'new':
        regular.sort((a, b) => (b.created_timestamp || 0) - (a.created_timestamp || 0))
        break
      case 'liquidity':
        regular.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
        break
      default:
        break
    }

    // Pinned coins always first
    return [...pinned, ...regular]
  }, [coins, filter])

  // Search coins
  const searchCoins = useCallback((query) => {
    if (!query || query.trim() === '') {
      return sortedCoins()
    }

    const lowerQuery = query.toLowerCase()
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
    isLoading,
    error,
    isConnected: true, // No WebSocket, always "connected"
    refetch,
    searchCoins,
  }
}
