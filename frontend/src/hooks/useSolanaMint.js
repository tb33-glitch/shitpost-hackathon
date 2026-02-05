import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { getSolanaNetwork } from '../config/solana'

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Derive collection config PDA
const deriveCollectionConfigPda = (programId) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('collection_config')],
    programId
  )
}

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

// Derive master edition PDA
const deriveMasterEditionPda = (mint) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition'),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
}

export default function useSolanaMint(network = 'devnet') {
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

  /**
   * Mint NFT with premium fee using our stripped-down contract
   *
   * Contract: 7F6SJmYgF8iEF9DQmpDUuboTRs4qYt5hr27TcXCuykDo
   * Instruction: mintWithPremium(uri: string)
   * Fee: 0.015 SOL (set on-chain)
   */
  const mintWithPremium = useCallback(async (uri, idl) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    if (!idl) {
      throw new Error('IDL not provided')
    }

    setIsPending(true)
    setError(null)
    setIsSuccess(false)

    try {
      console.log('[Mint] Starting premium mint...')
      console.log('[Mint] Network:', network)
      console.log('[Mint] Program ID:', networkConfig.programId.toString())
      console.log('[Mint] URI:', uri)

      // Create Anchor provider
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })

      // Create program instance
      const program = new Program(idl, networkConfig.programId, provider)
      console.log('[Mint] Program created')

      // Derive collection config PDA
      const [collectionConfigPda] = deriveCollectionConfigPda(networkConfig.programId)
      console.log('[Mint] Collection Config PDA:', collectionConfigPda.toString())

      // Fetch on-chain config to get treasury address
      const config = await program.account.collectionConfig.fetch(collectionConfigPda)
      console.log('[Mint] On-chain treasury:', config.treasury.toString())
      console.log('[Mint] On-chain premium fee:', config.premiumFee.toString(), 'lamports')

      // Generate new mint keypair
      const mintKeypair = Keypair.generate()
      console.log('[Mint] New mint address:', mintKeypair.publicKey.toString())

      // Derive PDAs
      const [metadataPda] = deriveMetadataPda(mintKeypair.publicKey)
      const [masterEditionPda] = deriveMasterEditionPda(mintKeypair.publicKey)
      console.log('[Mint] Metadata PDA:', metadataPda.toString())
      console.log('[Mint] Master Edition PDA:', masterEditionPda.toString())

      // Get associated token account for minter
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey
      )
      console.log('[Mint] Token Account:', tokenAccount.toString())

      setIsConfirming(true)

      // Call mintWithPremium instruction via Anchor
      console.log('[Mint] Sending transaction...')
      const tx = await program.methods
        .mintWithPremium(uri)
        .accounts({
          minter: wallet.publicKey,
          collectionConfig: collectionConfigPda,
          treasury: config.treasury, // Use on-chain treasury
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([mintKeypair])
        .rpc()

      console.log('[Mint] Transaction successful:', tx)
      setSignature(tx)
      setIsSuccess(true)

      return {
        signature: tx,
        mint: mintKeypair.publicKey.toString(),
      }
    } catch (err) {
      console.error('[Mint] Failed:', err)

      // Extract useful error message
      let errorMessage = err.message || 'Mint failed'

      // Check for common errors
      if (err.logs) {
        console.error('[Mint] Transaction logs:', err.logs)
        const logStr = err.logs.join('\n')
        if (logStr.includes('insufficient lamports')) {
          errorMessage = 'Insufficient SOL balance'
        } else if (logStr.includes('ConstraintSeeds')) {
          errorMessage = 'Account mismatch - wrong network?'
        }
      }

      setError(new Error(errorMessage))
      throw err
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }, [connection, wallet, networkConfig, network])

  return {
    mintWithPremium,
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

/**
 * Format token amount from smallest units
 */
export function formatTokenAmount(amount, decimals) {
  if (!amount) return '0'
  const value = Number(amount) / Math.pow(10, decimals)
  if (value < 0.000001) return value.toExponential(2)
  if (value < 0.01) return value.toFixed(6)
  if (value < 1) return value.toFixed(4)
  if (value < 1000) return value.toFixed(2)
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
