/**
 * IPFS Upload Routes
 * Secure endpoints for uploading to Pinata IPFS
 */

import pinata from '../services/pinata.js'

// JSON Schema for metadata upload
const metadataSchema = {
  type: 'object',
  required: ['name', 'image'],
  properties: {
    name: { type: 'string', maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    image: { type: 'string', maxLength: 200 },
    external_url: { type: 'string', maxLength: 200 },
    attributes: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          trait_type: { type: 'string' },
          value: {},
          display_type: { type: 'string' },
        },
      },
    },
  },
}

// JSON Schema for template metadata upload
const templateMetadataSchema = {
  type: 'object',
  required: ['name', 'category', 'imageCid'],
  properties: {
    name: { type: 'string', maxLength: 50 },
    category: { type: 'string', maxLength: 20 },
    tags: {
      type: 'array',
      maxItems: 10,
      items: { type: 'string', maxLength: 20 },
    },
    imageCid: { type: 'string', maxLength: 100 },
    imageUrl: { type: 'string', maxLength: 200 },
    submittedBy: { type: 'string', maxLength: 100 },
    displayName: { type: 'string', maxLength: 30 },
    xp: { type: 'number', minimum: 0, maximum: 1000 },
    submittedAt: { type: 'string' },
  },
}

/**
 * Register IPFS routes on Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function ipfsRoutes(fastify) {
  // Upload image endpoint
  fastify.post(
    '/upload-image',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        const data = await request.file()

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' })
        }

        const buffer = await data.toBuffer()
        const result = await pinata.uploadImage(buffer, data.filename, data.mimetype)

        return reply.send(result)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: error.message })
      }
    }
  )

  // Upload metadata endpoint
  fastify.post(
    '/upload-metadata',
    {
      schema: {
        body: metadataSchema,
      },
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await pinata.uploadMetadata(request.body)
        return reply.send(result)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: error.message })
      }
    }
  )

  // Upload template image endpoint
  fastify.post(
    '/upload-template',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        const data = await request.file()

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' })
        }

        const buffer = await data.toBuffer()
        const result = await pinata.uploadImage(buffer, data.filename, data.mimetype)

        return reply.send(result)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: error.message })
      }
    }
  )

  // Upload template metadata endpoint
  fastify.post(
    '/upload-template-metadata',
    {
      schema: {
        body: templateMetadataSchema,
      },
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await pinata.uploadTemplateMetadata(request.body)
        return reply.send(result)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: error.message })
      }
    }
  )
}
