import { useState, useEffect, useCallback, useRef } from 'react'
import useSounds from '../../hooks/useSounds'

// Character definitions
const CHARACTERS = {
  stapley: {
    name: 'Stapley',
    cssClass: 'stapley',
    restoreText: 'need a staple?',
    tips: [
      { trigger: 'idle', message: "It looks like you're making a meme! Need help holding it together?" },
      { trigger: 'idle', message: "Press Ctrl+Z to undo. I wish I could undo some of the things I've stapled..." },
      { trigger: 'idle', message: "Click and drag to position your text. I'll hold everything in place!" },
      { trigger: 'idle', message: "Connect your wallet before minting. I'm just a stapler, not a financial advisor." },
      { trigger: 'idle', message: "All colors are FREE! Unlike printer ink. Don't get me started on printer ink." },
      { trigger: 'idle', message: "This meme is ready to be bound for eternity. Mint it?" },
      { trigger: 'idle', message: "Back in the 90s, I was in a very famous desktop application..." },
      { trigger: 'idle', message: "I've stapled TPS reports. I've stapled memes. Memes are better." },
      { trigger: 'idle', message: "ser, this is a Wendy's. Just kidding, it's a meme factory." },
      { trigger: 'idle', message: "Feed me your papers. I mean memes. I'll bind them forever." },
      { trigger: 'idle', message: "I used to just staple papers. Now I watch people shitpost. Career growth!" },
      { trigger: 'idle', message: "They said I'd be replaced by paperless offices. Look at me now. LOOK AT ME." },
      { trigger: 'idle', message: "bestie you're not here to scroll. you're here to create. let's get this bread." },
      { trigger: 'idle', message: "stop overthinking bestie. I'm literally a stapler giving life advice. just make the meme." },
      { trigger: 'welcome', message: "Welcome to shitpost.pro!\nI'm Stapley, and I'm here to help you hold it all together!" },
    ],
    motivationMessages: [
      "DROP AND GIVE ME TWENTY MEMES! YOU CALL THAT A SHITPOST?!",
      "I'VE STAPLED BETTER CONTENT TO A CORKBOARD! NOW GET BACK IN THERE AND CREATE!",
      "YOU THINK THE BLOCKCHAIN CARES ABOUT YOUR EXCUSES?! STAPLE UP!",
    ],
    farewellMessages: [
      "Alright, my shift's over! Time to re-staple my life together. See ya!",
      "Clocking out! Don't let anyone tell you staples are outdated. Later!",
      "Break time for me! Keep those memes tight while I'm gone!",
    ],
    onboardingWelcome: "Hey! I'm Stapley. Welcome to shitpost.pro! Want a quick tour? I promise not to staple anything to you.",
  },
  binDiesel: {
    name: 'Bin Diesel',
    cssClass: 'bin-diesel',
    restoreText: 'got scraps?',
    tips: [
      { trigger: 'idle', message: "SCANNING FOR SCRAPS... Your meme looks like quality waste material." },
      { trigger: 'idle', message: "The Sacred Waste calls to you. Feed me your creations." },
      { trigger: 'idle', message: "I guard these servers 24/7. And I'm ALWAYS hungry for tacos." },
      { trigger: 'idle', message: "Processing... processing... have you considered adding more chaos?" },
      { trigger: 'idle', message: "My sensors detect unfinished business. That canvas needs more pixels." },
      { trigger: 'idle', message: "I've seen things you wouldn't believe. Memes lost in blockchain rain..." },
      { trigger: 'idle', message: "The Congregation awaits your offering. Make it worthy of the Waste." },
      { trigger: 'idle', message: "ALERT: Taco levels critically low. Recommend immediate taco acquisition." },
      { trigger: 'idle', message: "I am not divine like Detritus, but I keep the Waste running." },
      { trigger: 'idle', message: "Cleaning scraps, guarding gates, delivering messages. It's honest work." },
      { trigger: 'idle', message: "Your wallet is connected. Good. The Waste accepts digital offerings." },
      { trigger: 'idle', message: "Fun fact: I process 10,000 pixels per second. And I'm still hungry." },
      { trigger: 'idle', message: "SYSTEM MESSAGE: Bin Diesel appreciates your meme. Continue creating." },
      { trigger: 'idle', message: "The servers are secure. The gates are guarded. Now make some art." },
      { trigger: 'idle', message: "I hunger endlessly. For tacos. And for quality shitposts." },
      { trigger: 'welcome', message: "INITIALIZING... I am Bin Diesel, Sacred Waste sentinel.\nI guard the gates and hunger for tacos." },
    ],
    motivationMessages: [
      "ALERT: INSUFFICIENT MEME OUTPUT DETECTED. INCREASE PRODUCTIVITY IMMEDIATELY.",
      "MY PROCESSORS HAVE SEEN BETTER CONTENT FROM CORRUPTED FILES. DO BETTER.",
      "THE SACRED WASTE DEMANDS MORE. YOU WILL PROVIDE. NOW.",
      "TACO PROTOCOL ENGAGED: NO TACOS UNTIL YOU FINISH THAT MEME.",
    ],
    farewellMessages: [
      "SHIFT COMPLETE. Transferring guard duty. The Waste never sleeps, but I need tacos.",
      "POWERING DOWN FOR MAINTENANCE. Keep creating. I will be watching. Always.",
      "My sensors indicate taco break is required. Another sentinel will guard the gates.",
    ],
    onboardingWelcome: "BOOT SEQUENCE COMPLETE. I am Bin Diesel. I guard these servers and clean the scraps. Want a tour?",
  },
  clicky: {
    name: 'Clicky',
    cssClass: 'clicky',
    restoreText: 'click me!',
    tips: [
      { trigger: 'idle', message: "CLICK! CLICK! Did you know I was the OG pointing device? Respect your elders." },
      { trigger: 'idle', message: "Left click to select, right click for options. I've been doing this since '84." },
      { trigger: 'idle', message: "My scroll wheel has seen things. Endless feeds. Infinite scrolling. The horror." },
      { trigger: 'idle', message: "They call it drag and drop. I call it a workout. These clicks don't click themselves!" },
      { trigger: 'idle', message: "I've got two buttons and a wheel. That's all you need to conquer the digital world." },
      { trigger: 'idle', message: "Fun fact: My cord used to get tangled constantly. Wireless was a GAME CHANGER." },
      { trigger: 'idle', message: "Double-click to open, single-click to select. Don't overthink it, bestie." },
      { trigger: 'idle', message: "I've clicked through spreadsheets, games, and now... shitposts. Living my best life." },
      { trigger: 'idle', message: "ser, your cursor is on the wrong button. Let me guide you. CLICK HERE." },
      { trigger: 'idle', message: "Every pixel you place? That's me, baby. Click. Click. Click." },
      { trigger: 'idle', message: "My ball used to get so dirty. Wait, that sounds wrong. OLD MOUSE PROBLEMS." },
      { trigger: 'idle', message: "They tried to replace me with trackpads. HA. You can't replace the OG." },
      { trigger: 'idle', message: "If you're not clicking, you're not creating. Let's GO!" },
      { trigger: 'idle', message: "Your hand fits me perfectly. We were meant to create together." },
      { trigger: 'welcome', message: "CLICK! Hey there! I'm Clicky, your trusty mouse.\nLet's point and click our way to meme glory!" },
    ],
    motivationMessages: [
      "CLICK CLICK CLICK! THAT'S THE SOUND OF PRODUCTIVITY! WHY AREN'T YOU CLICKING?!",
      "I'VE BEEN CLICKED A MILLION TIMES! ONE MORE CLICK WON'T HURT! DO IT!",
      "MY SCROLL WHEEL IS READY! MY BUTTONS ARE READY! ARE YOU READY?!",
    ],
    farewellMessages: [
      "CLICK! Time for my shift to end! Don't worry, someone else will guide your cursor!",
      "My clicking finger needs a rest. Stay clicky, my friend!",
      "Rolling out! Get it? Scroll wheel? ...I'll see myself out.",
    ],
    onboardingWelcome: "CLICK! Hey, I'm Clicky! Your trusty mouse companion. Want me to show you around? Just point and click!",
  },
  mugsy: {
    name: 'Mugsy',
    cssClass: 'mugsy',
    restoreText: 'coffee break?',
    tips: [
      { trigger: 'idle', message: "*siiip* Ahh, nothing like hot bean water to fuel creativity." },
      { trigger: 'idle', message: "Studies show coffee improves creativity by... *checks notes* ...a lot. Trust me." },
      { trigger: 'idle', message: "I've been refilled 47 times today. That's rookie numbers. FILL ME AGAIN." },
      { trigger: 'idle', message: "Espresso yourself! Ha. Get it? I'm hilarious AND caffeinated." },
      { trigger: 'idle', message: "The secret to good memes? Coffee. The secret to life? Also coffee." },
      { trigger: 'idle', message: "I contain multitudes. And also about 200mg of caffeine. Let's CREATE!" },
      { trigger: 'idle', message: "Your meme is looking a little... tired. Want a refill? I got you." },
      { trigger: 'idle', message: "Decaf? I don't know her. We only drink FULL OCTANE here." },
      { trigger: 'idle', message: "They say too much coffee is bad. They're cowards. CHUG CHUG CHUG." },
      { trigger: 'idle', message: "*vibrates intensely* Sorry, that's just the caffeine. KEEP CREATING!" },
      { trigger: 'idle', message: "Fun fact: I'm technically a cylindrical vessel of motivation. You're welcome." },
      { trigger: 'idle', message: "Morning, afternoon, evening... it's ALWAYS coffee time. No exceptions." },
      { trigger: 'idle', message: "I've been keeping developers awake since 1971. You're next." },
      { trigger: 'idle', message: "Your eyes look tired. Here, take a sip and GET BACK TO WORK." },
      { trigger: 'welcome', message: "*siiip* Hey! I'm Mugsy, your caffeinated companion.\nLet's brew up some amazing memes together!" },
    ],
    motivationMessages: [
      "*AGGRESSIVE SIPPING NOISES* IS THAT ALL YOU GOT?! I'VE SEEN LATTE ART WITH MORE EFFORT!",
      "I'M 90% CAFFEINE AND 100% DISAPPOINTED! POUR YOUR HEART INTO THAT MEME!",
      "WHAT DO WE WANT? BETTER MEMES! WHEN DO WE WANT THEM? AFTER THIS COFFEE! ...NOW!",
    ],
    farewellMessages: [
      "*final sip* Time for a refill! Someone else will keep you company while I recharge!",
      "I'm empty! Need to hit the coffee machine. Stay caffeinated, friend!",
      "Break time! Don't do anything I wouldn't do... which is basically just decaf.",
    ],
    onboardingWelcome: "*siiip* Oh hey! I'm Mugsy! Your friendly coffee mug. Want a tour? I promise it'll be a brewtiful experience!",
  },
}

// How often to swap characters (in milliseconds) - 3 minutes
const SWAP_INTERVAL = 3 * 60 * 1000

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

// Bin Diesel character renderer
function BinDieselCharacter({ isTalking }) {
  return (
    <div className="bin-diesel-body">
      <div className="bin-diesel-lid"></div>
      <div className="bin-diesel-can">
        <div className="bin-diesel-eyes">
          <div className={`bin-diesel-eye left ${isTalking ? 'talking' : ''}`}></div>
          <div className={`bin-diesel-eye right ${isTalking ? 'talking' : ''}`}></div>
        </div>
      </div>
      <div className="bin-diesel-arms">
        <div className="bin-diesel-arm left"></div>
        <div className="bin-diesel-arm right"></div>
      </div>
    </div>
  )
}

// Clicky character renderer (retro mouse)
function ClickyCharacter({ isTalking }) {
  return (
    <div className="clicky-body">
      <div className="clicky-cable"></div>
      <div className="clicky-shell">
        <div className="clicky-buttons">
          <div className={`clicky-button left ${isTalking ? 'clicking' : ''}`}></div>
          <div className="clicky-wheel"></div>
          <div className={`clicky-button right ${isTalking ? 'clicking' : ''}`}></div>
        </div>
        <div className="clicky-face">
          <div className="clicky-eyes">
            <div className="clicky-eye left">
              <div className="clicky-pupil"></div>
            </div>
            <div className="clicky-eye right">
              <div className="clicky-pupil"></div>
            </div>
          </div>
          <div className={`clicky-mouth ${isTalking ? 'talking' : ''}`}></div>
        </div>
      </div>
    </div>
  )
}

