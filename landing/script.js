/**
 * shitpost.pro Landing Page
 *
 * Email Signup Configuration:
 * --------------------------
 * To connect to your email service, update the WAITLIST_ENDPOINT below.
 *
 * Options:
 * 1. Formspree (free, easy): https://formspree.io
 *    - Create form at formspree.io, get your endpoint
 *    - Set: WAITLIST_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'
 *
 * 2. Buttondown: https://buttondown.email
 *    - Set: WAITLIST_ENDPOINT = 'https://api.buttondown.email/v1/subscribers'
 *    - Add header: 'Authorization': 'Token YOUR_API_KEY'
 *
 * 3. Custom backend:
 *    - Set your own endpoint that accepts POST with { email: '...' }
 */

// Configure your email service endpoint here
const WAITLIST_ENDPOINT = null // Set to your endpoint URL

const form = document.getElementById('waitlist-form')
const messageEl = document.getElementById('form-message')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const emailInput = form.querySelector('input[name="email"]')
  const button = form.querySelector('button')
  const email = emailInput.value.trim()

  if (!email) return

  // If no endpoint configured, show instructions
  if (!WAITLIST_ENDPOINT) {
    showMessage('Email signup not configured yet. Follow us on X for updates!', 'error')
    return
  }

  // Loading state
  button.classList.add('loading')
  button.disabled = true

  try {
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (response.ok) {
      showMessage("You're on the list! We'll notify you at launch.", 'success')
      emailInput.value = ''
    } else {
      throw new Error('Signup failed')
    }
  } catch (error) {
    showMessage('Something went wrong. Please try again or follow us on X.', 'error')
  } finally {
    button.classList.remove('loading')
    button.disabled = false
  }
})

function showMessage(text, type) {
  messageEl.textContent = text
  messageEl.className = `form-message ${type}`
}

// Easter egg: Konami code
let konamiIndex = 0
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]

document.addEventListener('keydown', (e) => {
  if (e.keyCode === konamiCode[konamiIndex]) {
    konamiIndex++
    if (konamiIndex === konamiCode.length) {
      document.body.style.animation = 'hueRotate 2s linear infinite'
      konamiIndex = 0
    }
  } else {
    konamiIndex = 0
  }
})

// Add hue rotate animation
const style = document.createElement('style')
style.textContent = `
  @keyframes hueRotate {
    from { filter: hue-rotate(0deg); }
    to { filter: hue-rotate(360deg); }
  }
`
document.head.appendChild(style)
