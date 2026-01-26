import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { getSolanaNetwork, deriveCollectionConfigPda, deriveSacredWastePitPda } from '../config/solana'
import solanaIdl from '../contracts/idl/shitpost_pro.json'

export default function useSolanaBurnedArt(network = 'devnet') {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [burnedArt, setBurnedArt] = useState([])
  const [totalBurns, setTotalBurns] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const networkConfig = getSolanaNetwork(network)

  const fetchBurnedArt = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('[Solana Burned Art] Fetching burned art from:', networkConfig.programId?.toString())

      // Create a read-only provider (no wallet needed for reading)
      const provider = new AnchorProvider(
        connection,
        wallet.publicKey ? wallet : {
          publicKey: PublicKey.default,
          signTransaction: async () => { throw new Error('Read only') },
          signAllTransactions: async () => { throw new Error('Read only') },
        },
        { commitment: 'confirmed' }
      )

      const programId = networkConfig.programId instanceof PublicKey
        ? networkConfig.programId
        : new PublicKey(networkConfig.programId.toString())

      const program = new Program(solanaIdl, programId, provider)

      // Fetch collection config to get total burned count
      const [collectionConfigPda] = deriveCollectionConfigPda(programId)

      let collectionConfig
      try {
        collectionConfig = await program.account.collectionConfig.fetch(collectionConfigPda)
        console.log('[Solana Burned Art] Collection config:', {
          totalMinted: collectionConfig.totalMinted?.toString(),
          totalBurned: collectionConfig.totalBurned?.toString(),
        })
      } catch (e) {
        console.warn('[Solana Burned Art] Could not fetch collection config:', e.message)
        setBurnedArt([])
        setTotalBurns(0)
        return
      }

      const totalBurnedCount = Number(collectionConfig.totalBurned || 0)
      setTotalBurns(totalBurnedCount)

      if (totalBurnedCount === 0) {
        setBurnedArt([])
        return
      }

      // Fetch all BurnedArt accounts
      // These are PDAs derived from ['burned_art', mint.toBuffer()]
      const burnedArtAccounts = await program.account.burnedArt.all()

      console.log('[Solana Burned Art] Found burned art accounts:', burnedArtAccounts.length)

      const burns = burnedArtAccounts.map((account) => ({
        burner: account.account.artist.toString(),
        metadata: account.account.tokenUri,
        timestamp: Number(account.account.burnedAt),
        originalMint: account.account.originalMint.toString(),
        chainId: 'solana-devnet',
        isSolana: true,
      }))

      // Sort by timestamp descending (newest first)
      burns.sort((a, b) => b.timestamp - a.timestamp)

      setBurnedArt(burns)
    } catch (err) {
      console.error('[Solana Burned Art] Error fetching burned art:', err)
      setError(err.message)
      setBurnedArt([])
    } finally {
      setIsLoading(false)
    }
  }, [connection, wallet, networkConfig])

  // Fetch Sacred Waste Pit stats
  const fetchPitStats = useCallback(async () => {
    try {
      const provider = new AnchorProvider(
        connection,
        wallet.publicKey ? wallet : {
          publicKey: PublicKey.default,
          signTransaction: async () => { throw new Error('Read only') },
          signAllTransactions: async () => { throw new Error('Read only') },
        },
        { commitment: 'confirmed' }
      )

      const programId = networkConfig.programId instanceof PublicKey
        ? networkConfig.programId
        : new PublicKey(networkConfig.programId.toString())

      const program = new Program(solanaIdl, programId, provider)

      const [sacredWastePitPda] = deriveSacredWastePitPda(programId)

      try {
        const pitState = await program.account.sacredWastePit.fetch(sacredWastePitPda)
        return {
          totalBurns: Number(pitState.totalBurns || 0),
          authority: pitState.authority.toString(),
        }
      } catch (e) {
        console.warn('[Solana Burned Art] Sacred Waste Pit not initialized:', e.message)
        return null
      }
    } catch (err) {
      console.error('[Solana Burned Art] Error fetching pit stats:', err)
      return null
    }
  }, [connection, wallet, networkConfig])

  // Fetch on mount
  useEffect(() => {
    fetchBurnedArt()
  }, [fetchBurnedArt])

  return {
    burnedArt,
    totalBurns,
    isLoading,
    error,
    refetch: fetchBurnedArt,
    fetchPitStats,
  }
}

// Hook to get user's burn count on Solana
export function useSolanaBurnCount(network = 'devnet') {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [burnCount, setBurnCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const networkConfig = getSolanaNetwork(network)

  const fetchBurnCount = useCallback(async () => {
    if (!wallet.publicKey) {
      setBurnCount(0)
      return
    }

    setIsLoading(true)

    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })

      const programId = networkConfig.programId instanceof PublicKey
        ? networkConfig.programId
        : new PublicKey(networkConfig.programId.toString())

      const program = new Program(solanaIdl, programId, provider)

      // Try to fetch burner stats PDA
      const [burnerStatsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('burner_stats'), wallet.publicKey.toBuffer()],
        programId
      )

      try {
        const stats = await program.account.burnerStats.fetch(burnerStatsPda)
        setBurnCount(Number(stats.burnCount || 0))
      } catch (e) {
        // Account doesn't exist = 0 burns
        setBurnCount(0)
      }
    } catch (err) {
      console.error('[Solana Burn Count] Error:', err)
      setBurnCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [connection, wallet, networkConfig])

  useEffect(() => {
    if (wallet.connected) {
      fetchBurnCount()
    } else {
      setBurnCount(0)
    }
  }, [wallet.connected, wallet.publicKey, fetchBurnCount])

  return {
    burnCount,
    isLoading,
    refetch: fetchBurnCount,
  }
}
