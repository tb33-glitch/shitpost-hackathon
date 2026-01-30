/**
 * Leaderboard API Routes
 * Secure server-side validated leaderboard for the poop runner game
 *
 * Security: Uses session-based time validation to prevent fake scores.
 * - Client must call /start before playing to get a session
 * - Score submission validates elapsed time matches claimed score
 * - Sessions expire after 10 minutes and can only be used once
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '../../data/leaderboard.json')

// In-memory session store for active games
// Format: { sessionId: { startTime, ip, used } }
const gameSessions = new Map()

// Session config
const SESSION_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes max game
const SESSION_MIN_SCORE_TIME_RATIO = 55 // Minimum frames per second (allows some variance from 60fps)
const SESSION_CLEANUP_INTERVAL_MS = 60 * 1000 // Clean expired sessions every minute

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of gameSessions.entries()) {
    if (now - session.startTime > SESSION_MAX_AGE_MS) {
      gameSessions.delete(sessionId)
    }
  }
}, SESSION_CLEANUP_INTERVAL_MS)

// Generate secure session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex')
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = dirname(DATA_FILE)
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

// Load leaderboard from file
function loadLeaderboard() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
  }
  return { scores: [] }
}

// Save leaderboard to file
function saveLeaderboard(data) {
  try {
    ensureDataDir()
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Failed to save leaderboard:', e)
  }
}

// Sanitize display name
function sanitizeName(name) {
  if (!name || typeof name !== 'string') return 'Anonymous'
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s\-_.]/g, '')
    .trim()
    .slice(0, 20) || 'Anonymous'
}

// Validate score against session timing
function validateScoreWithSession(sessionId, score, ip) {
  const session = gameSessions.get(sessionId)

  if (!session) {
    return { valid: false, reason: 'Invalid or expired session' }
  }

  if (session.used) {
    return { valid: false, reason: 'Session already used' }
  }

  // Optional: Check IP matches (can be bypassed with VPN but adds friction)
  if (session.ip !== ip) {
    return { valid: false, reason: 'Session IP mismatch' }
  }

  const elapsedMs = Date.now() - session.startTime
  const elapsedSeconds = elapsedMs / 1000

  // Score increments every frame at ~60fps
  // So score of 6000 should take ~100 seconds minimum
  // We use 55fps to allow for some variance
  const minTimeForScore = score / SESSION_MIN_SCORE_TIME_RATIO

  if (elapsedSeconds < minTimeForScore) {
    return {
      valid: false,
      reason: `Score too high for elapsed time (${elapsedSeconds.toFixed(1)}s for ${score} points)`
    }
  }

  // Check session isn't too old
  if (elapsedMs > SESSION_MAX_AGE_MS) {
    return { valid: false, reason: 'Session expired' }
  }

  // Mark session as used
  session.used = true

  return { valid: true, elapsedSeconds }
}

export default async function leaderboardRoutes(fastify, options) {

  // Start a new game session
  fastify.post('/start', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const ip = request.headers['x-forwarded-for'] || request.ip
    const sessionId = generateSessionId()

    gameSessions.set(sessionId, {
      startTime: Date.now(),
      ip,
      used: false,
    })

    fastify.log.info({ sessionId: sessionId.slice(0, 8) + '...' }, 'Game session started')

    return {
      success: true,
      sessionId,
    }
  })

  // Get leaderboard (top 50)
  fastify.get('/', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const data = loadLeaderboard()

    const topScores = data.scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((entry, index) => ({
        rank: index + 1,
        name: entry.name,
        score: entry.score,
        date: entry.date,
      }))

    return {
      leaderboard: topScores,
      total: data.scores.length,
      updated: data.lastUpdated || null,
    }
  })

  // Submit a new score (requires valid session)
  fastify.post('/submit', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['score', 'sessionId'],
        properties: {
          score: { type: 'integer', minimum: 1, maximum: 50000 },
          sessionId: { type: 'string', minLength: 64, maxLength: 64 },
          name: { type: 'string', maxLength: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { score, sessionId, name } = request.body
    const ip = request.headers['x-forwarded-for'] || request.ip

    // Validate session and timing
    const validation = validateScoreWithSession(sessionId, score, ip)

    if (!validation.valid) {
      fastify.log.warn({ reason: validation.reason, score }, 'Score submission rejected')
      return reply.status(400).send({
        success: false,
        error: validation.reason,
      })
    }

    const data = loadLeaderboard()

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      score,
      name: sanitizeName(name),
      date: new Date().toISOString(),
      playTime: Math.round(validation.elapsedSeconds),
    }

    data.scores.push(entry)
    data.lastUpdated = new Date().toISOString()

    // Keep only top 1000 scores
    data.scores = data.scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 1000)

    saveLeaderboard(data)

    const rank = data.scores.findIndex(s => s.id === entry.id) + 1

    fastify.log.info({
      score,
      name: entry.name,
      rank,
      playTime: entry.playTime
    }, 'Score submitted successfully')

    return {
      success: true,
      rank,
      isTopTen: rank <= 10,
      isHighScore: rank === 1,
      message: rank <= 10
        ? `You made the top 10! Rank #${rank}`
        : `Your rank: #${rank}`,
    }
  })

  // Admin: Clear leaderboard (protected)
  fastify.delete('/admin/clear', {
    config: {
      rateLimit: {
        max: 1,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const adminKey = request.headers['x-admin-key']

    if (adminKey !== process.env.ADMIN_KEY) {
      return reply.status(403).send({ error: 'Unauthorized' })
    }

    saveLeaderboard({ scores: [], lastUpdated: new Date().toISOString() })

    return { success: true, message: 'Leaderboard cleared' }
  })

  // Admin: View active sessions (for debugging)
  fastify.get('/admin/sessions', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const adminKey = request.headers['x-admin-key']

    if (adminKey !== process.env.ADMIN_KEY) {
      return reply.status(403).send({ error: 'Unauthorized' })
    }

    return {
      activeSessions: gameSessions.size,
      sessions: Array.from(gameSessions.entries()).map(([id, s]) => ({
        id: id.slice(0, 8) + '...',
        age: Math.round((Date.now() - s.startTime) / 1000) + 's',
        used: s.used,
      })),
    }
  })
}
