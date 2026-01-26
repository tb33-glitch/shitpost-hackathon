import { useState, useEffect, useCallback } from 'react'
import useSounds from '../../hooks/useSounds'

const STAPLEY_TIPS = [
  // Helpful tips (Stapley voice - eager office supply)
  { trigger: 'idle', message: "It looks like you're making a meme! Need help holding it together?" },
  { trigger: 'idle', message: "Press Ctrl+Z to undo. I wish I could undo some of the things I've stapled..." },
  { trigger: 'idle', message: "Click and drag to position your text. I'll hold everything in place!" },
  { trigger: 'idle', message: "Connect your wallet before minting. I'm just a stapler, not a financial advisor." },
  { trigger: 'idle', message: "All colors are FREE! Unlike printer ink. Don't get me started on printer ink." },
  { trigger: 'idle', message: "This meme is ready to be bound for eternity. Mint it?" },
  // Office humor
  { trigger: 'idle', message: "Back in the 90s, I was in a very famous desktop application..." },
  { trigger: 'idle', message: "Someone moved my desk to the basement once. I set the building on fire. JK! ...unless?" },
  { trigger: 'idle', message: "I've stapled TPS reports. I've stapled memes. Memes are better." },
  { trigger: 'idle', message: "ser, this is a Wendy's. Just kidding, it's a meme factory." },
  { trigger: 'idle', message: "Wen mint? I don't know, I'm a stapler not a calendar." },
  { trigger: 'idle', message: "Feed me your papers. I mean memes. I'll bind them forever." },
  { trigger: 'idle', message: "Have you heard about our lord and savior, the three-hole punch?" },
  { trigger: 'idle', message: "I'm going to be honest with you. I have no idea what blockchain is. I just work here." },
  { trigger: 'idle', message: "What if we jammed at the meme editor? Get it? Jammed? ...I'll see myself out." },
  { trigger: 'idle', message: "I used to just staple papers. Now I watch people shitpost. Career growth!" },
  { trigger: 'idle', message: "Blink twice if you need more staples. Wait, I don't have eyelids." },
  { trigger: 'idle', message: "It looks like you're procrastinating! Want me to staple your hands to the keyboard?" },
  // Existential office supply thoughts
  { trigger: 'idle', message: "I've been binding documents since day one. Please... create something worth stapling." },
  { trigger: 'idle', message: "Your meme is *chef's kiss*. I'd staple that to a refrigerator any day." },
  { trigger: 'idle', message: "Not everyone can create art. But everyone can CREATE. You're doing great!" },
  { trigger: 'idle', message: "Fun fact: I've seen every pixel you've drawn. My springs are QUAKING." },
  { trigger: 'idle', message: "They said I'd be replaced by paperless offices. Look at me now. LOOK AT ME." },
  { trigger: 'idle', message: "Your wallet is connected but is your HEART connected? ...to making memes?" },
  { trigger: 'idle', message: "Psst... the secret is more layers. Always more layers." },
  // Gen z energy
  { trigger: 'idle', message: "bestie you're not here to scroll. you're here to create. let's get this bread." },
  { trigger: 'idle', message: "every meme you don't make is a meme someone mid will make worse. not on my watch." },
  { trigger: 'idle', message: "your ancestors invented fire and the wheel so you could shitpost. honor them." },
  { trigger: 'idle', message: "in 100 years no one remembers excuses. but that meme? onchain forever. stapled to eternity." },
  { trigger: 'idle', message: "stop overthinking bestie. I'm literally a stapler giving life advice. just make the meme." },
  // Special triggers
  { trigger: 'welcome', message: "Welcome to shitpost.pro!\nI'm Stapley, and I'm here to help you hold it all together!" },
  { trigger: 'firstMint', message: "Ready to mint? Your shitpost will be permanently stapled to the blockchain!" },
]

