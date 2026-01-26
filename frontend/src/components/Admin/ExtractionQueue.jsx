import { useEffect, useRef } from 'react'
import { extractMedia } from '../../utils/extractors'

export function ExtractionQueue({ items, onExtractionComplete, onExtractionError, logs }) {
  const processingRef = useRef(new Set())

  useEffect(() => {
    // Process pending items
    const pendingItems = items.filter(
      item => item.status === 'pending' && !processingRef.current.has(item.id)
    )

    pendingItems.forEach(async (item) => {
      processingRef.current.add(item.id)

      try {
        const extractedMedia = await extractMedia(item.url, item.type)
        onExtractionComplete(item, extractedMedia)
      } catch (error) {
        onExtractionError(item, error)
      } finally {
        processingRef.current.delete(item.id)
      }
    })
  }, [items, onExtractionComplete, onExtractionError])

  const pendingCount = items.filter(i => i.status === 'pending').length
  const processingCount = items.filter(i => i.status === 'processing').length
  const errorCount = items.filter(i => i.status === 'error').length

  return (
    <div className="extraction-queue-container">
      <div className="queue-list">
        <h2>
          Extraction Queue
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </h2>

        {items.length === 0 ? (
          <div className="queue-empty">
            <p>No items in queue</p>
            <p style={{ fontSize: '0.875rem', color: '#999' }}>
              Add URLs in the Link Input tab to start extracting media
            </p>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id} className="queue-item">
                <span className={`queue-item-type ${item.type}`}>
                  {item.type}
                </span>
                <span className="queue-item-url" title={item.url}>
                  {item.url}
                </span>
                <span className={`queue-item-status ${item.status}`}>
                  {item.status === 'pending' && 'Waiting...'}
                  {item.status === 'processing' && 'Processing...'}
                  {item.status === 'done' && 'Done'}
                  {item.status === 'error' && 'Error'}
                </span>
              </div>
            ))}
          </div>
        )}

        {errorCount > 0 && (
          <div style={{ marginTop: '1rem', color: '#e74c3c', fontSize: '0.875rem' }}>
            {errorCount} item(s) failed to extract. Check logs for details.
          </div>
        )}
      </div>

      <div className="extraction-logs">
        <h2>Extraction Logs</h2>
        <div className="logs-list">
          {logs.length === 0 ? (
            <div style={{ color: '#999', padding: '1rem', textAlign: 'center' }}>
              No logs yet
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ExtractionQueue
