/**
 * Meme Templates API Routes
 * Fetches and caches meme templates from external APIs (Imgflip, Memegen)
 */

// In-memory cache for templates
let templatesCache = null
let cacheTimestamp = 0
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Imgflip ID to our template ID mapping (for replacing placeholders)
const IMGFLIP_MAPPINGS = {
  // Classic
  '181913649': 'drake',              // Drake Hotline Bling
  '112126428': 'distracted-boyfriend', // Distracted Boyfriend
  '93895088': 'expanding-brain',     // Expanding Brain
  '100777631': 'is-this-pigeon',     // Is This A Pigeon?
  '188390779': 'woman-yelling-cat',  // Woman Yelling at Cat
  '131087935': 'gru-plan',           // Gru's Plan
  '129242436': 'change-my-mind',     // Change My Mind
  '252600902': 'always-has-been',    // Always Has Been
  '180190441': 'same-picture',       // They're The Same Picture
  '87743020': 'two-buttons',         // Two Buttons
  '27813981': 'surprised-pikachu',   // Surprised Pikachu
  '219525624': 'this-is-fine',       // This Is Fine (Dog)
  '52223610': 'stonks',              // Stonks (custom, might not match)
  '217743513': 'trade-offer',        // Trade Offer
  '222403160': 'bernie-asking',      // Bernie I Am Once Again Asking

  // Wojak/Meme faces
  '101511': 'smug-pepe',             // Pepe the Frog
  '110163934': 'gigachad',           // GigaChad
  '259237855': 'soyjak-pointing',    // Soyjak Pointing
  '316466202': 'npc',                // NPC Wojak
}

// Fetch templates from Imgflip
async function fetchImgflipTemplates() {
  try {
    const response = await fetch('https://api.imgflip.com/get_memes')
    const data = await response.json()

    if (!data.success || !data.data?.memes) {
      throw new Error('Invalid Imgflip response')
    }

    return data.data.memes.map(meme => ({
      id: `imgflip-${meme.id}`,
      imgflipId: meme.id,
      name: meme.name,
      url: meme.url,
      width: meme.width,
      height: meme.height,
      boxCount: meme.box_count,
      captions: meme.captions || 0,
      source: 'imgflip',
      // Map to our internal ID if we have one
      internalId: IMGFLIP_MAPPINGS[meme.id] || null,
    }))
  } catch (error) {
    console.error('Failed to fetch Imgflip templates:', error)
    return []
  }
}

// Fetch templates from Memegen (400+ templates)
async function fetchMemegenTemplates() {
  try {
    const response = await fetch('https://api.memegen.link/templates/')
    const data = await response.json()

    return data.map(template => ({
      id: `memegen-${template.id}`,
      memegenId: template.id,
      name: template.name,
      url: template.blank,
      boxCount: template.lines || 2,
      source: 'memegen',
    }))
  } catch (error) {
    console.error('Failed to fetch Memegen templates:', error)
    return []
  }
}

export default async function memesRoutes(fastify, options) {
  // Get all trending templates
  fastify.get('/templates', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    schema: {
      querystring: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['imgflip', 'memegen', 'all'] },
          limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            templates: { type: 'array' },
            mappings: { type: 'object' },
            cached: { type: 'boolean' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { source = 'imgflip', limit = 50 } = request.query
    const now = Date.now()

    // Check cache
    if (templatesCache && (now - cacheTimestamp) < CACHE_TTL) {
      fastify.log.info('Returning cached templates')
      return {
        templates: templatesCache.slice(0, limit),
        mappings: IMGFLIP_MAPPINGS,
        cached: true,
        timestamp: new Date(cacheTimestamp).toISOString(),
      }
    }

    fastify.log.info('Fetching fresh templates from external APIs')

    let templates = []

    if (source === 'imgflip' || source === 'all') {
      const imgflip = await fetchImgflipTemplates()
      templates = [...templates, ...imgflip]
    }

    if (source === 'memegen' || source === 'all') {
      const memegen = await fetchMemegenTemplates()
      templates = [...templates, ...memegen]
    }

    // Sort by popularity (captions count)
    templates.sort((a, b) => (b.captions || 0) - (a.captions || 0))

    // Cache the results
    templatesCache = templates
    cacheTimestamp = now

    return {
      templates: templates.slice(0, limit),
      mappings: IMGFLIP_MAPPINGS,
      cached: false,
      timestamp: new Date().toISOString(),
    }
  })

  // Proxy external images to avoid CORS issues
  fastify.get('/proxy-image', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
    schema: {
      querystring: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { url } = request.query

    // Only allow proxying from known safe domains (exact match for security)
    const allowedDomains = [
      'i.imgflip.com',
      'api.memegen.link',
      'gateway.pinata.cloud',
      'dd.dexscreener.com',
      'img.dexscreener.com',
      'assets.dexscreener.com',
      'dexscreener.com',
    ]

    // Allowed content types for images
    const allowedContentTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ]

    try {
      const parsedUrl = new URL(url)

      // Security: Use exact hostname match, not endsWith (prevents evil.i.imgflip.com attacks)
      if (!allowedDomains.includes(parsedUrl.hostname)) {
        fastify.log.warn(`Blocked proxy request for domain: ${parsedUrl.hostname}`)
        return reply.status(403).send({ error: 'Domain not allowed' })
      }

      // Security: Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        return reply.status(403).send({ error: 'HTTPS required' })
      }

      const response = await fetch(url, {
        headers: { 'User-Agent': 'shitpost-proxy/1.0' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        return reply.status(response.status).send({ error: 'Failed to fetch image' })
      }

      const contentType = response.headers.get('content-type') || ''

      // Security: Validate content type is actually an image
      const isValidImage = allowedContentTypes.some(type => contentType.startsWith(type))
      if (!isValidImage) {
        fastify.log.warn(`Blocked non-image content type: ${contentType}`)
        return reply.status(403).send({ error: 'Invalid content type' })
      }

      const buffer = await response.arrayBuffer()

      return reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
        .send(Buffer.from(buffer))
    } catch (error) {
      fastify.log.error('Image proxy error:', error)
      return reply.status(500).send({ error: 'Failed to proxy image' })
    }
  })

  // Get image URL mappings for replacing placeholders
  fastify.get('/mappings', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    // If we have cached templates, build mappings from them
    if (templatesCache) {
      const urlMappings = {}
      templatesCache.forEach(t => {
        if (t.internalId) {
          urlMappings[t.internalId] = t.url
        }
      })
      return { mappings: urlMappings }
    }

    // Otherwise fetch fresh
    const imgflip = await fetchImgflipTemplates()
    const urlMappings = {}
    imgflip.forEach(t => {
      if (t.internalId) {
        urlMappings[t.internalId] = t.url
      }
    })

    return { mappings: urlMappings }
  })
}