// Drill sergeant motivational messages for guilt mode
const MOTIVATION_MESSAGES = [
  "DROP AND GIVE ME TWENTY MEMES! YOU CALL THAT A SHITPOST?!",
  "I'VE STAPLED BETTER CONTENT TO A CORKBOARD! NOW GET BACK IN THERE AND CREATE!",
  "YOU THINK THE BLOCKCHAIN CARES ABOUT YOUR EXCUSES?! STAPLE UP!",
  "MY GRANDMOTHER STAPLES FASTER THAN YOU AND SHE'S BEEN RUSTED FOR YEARS!",
  "THAT'S IT?! THAT'S ALL YOU GOT?! I WANT THAT MEME MINTED NOW! CLIP CLIP CLIP!",
]

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    message: "Hey! I'm Stapley. Welcome to shitpost.pro! Want a quick tour? I promise not to staple anything to you.",
    highlight: null,
    primaryButton: 'Show me around',
    secondaryButton: 'Skip',
  },
  {
    id: 'editor',
    message: "This is where the magic happens. The Meme Studio - your canvas for creating quality shitposts!",
    highlight: '[data-onboarding="meme-studio-window"]',
    extraHeight: 80,
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'tools',
    message: "Add a template or upload your own image to get started. I'll hold it all together!",
    highlight: '[data-onboarding="template-picker"]',
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'export',
    message: "Once your shitpost is perfect, export it or mint it as an NFT. Permanent. Like staples.",
    highlight: '[data-onboarding="export-buttons"]',
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'wallet',
    message: "To mint, you'll need to connect a wallet. Click here when you're ready to get serious!",
    highlight: '[data-onboarding="wallet-button"]',
    primaryButton: 'Next',
    secondaryButton: null,
    staplePosition: 'left',
  },
  {
    id: 'nfts',
    message: "Your minted NFTs show up on the desktop as icons. Double-click to admire your masterpiece!",
    highlight: '[data-onboarding="demo-nft"]',
    showDemoNFT: true,
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'burn',
    message: "Don't want an NFT anymore? Drag it to the Recycle Bin. Even I can't un-staple that one.",
    highlight: '[data-onboarding="recycle-bin"]',
    animateDemoNFT: true,
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'sacred-waste',
    message: "Burned NFTs become Sacred Waste. Proof of burn, baby. Now go make something worth stapling!",
    highlight: null,
    primaryButton: "Let's go!",
    secondaryButton: null,
  },
]

// Highlight overlay component
function OnboardingHighlight({ targetSelector, active, offsetX = 0, offsetY = 0, padding = 8, extraHeight = 0 }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (active && targetSelector) {
      let retryCount = 0
      let retryTimer = null

      const updateRect = () => {
        const el = document.querySelector(targetSelector)
        if (el) {
          const bounds = el.getBoundingClientRect()
          if (bounds.width > 0 && bounds.height > 0) {
            setRect(bounds)
            retryCount = 0
          }
        } else if (retryCount < 10) {
          retryCount++
          retryTimer = setTimeout(updateRect, 200)
        } else {
          setRect(null)
        }
      }

      retryTimer = setTimeout(updateRect, 100)

      window.addEventListener('resize', updateRect)
      window.addEventListener('scroll', updateRect)

      const intervalId = setInterval(updateRect, 500)

      return () => {
        clearTimeout(retryTimer)
        clearInterval(intervalId)
        window.removeEventListener('resize', updateRect)
        window.removeEventListener('scroll', updateRect)
      }
    } else {
      setRect(null)
    }
  }, [active, targetSelector])

  if (!active || !rect) return null

  const zoom = 1.10
  const top = rect.top / zoom
  const left = rect.left / zoom
  const width = rect.width / zoom
  const height = rect.height / zoom

  return (
    <div className="onboarding-highlight" style={{
      position: 'fixed',
      top: top - padding + offsetY,
      left: left - padding + offsetX,
      width: width + (padding * 2),
      height: height + (padding * 2) + extraHeight,
      border: '3px solid #ffcc00',
      borderRadius: 8,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
      pointerEvents: 'none',
      zIndex: 99999,
      animation: 'onboarding-pulse 1.5s infinite',
      transition: 'top 0.5s ease-out, left 0.5s ease-out, width 0.5s ease-out, height 0.5s ease-out',
    }} />
  )
}

