import { useEffect } from 'react'
import './BlueScreen.css'

/**
 * Blue Screen of Death easter egg
 * Triggered by Konami code: up up down down left right left right B A
 */
export default function BlueScreen({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="bsod-overlay">
      <button className="bsod-close" onClick={onClose} title="Close">&times;</button>

      <div className="bsod-content">
        <p>A problem has been detected and shitpost has been shut down to prevent damage to your memes.</p>

        <p className="bsod-error">MEME_OVERFLOW_EXCEPTION</p>

        <p>If this is the first time you've seen this Stop error screen, restart your browser. If this screen appears again, follow these steps:</p>

        <p>Check to make sure any new memes or templates are properly installed. If this is a new installation, ask your meme dealer for any shitpost updates you might need.</p>

        <p>If problems continue, disable or remove any newly installed memes or stickers. Disable BIOS memory options such as caching or shadowing. If you need to use Safe Mode to remove or disable components, restart your browser, press F8 to select Advanced Startup Options, and then select Safe Mode.</p>

        <p className="bsod-technical">Technical information:</p>
        <p className="bsod-stop">*** STOP: 0xDEADBEEF (0x69420069, 0xBADC0DE, 0xCAFEBABE, 0x8008135)</p>
      </div>
    </div>
  )
}
