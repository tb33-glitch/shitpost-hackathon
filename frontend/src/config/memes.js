// Meme templates - each meme has a base image generator and text zones
// Text zones define where captions can be placed

export const MEME_TEMPLATES = [
  {
    id: 'drake',
    name: 'Drake',
    description: 'Disapprove / Approve format',
    textZones: [
      { id: 'top', label: 'Bad thing', x: 64, y: 20, width: 60, align: 'center' },
      { id: 'bottom', label: 'Good thing', x: 64, y: 84, width: 60, align: 'center' },
    ],
    generate: (ctx) => {
      // Top half - Drake disapproving (hand out)
      ctx.fillStyle = '#FFE4C4'
      // Face top
      ctx.fillRect(8, 8, 48, 48)
      // Hair
      ctx.fillStyle = '#000000'
      ctx.fillRect(8, 8, 48, 12)
      // Eyes
      ctx.fillRect(16, 24, 8, 4)
      ctx.fillRect(36, 24, 8, 4)
      // Mouth (frown)
      ctx.fillRect(20, 40, 16, 2)
      // Hand blocking
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(48, 24, 16, 24)
      // Arm
      ctx.fillStyle = '#FFA500'
      ctx.fillRect(48, 48, 16, 8)

      // Divider line
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 62, 128, 4)

      // Bottom half - Drake approving (pointing)
      ctx.fillStyle = '#FFE4C4'
      // Face bottom
      ctx.fillRect(8, 72, 48, 48)
      // Hair
      ctx.fillStyle = '#000000'
      ctx.fillRect(8, 72, 48, 12)
      // Eyes
      ctx.fillRect(16, 88, 8, 4)
      ctx.fillRect(36, 88, 8, 4)
      // Smile
      ctx.fillRect(20, 100, 4, 2)
      ctx.fillRect(24, 102, 8, 2)
      ctx.fillRect(32, 100, 4, 2)
      // Hand pointing
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(48, 88, 12, 8)
      ctx.fillRect(56, 92, 8, 4)
    },
  },
  {
    id: 'brain',
    name: 'Expanding Brain',
    description: '4 levels of enlightenment',
    textZones: [
      { id: 'text1', label: 'Level 1', x: 64, y: 12, width: 56, align: 'center' },
      { id: 'text2', label: 'Level 2', x: 64, y: 44, width: 56, align: 'center' },
      { id: 'text3', label: 'Level 3', x: 64, y: 76, width: 56, align: 'center' },
      { id: 'text4', label: 'Level 4', x: 64, y: 108, width: 56, align: 'center' },
    ],
    generate: (ctx) => {
      // 4 rows with increasingly glowing brains
      const rows = [
        { y: 4, glow: 0, size: 16 },
        { y: 36, glow: 1, size: 18 },
        { y: 68, glow: 2, size: 20 },
        { y: 100, glow: 3, size: 24 },
      ]

      rows.forEach(({ y, glow, size }) => {
        const x = 8
        // Brain base
        ctx.fillStyle = '#FFB6C1'
        ctx.fillRect(x, y, size, size - 4)

        // Brain details
        ctx.fillStyle = '#FF69B4'
        ctx.fillRect(x + 2, y + 2, 4, 4)
        ctx.fillRect(x + size - 6, y + 2, 4, 4)

        // Glow effect
        if (glow > 0) {
          ctx.fillStyle = glow === 1 ? '#FFFF00' : glow === 2 ? '#00FFFF' : '#FFFFFF'
          // Rays
          for (let i = 0; i < glow * 2 + 2; i++) {
            ctx.fillRect(x - 4 + i * 6, y - 2, 2, 2)
            ctx.fillRect(x - 4 + i * 6, y + size - 2, 2, 2)
          }
        }

        // Divider
        if (y < 100) {
          ctx.fillStyle = '#C0C0C0'
          ctx.fillRect(0, y + size + 8, 128, 2)
        }
      })
    },
  },
  {
    id: 'buttons',
    name: 'Two Buttons',
    description: 'The hardest choice',
    textZones: [
      { id: 'left', label: 'Button 1', x: 32, y: 20, width: 28, align: 'center' },
      { id: 'right', label: 'Button 2', x: 96, y: 20, width: 28, align: 'center' },
    ],
    generate: (ctx) => {
      // Background
      ctx.fillStyle = '#404040'
      ctx.fillRect(0, 0, 128, 128)

      // Two red buttons
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(12, 8, 40, 32)
      ctx.fillRect(76, 8, 40, 32)

      // Button highlights
      ctx.fillStyle = '#FF6666'
      ctx.fillRect(14, 10, 36, 4)
      ctx.fillRect(78, 10, 36, 4)

      // Sweating guy
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(40, 56, 48, 48)
      // Hair
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(40, 56, 48, 12)
      // Eyes (stressed)
      ctx.fillStyle = '#000000'
      ctx.fillRect(48, 72, 8, 6)
      ctx.fillRect(68, 72, 8, 6)
      // Sweat drops
      ctx.fillStyle = '#00BFFF'
      ctx.fillRect(44, 68, 4, 6)
      ctx.fillRect(88, 70, 4, 6)
      ctx.fillRect(92, 76, 4, 6)
      // Worried mouth
      ctx.fillStyle = '#000000'
      ctx.fillRect(56, 88, 16, 2)
    },
  },
  {
    id: 'doge',
    name: 'Doge',
    description: 'Much wow. Very meme.',
    textZones: [
      { id: 'wow', label: 'wow', x: 100, y: 16, width: 24, align: 'center' },
      { id: 'such', label: 'such X', x: 20, y: 48, width: 32, align: 'center' },
      { id: 'very', label: 'very Y', x: 96, y: 80, width: 28, align: 'center' },
      { id: 'much', label: 'much Z', x: 24, y: 104, width: 32, align: 'center' },
    ],
    generate: (ctx) => {
      // Background
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, 128, 128)

      // Doge body (shiba inu colors)
      ctx.fillStyle = '#DAA520'
      ctx.fillRect(32, 40, 64, 72)

      // Face (lighter)
      ctx.fillStyle = '#F5DEB3'
      ctx.fillRect(40, 48, 48, 40)

      // Ears
      ctx.fillStyle = '#DAA520'
      ctx.fillRect(32, 32, 16, 24)
      ctx.fillRect(80, 32, 16, 24)

      // Eyes
      ctx.fillStyle = '#000000'
      ctx.fillRect(48, 56, 8, 8)
      ctx.fillRect(72, 56, 8, 8)
      // Eye shine
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(50, 58, 2, 2)
      ctx.fillRect(74, 58, 2, 2)

      // Nose
      ctx.fillStyle = '#000000'
      ctx.fillRect(60, 72, 8, 6)

      // Mouth
      ctx.fillStyle = '#FF69B4'
      ctx.fillRect(56, 80, 16, 4)
    },
  },
  {
    id: 'thisisfine',
    name: 'This Is Fine',
    description: 'Everything is fine',
    textZones: [
      { id: 'text', label: 'This is fine.', x: 64, y: 108, width: 120, align: 'center' },
    ],
    generate: (ctx) => {
      // Room on fire
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(0, 80, 128, 48) // Floor
      ctx.fillStyle = '#D2691E'
      ctx.fillRect(0, 0, 128, 80) // Walls

      // Fire everywhere
      const fireColors = ['#FF0000', '#FF6600', '#FFFF00']
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = fireColors[i % 3]
        const x = (i * 17) % 120
        const y = (i * 13) % 60 + 8
        ctx.fillRect(x, y, 8, 12)
      }

      // Dog sitting at table
      // Table
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(32, 64, 64, 4)
      ctx.fillRect(36, 68, 8, 20)
      ctx.fillRect(84, 68, 8, 20)

      // Dog (simplified)
      ctx.fillStyle = '#F5DEB3'
      ctx.fillRect(48, 40, 32, 28)
      // Hat
      ctx.fillStyle = '#000000'
      ctx.fillRect(52, 32, 24, 8)
      // Eyes
      ctx.fillRect(54, 48, 6, 4)
      ctx.fillRect(68, 48, 6, 4)
      // Coffee cup
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(56, 60, 16, 8)
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(58, 56, 12, 4)
    },
  },
  {
    id: 'wojak',
    name: 'Wojak',
    description: 'That feel when...',
    textZones: [
      { id: 'tfw', label: 'tfw...', x: 64, y: 16, width: 100, align: 'center' },
    ],
    generate: (ctx) => {
      // Background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 128, 128)

      // Head shape
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(32, 28, 64, 80)

      // Bald head top
      ctx.fillRect(40, 24, 48, 8)

      // Eyes (sad)
      ctx.fillStyle = '#000000'
      ctx.fillRect(44, 52, 12, 2) // Left eyebrow
      ctx.fillRect(72, 52, 12, 2) // Right eyebrow
      ctx.fillRect(48, 58, 8, 8) // Left eye
      ctx.fillRect(72, 58, 8, 8) // Right eye

      // Sad mouth
      ctx.fillRect(52, 88, 4, 2)
      ctx.fillRect(56, 90, 16, 2)
      ctx.fillRect(72, 88, 4, 2)

      // Tears
      ctx.fillStyle = '#00BFFF'
      ctx.fillRect(44, 68, 4, 12)
      ctx.fillRect(80, 68, 4, 12)
    },
  },
  {
    id: 'stonks',
    name: 'Stonks',
    description: 'Profit!',
    textZones: [
      { id: 'top', label: 'When you...', x: 64, y: 12, width: 100, align: 'center' },
      { id: 'bottom', label: 'STONKS', x: 64, y: 116, width: 60, align: 'center' },
    ],
    generate: (ctx) => {
      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, 128, 128)

      // Graph going up
      ctx.fillStyle = '#00FF00'
      ctx.fillRect(8, 88, 8, 8)
      ctx.fillRect(20, 80, 8, 16)
      ctx.fillRect(32, 72, 8, 24)
      ctx.fillRect(44, 56, 8, 40)
      ctx.fillRect(56, 48, 8, 48)

      // Arrow going up
      ctx.fillStyle = '#00FF00'
      ctx.fillRect(68, 40, 4, 40)
      ctx.fillRect(60, 48, 8, 4)
      ctx.fillRect(72, 48, 8, 4)
      ctx.fillRect(64, 44, 8, 4)

      // Meme man head
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(80, 40, 40, 48)
      // Face features (surreal)
      ctx.fillStyle = '#000000'
      ctx.fillRect(88, 52, 8, 4)
      ctx.fillRect(104, 52, 8, 4)
      // Big nose
      ctx.fillStyle = '#DEB887'
      ctx.fillRect(96, 60, 8, 12)
      // Smile
      ctx.fillStyle = '#000000'
      ctx.fillRect(88, 76, 24, 2)
      ctx.fillRect(86, 74, 4, 2)
      ctx.fillRect(110, 74, 4, 2)
    },
  },
  {
    id: 'npc',
    name: 'NPC',
    description: 'Gray face meme',
    textZones: [
      { id: 'text', label: 'NPC dialogue', x: 64, y: 16, width: 100, align: 'center' },
    ],
    generate: (ctx) => {
      // Background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 128, 128)

      // Gray head
      ctx.fillStyle = '#808080'
      ctx.fillRect(32, 28, 64, 80)
      ctx.fillRect(40, 24, 48, 8)

      // Simple face
      ctx.fillStyle = '#404040'
      // Flat eyebrows
      ctx.fillRect(44, 52, 12, 2)
      ctx.fillRect(72, 52, 12, 2)
      // Dot eyes
      ctx.fillRect(48, 58, 8, 8)
      ctx.fillRect(72, 58, 8, 8)
      // Straight mouth
      ctx.fillRect(52, 88, 24, 2)
    },
  },
  {
    id: 'galaxy',
    name: 'Galaxy Brain',
    description: 'Transcendent thinking',
    textZones: [
      { id: 'text', label: 'Big brain move', x: 64, y: 108, width: 100, align: 'center' },
    ],
    generate: (ctx) => {
      // Space background
      ctx.fillStyle = '#000020'
      ctx.fillRect(0, 0, 128, 128)

      // Stars
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < 30; i++) {
        const x = (i * 37) % 128
        const y = (i * 23) % 100
        ctx.fillRect(x, y, 2, 2)
      }

      // Giant glowing brain
      ctx.fillStyle = '#FF00FF'
      ctx.fillRect(32, 24, 64, 56)
      ctx.fillStyle = '#FF66FF'
      ctx.fillRect(36, 28, 56, 48)
      ctx.fillStyle = '#FFAAFF'
      ctx.fillRect(44, 36, 40, 32)

      // Brain wrinkles
      ctx.fillStyle = '#FF00FF'
      ctx.fillRect(48, 40, 32, 2)
      ctx.fillRect(52, 48, 24, 2)
      ctx.fillRect(48, 56, 32, 2)

      // Glow rays
      ctx.fillStyle = '#FF00FF'
      ctx.fillRect(28, 48, 4, 8)
      ctx.fillRect(96, 48, 4, 8)
      ctx.fillRect(60, 16, 8, 8)
      ctx.fillRect(60, 80, 8, 8)
    },
  },
  {
    id: 'distracted',
    name: 'Distracted BF',
    description: 'Looking at something else',
    textZones: [
      { id: 'gf', label: 'GF', x: 104, y: 108, width: 24, align: 'center' },
      { id: 'bf', label: 'You', x: 64, y: 108, width: 24, align: 'center' },
      { id: 'other', label: 'Other', x: 24, y: 108, width: 24, align: 'center' },
    ],
    generate: (ctx) => {
      // Background (street)
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillStyle = '#606060'
      ctx.fillRect(0, 88, 128, 40)

      // Other girl (left, red dress)
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(8, 40, 24, 48)
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(12, 24, 16, 20)
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(12, 20, 16, 8)

      // Boyfriend (middle, looking left)
      ctx.fillStyle = '#0000FF'
      ctx.fillRect(48, 40, 24, 48)
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(52, 24, 16, 20)
      ctx.fillStyle = '#000000'
      ctx.fillRect(52, 24, 16, 6)
      // Eyes looking left
      ctx.fillRect(52, 32, 4, 4)

      // Girlfriend (right, upset)
      ctx.fillStyle = '#FF69B4'
      ctx.fillRect(88, 40, 24, 48)
      ctx.fillStyle = '#FFE4C4'
      ctx.fillRect(92, 24, 16, 20)
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(92, 20, 16, 8)
      // Angry eyebrows
      ctx.fillStyle = '#000000'
      ctx.fillRect(94, 30, 6, 2)
      ctx.fillRect(102, 30, 6, 2)
      // Frown
      ctx.fillRect(96, 38, 8, 2)
    },
  },
]

export default MEME_TEMPLATES
