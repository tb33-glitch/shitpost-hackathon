import { useState } from 'react'

// Internet Explorer content
function BrowserContent() {
  const [url, setUrl] = useState('https://trash.art')

  const links = [
    { name: 'trash.art', url: 'https://trash.art', icon: '🎨' },
    { name: 'Google', url: 'https://google.com', icon: '🔍' },
    { name: 'Yahoo!', url: 'https://yahoo.com', icon: '📧' },
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
    { name: 'Amazon', url: 'https://amazon.com', icon: '📦' },
    { name: 'Napster', url: 'https://napster.com', icon: '🎵' },
  ]

  return (
    <div className="browser-content">
      <div className="browser-toolbar">
        <button className="browser-btn">⬅️</button>
        <button className="browser-btn">➡️</button>
        <button className="browser-btn">🔄</button>
        <button className="browser-btn">🏠</button>
        <input
          type="text"
          className="browser-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="browser-btn">Go</button>
      </div>
      <div className="browser-page">
        <h2>🌐 Welcome to the Internet!</h2>
        <p>It's the year 2003 and the World Wide Web is amazing!</p>
        <div className="browser-favorites">
          <h3>⭐ Favorites</h3>
          <div className="favorites-grid">
            {links.map(link => (
              <div key={link.name} className="favorite-item" onClick={() => setUrl(link.url)}>
                <span className="favorite-icon">{link.icon}</span>
                <span className="favorite-name">{link.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="browser-marquee">
          <marquee>🔥 Hot new website: trash.art - Create meme NFTs! 🔥</marquee>
        </div>
      </div>
    </div>
  )
}

// Outlook Express content
function EmailContent() {
  const [selectedEmail, setSelectedEmail] = useState(0)

  const emails = [
    { from: 'Nigerian Prince', subject: 'URGENT: $10,000,000 waiting for you!!!', date: '10:32 AM', body: 'Dear Friend,\n\nI am Prince Abubakar and I need your help to transfer $10,000,000...' },
    { from: 'Amazon', subject: 'Your order has shipped', date: '9:15 AM', body: 'Your Nintendo GameCube has shipped and will arrive in 5-7 business days.' },
    { from: 'Mom', subject: 'Call me back', date: 'Yesterday', body: 'Hi sweetie, just checking in. Call me when you get a chance. Love, Mom' },
    { from: 'trash.art', subject: 'Welcome to trash.art!', date: 'Yesterday', body: 'Welcome to the future of meme NFTs! Start creating your masterpieces today.' },
    { from: 'AOL', subject: "You've Got Mail!", date: 'Jan 5', body: 'Welcome to AOL! You have 500 free hours of internet access.' },
  ]

  return (
    <div className="email-content">
      <div className="email-toolbar">
        <button className="email-btn">📝 New</button>
        <button className="email-btn">↩️ Reply</button>
        <button className="email-btn">↪️ Forward</button>
        <button className="email-btn">🗑️ Delete</button>
      </div>
      <div className="email-layout">
        <div className="email-folders">
          <div className="folder-item active">📥 Inbox (5)</div>
          <div className="folder-item">📤 Outbox</div>
          <div className="folder-item">📨 Sent Items</div>
          <div className="folder-item">🗑️ Deleted Items</div>
          <div className="folder-item">📁 Drafts</div>
        </div>
        <div className="email-list">
          {emails.map((email, i) => (
            <div
              key={i}
              className={`email-row ${selectedEmail === i ? 'selected' : ''}`}
              onClick={() => setSelectedEmail(i)}
            >
              <span className="email-from">{email.from}</span>
              <span className="email-subject">{email.subject}</span>
              <span className="email-date">{email.date}</span>
            </div>
          ))}
        </div>
        <div className="email-preview">
          <div className="email-header">
            <strong>From:</strong> {emails[selectedEmail].from}<br/>
            <strong>Subject:</strong> {emails[selectedEmail].subject}
          </div>
          <div className="email-body">
            {emails[selectedEmail].body}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple Paint content
function PaintContent() {
  return (
    <div className="paint-content-simple">
      <div className="paint-toolbar-simple">
        <button className="paint-tool">✏️</button>
        <button className="paint-tool">🖌️</button>
        <button className="paint-tool">🪣</button>
        <button className="paint-tool">✂️</button>
        <button className="paint-tool active">🔲</button>
        <button className="paint-tool">⭕</button>
      </div>
      <div className="paint-canvas-simple">
        <canvas width="400" height="280" style={{ background: 'white', border: '1px solid #808080' }} />
      </div>
      <div className="paint-colors">
        {['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
          '#FFFFFF', '#C0C0C0', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'].map(color => (
          <div key={color} className="paint-color" style={{ background: color }} />
        ))}
      </div>
      <p className="paint-hint">💡 For full painting features, use trash.art!</p>
    </div>
  )
}

// Calculator content
function CalculatorContent() {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setMemory(null)
    setOperator(null)
  }

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(display)

    if (memory === null) {
      setMemory(inputValue)
    } else if (operator) {
      const result = calculate(memory, inputValue, operator)
      setDisplay(String(result))
      setMemory(result)
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 'Error'
      default: return b
    }
  }

  const equals = () => {
    if (!operator || memory === null) return
    const result = calculate(memory, parseFloat(display), operator)
    setDisplay(String(result))
    setMemory(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  return (
    <div className="calculator-content">
      <div className="calc-display">{display}</div>
      <div className="calc-buttons">
        <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="calc-btn">⌫</button>
        <button onClick={clear} className="calc-btn">CE</button>
        <button onClick={clear} className="calc-btn">C</button>
        <button onClick={() => performOperation('/')} className="calc-btn calc-op">/</button>

        <button onClick={() => inputDigit('7')} className="calc-btn">7</button>
        <button onClick={() => inputDigit('8')} className="calc-btn">8</button>
        <button onClick={() => inputDigit('9')} className="calc-btn">9</button>
        <button onClick={() => performOperation('*')} className="calc-btn calc-op">×</button>

        <button onClick={() => inputDigit('4')} className="calc-btn">4</button>
        <button onClick={() => inputDigit('5')} className="calc-btn">5</button>
        <button onClick={() => inputDigit('6')} className="calc-btn">6</button>
        <button onClick={() => performOperation('-')} className="calc-btn calc-op">-</button>

        <button onClick={() => inputDigit('1')} className="calc-btn">1</button>
        <button onClick={() => inputDigit('2')} className="calc-btn">2</button>
        <button onClick={() => inputDigit('3')} className="calc-btn">3</button>
        <button onClick={() => performOperation('+')} className="calc-btn calc-op">+</button>

        <button onClick={() => setDisplay(String(-parseFloat(display)))} className="calc-btn">±</button>
        <button onClick={() => inputDigit('0')} className="calc-btn">0</button>
        <button onClick={inputDecimal} className="calc-btn">.</button>
        <button onClick={equals} className="calc-btn calc-equals">=</button>
      </div>
    </div>
  )
}

// Notepad content
function NotepadContent() {
  const [text, setText] = useState(`Welcome to Notepad!

This is a simple text editor.
You can write anything here.

Try trash.art for creating meme NFTs!

- Create pixel art
- Add meme text
- Mint as NFT
- Burn to the gallery

Have fun! 🎨`)

  return (
    <div className="notepad-content">
      <div className="notepad-menu">
        <span className="notepad-menu-item">File</span>
        <span className="notepad-menu-item">Edit</span>
        <span className="notepad-menu-item">Format</span>
        <span className="notepad-menu-item">View</span>
        <span className="notepad-menu-item">Help</span>
      </div>
      <textarea
        className="notepad-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  )
}

// File Explorer content
function FileExplorerContent({ folder }) {
  const folders = {
    documents: [
      { name: 'My Resume.doc', icon: '📄', size: '24 KB' },
      { name: 'Budget 2003.xls', icon: '📊', size: '156 KB' },
      { name: 'Vacation Photos', icon: '📁', size: '' },
      { name: 'README.txt', icon: '📝', size: '2 KB' },
      { name: 'trash_art_guide.pdf', icon: '📕', size: '1.2 MB' },
    ],
    pictures: [
      { name: 'Family Photo.jpg', icon: '🖼️', size: '2.4 MB' },
      { name: 'Vacation 2002', icon: '📁', size: '' },
      { name: 'meme_template.png', icon: '🖼️', size: '128 KB' },
      { name: 'Screenshot.bmp', icon: '🖼️', size: '3.1 MB' },
      { name: 'My NFTs', icon: '📁', size: '' },
    ],
    music: [
      { name: 'Linkin Park - In The End.mp3', icon: '🎵', size: '4.2 MB' },
      { name: 'Smash Mouth - All Star.mp3', icon: '🎵', size: '3.8 MB' },
      { name: 'Crazy Frog - Axel F.mp3', icon: '🎵', size: '3.1 MB' },
      { name: 'Evanescence - Bring Me To Life.mp3', icon: '🎵', size: '4.5 MB' },
      { name: 'Downloads', icon: '📁', size: '' },
    ],
  }

  const items = folders[folder] || folders.documents

  return (
    <div className="explorer-content">
      <div className="explorer-toolbar">
        <button className="explorer-btn">⬅️ Back</button>
        <button className="explorer-btn">➡️</button>
        <button className="explorer-btn">⬆️ Up</button>
        <span className="explorer-path">📁 C:\Documents and Settings\User\{folder === 'documents' ? 'My Documents' : folder === 'pictures' ? 'My Pictures' : 'My Music'}</span>
      </div>
      <div className="explorer-main">
        <div className="explorer-sidebar">
          <div className="explorer-task-section">
            <h4>📋 File and Folder Tasks</h4>
            <div className="explorer-task">Make a new folder</div>
            <div className="explorer-task">Publish to the Web</div>
          </div>
          <div className="explorer-task-section">
            <h4>🔗 Other Places</h4>
            <div className="explorer-task">My Computer</div>
            <div className="explorer-task">My Documents</div>
            <div className="explorer-task">Desktop</div>
          </div>
        </div>
        <div className="explorer-files">
          {items.map((item, i) => (
            <div key={i} className="explorer-item">
              <span className="explorer-icon">{item.icon}</span>
              <span className="explorer-name">{item.name}</span>
              <span className="explorer-size">{item.size}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="explorer-status">
        {items.length} objects
      </div>
    </div>
  )
}

// My Computer content
function MyComputerContent() {
  const drives = [
    { name: 'Local Disk (C:)', icon: '💾', free: '12.4 GB', total: '40 GB' },
    { name: 'CD Drive (D:)', icon: '💿', free: '', total: '' },
    { name: 'Floppy (A:)', icon: '💾', free: '', total: '1.44 MB' },
    { name: 'Removable Disk (E:)', icon: '📀', free: '128 MB', total: '256 MB' },
  ]

  return (
    <div className="mycomputer-content">
      <div className="explorer-toolbar">
        <button className="explorer-btn">⬅️ Back</button>
        <button className="explorer-btn">🔍 Search</button>
        <button className="explorer-btn">📁 Folders</button>
      </div>
      <div className="mycomputer-main">
        <div className="mycomputer-section">
          <h4>📁 Files Stored on This Computer</h4>
          <div className="mycomputer-items">
            <div className="mycomputer-item">
              <span className="mycomputer-icon">📄</span>
              <span>Shared Documents</span>
            </div>
            <div className="mycomputer-item">
              <span className="mycomputer-icon">📁</span>
              <span>User's Documents</span>
            </div>
          </div>
        </div>
        <div className="mycomputer-section">
          <h4>💽 Hard Disk Drives</h4>
          <div className="mycomputer-items">
            {drives.map((drive, i) => (
              <div key={i} className="mycomputer-item">
                <span className="mycomputer-icon">{drive.icon}</span>
                <div className="mycomputer-drive-info">
                  <span>{drive.name}</span>
                  {drive.free && <span className="drive-space">{drive.free} free of {drive.total}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Control Panel content
function ControlPanelContent() {
  const items = [
    { name: 'Display', icon: '🖥️', desc: 'Change display settings' },
    { name: 'Sound', icon: '🔊', desc: 'Configure audio devices' },
    { name: 'Network', icon: '🌐', desc: 'Network connections' },
    { name: 'Users', icon: '👤', desc: 'User accounts' },
    { name: 'Date/Time', icon: '🕐', desc: 'Set date and time' },
    { name: 'Mouse', icon: '🖱️', desc: 'Mouse settings' },
    { name: 'Keyboard', icon: '⌨️', desc: 'Keyboard settings' },
    { name: 'Printers', icon: '🖨️', desc: 'Add or remove printers' },
    { name: 'Add/Remove', icon: '📀', desc: 'Install or uninstall programs' },
  ]

  return (
    <div className="controlpanel-content">
      <div className="explorer-toolbar">
        <button className="explorer-btn">⬅️ Back</button>
        <button className="explorer-btn">🔍 Search</button>
      </div>
      <div className="controlpanel-main">
        <div className="controlpanel-sidebar">
          <h4>⚙️ Control Panel</h4>
          <p>Pick a category</p>
        </div>
        <div className="controlpanel-items">
          {items.map((item, i) => (
            <div key={i} className="controlpanel-item">
              <span className="controlpanel-icon">{item.icon}</span>
              <div className="controlpanel-info">
                <span className="controlpanel-name">{item.name}</span>
                <span className="controlpanel-desc">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Help content
function HelpContent() {
  return (
    <div className="help-content-window">
      <div className="help-toolbar">
        <button className="help-btn">⬅️ Back</button>
        <button className="help-btn">➡️</button>
        <button className="help-btn">🏠 Home</button>
        <button className="help-btn">🔍 Search</button>
      </div>
      <div className="help-main">
        <div className="help-sidebar">
          <h4>📚 Help Topics</h4>
          <div className="help-topic">Getting Started</div>
          <div className="help-topic">What's New</div>
          <div className="help-topic">Troubleshooting</div>
          <div className="help-topic active">Using trash.art</div>
          <div className="help-topic">Networking</div>
        </div>
        <div className="help-article">
          <h2>🎨 Welcome to trash.art Help</h2>
          <p>trash.art is your premier destination for creating meme NFTs on the Hemi blockchain!</p>

          <h3>Getting Started</h3>
          <ol>
            <li><strong>Connect your wallet</strong> - Click the wallet button to connect MetaMask</li>
            <li><strong>Create your art</strong> - Use the pixel editor or meme generator</li>
            <li><strong>Mint as NFT</strong> - Click File → Mint to create your NFT</li>
            <li><strong>Burn to gallery</strong> - Send NFTs to the Dumpster Fire!</li>
          </ol>

          <h3>Premium Colors</h3>
          <p>Some colors require a small fee to mint. Look for the ⭐ indicator on premium colors.</p>

          <h3>Need More Help?</h3>
          <p>Visit our website or ask Stapley! He's always happy to help. 📎</p>
        </div>
      </div>
    </div>
  )
}

// Main AppWindow component
export default function AppWindow({ windowId, config, onClose, onMinimize }) {
  const renderContent = () => {
    switch (config.component) {
      case 'browser':
        return <BrowserContent />
      case 'email':
        return <EmailContent />
      case 'paint':
        return <PaintContent />
      case 'calculator':
        return <CalculatorContent />
      case 'notepad':
        return <NotepadContent />
      case 'fileExplorer':
        return <FileExplorerContent folder={config.folder} />
      case 'myComputer':
        return <MyComputerContent />
      case 'controlPanel':
        return <ControlPanelContent />
      case 'help':
        return <HelpContent />
      default:
        return <div className="default-content">Content coming soon...</div>
    }
  }

  return (
    <div className="window app-window">
      <div className="title-bar">
        <div className="title-bar-text">
          <span className="window-icon">{config.icon}</span>
          {config.title}
        </div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={onMinimize} />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body app-window-body">
        {renderContent()}
      </div>
    </div>
  )
}
