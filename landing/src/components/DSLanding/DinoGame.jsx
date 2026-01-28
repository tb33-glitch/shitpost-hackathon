import { useState, useEffect, useRef, useCallback } from 'react'

const GAME_WIDTH = 268
const GAME_HEIGHT = 199
const GROUND_HEIGHT = 30
const POOP_SIZE = 28
const GRAVITY = 0.6
const JUMP_FORCE = -11
const GAME_SPEED_INITIAL = 3

export default function DinoGame({ isActive, onJump }) {
  const [, forceUpdate] = useState(0)
  const gameRef = useRef({
    state: 'waiting', // waiting, playing, gameover
    score: 0,
    highScore: 0,
    poop: { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 },
    obstacles: [],
    gameSpeed: GAME_SPEED_INITIAL,
    frameCount: 0,
    lastObstacle: 0
  })
  const animationRef = useRef(null)

  const game = gameRef.current

  // Jump handler
  const jump = useCallback(() => {
    if (game.state === 'waiting') {
      game.state = 'playing'
      game.score = 0
      game.obstacles = []
      game.gameSpeed = GAME_SPEED_INITIAL
      game.frameCount = 0
      game.lastObstacle = 0
      game.poop = { y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0 }
      forceUpdate(n => n + 1)
    } else if (game.state === 'playing') {
      // Only jump if on ground
      if (game.poop.y >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1) {
        game.poop.vy = JUMP_FORCE
      }
    } else if (game.state === 'gameover') {
      game.state = 'waiting'
      forceUpdate(n => n + 1)
    }
  }, [game])

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
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, jump])

  const isJumping = game.poop.y < GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE - 1

  return (
    <div className="dino-game">
      <div className="dino-sky" />

      <div className="dino-play-area">
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
          </div>
        )}

        {game.state === 'gameover' && (
          <div className="dino-overlay">
            <div className="dino-gameover">GAME OVER</div>
            <div className="dino-final-score">Score: {game.score}</div>
            <div className="dino-restart">Press SPACE or B to restart</div>
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
