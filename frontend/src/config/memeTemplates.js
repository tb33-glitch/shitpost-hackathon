// Meme Templates for shitpost.pro
// Each template has an image and defined text zones

export const TEMPLATE_CATEGORIES = {
  CLASSIC: 'classic',
  WOJAK: 'wojak',
  CRYPTO: 'crypto',
  COMMUNITY: 'community',
  RECENT: 'recent',
  LEADERBOARD: 'leaderboard',
}

export const CATEGORY_LABELS = {
  [TEMPLATE_CATEGORIES.CLASSIC]: 'Classic',
  [TEMPLATE_CATEGORIES.WOJAK]: 'Wojak/Pepe',
  [TEMPLATE_CATEGORIES.CRYPTO]: 'Crypto',
  [TEMPLATE_CATEGORIES.COMMUNITY]: 'Community',
  [TEMPLATE_CATEGORIES.RECENT]: 'Recent',
  [TEMPLATE_CATEGORIES.LEADERBOARD]: '🏆',
}

// Generate a placeholder SVG for templates without images yet
const generatePlaceholder = (text, color = '#667eea') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${color}"/>
    <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">${text}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Text zone positioning is in percentages (0-100) for responsive scaling
// Each zone: { id, x, y, width, height, defaultText, fontSize, align }
export const MEME_TEMPLATES = [
  // ==================== CLASSIC TEMPLATES ====================
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Drake', '#E91E63'),
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 75, y: 25, width: 45, height: 40, defaultText: 'Thing I hate', fontSize: 24, align: 'center' },
      { id: 'bottom', x: 75, y: 75, width: 45, height: 40, defaultText: 'Thing I love', fontSize: 24, align: 'center' },
    ],
  },
  {
    id: 'distracted-boyfriend',
    name: 'Distracted Boyfriend',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Distracted BF', '#9C27B0'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'girlfriend', x: 80, y: 50, width: 20, height: 30, defaultText: 'Responsibilities', fontSize: 16, align: 'center' },
      { id: 'boyfriend', x: 50, y: 50, width: 20, height: 30, defaultText: 'Me', fontSize: 16, align: 'center' },
      { id: 'other', x: 20, y: 50, width: 20, height: 30, defaultText: 'New thing', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'expanding-brain',
    name: 'Expanding Brain',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Brain Expand', '#673AB7'),
    aspectRatio: 0.75,
    textZones: [
      { id: 'small', x: 25, y: 12, width: 45, height: 20, defaultText: 'Normal idea', fontSize: 16, align: 'center' },
      { id: 'medium', x: 25, y: 37, width: 45, height: 20, defaultText: 'Better idea', fontSize: 16, align: 'center' },
      { id: 'large', x: 25, y: 62, width: 45, height: 20, defaultText: 'Big brain', fontSize: 16, align: 'center' },
      { id: 'galaxy', x: 25, y: 87, width: 45, height: 20, defaultText: 'Transcendent', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'is-this-pigeon',
    name: 'Is This a Pigeon?',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Pigeon?', '#3F51B5'),
    aspectRatio: 1.33,
    textZones: [
      { id: 'butterfly', x: 70, y: 20, width: 30, height: 20, defaultText: 'Obvious thing', fontSize: 16, align: 'center' },
      { id: 'person', x: 30, y: 60, width: 30, height: 20, defaultText: 'Confused person', fontSize: 16, align: 'center' },
      { id: 'caption', x: 50, y: 90, width: 80, height: 15, defaultText: 'Is this X?', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'woman-yelling-cat',
    name: 'Woman Yelling at Cat',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Yelling Cat', '#2196F3'),
    aspectRatio: 2,
    textZones: [
      { id: 'woman', x: 25, y: 15, width: 45, height: 25, defaultText: 'Person yelling', fontSize: 20, align: 'center' },
      { id: 'cat', x: 75, y: 15, width: 45, height: 25, defaultText: 'Confused cat', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'gru-plan',
    name: "Gru's Plan",
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder("Gru's Plan", '#03A9F4'),
    aspectRatio: 1,
    textZones: [
      { id: 'step1', x: 25, y: 25, width: 40, height: 20, defaultText: 'Step 1', fontSize: 14, align: 'center' },
      { id: 'step2', x: 75, y: 25, width: 40, height: 20, defaultText: 'Step 2', fontSize: 14, align: 'center' },
      { id: 'step3', x: 25, y: 75, width: 40, height: 20, defaultText: 'Wait what', fontSize: 14, align: 'center' },
      { id: 'step4', x: 75, y: 75, width: 40, height: 20, defaultText: 'Wait what', fontSize: 14, align: 'center' },
    ],
  },
  {
    id: 'change-my-mind',
    name: 'Change My Mind',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Change Mind', '#00BCD4'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'sign', x: 50, y: 70, width: 40, height: 20, defaultText: 'Hot take here', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'always-has-been',
    name: 'Always Has Been',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Always Been', '#009688'),
    aspectRatio: 1,
    textZones: [
      { id: 'question', x: 30, y: 20, width: 45, height: 20, defaultText: "Wait, it's all X?", fontSize: 16, align: 'center' },
      { id: 'answer', x: 70, y: 20, width: 45, height: 20, defaultText: 'Always has been', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'same-picture',
    name: "They're the Same Picture",
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Same Picture', '#4CAF50'),
    aspectRatio: 0.8,
    textZones: [
      { id: 'left', x: 25, y: 30, width: 30, height: 15, defaultText: 'Thing A', fontSize: 14, align: 'center' },
      { id: 'right', x: 65, y: 30, width: 30, height: 15, defaultText: 'Thing B', fontSize: 14, align: 'center' },
    ],
  },
  {
    id: 'two-buttons',
    name: 'Two Buttons',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Two Buttons', '#8BC34A'),
    aspectRatio: 1,
    textZones: [
      { id: 'left-btn', x: 30, y: 25, width: 25, height: 15, defaultText: 'Option A', fontSize: 12, align: 'center' },
      { id: 'right-btn', x: 55, y: 25, width: 25, height: 15, defaultText: 'Option B', fontSize: 12, align: 'center' },
    ],
  },
  {
    id: 'surprised-pikachu',
    name: 'Surprised Pikachu',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Pikachu', '#FFEB3B'),
    aspectRatio: 1.2,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'Does bad thing', fontSize: 18, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: 'Bad happens', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'this-is-fine',
    name: 'This Is Fine',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('This Is Fine', '#FFC107'),
    aspectRatio: 2,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'This is fine.', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'stonks',
    name: 'Stonks',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('STONKS', '#FF9800'),
    aspectRatio: 1.2,
    textZones: [
      { id: 'caption', x: 50, y: 85, width: 90, height: 20, defaultText: 'STONKS', fontSize: 28, align: 'center' },
    ],
  },
  {
    id: 'trade-offer',
    name: 'Trade Offer',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Trade Offer', '#FF5722'),
    aspectRatio: 0.8,
    textZones: [
      { id: 'receive', x: 25, y: 55, width: 40, height: 25, defaultText: 'I receive: Money', fontSize: 14, align: 'center' },
      { id: 'give', x: 75, y: 55, width: 40, height: 25, defaultText: 'You receive: Nothing', fontSize: 14, align: 'center' },
    ],
  },
  {
    id: 'bernie-asking',
    name: 'Bernie Asking',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: generatePlaceholder('Bernie', '#795548'),
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'I am once again asking', fontSize: 20, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: 'for your support', fontSize: 20, align: 'center' },
    ],
  },

  // ==================== WOJAK/PEPE TEMPLATES ====================
  {
    id: 'wojak-vs-chad',
    name: 'Wojak vs Chad',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Virgin Chad', '#607D8B'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'wojak', x: 25, y: 15, width: 40, height: 20, defaultText: 'Virgin take', fontSize: 16, align: 'center' },
      { id: 'chad', x: 75, y: 15, width: 40, height: 20, defaultText: 'Chad take', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'crying-wojak',
    name: 'Crying Wojak',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Crying', '#9E9E9E'),
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'When something sad happens', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'smug-pepe',
    name: 'Smug Pepe',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Smug Pepe', '#4CAF50'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Feels good man', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'sad-pepe',
    name: 'Sad Pepe',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Sad Pepe', '#2196F3'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Feels bad man', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'pepe-silvia',
    name: 'Pepe Silvia (Conspiracy)',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Conspiracy', '#FF5722'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'Me explaining my theory', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'yes-chad',
    name: 'Yes Chad',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Yes Chad', '#3F51B5'),
    aspectRatio: 1,
    textZones: [
      { id: 'question', x: 50, y: 15, width: 90, height: 20, defaultText: 'You really think X?', fontSize: 16, align: 'center' },
      { id: 'answer', x: 50, y: 85, width: 90, height: 20, defaultText: 'Yes.', fontSize: 24, align: 'center' },
    ],
  },
  {
    id: 'npc',
    name: 'NPC',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('NPC', '#9E9E9E'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'NPC dialogue here', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'doomer',
    name: 'Doomer',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Doomer', '#424242'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: "It's all so tiresome", fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'gigachad',
    name: 'Gigachad',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('GIGACHAD', '#212121'),
    aspectRatio: 0.8,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'Average enjoyer', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'soyjak-pointing',
    name: 'Soyjak Pointing',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Soyjak', '#FFEB3B'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 15, width: 90, height: 20, defaultText: 'OMG IS THAT A...', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'boomer-wojak',
    name: 'Boomer Wojak',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Boomer', '#795548'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: '30 year old boomer', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'zoomer-wojak',
    name: 'Zoomer Wojak',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Zoomer', '#E91E63'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Zoomer moment', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'wojak-brainlet',
    name: 'Wojak Brainlet',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Brainlet', '#FF9800'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Smooth brain moment', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'feels-good-man',
    name: 'Feels Good Man',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Feels Good', '#8BC34A'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Feels good man', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'bloomer',
    name: 'Bloomer',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: generatePlaceholder('Bloomer', '#CDDC39'),
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'Life is beautiful', fontSize: 18, align: 'center' },
    ],
  },

  // ==================== CRYPTO TEMPLATES ====================
  {
    id: 'ct-screenshot',
    name: 'CT Screenshot (Fake Tweet)',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Tweet', '#1DA1F2'),
    aspectRatio: 1.2,
    textZones: [
      { id: 'username', x: 30, y: 20, width: 50, height: 10, defaultText: '@cryptobro', fontSize: 14, align: 'left' },
      { id: 'tweet', x: 50, y: 50, width: 90, height: 40, defaultText: 'Trust me bro. NFA.', fontSize: 16, align: 'left' },
    ],
  },
  {
    id: 'price-chart-cope',
    name: 'Price Chart Cope',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Chart', '#4CAF50'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: "We're still early", fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'rug-pull',
    name: 'Rug Pull Announcement',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('RUGGED', '#F44336'),
    aspectRatio: 1,
    textZones: [
      { id: 'project', x: 50, y: 30, width: 80, height: 20, defaultText: '[PROJECT NAME]', fontSize: 20, align: 'center' },
      { id: 'status', x: 50, y: 70, width: 80, height: 20, defaultText: 'HAS BEEN RUGGED', fontSize: 24, align: 'center' },
    ],
  },
  {
    id: 'few-understand',
    name: 'Few Understand',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Few', '#9C27B0'),
    aspectRatio: 1,
    textZones: [
      { id: 'statement', x: 50, y: 40, width: 90, height: 40, defaultText: 'Complex thesis', fontSize: 16, align: 'center' },
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'Few understand.', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'gm-gn',
    name: 'GM/GN Post',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('GM', '#FF9800'),
    aspectRatio: 1,
    textZones: [
      { id: 'greeting', x: 50, y: 50, width: 90, height: 50, defaultText: 'GM', fontSize: 72, align: 'center' },
    ],
  },
  {
    id: 'probably-nothing',
    name: 'Probably Nothing',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Nothing', '#673AB7'),
    aspectRatio: 1.2,
    textZones: [
      { id: 'news', x: 50, y: 40, width: 90, height: 40, defaultText: 'Major announcement', fontSize: 16, align: 'center' },
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'Probably nothing', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'wagmi-ngmi',
    name: 'WAGMI/NGMI',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('WAGMI', '#4CAF50'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'wagmi', x: 25, y: 50, width: 40, height: 30, defaultText: 'WAGMI', fontSize: 24, align: 'center' },
      { id: 'ngmi', x: 75, y: 50, width: 40, height: 30, defaultText: 'NGMI', fontSize: 24, align: 'center' },
    ],
  },
  {
    id: 'ser',
    name: 'Ser...',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Ser...', '#607D8B'),
    aspectRatio: 1,
    textZones: [
      { id: 'message', x: 50, y: 50, width: 90, height: 50, defaultText: "Ser... this is a Wendy's", fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'touch-grass',
    name: 'Touch Grass',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Touch Grass', '#8BC34A'),
    aspectRatio: 1.2,
    textZones: [
      { id: 'advice', x: 50, y: 15, width: 90, height: 20, defaultText: 'You need to', fontSize: 20, align: 'center' },
      { id: 'action', x: 50, y: 85, width: 90, height: 20, defaultText: 'TOUCH GRASS', fontSize: 28, align: 'center' },
    ],
  },
  {
    id: 'down-bad',
    name: 'Down Bad Chart',
    category: TEMPLATE_CATEGORIES.CRYPTO,
    image: generatePlaceholder('Down Bad', '#F44336'),
    aspectRatio: 1.5,
    textZones: [
      { id: 'asset', x: 50, y: 15, width: 90, height: 15, defaultText: 'My portfolio', fontSize: 20, align: 'center' },
      { id: 'status', x: 50, y: 85, width: 90, height: 15, defaultText: 'Down bad', fontSize: 24, align: 'center' },
    ],
  },

  // ==================== COMMUNITY/HEMI TEMPLATES ====================
  {
    id: 'hemi-logo',
    name: 'Hemi Logo Meme',
    category: TEMPLATE_CATEGORIES.COMMUNITY,
    image: generatePlaceholder('HEMI', '#FF6B00'),
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'Building on', fontSize: 20, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: 'HEMI', fontSize: 32, align: 'center' },
    ],
  },
  {
    id: 'blank-square',
    name: 'Blank Canvas (Square)',
    category: TEMPLATE_CATEGORIES.COMMUNITY,
    image: generatePlaceholder('BLANK', '#FFFFFF'),
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 15, width: 90, height: 25, defaultText: 'Top text', fontSize: 28, align: 'center' },
      { id: 'bottom', x: 50, y: 85, width: 90, height: 25, defaultText: 'Bottom text', fontSize: 28, align: 'center' },
    ],
  },
  {
    id: 'blank-wide',
    name: 'Blank Canvas (Wide)',
    category: TEMPLATE_CATEGORIES.COMMUNITY,
    image: generatePlaceholder('WIDE', '#EEEEEE'),
    aspectRatio: 1.78,
    textZones: [
      { id: 'center', x: 50, y: 50, width: 90, height: 50, defaultText: 'Your text here', fontSize: 32, align: 'center' },
    ],
  },
  {
    id: 'custom-upload',
    name: 'Upload Your Own',
    category: TEMPLATE_CATEGORIES.COMMUNITY,
    image: null, // Special case - triggers file upload
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
    ],
    isCustomUpload: true,
  },
]

// Get templates by category
export const getTemplatesByCategory = (category) => {
  return MEME_TEMPLATES.filter(t => t.category === category)
}

// Get all categories with their templates
export const getTemplatesGrouped = () => {
  return Object.values(TEMPLATE_CATEGORIES).map(category => ({
    category,
    label: CATEGORY_LABELS[category],
    templates: getTemplatesByCategory(category),
  }))
}

// Get a single template by ID
export const getTemplateById = (id) => {
  return MEME_TEMPLATES.find(t => t.id === id)
}

// Load custom templates from admin-saved metadata.json and community registry
let customTemplates = []
let customTemplatesLoaded = false

export const loadCustomTemplates = async () => {
  if (customTemplatesLoaded) return customTemplates

  const loaded = []

  // Load from local metadata.json first (admin-curated templates)
  try {
    const response = await fetch('/templates/metadata.json')
    if (response.ok) {
      const metadata = await response.json()

      // Load templates category
      if (metadata.templates) {
        metadata.templates.forEach((item, index) => {
          loaded.push({
            id: `custom-template-${index}`,
            name: item.name || item.file.replace(/\.[^.]+$/, ''),
            category: TEMPLATE_CATEGORIES.COMMUNITY,
            image: `/templates/templates/${item.file}`,
            aspectRatio: 1,
            textZones: [
              { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
              { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
            ],
            tags: item.tags,
            sourceUrl: item.sourceUrl,
            isCustom: true,
          })
        })
      }

      // Load stickers
      if (metadata.stickers) {
        metadata.stickers.forEach((item, index) => {
          loaded.push({
            id: `custom-sticker-${index}`,
            name: item.name || item.file.replace(/\.[^.]+$/, ''),
            category: 'stickers',
            image: `/templates/stickers/${item.file}`,
            aspectRatio: 1,
            isSticker: true,
            tags: item.tags,
            sourceUrl: item.sourceUrl,
            isCustom: true,
          })
        })
      }

      // Load backgrounds
      if (metadata.backgrounds) {
        metadata.backgrounds.forEach((item, index) => {
          loaded.push({
            id: `custom-bg-${index}`,
            name: item.name || item.file.replace(/\.[^.]+$/, ''),
            category: TEMPLATE_CATEGORIES.COMMUNITY,
            image: `/templates/backgrounds/${item.file}`,
            aspectRatio: 1.78,
            textZones: [
              { id: 'center', x: 50, y: 50, width: 90, height: 50, defaultText: '', fontSize: 32, align: 'center' },
            ],
            isBackground: true,
            tags: item.tags,
            sourceUrl: item.sourceUrl,
            isCustom: true,
          })
        })
      }
    }
  } catch (e) {
    // Admin templates not found - expected in dev
  }

  // Load community-submitted templates from localStorage registry
  try {
    const registryData = localStorage.getItem('shitpost-template-registry')
    console.log('[TemplatePicker] Registry data:', registryData ? 'found' : 'not found')
    if (registryData) {
      const registry = JSON.parse(registryData)
      console.log('[TemplatePicker] Registry templates count:', registry.templates?.length || 0)
      const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

      if (registry.templates && Array.isArray(registry.templates)) {
        registry.templates.forEach((entry, index) => {
          // Get vote counts
          const templateId = `community-${entry.cid || index}`
          const votes = getTemplateVotes(templateId)
          const netVotes = votes.up - votes.down

          // Skip templates with 3+ downvotes (net score of -3 or worse)
          if (netVotes <= -3) {
            console.log('[TemplatePicker] Skipping downvoted template:', entry.name)
            return
          }

          // Handle both IPFS URLs and local data URLs
          let imageUrl
          if (entry.imageUrl) {
            // Local mode - data URL stored directly
            imageUrl = entry.imageUrl
            console.log('[TemplatePicker] Loading template with imageUrl:', entry.name)
          } else if (entry.imageCid?.startsWith('local-')) {
            // Legacy local mode - skip broken entries
            console.log('[TemplatePicker] Skipping legacy local template:', entry.name)
            return
          } else {
            // IPFS mode
            imageUrl = `https://${PINATA_GATEWAY}/ipfs/${entry.imageCid}`
          }

          const template = {
            id: `community-${entry.cid || index}`,
            name: entry.name,
            category: entry.category === 'templates' ? TEMPLATE_CATEGORIES.COMMUNITY : entry.category,
            image: imageUrl,
            aspectRatio: 1,
            textZones: getDefaultTextZonesForCategory(entry.category),
            tags: entry.tags || [],
            isCustom: true,
            isCommunity: true,
            isRecent: true,
            submittedBy: entry.submittedBy,
            displayName: entry.displayName,
            xp: entry.xp,
            submittedAt: entry.submittedAt,
            cid: entry.cid,
            votes: votes,
          }
          loaded.push(template)
        })
      }
    }
  } catch (e) {
    // No community templates found
  }

  customTemplates = loaded
  customTemplatesLoaded = true
  return loaded
}

// Helper function for text zones based on category
function getDefaultTextZonesForCategory(category) {
  switch (category) {
    case 'stickers':
      return []
    case 'backgrounds':
      return [
        { id: 'center', x: 50, y: 50, width: 90, height: 50, defaultText: '', fontSize: 32, align: 'center' },
      ]
    case 'templates':
    default:
      return [
        { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
        { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
      ]
  }
}

// Force reload of custom templates
export const reloadCustomTemplates = async () => {
  console.log('[reloadCustomTemplates] Resetting cache, localStorage:', localStorage.getItem('shitpost-template-registry')?.slice(0, 100) || 'EMPTY')
  customTemplatesLoaded = false
  customTemplates = []
  const result = await loadCustomTemplates()
  console.log('[reloadCustomTemplates] Loaded', result.length, 'templates')
  return result
}

// Get all templates including custom ones
export const getAllTemplates = async () => {
  const custom = await loadCustomTemplates()
  return [...MEME_TEMPLATES, ...custom]
}

// Get custom templates only
export const getCustomTemplates = async () => {
  return loadCustomTemplates()
}

// Get custom stickers
export const getCustomStickers = async () => {
  const custom = await loadCustomTemplates()
  return custom.filter(t => t.isSticker)
}

// ==================== VOTING SYSTEM ====================

const VOTES_KEY = 'shitpost-template-votes'

// Get votes for a template
export const getTemplateVotes = (templateId) => {
  try {
    const votes = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
    return votes[templateId] || { up: 0, down: 0, userVote: null }
  } catch {
    return { up: 0, down: 0, userVote: null }
  }
}

// Vote on a template (type: 'up' or 'down')
export const voteOnTemplate = (templateId, voteType) => {
  try {
    const votes = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
    if (!votes[templateId]) {
      votes[templateId] = { up: 0, down: 0, userVote: null }
    }

    const current = votes[templateId]
    const previousVote = current.userVote

    // If clicking the same vote, remove it
    if (previousVote === voteType) {
      current[voteType]--
      current.userVote = null
    } else {
      // Remove previous vote if exists
      if (previousVote) {
        current[previousVote]--
      }
      // Add new vote
      current[voteType]++
      current.userVote = voteType
    }

    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
    return current
  } catch {
    return { up: 0, down: 0, userVote: null }
  }
}

// Get recent templates (for the Recent tab)
export const getRecentTemplates = async () => {
  const custom = await loadCustomTemplates()
  return custom
    .filter(t => t.isRecent || t.isCommunity)
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
}

export default MEME_TEMPLATES
