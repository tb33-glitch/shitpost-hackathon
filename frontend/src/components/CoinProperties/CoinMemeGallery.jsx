import { useState } from 'react'
import useCoinMemes from '../../hooks/useCoinMemes'
import './CoinProperties.css'

/**
 * CoinMemeGallery - Community meme gallery for a coin
 * Shows memes created for this coin with voting
 */
export default function CoinMemeGallery({ coin, walletAddress }) {
  const { memes, isLoading, vote, checkVoted, removeMeme } = useCoinMemes(coin.mint)
  const [selectedMeme, setSelectedMeme] = useState(null)

  const handleVote = (e, memeId) => {
    e.stopPropagation()
    vote(memeId)
  }

  const handleDelete = (e, memeId) => {
    e.stopPropagation()
    if (window.confirm('Delete this meme?')) {
      removeMeme(memeId, walletAddress)
    }
  }

  if (isLoading) {
    return (
      <div className="meme-gallery-loading">
        <span className="loading-icon">⏳</span>
        Loading memes...
      </div>
    )
  }

  if (!memes || memes.length === 0) {
    return (
      <div className="meme-gallery-empty">
        <span className="empty-icon">🖼️</span>
        <span className="empty-text">No memes yet for ${coin.symbol}</span>
        <span className="empty-hint">Be the first to create one!</span>
      </div>
    )
  }

  return (
    <div className="meme-gallery">
      <div className="meme-gallery-grid">
        {memes.map((meme) => {
          const hasVoted = checkVoted(meme.id)
          const isCreator = meme.creatorWallet === walletAddress

          return (
            <div
              key={meme.id}
              className="meme-card"
              onClick={() => setSelectedMeme(meme)}
            >
              <div className="meme-image">
                <img src={meme.imageUrl} alt="Meme" />
              </div>
              <div className="meme-actions">
                <button
                  className={`vote-btn ${hasVoted ? 'voted' : ''}`}
                  onClick={(e) => handleVote(e, meme.id)}
                  title={hasVoted ? 'Remove vote' : 'Upvote'}
                >
                  {hasVoted ? '❤️' : '🤍'} {meme.upvotes || 0}
                </button>
                {isCreator && (
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, meme.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Meme Preview Modal */}
      {selectedMeme && (
        <div
          className="meme-modal-overlay"
          onClick={() => setSelectedMeme(null)}
        >
          <div
            className="meme-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="meme-modal-close"
              onClick={() => setSelectedMeme(null)}
            >
              ✕
            </button>
            <img
              src={selectedMeme.imageUrl}
              alt="Meme"
              className="meme-modal-image"
            />
            <div className="meme-modal-info">
              <span className="meme-modal-votes">
                ❤️ {selectedMeme.upvotes || 0} votes
              </span>
              <span className="meme-modal-creator">
                by {selectedMeme.creatorWallet === 'anonymous'
                  ? 'Anonymous'
                  : `${selectedMeme.creatorWallet.slice(0, 6)}...${selectedMeme.creatorWallet.slice(-4)}`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
