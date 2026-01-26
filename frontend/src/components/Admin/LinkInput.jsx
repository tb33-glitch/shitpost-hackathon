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
      'https://twitter.com/example/status/1234567890',
      'https://www.reddit.com/r/memes/comments/abc123/funny_meme/',
      'https://imgur.com/gallery/abc123',
      'https://i.imgur.com/abc123.jpg',
      'https://example.com/image.png',
    ]
    setInputValue(examples.join('\n'))
  }

  return (
    <div className="link-input-container">
      <h2>Add URLs to Extract</h2>
      <p>Paste one URL per line. Supported sources: Twitter/X, Reddit, Imgur, YouTube thumbnails, and direct image URLs.</p>

      <textarea
        className="link-input-textarea"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="https://twitter.com/user/status/123456789
https://www.reddit.com/r/memes/comments/abc123/funny/
https://imgur.com/gallery/xyz789
https://i.imgur.com/direct-image.png"
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
          <span className="source-badge">Twitter/X</span>
          <span className="source-badge">Reddit</span>
          <span className="source-badge">Imgur</span>
          <span className="source-badge">YouTube (thumbnails)</span>
          <span className="source-badge">Direct Image URLs</span>
        </div>
      </div>
    </div>
  )
}

export default LinkInput
