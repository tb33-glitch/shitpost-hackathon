import { ContentCard } from './ContentCard'

export function ReviewGrid({ items, onApprove, onReject }) {
  const handleBulkApprove = () => {
    items.forEach(item => {
      onApprove(item, { category: item.category, tags: item.tags })
    })
  }

  const handleBulkReject = () => {
    items.forEach(item => {
      onReject(item)
    })
  }

  return (
    <div className="review-grid-container">
      <div className="review-grid-header">
        <h2>Review Queue ({items.length} items)</h2>
        {items.length > 0 && (
          <div className="review-grid-actions">
            <button onClick={handleBulkApprove}>
              Approve All
            </button>
            <button onClick={handleBulkReject}>
              Reject All
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="review-grid-empty">
          <p>No items to review</p>
          <p style={{ fontSize: '0.875rem', color: '#999' }}>
            Extracted media will appear here for review
          </p>
        </div>
      ) : (
        <div className="review-grid">
          {items.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewGrid
