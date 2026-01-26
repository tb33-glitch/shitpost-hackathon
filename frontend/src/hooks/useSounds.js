import { useCallback, useRef, useEffect } from 'react'

// Windows 98 sound effect URLs (base64 encoded short sounds)
const SOUNDS = {
  // Click sound - short blip
  click: 'data:audio/wav;base64,UklGRl4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToAAAACAP7/AgD+/wIA/v8CAP7/AgD+/wIA/v8CAP7/AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAg==',

  // Error sound - deeper tone
  error: 'data:audio/wav;base64,UklGRoAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVwAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD+/wIA+v8GAO//EQDd/yMA0P81ALn/RwCk/1cAiv9oAHH/cwBb/34ARv+DADD/iAAg/4sAEP+OAAX/jgD+/o4A',

  // Success/ding sound
  success: 'data:audio/wav;base64,UklGRqQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYAAAABkAGQAZABkAFAAUABQAFAAQABAAEAAQAAwADAAMAAwACAAIAAgACAAEAAQABAAEAAIAAgACAAIAAQABAAEAAQAAgACAAIAAgAQAEAAQABAAGAAYABgAGAAcABwAHAAcABwAHAAcABwAGAAYABgAGAAUABQAFAAUABAAEAAQABAADAAMAAwADAA',

  // Startup chime
  startup: 'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YaAAAAAgAEAAYABwAIAAkACAAHAAYABQAEAAMAAwADAAQABQAGAAcACAAJAAmACgAKAAoACYAJAAiAB4AGgAWABIADgAKAAgACAAKAAwAEAAUABgAHAAgACQAKAAsAC4AMAAyADIAMgAwAC4ALAAoACQAIAAcABgAFAAQAAwACAAGAAQAAgAAAD4//D/6P/g/9j/0P/I/8D/uP+w/6j/oP+Y/5D/iP+A/',

  // Burn/fire crackle
  burn: 'data:audio/wav;base64,UklGRmYBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUIBAAACAPz/BgD4/wsA8v8SAOr/GgDi/yIA1/8rAMz/MwDA/zwAtP9FAKn/TACd/1QAkv9aAIf/YQB9/2YAc/9sAGn/cABg/3UAWP95AFD/fQBJ/4AASP+EAEf/hwBH/4kASv+LAE3/jABP/44AVf+OAFz/jQBj/4wAa/+KAHb/hwCA/4QAi/+BAJr/fACn/3cAtf9xAMP/awDR/2QA3/9dAO3/VgD7/04ACgBGABkAPgAoADYAOAAuAEcAJgBWAB4AZQAWAHQADgCCAAgAkAACAJ4A/f+rAPn/twD2/8IA8//NAPH/1wDv/+EA7v/qAO3/8gDs//oA7P8BAe3/BwHu/wwB7/8RAfH/FAHz/xcB9v8YAfj/GQH7/xgB/v8XAQEAFQEEABIBBwAPAQoACwENAAcBEAACARM=',

  // Mint/coin sound
  mint: 'data:audio/wav;base64,UklGRoQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWAAAAA/AH4AmwCwALwAvQC0AKEAhgBkAD0AFQD1/9b/vP+o/5n/kP+N/5D/mP+l/7f/zP/j//v/EgAqAEAAVABmAHQAfgCEAIYAhAB+AHUAaQBaAEkANgAjABEA//9',

  // Tool select
  select: 'data:audio/wav;base64,UklGRkYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSIAAAAgAEAAYABgAGAAYABAACAAAAAA4P/A/8D/wP/A/+D/AAA=',

  // Stapley entrance - stapler click/spring sound
  stapley: 'data:audio/wav;base64,UklGRpoBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXYBAAAAAAEAAwAHAA4AGAAkADMARABYAG4AhgCgALsA1wDzABABLQFKAWYBgQGbAbMByQHdAe4B/QEIAhACFQIXAhUCEAIHAvkB6AHUAbwBoQGCAWABOwETAegAvACOAF0AKQD0/77/h/9P/xf/4P6q/nb+RP4V/un9wf2d/X39Yv1M/Tv9MP0r/Sz9Mv0+/VD9aP2F/an90v0A/jP+a/6o/un+Lv93/8T/EwBmALsAEgFqAcMBHAJ1As0CIwN3A8kDFwRiBKkE7AQqBWMFlgXDBeoFCgYkBjcGQgZGBkMGOAYmBgwG6gXBBZAFWAUZBdMEhgQyBNkDegMVA6sCPALJAVIB2ABbAN3/X//f/mH+4/1n/e38dvwD/Jb7L/vP+nf6J/rg+aP5cPlI+Sv5Gvka+Sb5Pvli+ZP50Pkb+nL61fo/+637Ifuc+xn8mfwb/Z79If6k/ib/pv8kAKAAGAGMAfoB',
}

export default function useSounds() {
  const audioContextRef = useRef(null)
  const enabledRef = useRef(true)

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }

    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])

  const playSound = useCallback((soundName) => {
    if (!enabledRef.current) return

    try {
      const audio = new Audio(SOUNDS[soundName])
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch (e) {
      // Ignore audio errors
    }
  }, [])

  const playClick = useCallback(() => playSound('click'), [playSound])
  const playError = useCallback(() => playSound('error'), [playSound])
  const playSuccess = useCallback(() => playSound('success'), [playSound])
  const playStartup = useCallback(() => playSound('startup'), [playSound])
  const playBurn = useCallback(() => playSound('burn'), [playSound])
  const playMint = useCallback(() => playSound('mint'), [playSound])
  const playSelect = useCallback(() => playSound('select'), [playSound])
  const playStapley = useCallback(() => playSound('stapley'), [playSound])

  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled
  }, [])

  return {
    playClick,
    playError,
    playSuccess,
    playStartup,
    playBurn,
    playMint,
    playSelect,
    playStapley,
    setEnabled,
  }
}
