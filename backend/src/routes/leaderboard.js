/**
 * Leaderboard API Routes
 * Simple file-based leaderboard for Poop Runner game
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')
const LEADERBOARD_FILE = join(DATA_DIR, 'leaderboard.json')
const MAX_ENTRIES = 50
const MAX_GHOSTS = 20

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

// Load leaderboard from file
async function loadLeaderboard() {
  await ensureDataDir()
  try {
    const data = await readFile(LEADERBOARD_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { scores: [], ghosts: [] }
  }
}

// Save leaderboard to file
async function saveLeaderboard(data) {
  await ensureDataDir()
  await writeFile(LEADERBOARD_FILE, JSON.stringify(data, null, 2))
}

export default async function leaderboardRoutes(fastify, opts) {
  // Get leaderboard
  fastify.get('/', async (request, reply) => {
    const data = await loadLeaderboard()
    return {
      scores: data.scores.slice(0, 10), // Top 10
      ghosts: data.ghosts.slice(0, MAX_GHOSTS)
    }
  })

  // Submit score
  fastify.post('/submit', {
    schema: {
      body: {
        type: 'object',
        required: ['tag', 'score'],
        properties: {
          tag: {
            type: 'string',
            minLength: 1,
            maxLength: 3,
            pattern: '^[A-Za-z0-9]{1,3}$'
          },
          score: {
            type: 'integer',
            minimum: 0,
            maximum: 999999
          },
          deathX: {
            type: 'number',
            minimum: 0,
            maximum: 1000
          }
        }
      }
    }
  }, async (request, reply) => {
    const { tag, score, deathX } = request.body
    const data = await loadLeaderboard()

    const entry = {
      tag: tag.toUpperCase().slice(0, 3),
      score,
      timestamp: Date.now()
    }

    // Add to scores
    data.scores.push(entry)
    data.scores.sort((a, b) => b.score - a.score)
    data.scores = data.scores.slice(0, MAX_ENTRIES)

    // Add ghost if deathX provided
    if (typeof deathX === 'number') {
      data.ghosts.push({
        tag: entry.tag,
        score,
        x: deathX,
        timestamp: Date.now()
      })
      // Keep only recent ghosts
      data.ghosts = data.ghosts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_GHOSTS)
    }

    await saveLeaderboard(data)

    // Find rank
    const rank = data.scores.findIndex(s =>
      s.tag === entry.tag && s.score === entry.score && s.timestamp === entry.timestamp
    ) + 1

    return {
      success: true,
      rank,
      entry
    }
  })

  // Get ghosts only
  fastify.get('/ghosts', async (request, reply) => {
    const data = await loadLeaderboard()
    return { ghosts: data.ghosts.slice(0, MAX_GHOSTS) }
  })

  // Clear leaderboard (admin only - would need auth in production)
  fastify.delete('/clear', async (request, reply) => {
    // In production, add authentication here
    await saveLeaderboard({ scores: [], ghosts: [] })
    return { success: true, message: 'Leaderboard cleared' }
  })
}
