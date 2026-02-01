import { useState, useCallback } from 'react'
import { uploadTemplateImage, uploadTemplateMetadata, addToRegistry } from '../utils/templateRegistry'

const XP_PER_TEMPLATE = 10

export default function useTemplateSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submitTemplate = useCallback(async ({ file, name, category, tags, displayName, submittedBy }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Upload image
      const imageResult = await uploadTemplateImage(file, name)

      // Create and upload metadata
      const metadata = {
        type: 'shitpost-template',
        version: '1.0',
        image: imageResult.url,
        name,
        category,
        tags: tags || [],
        submittedBy,
        displayName: displayName || null,
        submittedAt: new Date().toISOString(),
        xpAwarded: XP_PER_TEMPLATE,
      }

      const metadataResult = await uploadTemplateMetadata(metadata)

      // Add to the community registry
      const registryEntry = {
        cid: metadataResult.cid,
        imageCid: imageResult.cid,
        imageUrl: imageResult.gateway || imageResult.url, // Store the gateway URL for faster loading
        name,
        category,
        submittedBy,
        displayName: displayName || null,
        xp: XP_PER_TEMPLATE,
        submittedAt: metadata.submittedAt,
        tags: tags || [],
      }

      await addToRegistry(registryEntry)

      return {
        success: true,
        templateCid: metadataResult.cid,
        imageCid: imageResult.cid,
        imageGateway: imageResult.gateway,
        xpAwarded: XP_PER_TEMPLATE,
      }
    } catch (err) {
      console.error('Template submission error:', err)
      setError(err.message || 'Failed to submit template')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    submitTemplate,
    isSubmitting,
    error,
  }
}
