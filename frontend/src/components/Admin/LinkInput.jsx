import { useState, useMemo } from 'react'

export function LinkInput({ onSubmit }) {
  const [inputValue, setInputValue] = useState('')

  const parsedUrls = useMemo(() => {
    if (!inputValue.trim()) return []

    return inputValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => {
        try {
          new URL(line)
          return true
        } catch {
          return false
        }
      })
  }, [inputValue])

  const handleSubmit = () => {
    if (parsedUrls.length > 0) {
      onSubmit(parsedUrls)
      setInputValue('')
    }
  }

  const handleClear = () => {
    setInputValue('')
  }

  const handlePasteExample = () => {
    const examples = [
      'https://www.reddit.com/r/memes/comments/1qq6k04/how_evil_can_you_be_amazon_yes/',
      'https://i.imgur.com/abc123.jpg',
      'https://i.redd.it/example.jpg',
      'https://pbs.twimg.com/media/example.jpg',
    ]
    setInputValue(examples.join('\n'))
  }

  return (
    <div className="link-input-container">
      <h2>Add URLs to Extract</h2>
      <p>Paste one URL per line. Works best with Reddit, Imgur, and direct image URLs.</p>

      <textarea
        className="link-input-textarea"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="https://www.reddit.com/r/memes/comments/abc123/funny/
https://imgur.com/gallery/xyz789
https://i.imgur.com/direct-image.png
https://i.redd.it/example.jpg"
      />

      <div className="link-input-actions">
        <button onClick={handleSubmit} disabled={parsedUrls.length === 0}>
          Process {parsedUrls.length > 0 ? `(${parsedUrls.length} URLs)` : ''}
        </button>
        <button className="secondary" onClick={handleClear} disabled={!inputValue}>
          Clear
        </button>
        <button className="secondary" onClick={handlePasteExample}>
          Paste Example
        </button>
        <span className="url-count">
          {parsedUrls.length} valid URL{parsedUrls.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      <div className="supported-sources">
        <h3>Supported Sources</h3>
        <div className="source-badges">
          <span className="source-badge" style={{background: '#27ae60'}}>Reddit</span>
          <span className="source-badge" style={{background: '#27ae60'}}>Imgur</span>
          <span className="source-badge" style={{background: '#27ae60'}}>Direct URLs</span>
          <span className="source-badge" style={{background: '#95a5a6'}}>Twitter (limited)</span>
        </div>
        <p style={{fontSize: '0.75rem', color: '#888', marginTop: '0.5rem'}}>
          For Twitter: right-click the image → "Copy image address" → paste that URL
        </p>
      </div>
    </div>
  )
}

export default LinkInput