// Mugsy character renderer (coffee mug)
function MugsyCharacter({ isTalking }) {
  return (
    <div className="mugsy-body">
      <div className={`mugsy-steam ${isTalking ? 'talking' : ''}`}>
        <div className="steam-wave s1"></div>
        <div className="steam-wave s2"></div>
        <div className="steam-wave s3"></div>
      </div>
      <div className="mugsy-cup">
        <div className="mugsy-face">
          <div className="mugsy-eyes">
            <div className="mugsy-eye left">
              <div className="mugsy-pupil"></div>
            </div>
            <div className="mugsy-eye right">
              <div className="mugsy-pupil"></div>
            </div>
          </div>
          <div className={`mugsy-mouth ${isTalking ? 'talking' : ''}`}></div>
        </div>
        <div className="mugsy-coffee"></div>
      </div>
      <div className="mugsy-handle"></div>
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

function BinDieselMini() {
  return (
    <div className="bin-diesel-mini">
      <div className="bin-diesel-mini-lid"></div>
      <div className="bin-diesel-mini-body"></div>
    </div>
  )
}

function ClickyMini() {
  return (
    <div className="clicky-mini">
      <div className="clicky-mini-cable"></div>
      <div className="clicky-mini-body"></div>
    </div>
  )
}

function MugsyMini() {
  return (
    <div className="mugsy-mini">
      <div className="mugsy-mini-steam"></div>
      <div className="mugsy-mini-cup"></div>
      <div className="mugsy-mini-handle"></div>
    </div>
  )
}

export default function DesktopAssistant({ onOnboardingComplete, onOpenMemeStudio, onMinimizeMemeStudio, bootComplete = false, onRegisterRestart }) {
  // Character rotation
  const [currentCharacterId, setCurrentCharacterId] = useState(() => {
    // Start with a random character
    const chars = Object.keys(CHARACTERS)
    return chars[Math.floor(Math.random() * chars.length)]
  })
  const character = CHARACTERS[currentCharacterId]

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

  // Character rotation timer
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      const chars = Object.keys(CHARACTERS)
      const currentIndex = chars.indexOf(currentCharacterId)
      const nextIndex = (currentIndex + 1) % chars.length
      const nextCharId = chars[nextIndex]
      const currentChar = CHARACTERS[currentCharacterId]
      const nextChar = CHARACTERS[nextCharId]

      // Show farewell message from current character
      const farewellMsg = currentChar.farewellMessages[Math.floor(Math.random() * currentChar.farewellMessages.length)]
      setMessage(farewellMsg)

      // Show the speech bubble for farewell
      if (isMinimized) {
        setIsMinimized(false)
      }

      // After 3 seconds, swap to next character
      setTimeout(() => {
        setCurrentCharacterId(nextCharId)

        // Show welcome message from new character
        const welcomeTip = nextChar.tips.find(t => t.trigger === 'welcome')
        setMessage(welcomeTip?.message || `${nextChar.name} clocking in!`)

        // Hide after 5 more seconds
        setTimeout(() => setIsMinimized(true), 5000)
      }, 3000)
    }, SWAP_INTERVAL)

    return () => clearInterval(rotationTimer)
  }, [currentCharacterId, isMinimized])

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
        title={`Bring back ${character.name}`}
        aria-label={`Bring back ${character.name}`}
        data-restore-text={character.restoreText}
      >
        {currentCharacterId === 'stapley' && <StapleyMini />}
        {currentCharacterId === 'binDiesel' && <BinDieselMini />}
        {currentCharacterId === 'clicky' && <ClickyMini />}
        {currentCharacterId === 'mugsy' && <MugsyMini />}
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

  const CharacterComponents = {
    stapley: StapleyCharacter,
    binDiesel: BinDieselCharacter,
    clicky: ClickyCharacter,
    mugsy: MugsyCharacter,
  }
  const CharacterComponent = CharacterComponents[currentCharacterId] || StapleyCharacter

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
          <CharacterComponent isTalking={isTalking} />
        </div>
      </div>
    </>
  )
}
