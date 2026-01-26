import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { getSolanaNetwork, deriveCollectionConfigPda, getTreasuryAddress } from '../config/solana'

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

  const mint = useCallback(async (uri, idl) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    if (!idl) {
      throw new Error('IDL not provided - Anchor IDL required for program interaction')
    }

    setIsPending(true)
    setError(null)
    setIsSuccess(false)

    try {
      // Only log non-sensitive info in development
      const isDev = import.meta.env.DEV
      if (isDev) {
        console.log('[Solana Mint] Starting mint on', network)
      }

      // Verify network by checking genesis hash
      const genesisHash = await connection.getGenesisHash()
      // Devnet genesis: EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG
      // Mainnet genesis: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
      const isDevnet = genesisHash === 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'

      // Create Anchor provider and program
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      if (isDev) console.log('[Solana Mint] Step 2: Provider created')

      if (isDev) console.log('[Solana Mint] Step 3: Creating program...')
      console.log('[Solana Mint] Program ID:', networkConfig.programId?.toString())
      console.log('[Solana Mint] IDL name:', idl?.name)

      // Ensure programId is a proper PublicKey instance
      const programId = networkConfig.programId instanceof PublicKey
        ? networkConfig.programId
        : new PublicKey(networkConfig.programId.toString())
      if (isDev) console.log('[Solana Mint] Step 3b: Program ID converted:', programId.toString())

      // Anchor 0.29 API - pass IDL, program ID, and provider
      const program = new Program(idl, programId, provider)
      if (isDev) console.log('[Solana Mint] Step 4: Program created')

      // Generate new mint keypair
      const mintKeypair = Keypair.generate()
      if (isDev) console.log('[Solana Mint] Step 5: Mint keypair:', mintKeypair.publicKey.toString())

      // Derive PDAs
      const [collectionConfigPda] = deriveCollectionConfigPda(programId)
      if (isDev) console.log('[Solana Mint] Step 6: Collection config PDA:', collectionConfigPda.toString())

      const [metadataPda] = deriveMetadataPda(mintKeypair.publicKey)
      const [masterEditionPda] = deriveMasterEditionPda(mintKeypair.publicKey)
      if (isDev) console.log('[Solana Mint] Step 7: PDAs derived')

      // Get associated token account
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey
      )

      setIsConfirming(true)

      // Call the mint instruction
      const tx = await program.methods
        .mint(uri)
        .accounts({
          minter: wallet.publicKey,
          collectionConfig: collectionConfigPda,
          mint: mintKeypair.publicKey,
          tokenAccount,
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

      setSignature(tx)
      setIsSuccess(true)
      setIsConfirming(false)

      return {
        signature: tx,
        mint: mintKeypair.publicKey.toString(),
      }
    } catch (err) {
      console.error('[useSolanaMint] Mint failed:', err)
      console.error('[useSolanaMint] Error name:', err.name)
      console.error('[useSolanaMint] Error message:', err.message)
      if (err.logs) {
        console.error('[useSolanaMint] Transaction logs:', err.logs)
      }
      if (err.error) {
        console.error('[useSolanaMint] Inner error:', err.error)
      }
      setError(err)
      throw err
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }, [connection, wallet, networkConfig])

  const mintWithPremium = useCallback(async (uri, idl, feeInLamports = null) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    if (!idl) {
      throw new Error('IDL not provided - Anchor IDL required for program interaction')
    }

    setIsPending(true)
    setError(null)
    setIsSuccess(false)

    try {
      // Create Anchor provider and program
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })

      // Anchor 0.29 API - pass IDL, program ID, and provider
      const program = new Program(idl, networkConfig.programId, provider)

      // Get collection config to find treasury
      const [collectionConfigPda] = deriveCollectionConfigPda(networkConfig.programId)
      const config = await program.account.collectionConfig.fetch(collectionConfigPda)

      // Get treasury - prefer config from .env, fall back to on-chain config
      const treasuryAddress = getTreasuryAddress(network) || config.treasury
      if (!treasuryAddress) {
        throw new Error('Treasury address not configured')
      }

      // Generate new mint keypair
      const mintKeypair = Keypair.generate()

      // Derive PDAs
      const [metadataPda] = deriveMetadataPda(mintKeypair.publicKey)
      const [masterEditionPda] = deriveMasterEditionPda(mintKeypair.publicKey)

      // Get associated token account
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey
      )

      setIsConfirming(true)

      // Build the mint instruction
      const mintIx = await program.methods
        .mintWithPremium(uri)
        .accounts({
          minter: wallet.publicKey,
          collectionConfig: collectionConfigPda,
          treasury: treasuryAddress,
          mint: mintKeypair.publicKey,
          tokenAccount,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .instruction()

      // Build transaction with fee transfer (if dynamic fee provided) + mint
      const transaction = new Transaction()

      // Add dynamic fee transfer if provided (overrides on-chain fee)
      if (feeInLamports && feeInLamports > 0) {
        console.log(`[Solana Mint] Adding fee transfer: ${feeInLamports} lamports to ${treasuryAddress.toString()}`)
        const feeIx = SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: treasuryAddress,
          lamports: feeInLamports,
        })
        transaction.add(feeIx)
      }

      // Add mint instruction
      transaction.add(mintIx)

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      // Sign with mint keypair
      transaction.partialSign(mintKeypair)

      // SECURITY: Simulate transaction before signing to catch errors early
      console.log('[Solana Mint] Simulating transaction...')
      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        commitment: 'confirmed',
      })

      if (simulation.value.err) {
        console.error('[Solana Mint] Simulation failed:', simulation.value.err)
        console.error('[Solana Mint] Simulation logs:', simulation.value.logs)
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
      }
      console.log('[Solana Mint] Simulation successful')

      // Sign with wallet
      const signedTx = await wallet.signTransaction(transaction)

      // Send transaction
      const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false, // Keep preflight as additional check
        preflightCommitment: 'confirmed',
      })

      // Wait for confirmation
      await connection.confirmTransaction({
        signature: txSig,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed')

      setSignature(txSig)
      setIsSuccess(true)
      setIsConfirming(false)

      return {
        signature: txSig,
        mint: mintKeypair.publicKey.toString(),
      }
    } catch (err) {
      console.error('[useSolanaMint] Premium mint failed:', err)
      setError(err)
      throw err
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }, [connection, wallet, networkConfig, network])

  return {
    mint,
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