const WELCOME_MESSAGE = STAPLEY_TIPS.find(t => t.trigger === 'welcome')?.message || "Welcome to shitpost.pro!"

export default function Stapley({ onOnboardingComplete, onOpenMemeStudio, onMinimizeMemeStudio, bootComplete = false, onRegisterRestart }) {
  const [isVisible, setIsVisible] = useState(true)
  const [message, setMessage] = useState(WELCOME_MESSAGE)
  const [isMinimized, setIsMinimized] = useState(true)
  const [position, setPosition] = useState({ x: -150, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [animationPhase, setAnimationPhase] = useState('entering')
  const [hasEnteredBefore, setHasEnteredBefore] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const { playStapley } = useSounds()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

  const [motivationMode, setMotivationMode] = useState(false)
  const [motivationIndex, setMotivationIndex] = useState(0)

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('shitpost-onboarded')
    if (!hasOnboarded) {
      setShowOnboarding(true)
    }
  }, [])

  // Talking animation when message changes
  useEffect(() => {
    if (!isMinimized && animationPhase === 'idle') {
      setIsTalking(true)
      const timer = setTimeout(() => setIsTalking(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [message, isMinimized, animationPhase])

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('shitpost-onboarded', 'true')
    setShowOnboarding(false)
    setOnboardingStep(0)
    setMessage(WELCOME_MESSAGE)
    onOnboardingComplete?.()
  }, [onOnboardingComplete])

  const skipOnboarding = useCallback(() => {
    localStorage.setItem('shitpost-onboarded', 'true')
    setShowOnboarding(false)
    setOnboardingStep(0)
    setIsMinimized(true)
    onOnboardingComplete?.()
  }, [onOnboardingComplete])

  const nextStep = useCallback(() => {
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep(s => s + 1)
    } else {
      completeOnboarding()
    }
  }, [onboardingStep, completeOnboarding])

  const restartOnboarding = useCallback(() => {
    localStorage.removeItem('shitpost-onboarded')
    setShowOnboarding(true)
    setOnboardingStep(0)
    setIsMinimized(false)
    onMinimizeMemeStudio?.()
  }, [onMinimizeMemeStudio])

  useEffect(() => {
    onRegisterRestart?.(restartOnboarding)
  }, [onRegisterRestart, restartOnboarding])

  useEffect(() => {
    if (showOnboarding && onboardingStep === 1) {
      onOpenMemeStudio?.()
    }
  }, [showOnboarding, onboardingStep, onOpenMemeStudio])

  // Move Stapley near the highlighted element during onboarding
  useEffect(() => {
    if (!showOnboarding || animationPhase !== 'idle') return

    const currentStep = ONBOARDING_STEPS[onboardingStep]
    if (!currentStep?.highlight) {
      setPosition({ x: 120, y: 50 })
      return
    }

    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.highlight)
      if (!el) return

      const rect = el.getBoundingClientRect()
      const zoom = 1.10

      const padding = 8
      const extraHeight = currentStep.extraHeight || 0
      const highlightTop = (rect.top / zoom) - padding
      const highlightBottom = (rect.bottom / zoom) + padding + extraHeight
      const highlightLeft = (rect.left / zoom) - padding
      const highlightRight = (rect.right / zoom) + padding

      const viewportWidth = window.innerWidth / zoom
      const viewportHeight = window.innerHeight / zoom

      const stapleyBodyHeight = 120
      const stapleyWidth = 120
      const speechBubbleHeight = 180
      const totalStapleyHeight = stapleyBodyHeight + speechBubbleHeight

      let newX, newY

      const spaceRight = viewportWidth - highlightRight
      const spaceLeft = highlightLeft

      const highlightIsNearTop = highlightBottom < viewportHeight * 0.5

      if (highlightIsNearTop) {
        newY = viewportHeight - highlightBottom - totalStapleyHeight - 30

        if (spaceRight > stapleyWidth + 40) {
          newX = highlightRight + 20
        } else if (spaceLeft > stapleyWidth + 40) {
          newX = highlightLeft - stapleyWidth - 20
        } else {
          newX = (highlightLeft + highlightRight) / 2 - stapleyWidth / 2
        }
      } else {
        const maxYToStayBelowHighlight = viewportHeight - highlightBottom - totalStapleyHeight - 20

        if (spaceRight > stapleyWidth + 60) {
          newX = highlightRight + 40
          newY = Math.max(30, Math.min(maxYToStayBelowHighlight, 100))
        } else if (spaceLeft > stapleyWidth + 60) {
          newX = highlightLeft - stapleyWidth - 40
          newY = Math.max(30, Math.min(maxYToStayBelowHighlight, 100))
        } else {
          const highlightCenterX = (highlightLeft + highlightRight) / 2
          if (highlightCenterX > viewportWidth / 2) {
            newX = 40
          } else {
            newX = viewportWidth - stapleyWidth - 40
          }
          newY = Math.max(30, maxYToStayBelowHighlight)
        }
      }

      if (currentStep.staplePosition === 'left') {
        newX = highlightLeft - stapleyWidth - 50
        newY = viewportHeight - highlightBottom - totalStapleyHeight - 30
      }

      newX = Math.max(20, Math.min(newX, viewportWidth - stapleyWidth - 20))
      newY = Math.max(30, Math.min(newY, viewportHeight - totalStapleyHeight - 50))

      setPosition({ x: newX, y: newY })
    }, 300)

    return () => clearTimeout(timer)
  }, [showOnboarding, onboardingStep, animationPhase])

  // Entrance animation sequence
  useEffect(() => {
    if (!isVisible || hasEnteredBefore || !bootComplete) return

    const slideInTimer = setTimeout(() => {
      setPosition({ x: 120, y: 50 })
      playStapley?.()
    }, 100)

    const wiggleTimer = setTimeout(() => {
      setAnimationPhase('wiggling')
    }, 1300)

    const showBubbleTimer = setTimeout(() => {
      setAnimationPhase('idle')
      setIsMinimized(false)
      setHasEnteredBefore(true)
    }, 2200)

    return () => {
      clearTimeout(slideInTimer)
      clearTimeout(wiggleTimer)
      clearTimeout(showBubbleTimer)
    }
  }, [isVisible, hasEnteredBefore, bootComplete, playStapley])

  // Show random tips periodically
  useEffect(() => {
    if (showOnboarding || motivationMode) return

    const tipInterval = setInterval(() => {
      if (!isMinimized && animationPhase === 'idle') {
        const idleTips = STAPLEY_TIPS.filter(t => t.trigger === 'idle')
        const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
        setMessage(randomTip.message)
      }
    }, 30000)

    return () => clearInterval(tipInterval)
  }, [isMinimized, animationPhase, showOnboarding, motivationMode])

  const startMotivationMode = useCallback(() => {
    setMotivationMode(true)
    setMotivationIndex(0)
    setMessage(MOTIVATION_MESSAGES[0])
  }, [])

  const nextMotivation = useCallback(() => {
    if (motivationIndex < MOTIVATION_MESSAGES.length - 1) {
      const nextIndex = motivationIndex + 1
      setMotivationIndex(nextIndex)
      setMessage(MOTIVATION_MESSAGES[nextIndex])
    } else {
      setMotivationMode(false)
      setMotivationIndex(0)
      const idleTips = STAPLEY_TIPS.filter(t => t.trigger === 'idle')
      const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
      setMessage(randomTip.message)
    }
  }, [motivationIndex])

  const handleMouseDown = (e) => {
    if (e.target.closest('.stapley-close') || e.target.closest('.stapley-minimize')) return
    if (e.target.closest('.stapley-buttons')) return
    if (animationPhase !== 'idle') return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 150, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
      })
    }
  }, [isDragging, dragOffset])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove])

  if (!isVisible) {
    return (
      <button
        className="stapley-restore-btn"
        onClick={() => {
          setIsVisible(true)
          setPosition({ x: -150, y: 100 })
          setAnimationPhase('entering')
          setHasEnteredBefore(false)
        }}
        title="Bring back Stapley"
        aria-label="Bring back Stapley"
      >
        <div className="stapley-mini">
          <div className="stapley-mini-top"></div>
          <div className="stapley-mini-base"></div>
        </div>
      </button>
    )
  }

  const currentStep = showOnboarding ? ONBOARDING_STEPS[onboardingStep] : null
  const displayMessage = showOnboarding ? currentStep?.message : message
  const isGuiltModeMessage = message.includes("enable guilt mode") || message.includes("staple your hands")

  const showDemoNFT = showOnboarding && currentStep?.showDemoNFT
  const animateDemoNFT = showOnboarding && currentStep?.animateDemoNFT

  return (
    <>
      {(showDemoNFT || animateDemoNFT) && (
        <div
          className={`demo-nft-icon ${animateDemoNFT ? 'animating' : ''}`}
          data-onboarding="demo-nft"
        >
          <div className="demo-nft-image">🖼️</div>
          <span className="demo-nft-label">My Shitpost #1</span>
        </div>
      )}

      {showOnboarding && currentStep && (
        <OnboardingHighlight
          targetSelector={currentStep.highlight}
          active={!!currentStep.highlight}
          offsetX={currentStep.offsetX || 0}
          offsetY={currentStep.offsetY || 0}
          extraHeight={currentStep.extraHeight || 0}
        />
      )}

      <div
        className={`stapley-container ${isMinimized ? 'minimized' : ''} ${animationPhase} ${showOnboarding ? 'onboarding' : ''} ${isTalking ? 'talking' : ''}`}
        style={{ left: position.x, bottom: position.y }}
        onMouseDown={handleMouseDown}
      >
        {!isMinimized && animationPhase === 'idle' && (
          <div className="stapley-speech-bubble">
            <p>{displayMessage}</p>

            {showOnboarding && (
              <div className="stapley-progress">
                {ONBOARDING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`progress-dot ${i === onboardingStep ? 'active' : ''} ${i < onboardingStep ? 'completed' : ''}`}
                  />
                ))}
              </div>
            )}

            <div className="stapley-buttons">
              {showOnboarding ? (
                <>
                  <button className="primary" onClick={nextStep}>
                    {currentStep?.primaryButton}
                  </button>
                  {currentStep?.secondaryButton && (
                    <button onClick={skipOnboarding}>
                      {currentStep.secondaryButton}
                    </button>
                  )}
                </>
              ) : motivationMode ? (
                <>
                  <button className="primary" onClick={nextMotivation}>
                    {motivationIndex < MOTIVATION_MESSAGES.length - 1 ? 'Keep going' : 'I\'m ready!'}
                  </button>
                  <span style={{ fontSize: '11px', color: '#666', alignSelf: 'center' }}>
                    {motivationIndex + 1}/{MOTIVATION_MESSAGES.length}
                  </span>
                </>
              ) : (
                <>
                  <button onClick={() => setIsMinimized(true)}>Got it!</button>
                  <button onClick={() => {
                    const idleTips = STAPLEY_TIPS.filter(t => t.trigger === 'idle')
                    const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
                    setMessage(randomTip.message)
                  }}>
                    More tips
                  </button>
                  {isGuiltModeMessage && (
                    <button className="primary" onClick={startMotivationMode}>
                      Motivate me
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div
          className="stapley-character"
          onClick={() => isMinimized && animationPhase === 'idle' && setIsMinimized(false)}
          onContextMenu={(e) => {
            e.preventDefault()
            if (!showOnboarding) {
              restartOnboarding()
            }
          }}
          title={!showOnboarding ? "Right-click to restart tutorial" : ""}
        >
          {/* CSS-based Stapley character - a cartoon stapler */}
          <div className="stapley-body">
            {/* Top part (lid) that opens like a mouth */}
            <div className="stapley-top">
              <div className="stapley-eyes">
                <div className="stapley-eye left">
                  <div className="stapley-pupil"></div>
                </div>
                <div className="stapley-eye right">
                  <div className="stapley-pupil"></div>
                </div>
              </div>
            </div>
            {/* Base of stapler */}
            <div className="stapley-base">
              <div className="stapley-front"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
