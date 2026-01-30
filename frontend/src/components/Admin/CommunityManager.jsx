import { useState, useEffect, useCallback } from 'react'
import { getLocalRegistry, saveLocalRegistry, removeFromRegistry, clearRegistry } from '../../utils/templateRegistry'
import { reloadCustomTemplates } from '../../config/memeTemplates'

export function CommunityManager() {
  const [templates, setTemplates] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Load templates from registry
  const loadTemplates = useCallback(() => {
    const registry = getLocalRegistry()
    setTemplates(registry.templates || [])
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Filter templates by search
  const filteredTemplates = templates.filter(t => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      t.name?.toLowerCase().includes(search) ||
      t.submittedBy?.toLowerCase().includes(search) ||
      t.tags?.some(tag => tag.toLowerCase().includes(search))
    )
  })

  // Toggle selection
  const toggleSelect = (cid) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(cid)) {
        next.delete(cid)
      } else {
        next.add(cid)
      }
      return next
    })
  }

  // Select all visible
  const selectAll = () => {
    setSelectedIds(new Set(filteredTemplates.map(t => t.cid)))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  // Delete single template
  const handleDelete = async (cid, name) => {
    if (!confirm(`Delete "${name}"?`)) return

    removeFromRegistry(cid)
    await reloadCustomTemplates()
    loadTemplates()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(cid)
      return next
    })
  }

  // Delete selected templates
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected template(s)?`)) return

    const registry = getLocalRegistry()
    registry.templates = registry.templates.filter(t => !selectedIds.has(t.cid))
    registry.lastUpdated = new Date().toISOString()
    saveLocalRegistry(registry)

    await reloadCustomTemplates()
    loadTemplates()
    setSelectedIds(new Set())
  }

  // Clear all templates
  const handleClearAll = async () => {
    if (!confirm('Delete ALL community templates? This cannot be undone.')) return

    clearRegistry()
    await reloadCustomTemplates()
    loadTemplates()
    setSelectedIds(new Set())
  }

  return (
    <div className="community-manager">
      <div className="community-manager-header">
        <h2>Community Templates ({templates.length})</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0', width: '150px' }}
          />
          <button
            onClick={selectAll}
            style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            disabled={selectedIds.size === 0}
            style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: selectedIds.size === 0 ? 0.5 : 1 }}
          >
            Deselect
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: selectedIds.size === 0 ? 0.5 : 1 }}
          >
            Delete Selected ({selectedIds.size})
          </button>
          <button
            onClick={handleClearAll}
            disabled={templates.length === 0}
            style={{ padding: '0.5rem 1rem', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: templates.length === 0 ? 0.5 : 1 }}
          >
            Clear All
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No community templates</p>
          <p style={{ fontSize: '0.875rem', color: '#999' }}>
            Templates submitted from Meme Studio will appear here
          </p>
        </div>
      ) : (
        <div className="community-template-grid">
          {filteredTemplates.map(template => (
            <div
              key={template.cid}
              className={`community-template-card ${selectedIds.has(template.cid) ? 'selected' : ''}`}
              onClick={() => toggleSelect(template.cid)}
            >
              <div className="template-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.has(template.cid)}
                  onChange={() => toggleSelect(template.cid)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="template-image">
                <img
                  src={template.imageUrl || `https://gateway.pinata.cloud/ipfs/${template.imageCid}`}
                  alt={template.name}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              <div className="template-info">
                <div className="template-name-row">
                  <strong>{template.name}</strong>
                  {template.isAdminApproved && <span className="admin-badge">Admin</span>}
                </div>
                <div className="template-meta">
                  {template.displayName || (template.submittedBy ? `${template.submittedBy.slice(0, 6)}...` : 'Anonymous')}
                </div>
                <div className="template-meta">
                  {new Date(template.submittedAt).toLocaleDateString()}
                </div>
                {template.tags?.length > 0 && (
                  <div className="template-tags">
                    {template.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(template.cid, template.name)
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .community-manager {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .community-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .community-manager-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .community-template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .community-template-card {
          position: relative;
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .community-template-card:hover {
          border-color: #3498db;
          background: #f0f7ff;
        }

        .community-template-card.selected {
          border-color: #e74c3c;
          background: #fff5f5;
        }

        .template-checkbox {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          z-index: 2;
        }

        .template-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .template-image {
          width: 100%;
          aspect-ratio: 1;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .template-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .template-info {
          font-size: 0.8rem;
        }

        .template-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .template-name-row strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-badge {
          background: #9b59b6;
          color: white;
          font-size: 0.6rem;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: bold;
        }

        .template-meta {
          color: #666;
          font-size: 0.7rem;
        }

        .template-tags {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        .template-tags .tag {
          background: #e0e0e0;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.65rem;
          color: #555;
        }

        .delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .community-template-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: #c0392b;
        }
      `}</style>
    </div>
  )
}

export default CommunityManager
