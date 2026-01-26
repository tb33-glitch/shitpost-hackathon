import { useState, useCallback } from 'react'
import { uploadImage, uploadMetadata, generateMetadata } from '../utils/ipfs'

export default function useIPFS() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(async (blob, tokenId, hasPremium) => {
    setIsUploading(true)
    setError(null)

    try {
      // Upload image
      const imageResult = await uploadImage(blob, `shitpost-${tokenId}.png`)

      // Generate and upload metadata
      const metadata = generateMetadata(imageResult.url, tokenId, hasPremium)
      const metadataResult = await uploadMetadata(metadata)

      return {
        imageUrl: imageResult.url,
        imageGateway: imageResult.gateway,
        metadataUrl: metadataResult.url,
        metadataGateway: metadataResult.gateway,
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [])

  return {
    upload,
    isUploading,
    error,
  }
}
