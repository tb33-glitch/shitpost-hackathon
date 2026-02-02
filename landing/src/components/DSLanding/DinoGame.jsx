import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const GAME_WIDTH = 268
const GAME_HEIGHT = 199
const GROUND_HEIGHT = 30
const POOP_SIZE = 28
const GRAVITY = 0.6
const JUMP_FORCE = -11
const GAME_SPEED_INITIAL = 5

const supabase = createClient(
  'https://rnfwvqmwyfntsxdeafvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZnd2cW13eWZudHN4ZGVhZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI2MjMsImV4cCI6MjA4NTM3ODYyM30.RWp42Jy1cPdT0ySbkqaYFm-yUXsF7wqDRGvLNRtjop4'
)

export default function DinoGame({ isActive, onJump }) {
  const [, forceUpdate] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [initials, setInitials] = useState('')
  const [showInitialsInput, setShowInitialsInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const inputRef = useRef(null)

  const gameRef = useRef({
    state: 'waiting',
    score: 0,
    highScore: 0, // Will be fetched from leaderboard
    poop: { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 },
    obstacles: [],
    gameSpeed: GAME_SPEED_INITIAL,
    frameCount: 0,
    lastObstacle: 0,
    scoreSubmitted: false,
    startTime: null,
    finalScore: 0,
    playTime: 0,
  })
  const animationRef = useRef(null)

  const game = gameRef.current

  // Fetch leaderboard and sync high score on mount
  useEffect(() => {
    fetchLeaderboard()
    fetchHighScore()
  }, [])

  // Fetch the global high score from Supabase
  const fetchHighScore = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('score')
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        game.highScore = data.score
        forceUpdate(n => n + 1)
      }
    } catch (e) {
      console.error('Failed to fetch high score:', e)
    }
  }

  // Focus input when initials screen shows
  useEffect(() => {
    if (showInitialsInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInitialsInput])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('id, name, score, created_at')
        .order('score', { ascending: false })
        .limit(50)

      if (!error && data) {
        setLeaderboard(data.map((entry, i) => ({
          rank: i + 1,
          name: entry.name,
          score: entry.score,
          date: entry.created_at,
        })))
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    }
  }

  const submitScore = async () => {
    if (game.scoreSubmitted || !initials.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('leaderboard')
        .insert({
          name: initials.toUpperCase().slice(0, 3),
          score: game.finalScore,
          play_time: game.playTime,
        })

      if (!error) {
        game.scoreSubmitted = true

        const { data: rankData } = await supabase
          .from('leaderboard')
          .select('id')
          .gt('score', game.finalScore)

        const rank = (rankData?.length || 0) + 1
        setSubmitResult({ rank, isTopTen: rank <= 10 })
        setShowInitialsInput(false)
        fetchLeaderboard()
        fetchHighScore() // Refresh global high score
      }
    } catch (e) {
      console.error('Failed to submit score:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInitialsChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setInitials(val)
  }

  const handleInitialsKeyDown = (e) => {
    if (e.key === 'Enter' && initials.length === 3) {
      submitScore()
    }
  }

  const skipSubmit = () => {
    setShowInitialsInput(false)
    game.scoreSubmitted = true
  }

  const jump = useCallback(() => {
    if (game.state === 'waiting') {
      game.state = 'playing'
      game.score = 0
      game.obstacles = []
      game.gameSpeed = GAME_SPEED_INITIAL
      game.frameCount = 0
      game.lastObstacle = 0
      game.scoreSubmitted = false
      game.startTime = Date.now()
      game.poop = { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 }
      setSubmitResult(null)
      setShowLeaderboard(false)
      setShowInitialsInput(false)
      setInitials('')
      forceUpdate(n => n + 1)
    } else if (game.state === 'playing') {
      if (game.poop.y >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1) {
        game.poop.vy = JUMP_FORCE
      }
    } else if (game.state === 'gameover' && !showInitialsInput) {
      game.state = 'waiting'
      forceUpdate(n => n + 1)
    }
  }, [game, showInitialsInput])

  useEffect(() => {
    if (onJump) {
      onJump.current = jump
    }
  }, [jump, onJump])

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

      game.poop.vy += GRAVITY
      game.poop.y += game.poop.vy

      if (game.poop.y >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE) {
        game.poop.y = GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE
        game.poop.vy = 0
      }

      game.obstacles = game.obstacles
        .map(o => ({ ...o, x: o.x - game.gameSpeed }))
        .filter(o => o.x > -40)

      if (game.frameCount - game.lastObstacle > 60 + Math.random() * 40) {
        const type = Math.random() > 0.65 ? 'bird' : 'cactus'
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
          game.finalScore = game.score
          game.playTime = Math.round((Date.now() - game.startTime) / 1000)
          // Show initials input if score >= 100
          if (game.score >= 100) {
            setShowInitialsInput(true)
          }
          forceUpdate(n => n + 1)
          break
        }
      }

      game.score++
      game.gameSpeed += 0.003

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

  useEffect(() => {
    if (!isActive) return

    const handleKey = (e) => {
      // Don't intercept keys when typing initials
      if (showInitialsInput) return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
      if (e.key === 'l' || e.key === 'L') {
        setShowLeaderboard(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, jump, showInitialsInput])

  const isJumping = game.poop.y < GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1

  return (
    <div className="dino-game">
      <div className="dino-sky" />

      <div className="dino-play-area">
        <div
          className="dino-poop"
          style={{
            top: game.poop.y,
            transform: isJumping ? 'rotate(-10deg)' : 'rotate(0deg)'
          }}
        >
          💩
        </div>

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

        <div className="dino-ground" />

        {game.state === 'waiting' && !showLeaderboard && (
          <div className="dino-overlay">
            <div className="dino-start-text">Press SPACE or B to start</div>
            <div className="dino-start-hint">Press L for leaderboard</div>
          </div>
        )}

        {/* Initials input screen */}
        {game.state === 'gameover' && showInitialsInput && (
          <div className="dino-overlay">
            <div className="dino-gameover">GAME OVER</div>
            <div className="dino-final-score">Score: {game.finalScore}</div>
            <div className="dino-initials-prompt">ENTER YOUR INITIALS</div>
            <input
              ref={inputRef}
              type="text"
              className="dino-initials-input"
              value={initials}
              onChange={handleInitialsChange}
              onKeyDown={handleInitialsKeyDown}
              maxLength={3}
              placeholder="AAA"
              autoComplete="off"
            />
            <div className="dino-initials-buttons">
              <button
                className="dino-btn-submit"
                onClick={submitScore}
                disabled={initials.length !== 3 || submitting}
              >
                {submitting ? 'SAVING...' : 'SUBMIT'}
              </button>
              <button className="dino-btn-skip" onClick={skipSubmit}>
                SKIP
              </button>
            </div>
          </div>
        )}

        {/* Game over screen (after submit or skip) */}
        {game.state === 'gameover' && !showInitialsInput && !showLeaderboard && (
          <div className="dino-overlay">
            <div className="dino-gameover">GAME OVER</div>
            <div className="dino-final-score">Score: {game.finalScore}</div>
            {submitResult && submitResult.isTopTen && (
              <div className="dino-rank-badge">TOP 10! Rank #{submitResult.rank}</div>
            )}
            {submitResult && !submitResult.isTopTen && submitResult.rank && (
              <div className="dino-rank-info">Rank #{submitResult.rank}</div>
            )}
            <div className="dino-restart">Press SPACE or B to restart</div>
            <div className="dino-leaderboard-hint" onClick={() => setShowLeaderboard(true)}>
              Press L for leaderboard
            </div>
          </div>
        )}

        {/* Leaderboard overlay */}
        {showLeaderboard && (
          <div className="dino-overlay dino-leaderboard-overlay">
            <div className="dino-leaderboard">
              <div className="dino-leaderboard-title">LEADERBOARD</div>
              <div className="dino-leaderboard-list">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`dino-leaderboard-entry ${i < 3 ? 'top-three' : ''}`}>
                    <span className="lb-rank">#{entry.rank}</span>
                    <span className="lb-name">{entry.name}</span>
                    <span className="lb-score">{entry.score}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="dino-no-scores">No scores yet. Be the first!</div>
                )}
              </div>
              <div className="dino-leaderboard-close" onClick={() => setShowLeaderboard(false)}>
                Press L or click to close
              </div>
            </div>
          </div>
        )}

        {game.state === 'playing' && (
          <div className="dino-score">
            {String(game.score).padStart(5, '0')}
          </div>
        )}

        {game.highScore > 0 && (
          <div className="dino-high-score">
            HI {String(game.highScore).padStart(5, '0')}
          </div>
        )}
      </div>
    </div>
  )
}
