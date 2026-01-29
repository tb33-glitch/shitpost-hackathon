import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ipfsToGateway } from '../utils/ipfs'

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

export default function useSolanaNFTs() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [nfts, setNfts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNFTs = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setNfts([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('[Solana NFTs] Fetching NFTs for:', wallet.publicKey.toString())

      // Get all token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )

      console.log('[Solana NFTs] Found token accounts:', tokenAccounts.value.length)

      const ownedNFTs = []

      for (const { account, pubkey } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info
        const amount = parsedInfo.tokenAmount.uiAmount
        const decimals = parsedInfo.tokenAmount.decimals

        // NFTs have amount 1 and decimals 0
        if (amount === 1 && decimals === 0) {
          const mintAddress = new PublicKey(parsedInfo.mint)
          console.log('[Solana NFTs] Found NFT mint:', mintAddress.toString())

          // Derive metadata PDA
          const [metadataPda] = deriveMetadataPda(mintAddress)

          try {
            // Fetch metadata account
            const metadataAccount = await connection.getAccountInfo(metadataPda)

            if (metadataAccount) {
              // Parse metadata (simplified - the actual format is more complex)
              const data = metadataAccount.data

              // Skip the first byte (key) and read the update authority (32 bytes)
              let offset = 1 + 32

              // Read mint (32 bytes)
              offset += 32

              // Read name (4 byte length prefix + string)
              const nameLength = data.readUInt32LE(offset)
              offset += 4
              const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '')
              offset += nameLength

              // Read symbol (4 byte length prefix + string)
              const symbolLength = data.readUInt32LE(offset)
              offset += 4
              const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '')
              offset += symbolLength

              // Read URI (4 byte length prefix + string)
              const uriLength = data.readUInt32LE(offset)
              offset += 4
              const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '')

              console.log('[Solana NFTs] Metadata:', { name, symbol, uri })

              // Fetch JSON metadata from URI
              let metadata = null
              let imageUrl = null

              if (uri && uri.length > 0) {
                try {
                  const metaResponse = await fetch(ipfsToGateway(uri))
                  if (metaResponse.ok) {
                    metadata = await metaResponse.json()
                    imageUrl = metadata.image ? ipfsToGateway(metadata.image) : null
                  }
                } catch (e) {
                  console.warn('[Solana NFTs] Failed to fetch metadata JSON:', e)
                }
              }

              ownedNFTs.push({
                tokenId: mintAddress.toString(),
                contractAddress: mintAddress.toString(),
                name: metadata?.name || name || 'Solana NFT',
                description: metadata?.description || '',
                image: imageUrl,
                metadata,
                chainId: 'solana-devnet',
                isSolana: true,
                tokenAccount: pubkey.toString(),
              })
            }
          } catch (e) {
            console.warn('[Solana NFTs] Failed to fetch metadata for mint:', mintAddress.toString(), e)
          }
        }
      }

      console.log('[Solana NFTs] Total NFTs found:', ownedNFTs.length)
      setNfts(ownedNFTs)
    } catch (err) {
      console.error('[Solana NFTs] Error fetching NFTs:', err)
      setError(err.message)
      setNfts([])
    } finally {
      setIsLoading(false)
    }
  }, [connection, wallet.connected, wallet.publicKey])

  // Fetch on mount and when wallet changes
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchNFTs()
    } else {
      setNfts([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected, wallet.publicKey?.toString()])

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchNFTs,
  }
}
