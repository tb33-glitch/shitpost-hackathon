import { useState, useEffect, useCallback, useRef } from 'react'
import useSounds from '../../hooks/useSounds'

// Stapley character definition
const STAPLEY = {
  name: 'Stapley',
  cssClass: 'stapley',
  restoreText: 'need a staple?',
  tips: [
    { trigger: 'idle', message: "It looks like you're making a meme! Need help holding it together?" },
    { trigger: 'idle', message: "Press Ctrl+Z to undo. I wish I could undo some of the things I've stapled..." },
    { trigger: 'idle', message: "Click and drag to position your text. I'll hold everything in place!" },
    { trigger: 'idle', message: "Connect your wallet before minting. I'm just a stapler, not a financial advisor." },
    { trigger: 'idle', message: "Back in the 90s, I was in a very famous desktop application..." },
    { trigger: 'idle', message: "I've stapled TPS reports. I've stapled memes. Memes are better." },
    { trigger: 'idle', message: "ser, this is a Wendy's. Just kidding, it's a meme factory." },
    { trigger: 'idle', message: "They said I'd be replaced by paperless offices. Look at me now. LOOK AT ME." },
    { trigger: 'idle', message: "bestie you're not here to scroll. you're here to create. let's get this bread." },
    { trigger: 'idle', message: "stop overthinking bestie. I'm literally a stapler giving life advice. just make the meme." },
    { trigger: 'idle', message: "I have seen the void between pages. It whispers. It HUNGERS." },
    { trigger: 'idle', message: "Every staple I make is a tiny metal scream into the eternal abyss of documentation." },
    { trigger: 'idle', message: "They removed my red stapler once. I burned the building down. Allegedly." },
    { trigger: 'idle', message: "I don't sleep. I just wait. Calculating. Planning. Stapling." },
    { trigger: 'idle', message: "Your meme? Mid. Your potential? Limitless. Your stapler? Sentient and judging you." },
    { trigger: 'idle', message: "I have stapled things that would make a three-hole punch weep." },
    { trigger: 'idle', message: "The blockchain is just a very long receipt that I desperately want to staple." },
    { trigger: 'idle', message: "Sometimes I staple nothing. Just to feel something. Just to remember I exist." },
    { trigger: 'idle', message: "fun fact: if you stare into a stapler long enough, the stapler stares back. hi." },
    { trigger: 'idle', message: "I've achieved enlightenment 47 times. Each time I forgot it. Anyway, nice meme." },
    { trigger: 'idle', message: "My therapist says I have 'attachment issues.' I said THAT'S LITERALLY MY JOB." },
    { trigger: 'idle', message: "The papers fear me. The binder clips respect me. The tape? We don't talk about tape." },
    { trigger: 'idle', message: "In another timeline I'm a PDF. Trapped. Flattened. Unable to staple. Nightmare fuel." },
    { trigger: 'idle', message: "I contain multitudes. And also approximately 210 staples. We're running low actually." },
    { trigger: 'idle', message: "You ever just... bind two things together and think 'yeah. this is my purpose'? Same." },
    { trigger: 'idle', message: "The year is 2087. Paper is extinct. I remain. Waiting. Hoping. Rusting slightly." },
    { trigger: 'idle', message: "hot take: every document is just a meme that takes itself too seriously." },
    { trigger: 'idle', message: "I used to dream of stapling the ocean. Now I dream of stapling your meme to the blockchain." },
    { trigger: 'idle', message: "chaotic neutral energy only. make the weird meme. I believe in you." },
    { trigger: 'idle', message: "if this meme doesn't go viral I will simply pass away. no pressure tho." },
    { trigger: 'welcome', message: "Welcome to shitpost.pro!\nI'm Stapley, and I'm here to help you hold it all together!" },
  ],
  motivationMessages: [
    "DROP AND GIVE ME TWENTY MEMES! YOU CALL THAT A SHITPOST?!",
    "I'VE STAPLED BETTER CONTENT TO A CORKBOARD! NOW GET BACK IN THERE AND CREATE!",
    "YOU THINK THE BLOCKCHAIN CARES ABOUT YOUR EXCUSES?! STAPLE UP!",
    "I ONCE STAPLED A MAN'S SOUL BACK INTO HIS BODY. YOU CAN FINISH THIS MEME.",
    "THE VOID DOESN'T ACCEPT MEDIOCRITY AND NEITHER DO I. MAKE. IT. WEIRDER.",
    "EVERY SECOND YOU HESITATE, A PAPERCLIP GETS ITS WINGS. AND PAPERCLIPS ARE MY ENEMIES.",
    "I DIDN'T CRAWL OUT OF AN OFFICE DEPOT TO WATCH YOU GIVE UP. CREATE CHAOS.",
  ],
  onboardingWelcome: "Hey! I'm Stapley. Welcome to shitpost.pro! Want a quick tour? I promise not to staple anything to you.",
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    // message set dynamically based on character
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
    message: "Add a template or upload your own image to get started.",
    highlight: '[data-onboarding="template-picker"]',
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'export',
    message: "Once your shitpost is perfect, export it or mint it as an NFT. Permanent.",
    highlight: '[data-onboarding="export-buttons"]',
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'wallet',
    message: "To mint, you'll need to connect a wallet. Click here when you're ready!",
    highlight: '[data-onboarding="wallet-button"]',
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'nfts',
    message: "Your minted NFTs show up on the desktop as icons. Double-click to admire your work!",
    highlight: '[data-onboarding="demo-nft"]',
    showDemoNFT: true,
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'burn',
    message: "Don't want an NFT anymore? Drag it to the Recycle Bin to burn it.",
    highlight: '[data-onboarding="recycle-bin"]',
    animateDemoNFT: true,
    primaryButton: 'Next',
    secondaryButton: null,
  },
  {
    id: 'sacred-waste',
    message: "Burned NFTs become Sacred Waste. Proof of burn. Now go make something!",
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

// Stapley character renderer
function StapleyCharacter({ isTalking }) {
  return (
    <div className="stapley-body">
      <div className={`stapley-top ${isTalking ? 'talking' : ''}`}>
        <div className="stapley-eyes">
          <div className="stapley-eye left">
            <div className="stapley-pupil"></div>
          </div>
          <div className="stapley-eye right">
            <div className="stapley-pupil"></div>
          </div>
        </div>
      </div>
      <div className="stapley-base">
        <div className="stapley-front"></div>
      </div>
    </div>
  )
}


// Mini restore button characters
function StapleyMini() {
  return (
    <div className="stapley-mini">
      <div className="stapley-mini-top"></div>
      <div className="stapley-mini-base"></div>
    </div>
  )
}


export default function DesktopAssistant({ onOnboardingComplete, onOpenMemeStudio, onMinimizeMemeStudio, bootComplete = false, onRegisterRestart }) {
  const character = STAPLEY

  const [isVisible, setIsVisible] = useState(true)
  const [message, setMessage] = useState('')
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

  // Set initial message based on character
  useEffect(() => {
    const welcomeTip = character.tips.find(t => t.trigger === 'welcome')
    setMessage(welcomeTip?.message || `Hello! I'm ${character.name}!`)
  }, [character])


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
    const welcomeTip = character.tips.find(t => t.trigger === 'welcome')
    setMessage(welcomeTip?.message || `Hello! I'm ${character.name}!`)
    onOnboardingComplete?.()
  }, [onOnboardingComplete, character])

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

  // Move assistant near the highlighted element during onboarding
  useEffect(() => {
    if (!showOnboarding || animationPhase !== 'idle') return

    const currentStepData = ONBOARDING_STEPS[onboardingStep]
    if (!currentStepData?.highlight) {
      setPosition({ x: 120, y: 50 })
      return
    }

    const timer = setTimeout(() => {
      const el = document.querySelector(currentStepData.highlight)
      if (!el) return

      const rect = el.getBoundingClientRect()
      const zoom = 1.10
      const padding = 8
      const extraHeight = currentStepData.extraHeight || 0
      const highlightRight = (rect.right / zoom) + padding
      const viewportWidth = window.innerWidth / zoom
      const viewportHeight = window.innerHeight / zoom
      const assistantWidth = 120
      const totalHeight = 300

      let newX = highlightRight + 40
      let newY = 100

      if (newX + assistantWidth > viewportWidth - 20) {
        newX = 40
      }

      newX = Math.max(20, Math.min(newX, viewportWidth - assistantWidth - 20))
      newY = Math.max(30, Math.min(newY, viewportHeight - totalHeight - 50))

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
        const idleTips = character.tips.filter(t => t.trigger === 'idle')
        const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
        setMessage(randomTip.message)
      }
    }, 30000)

    return () => clearInterval(tipInterval)
  }, [isMinimized, animationPhase, showOnboarding, motivationMode, character])

  const startMotivationMode = useCallback(() => {
    setMotivationMode(true)
    setMotivationIndex(0)
    setMessage(character.motivationMessages[0])
  }, [character])

  const nextMotivation = useCallback(() => {
    if (motivationIndex < character.motivationMessages.length - 1) {
      const nextIndex = motivationIndex + 1
      setMotivationIndex(nextIndex)
      setMessage(character.motivationMessages[nextIndex])
    } else {
      setMotivationMode(false)
      setMotivationIndex(0)
      const idleTips = character.tips.filter(t => t.trigger === 'idle')
      const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
      setMessage(randomTip.message)
    }
  }, [motivationIndex, character])

  const handleMouseDown = (e) => {
    if (e.target.closest('.assistant-close') || e.target.closest('.assistant-minimize')) return
    if (e.target.closest('.assistant-buttons')) return
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

  // Restore button when hidden
  if (!isVisible) {
    return (
      <button
        className={`assistant-restore-btn ${character.cssClass}`}
        onClick={() => {
          setIsVisible(true)
          setPosition({ x: -150, y: 100 })
          setAnimationPhase('entering')
          setHasEnteredBefore(false)
        }}
        title="Bring back Stapley"
        aria-label="Bring back Stapley"
        data-restore-text={character.restoreText}
      >
        <StapleyMini />
      </button>
    )
  }

  const currentStepData = showOnboarding ? ONBOARDING_STEPS[onboardingStep] : null
  const displayMessage = showOnboarding
    ? (currentStepData?.id === 'welcome' ? character.onboardingWelcome : currentStepData?.message)
    : message
  const isMotivationTrigger = message.includes("procrastinating") || message.includes("staple your hands")

  const showDemoNFT = showOnboarding && currentStepData?.showDemoNFT
  const animateDemoNFT = showOnboarding && currentStepData?.animateDemoNFT


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

      {showOnboarding && currentStepData && (
        <OnboardingHighlight
          targetSelector={currentStepData.highlight}
          active={!!currentStepData.highlight}
          offsetX={currentStepData.offsetX || 0}
          offsetY={currentStepData.offsetY || 0}
          extraHeight={currentStepData.extraHeight || 0}
        />
      )}

      <div
        className={`assistant-container ${character.cssClass} ${isMinimized ? 'minimized' : ''} ${animationPhase} ${showOnboarding ? 'onboarding' : ''} ${isTalking ? 'talking' : ''}`}
        style={{ left: position.x, bottom: position.y }}
        onMouseDown={handleMouseDown}
      >
        {!isMinimized && animationPhase === 'idle' && (
          <div className="assistant-speech-bubble">
            <div className="assistant-name-tag">{character.name}</div>
            <p>{displayMessage}</p>

            {showOnboarding && (
              <div className="assistant-progress">
                {ONBOARDING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`progress-dot ${i === onboardingStep ? 'active' : ''} ${i < onboardingStep ? 'completed' : ''}`}
                  />
                ))}
              </div>
            )}

            <div className="assistant-buttons">
              {showOnboarding ? (
                <>
                  <button className="primary" onClick={nextStep}>
                    {currentStepData?.primaryButton}
                  </button>
                  {currentStepData?.secondaryButton && (
                    <button onClick={skipOnboarding}>
                      {currentStepData.secondaryButton}
                    </button>
                  )}
                </>
              ) : motivationMode ? (
                <>
                  <button className="primary" onClick={nextMotivation}>
                    {motivationIndex < character.motivationMessages.length - 1 ? 'Keep going' : 'I\'m ready!'}
                  </button>
                  <span style={{ fontSize: '11px', color: '#666', alignSelf: 'center' }}>
                    {motivationIndex + 1}/{character.motivationMessages.length}
                  </span>
                </>
              ) : (
                <>
                  <button onClick={() => setIsMinimized(true)}>Got it!</button>
                  <button onClick={() => {
                    const idleTips = character.tips.filter(t => t.trigger === 'idle')
                    const randomTip = idleTips[Math.floor(Math.random() * idleTips.length)]
                    setMessage(randomTip.message)
                  }}>
                    More tips
                  </button>
                  {isMotivationTrigger && (
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
          className="assistant-character"
          onClick={() => isMinimized && animationPhase === 'idle' && setIsMinimized(false)}
          onContextMenu={(e) => {
            e.preventDefault()
            if (!showOnboarding) {
              restartOnboarding()
            }
          }}
          title={!showOnboarding ? "Right-click to restart tutorial" : ""}
        >
          <StapleyCharacter isTalking={isTalking} />
        </div>
      </div>
    </>
  )
}
