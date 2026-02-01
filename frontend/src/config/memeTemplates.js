// Meme Templates for shitpost.pro
// Each template has an image and defined text zones

export const TEMPLATE_CATEGORIES = {
  TRENDING: 'trending',
  CLASSIC: 'classic',
  WOJAK: 'wojak',
  CRYPTO: 'crypto',
  COMMUNITY: 'community',
  RECENT: 'recent',
  LEADERBOARD: 'leaderboard',
}

export const CATEGORY_LABELS = {
  [TEMPLATE_CATEGORIES.TRENDING]: 'Trending',
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

// Real image URLs from Imgflip API
const IMGFLIP_IMAGES = {
  drake: 'https://i.imgflip.com/30b1gx.jpg',
  'distracted-boyfriend': 'https://i.imgflip.com/1ur9b0.jpg',
  'expanding-brain': 'https://i.imgflip.com/1jwhww.jpg',
  'is-this-pigeon': 'https://i.imgflip.com/1o00in.jpg',
  'woman-yelling-cat': 'https://i.imgflip.com/345v97.jpg',
  'gru-plan': 'https://i.imgflip.com/261o3j.jpg',
  'change-my-mind': 'https://i.imgflip.com/24y43o.jpg',
  'always-has-been': 'https://i.imgflip.com/46e43q.png',
  'same-picture': 'https://i.imgflip.com/2za3u1.jpg',
  'two-buttons': 'https://i.imgflip.com/1g8my4.jpg',
  'surprised-pikachu': 'https://i.imgflip.com/gk5el.jpg',
  'this-is-fine': 'https://i.imgflip.com/wxica.jpg',
  stonks: 'https://i.imgflip.com/30bih3.jpg',
  'trade-offer': 'https://i.imgflip.com/3lmzyx.jpg',
  'bernie-asking': 'https://i.imgflip.com/3oevdk.jpg',
  'buff-doge-vs-cheems': 'https://i.imgflip.com/43a45p.png',
  'gigachad': 'https://i.imgflip.com/1tl71a.jpg',
  'soyjak-pointing': 'https://i.imgflip.com/4acd7j.png',
  'npc': 'https://i.imgflip.com/58eyvu.png',
  'hide-pain-harold': 'https://i.imgflip.com/gk5el.jpg',
  'disaster-girl': 'https://i.imgflip.com/23ls.jpg',
  'clown-makeup': 'https://i.imgflip.com/38el31.jpg',
  'monkey-puppet': 'https://i.imgflip.com/2gnnjh.jpg',
  'waiting-skeleton': 'https://i.imgflip.com/2fm6x.jpg',
  'one-does-not-simply': 'https://i.imgflip.com/1bij.jpg',
  'futurama-fry': 'https://i.imgflip.com/1bgw.jpg',
}

// Text zone positioning is in percentages (0-100) for responsive scaling
// Each zone: { id, x, y, width, height, defaultText, fontSize, align }
export const MEME_TEMPLATES = [
  // ==================== CLASSIC TEMPLATES ====================
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES.drake,
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
    image: IMGFLIP_IMAGES['distracted-boyfriend'],
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
    image: IMGFLIP_IMAGES['expanding-brain'],
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
    image: IMGFLIP_IMAGES['is-this-pigeon'],
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
    image: IMGFLIP_IMAGES['woman-yelling-cat'],
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
    image: IMGFLIP_IMAGES['gru-plan'],
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
    image: IMGFLIP_IMAGES['change-my-mind'],
    aspectRatio: 1.5,
    textZones: [
      { id: 'sign', x: 50, y: 70, width: 40, height: 20, defaultText: 'Hot take here', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'always-has-been',
    name: 'Always Has Been',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['always-has-been'],
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
    image: IMGFLIP_IMAGES['same-picture'],
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
    image: IMGFLIP_IMAGES['two-buttons'],
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
    image: IMGFLIP_IMAGES['surprised-pikachu'],
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
    image: IMGFLIP_IMAGES['this-is-fine'],
    aspectRatio: 2,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'This is fine.', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'stonks',
    name: 'Stonks',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES.stonks,
    aspectRatio: 1.2,
    textZones: [
      { id: 'caption', x: 50, y: 85, width: 90, height: 20, defaultText: 'STONKS', fontSize: 28, align: 'center' },
    ],
  },
  {
    id: 'trade-offer',
    name: 'Trade Offer',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['trade-offer'],
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
    image: IMGFLIP_IMAGES['bernie-asking'],
    aspectRatio: 1,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'I am once again asking', fontSize: 20, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: 'for your support', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'clown-makeup',
    name: 'Clown Applying Makeup',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['clown-makeup'],
    aspectRatio: 0.75,
    textZones: [
      { id: 'step1', x: 75, y: 12, width: 45, height: 15, defaultText: 'Step 1', fontSize: 14, align: 'center' },
      { id: 'step2', x: 75, y: 37, width: 45, height: 15, defaultText: 'Step 2', fontSize: 14, align: 'center' },
      { id: 'step3', x: 75, y: 62, width: 45, height: 15, defaultText: 'Step 3', fontSize: 14, align: 'center' },
      { id: 'step4', x: 75, y: 87, width: 45, height: 15, defaultText: 'Full clown', fontSize: 14, align: 'center' },
    ],
  },
  {
    id: 'disaster-girl',
    name: 'Disaster Girl',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['disaster-girl'],
    aspectRatio: 1.33,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 20, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'waiting-skeleton',
    name: 'Waiting Skeleton',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['waiting-skeleton'],
    aspectRatio: 0.75,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'Waiting for...', fontSize: 18, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'one-does-not-simply',
    name: 'One Does Not Simply',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['one-does-not-simply'],
    aspectRatio: 1.33,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'One does not simply', fontSize: 18, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'futurama-fry',
    name: 'Futurama Fry',
    category: TEMPLATE_CATEGORIES.CLASSIC,
    image: IMGFLIP_IMAGES['futurama-fry'],
    aspectRatio: 1.33,
    textZones: [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: 'Not sure if...', fontSize: 18, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: 'Or...', fontSize: 18, align: 'center' },
    ],
  },

  // ==================== WOJAK/PEPE TEMPLATES ====================
  {
    id: 'buff-doge-vs-cheems',
    name: 'Buff Doge vs Cheems',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: IMGFLIP_IMAGES['buff-doge-vs-cheems'],
    aspectRatio: 1.5,
    textZones: [
      { id: 'doge', x: 25, y: 15, width: 40, height: 20, defaultText: 'Then', fontSize: 16, align: 'center' },
      { id: 'cheems', x: 75, y: 15, width: 40, height: 20, defaultText: 'Now', fontSize: 16, align: 'center' },
    ],
  },
  {
    id: 'gigachad',
    name: 'Gigachad',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: IMGFLIP_IMAGES['gigachad'],
    aspectRatio: 0.8,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'Average enjoyer', fontSize: 20, align: 'center' },
    ],
  },
  {
    id: 'soyjak-pointing',
    name: 'Soyjak Pointing',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: IMGFLIP_IMAGES['soyjak-pointing'],
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 15, width: 90, height: 20, defaultText: 'OMG IS THAT A...', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'npc',
    name: 'NPC Wojak',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: IMGFLIP_IMAGES['npc'],
    aspectRatio: 1,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 20, defaultText: 'NPC dialogue here', fontSize: 18, align: 'center' },
    ],
  },
  {
    id: 'monkey-puppet',
    name: 'Monkey Puppet',
    category: TEMPLATE_CATEGORIES.WOJAK,
    image: IMGFLIP_IMAGES['monkey-puppet'],
    aspectRatio: 1.5,
    textZones: [
      { id: 'caption', x: 50, y: 90, width: 90, height: 15, defaultText: 'When you...', fontSize: 18, align: 'center' },
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

// Load custom templates from local metadata.json and localStorage registry
// Note: Supabase templates are loaded via templateRegistry.js getCommunityTemplates()
let customTemplates = []
let customTemplatesLoaded = false

export const loadCustomTemplates = async () => {
  if (customTemplatesLoaded) return customTemplates

  const loaded = []

  // Load from local metadata.json (for local dev assets)
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

  // Load community-submitted templates from localStorage registry (legacy support)
  try {
    const registryData = localStorage.getItem('shitpost-template-registry')
    if (registryData) {
      const registry = JSON.parse(registryData)
      const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

      if (registry.templates && Array.isArray(registry.templates)) {
        registry.templates.forEach((entry, index) => {
          // Get vote counts
          const templateId = `community-${entry.cid || index}`
          const votes = getTemplateVotes(templateId)
          const netVotes = votes.up - votes.down

          // Skip templates with 3+ downvotes (net score of -3 or worse)
          if (netVotes <= -3) {
            return
          }

          // Handle both IPFS URLs and local data URLs
          let imageUrl
          if (entry.imageUrl) {
            imageUrl = entry.imageUrl
          } else if (entry.imageCid?.startsWith('local-')) {
            return
          } else {
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
  customTemplatesLoaded = false
  customTemplates = []
  return await loadCustomTemplates()
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

// ==================== TRENDING TEMPLATES (External APIs) ====================

let trendingCache = null
let trendingCacheTimestamp = 0
const TRENDING_CACHE_TTL = 5 * 60 * 1000 // 5 minutes client-side cache

// Image URL mappings cache (for replacing placeholders)
let imageMappingsCache = null

// Generate text zones based on box count
function generateTextZones(boxCount, aspectRatio = 1) {
  if (boxCount === 1) {
    return [
      { id: 'text1', x: 50, y: 85, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
    ]
  }
  if (boxCount === 2) {
    return [
      { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
      { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
    ]
  }
  if (boxCount === 3) {
    return [
      { id: 'text1', x: 50, y: 15, width: 90, height: 20, defaultText: '', fontSize: 20, align: 'center' },
      { id: 'text2', x: 50, y: 50, width: 90, height: 20, defaultText: '', fontSize: 20, align: 'center' },
      { id: 'text3', x: 50, y: 85, width: 90, height: 20, defaultText: '', fontSize: 20, align: 'center' },
    ]
  }
  // 4+ boxes - grid layout
  const zones = []
  const rows = Math.ceil(boxCount / 2)
  for (let i = 0; i < boxCount; i++) {
    const row = Math.floor(i / 2)
    const col = i % 2
    zones.push({
      id: `text${i + 1}`,
      x: col === 0 ? 25 : 75,
      y: (100 / (rows + 1)) * (row + 1),
      width: 45,
      height: 100 / (rows + 1) - 5,
      defaultText: '',
      fontSize: 16,
      align: 'center',
    })
  }
  return zones
}

// Fetch trending templates from backend (which proxies Imgflip)
export const fetchTrendingTemplates = async (limit = 50) => {
  const now = Date.now()

  // Check client-side cache
  if (trendingCache && (now - trendingCacheTimestamp) < TRENDING_CACHE_TTL) {
    return trendingCache
  }

  try {
    const response = await fetch(`/api/memes/templates?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch trending templates')

    const data = await response.json()

    // Transform to our template format
    const templates = data.templates.map(t => ({
      id: t.id,
      name: t.name,
      category: TEMPLATE_CATEGORIES.TRENDING,
      image: t.url,
      aspectRatio: t.width && t.height ? t.width / t.height : 1,
      textZones: generateTextZones(t.boxCount || 2, t.width / t.height),
      tags: ['trending', 'imgflip'],
      isTrending: true,
      popularity: t.captions || 0,
      source: t.source,
      imgflipId: t.imgflipId,
    }))

    // Cache the image mappings for placeholder replacement
    if (data.mappings) {
      imageMappingsCache = {}
      data.templates.forEach(t => {
        if (t.internalId) {
          imageMappingsCache[t.internalId] = t.url
        }
      })
    }

    trendingCache = templates
    trendingCacheTimestamp = now

    return templates
  } catch (error) {
    console.error('[TrendingTemplates] Failed to fetch:', error)
    return []
  }
}

// Get image URL for a template ID (replaces placeholder)
export const getTemplateImageUrl = async (templateId) => {
  // Fetch mappings if not cached
  if (!imageMappingsCache) {
    try {
      const response = await fetch('/api/memes/mappings')
      if (response.ok) {
        const data = await response.json()
        imageMappingsCache = data.mappings || {}
      }
    } catch (e) {
      console.warn('[getTemplateImageUrl] Failed to fetch mappings')
      imageMappingsCache = {}
    }
  }

  return imageMappingsCache[templateId] || null
}

// Get all templates with real images (replaces placeholders where possible)
export const getTemplatesWithRealImages = async () => {
  // First, fetch trending to populate the mappings cache
  await fetchTrendingTemplates(100)

  // Now apply mappings to built-in templates
  return MEME_TEMPLATES.map(template => {
    const realImageUrl = imageMappingsCache?.[template.id]
    if (realImageUrl && template.image?.startsWith('data:image/svg+xml')) {
      return { ...template, image: realImageUrl }
    }
    return template
  })
}

// Clear trending cache (useful for manual refresh)
export const clearTrendingCache = () => {
  trendingCache = null
  trendingCacheTimestamp = 0
}

export default MEME_TEMPLATES
