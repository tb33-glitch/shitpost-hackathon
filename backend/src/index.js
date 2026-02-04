/**
 * shitpost.pro Backend API Server
 * Secure server-side API for IPFS uploads via Pinata
 */

import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import ipfsRoutes from './routes/ipfs.js'
import solanaRoutes from './routes/solana.js'
import memesRoutes from './routes/memes.js'
import scraperRoutes from './routes/scraper.js'
import leaderboardRoutes from './routes/leaderboard.js'
import templatesRoutes from './routes/templates.js'

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://shitpost.pro',
  'https://www.shitpost.pro',
  'https://test.shitpost.pro',
  'https://frontend-lqqchyqfm-tylers-projects-56d96582.vercel.app',
]

// Add production domain if configured
if (process.env.PRODUCTION_DOMAIN) {
  ALLOWED_ORIGINS.push(process.env.PRODUCTION_DOMAIN)
  ALLOWED_ORIGINS.push(`https://${process.env.PRODUCTION_DOMAIN}`)
}

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
})

// Register CORS
await fastify.register(cors, {
  origin: (origin, callback) => {
    // In production, require origin header for security
    // In development, allow no-origin for tools like curl
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        fastify.log.warn('Blocked request with no origin in production')
        return callback(new Error('Origin header required'), false)
      }
      return callback(null, true)
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    // Log rejected origins for debugging
    fastify.log.warn(`Blocked CORS request from origin: ${origin}`)
    return callback(new Error('Not allowed by CORS'), false)
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  credentials: true,
})

// Security headers
fastify.addHook('onSend', (request, reply, payload, done) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-XSS-Protection', '1; mode=block')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  done()
})

// Register global rate limiter
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => {
    // Use X-Forwarded-For header if behind a proxy, otherwise use IP
    return request.headers['x-forwarded-for'] || request.ip
  },
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please wait ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }
  },
})

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (for videos)
    files: 1, // Only 1 file at a time
  },
})

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  }
})

// Register IPFS routes under /api/ipfs prefix
await fastify.register(ipfsRoutes, { prefix: '/api/ipfs' })

// Register Solana RPC proxy routes under /api/solana prefix
await fastify.register(solanaRoutes, { prefix: '/api/solana' })

// Register Meme templates routes under /api/memes prefix
await fastify.register(memesRoutes, { prefix: '/api/memes' })

// Register Scraper routes under /api/scraper prefix
await fastify.register(scraperRoutes, { prefix: '/api/scraper' })

// Register Leaderboard routes under /api/leaderboard prefix
await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' })

// Register Community Templates routes under /api/templates prefix
await fastify.register(templatesRoutes, { prefix: '/api/templates' })

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error)

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation error',
      message: error.message,
    })
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Rate limit exceeded',
      message: error.message,
    })
  }

  // Generic error response (don't leak internal details)
  return reply.status(error.statusCode || 500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message,
  })
})

// Start server
const start = async () => {
  try {
    // Validate configuration on startup
    if (!process.env.PINATA_JWT) {
      fastify.log.warn('PINATA_JWT not configured - IPFS uploads will fail')
    }
    if (!process.env.SOLANA_RPC_URL) {
      fastify.log.warn('SOLANA_RPC_URL not configured - Solana RPC proxy will fail')
    }

    await fastify.listen({ port: PORT, host: HOST })
    fastify.log.info(`Server running at http://${HOST}:${PORT}`)
    fastify.log.info(`Health check: http://${HOST}:${PORT}/api/health`)
    fastify.log.info(`IPFS endpoints: http://${HOST}:${PORT}/api/ipfs/*`)
    fastify.log.info(`Solana RPC proxy: http://${HOST}:${PORT}/api/solana/rpc`)
    fastify.log.info(`Meme templates: http://${HOST}:${PORT}/api/memes/templates`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
