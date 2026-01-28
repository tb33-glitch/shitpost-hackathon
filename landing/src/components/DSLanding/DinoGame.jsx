import { useState, useEffect, useRef, useCallback } from 'react'

const GAME_WIDTH = 268
const GAME_HEIGHT = 199
const GROUND_HEIGHT = 30
const POOP_SIZE = 28
const GRAVITY = 0.8
const JUMP_FORCE = -12
const GAME_SPEED_INITIAL = 4
const GAME_SPEED_INCREMENT = 0.001

export default function DinoGame({ isActive, onJump }) {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, gameover
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [poop, setPoop] = useState({ y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0, jumping: false })
  const [obstacles, setObstacles] = useState([])
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_INITIAL)
  const gameLoopRef = useRef(null)
  const lastObstacleRef = useRef(0)

  // Jump handler
  const jump = useCallback(() => {
    if (gameState === 'waiting') {
      setGameState('playing')
      setScore(0)
      setObstacles([])
      setGameSpeed(GAME_SPEED_INITIAL)
      setPoop({ y: GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE, vy: 0, jumping: false })
    } else if (gameState === 'playing') {
      setPoop(p => {
        if (!p.jumping) {
          return { ...p, vy: JUMP_FORCE, jumping: true }
        }
        return p
      })
    } else if (gameState === 'gameover') {
      setGameState('waiting')
    }
  }, [gameState])

  // Expose jump to parent
  useEffect(() => {
    if (onJump) {
      onJump.current = jump
    }
  }, [jump, onJump])

  // Game loop
  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
      return
    }

    let frameCount = 0

    const loop = () => {
      frameCount++

      // Update poop position
      setPoop(p => {
        let newY = p.y + p.vy
        let newVy = p.vy + GRAVITY
        let jumping = true

        // Ground collision
        if (newY >= GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE) {
          newY = GAME_HEIGHT - GROUND_HEIGHT - POOP_SIZE
          newVy = 0
          jumping = false
        }

        return { y: newY, vy: newVy, jumping }
      })

      // Update obstacles
      setObstacles(obs => {
        let newObs = obs.map(o => ({ ...o, x: o.x - gameSpeed })).filter(o => o.x > -40)

        // Spawn new obstacle
        if (frameCount - lastObstacleRef.current > 80 + Math.random() * 60) {
          const types = ['cactus', 'cactus', 'cactus', 'bird']
          const type = types[Math.floor(Math.random() * types.length)]
          newObs.push({
            x: GAME_WIDTH + 20,
            y: type === 'bird' ? GAME_HEIGHT - GROUND_HEIGHT - 50 - Math.random() * 30 : GAME_HEIGHT - GROUND_HEIGHT - 30,
            width: type === 'bird' ? 24 : 18,
            height: type === 'bird' ? 20 : 30,
            type
          })
          lastObstacleRef.current = frameCount
        }

        return newObs
      })

      // Update score and speed
      setScore(s => s + 1)
      setGameSpeed(s => s + GAME_SPEED_INCREMENT)

      gameLoopRef.current = requestAnimationFrame(loop)
    }

    gameLoopRef.current = requestAnimationFrame(loop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isActive, gameState, gameSpeed])

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return

    const poopBox = {
      x: 30,
      y: poop.y,
      width: POOP_SIZE - 6,
      height: POOP_SIZE - 6
    }

    for (const obs of obstacles) {
      if (
        poopBox.x < obs.x + obs.width &&
        poopBox.x + poopBox.width > obs.x &&
        poopBox.y < obs.y + obs.height &&
        poopBox.y + poopBox.height > obs.y
      ) {
        setGameState('gameover')
        setHighScore(h => Math.max(h, score))
        break
      }
    }
  }, [poop, obstacles, gameState, score])

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

  return (
    <div className="dino-game">
      {/* Sky */}
      <div className="dino-sky" />

      {/* Game area */}
      <div className="dino-play-area">
        {/* Poop character */}
        <div
          className="dino-poop"
          style={{
            top: poop.y,
            transform: poop.jumping ? 'rotate(-10deg)' : 'rotate(0deg)'
          }}
        >
          💩
        </div>

        {/* Obstacles */}
        {obstacles.map((obs, i) => (
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
        {gameState === 'waiting' && (
          <div className="dino-overlay">
            <div className="dino-start-text">Press SPACE or B to start</div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="dino-overlay">
            <div className="dino-gameover">GAME OVER</div>
            <div className="dino-final-score">Score: {score}</div>
            <div className="dino-restart">Press SPACE or B to restart</div>
          </div>
        )}

        {/* Score display */}
        {gameState === 'playing' && (
          <div className="dino-score">
            {String(score).padStart(5, '0')}
          </div>
        )}

        {/* High score */}
        {highScore > 0 && (
          <div className="dino-high-score">
            HI {String(highScore).padStart(5, '0')}
          </div>
        )}
      </div>
    </div>
  )
}
