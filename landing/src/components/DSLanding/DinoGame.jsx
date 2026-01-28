import { useState, useEffect, useRef, useCallback } from 'react'

const GAME_WIDTH = 268
const GAME_HEIGHT = 199
const GROUND_HEIGHT = 30
const POOP_SIZE = 28
const GRAVITY = 0.6
const JUMP_FORCE = -11
const GAME_SPEED_INITIAL = 3

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function DinoGame({ isActive, onJump }) {
  const [, forceUpdate] = useState(0)
  const [ghosts, setGhosts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [playerTag, setPlayerTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const gameRef = useRef({
    state: 'waiting', // waiting, playing, gameover
    score: 0,
    highScore: 0,
    poop: { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 },
    obstacles: [],
    gameSpeed: GAME_SPEED_INITIAL,
    frameCount: 0,
    lastObstacle: 0,
    deathX: 0
  })
  const animationRef = useRef(null)
  const inputRef = useRef(null)

  const game = gameRef.current

  // Fetch leaderboard and ghosts on mount
  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`)
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.scores || [])
        setGhosts(data.ghosts || [])
      }
    } catch (err) {
      console.log('Leaderboard fetch failed:', err)
    }
  }

  const submitScore = async (tag, score, deathX) => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/leaderboard/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, score, deathX })
      })
      if (res.ok) {
        await fetchLeaderboard()
      }
    } catch (err) {
      console.log('Score submit failed:', err)
    }
    setSubmitting(false)
    setShowTagInput(false)
  }

  // Jump handler
  const jump = useCallback(() => {
    if (game.state === 'waiting') {
      game.state = 'playing'
      game.score = 0
      game.obstacles = []
      game.gameSpeed = GAME_SPEED_INITIAL
      game.frameCount = 0
      game.lastObstacle = 0
      game.deathX = 0
      game.poop = { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 }
      forceUpdate(n => n + 1)
    } else if (game.state === 'playing') {
      // Only jump if on ground
      if (game.poop.y >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1) {
        game.poop.vy = JUMP_FORCE
      }
    } else if (game.state === 'gameover' && !showTagInput) {
      game.state = 'waiting'
      forceUpdate(n => n + 1)
    }
  }, [game, showTagInput])

  // Expose jump to parent
  useEffect(() => {
    if (onJump) {
      onJump.current = jump
    }
  }, [jump, onJump])

  // Game loop
  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const loop = () => {
      if (game.state !== 'playing') {
        animationRef.current = requestAnimationFrame(loop)
        return
      }

      game.frameCount++

      // Update poop position
      game.poop.vy += GRAVITY
      game.poop.y += game.poop.vy

      // Ground collision
      if (game.poop.y >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE) {
        game.poop.y = GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE
        game.poop.vy = 0
      }

      // Update obstacles
      game.obstacles = game.obstacles
        .map(o => ({ ...o, x: o.x - game.gameSpeed }))
        .filter(o => o.x > -40)

      // Spawn new obstacle
      if (game.frameCount - game.lastObstacle > 90 + Math.random() * 50) {
        const type = Math.random() > 0.75 ? 'bird' : 'cactus'
        game.obstacles.push({
          x: GAME_WIDTH + 10,
          y: type === 'bird'
            ? GAME_HEIGHT - GROUND_HEIGHT - 55 - Math.random() * 20
            : GAME_HEIGHT - GROUND_HEIGHT - 32,
          width: type === 'bird' ? 26 : 20,
          height: type === 'bird' ? 22 : 32,
          type
        })
        game.lastObstacle = game.frameCount
      }

      // Collision detection
      const poopBox = {
        x: 30 + 4,
        y: game.poop.y + 4,
        width: POOP_SIZE - 8,
        height: POOP_SIZE - 8
      }

      for (const obs of game.obstacles) {
        if (
          poopBox.x < obs.x + obs.width - 4 &&
          poopBox.x + poopBox.width > obs.x + 4 &&
          poopBox.y < obs.y + obs.height - 4 &&
          poopBox.y + poopBox.height > obs.y + 4
        ) {
          game.state = 'gameover'
          game.highScore = Math.max(game.highScore, game.score)
          // Calculate death position as distance traveled
          game.deathX = Math.min(game.score / 10, 1000)
          setShowTagInput(true)
          forceUpdate(n => n + 1)
          break
        }
      }

      // Update score and speed
      game.score++
      game.gameSpeed += 0.0008

      forceUpdate(n => n + 1)
      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, game])

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return

    const handleKey = (e) => {
      if (showTagInput) return // Don't jump while entering tag

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, jump, showTagInput])

  // Focus input when showing tag input
  useEffect(() => {
    if (showTagInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showTagInput])

  const handleTagSubmit = (e) => {
    e.preventDefault()
    const tag = playerTag.toUpperCase().slice(0, 3) || 'AAA'
    submitScore(tag, game.score, game.deathX)
  }

  const handleSkip = () => {
    setShowTagInput(false)
    setPlayerTag('')
  }

  const isJumping = game.poop.y < GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1

  return (
    <div className="dino-game">
      <div className="dino-sky" />

      <div className="dino-play-area">
        {/* Ghost poops from other players */}
        {game.state === 'playing' && ghosts.map((ghost, i) => {
          // Show ghost at their death position relative to current score
          const ghostScreenX = (ghost.x * 10) - game.score + GAME_WIDTH
          if (ghostScreenX < -30 || ghostScreenX > GAME_WIDTH + 30) return null
          return (
            <div
              key={i}
              className="dino-ghost"
              style={{
                left: ghostScreenX,
                top: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE
              }}
            >
              <span className="ghost-emoji">👻</span>
              <span className="ghost-tag">{ghost.tag}</span>
            </div>
          )
        })}

        {/* Poop character */}
        <div
          className="dino-poop"
          style={{
            top: game.poop.y,
            transform: isJumping ? 'rotate(-10deg)' : 'rotate(0deg)'
          }}
        >
          💩
        </div>

        {/* Obstacles */}
        {game.obstacles.map((obs, i) => (
          <div
            key={i}
            className={`dino-obstacle ${obs.type}`}
            style={{
              left: obs.x,
              top: obs.y,
              width: obs.width,
              height: obs.height
            }}
          >
            {obs.type === 'bird' ? '🦅' : '🌵'}
          </div>
        ))}

        {/* Ground */}
        <div className="dino-ground" />

        {/* UI Overlays */}
        {game.state === 'waiting' && (
          <div className="dino-overlay">
            <div className="dino-start-text">Press SPACE or B to start</div>
            {leaderboard.length > 0 && (
              <div className="dino-leaderboard">
                <div className="leaderboard-title">TOP SCORES</div>
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className="leaderboard-entry">
                    <span className="lb-rank">{i + 1}.</span>
                    <span className="lb-tag">{entry.tag}</span>
                    <span className="lb-score">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {game.state === 'gameover' && (
          <div className="dino-overlay">
            <div className="dino-gameover">GAME OVER</div>
            <div className="dino-final-score">Score: {game.score}</div>

            {showTagInput ? (
              <form onSubmit={handleTagSubmit} className="tag-input-form">
                <div className="tag-prompt">Enter your tag:</div>
                <input
                  ref={inputRef}
                  type="text"
                  value={playerTag}
                  onChange={(e) => setPlayerTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))}
                  maxLength={3}
                  placeholder="AAA"
                  className="tag-input"
                  disabled={submitting}
                />
                <div className="tag-buttons">
                  <button type="submit" disabled={submitting} className="tag-btn">
                    {submitting ? '...' : 'OK'}
                  </button>
                  <button type="button" onClick={handleSkip} disabled={submitting} className="tag-btn skip">
                    SKIP
                  </button>
                </div>
              </form>
            ) : (
              <div className="dino-restart">Press SPACE or B to restart</div>
            )}
          </div>
        )}

        {/* Score display */}
        {game.state === 'playing' && (
          <div className="dino-score">
            {String(game.score).padStart(5, '0')}
          </div>
        )}

        {/* High score */}
        {game.highScore > 0 && (
          <div className="dino-high-score">
            HI {String(game.highScore).padStart(5, '0')}
          </div>
        )}
      </div>
    </div>
  )
}
