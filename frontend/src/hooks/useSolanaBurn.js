import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import {
  getSolanaNetwork,
  deriveCollectionConfigPda,
  deriveSacredWastePitPda,
  deriveBurnedArtPda,
  deriveBurnerStatsPda,
} from '../config/solana'

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Derive metadata PDA
const deriveMetadataPda = (mint) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
}

export default function useSolanaBurn(network = 'devnet') {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [signature, setSignature] = useState(null)

  const networkConfig = getSolanaNetwork(network)

  const reset = useCallback(() => {
    setIsPending(false)
    setIsConfirming(false)
    setIsSuccess(false)
    setError(null)
    setSignature(null)
  }, [])

  // Standard burn - records in gallery
  const burn = useCallback(async (mintAddress, idl) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    if (!idl) {
      throw new Error('IDL not provided - Anchor IDL required for program interaction')
    }

    const mint = new PublicKey(mintAddress)

    setIsPending(true)
    setError(null)
    setIsSuccess(false)

    try {
      // Create Anchor provider and program
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      const program = new Program(idl, networkConfig.programId, provider)

      // Derive PDAs
      const [collectionConfigPda] = deriveCollectionConfigPda(networkConfig.programId)
      const [burnedArtPda] = deriveBurnedArtPda(networkConfig.programId, mint)
      const [metadataPda] = deriveMetadataPda(mint)

      // Get token account
      const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey)

      setIsConfirming(true)

      // Call the burn instruction
      const tx = await program.methods
        .burn()
        .accounts({
          burner: wallet.publicKey,
          collectionConfig: collectionConfigPda,
          mint,
          tokenAccount,
          burnedArt: burnedArtPda,
          metadata: metadataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true })

      setSignature(tx)
      setIsSuccess(true)
      setIsConfirming(false)

      console.log('[useSolanaBurn] NFT burned:', tx)

      return {
        signature: tx,
        mint: mintAddress,
      }
    } catch (err) {
      console.error('[useSolanaBurn] Burn failed:', err)
      setError(err)
      throw err
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }, [connection, wallet, networkConfig])

  // Burn to Sacred Waste Pit
  const burnToWaste = useCallback(async (mintAddress, idl) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    if (!idl) {
      throw new Error('IDL not provided - Anchor IDL required for program interaction')
    }

    const mint = new PublicKey(mintAddress)

    setIsPending(true)
    setError(null)
    setIsSuccess(false)

    try {
      // Create Anchor provider and program
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      const program = new Program(idl, networkConfig.programId, provider)

      // Get collection config to check if pit is configured
      const [collectionConfigPda] = deriveCollectionConfigPda(networkConfig.programId)
      const config = await program.account.collectionConfig.fetch(collectionConfigPda)

      if (!config.sacredWastePit) {
        throw new Error('Sacred Waste Pit not configured on this network')
      }

      // Derive PDAs
      const [sacredWastePitPda] = deriveSacredWastePitPda(networkConfig.programId)
      const [burnedArtPda] = deriveBurnedArtPda(networkConfig.programId, mint)
      const [metadataPda] = deriveMetadataPda(mint)
      const [burnerStatsPda] = deriveBurnerStatsPda(networkConfig.programId, wallet.publicKey)

      // Get pit state to derive pit burn record PDA
      const pitState = await program.account.sacredWastePit.fetch(sacredWastePitPda)
      const burnIdBuffer = Buffer.alloc(8)
      burnIdBuffer.writeBigUInt64LE(BigInt(pitState.totalBurns.toString()))
      const [pitBurnRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pit_burn'), burnIdBuffer],
        networkConfig.programId
      )

      // Get token account
      const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey)

      setIsConfirming(true)

      // Call the burn to waste instruction
      const tx = await program.methods
        .burnToWaste()
        .accounts({
          burner: wallet.publicKey,
          collectionConfig: collectionConfigPda,
          sacredWastePit: sacredWastePitPda,
          mint,
          tokenAccount,
          burnedArt: burnedArtPda,
          pitBurnRecord: pitBurnRecordPda,
          burnerStats: burnerStatsPda,
          metadata: metadataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true })

      setSignature(tx)
      setIsSuccess(true)
      setIsConfirming(false)

      console.log('[useSolanaBurn] NFT burned to Sacred Waste:', tx)

      return {
        signature: tx,
        mint: mintAddress,
      }
    } catch (err) {
      console.error('[useSolanaBurn] Burn to waste failed:', err)
      setError(err)
      throw err
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }, [connection, wallet, networkConfig])

  // Check if Sacred Waste Pit is available
  const checkPitAvailable = useCallback(async (idl) => {
    if (!idl) return false

    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      const program = new Program(idl, networkConfig.programId, provider)

      const [collectionConfigPda] = deriveCollectionConfigPda(networkConfig.programId)
      const config = await program.account.collectionConfig.fetch(collectionConfigPda)

      return !!config.sacredWastePit
    } catch {
      return false
    }
  }, [connection, wallet, networkConfig])

  return {
    burn,
    burnToWaste,
    checkPitAvailable,
    signature,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
    isConnected: wallet.connected,
    publicKey: wallet.publicKey,
  }
}
