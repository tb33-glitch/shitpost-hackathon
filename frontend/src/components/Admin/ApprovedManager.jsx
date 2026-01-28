import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { addToRegistry, getLocalRegistry, clearRegistry } from '../../utils/templateRegistry'
import { reloadCustomTemplates } from '../../config/memeTemplates'
import { downloadVideo, saveVideo, getAllVideos, clearAllVideos } from '../../utils/videoStorage'
import { isVideoContent } from '../../utils/urlValidation'

export function ApprovedManager({ items }) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [saveStatus, setSaveStatus] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [videoSyncStatus, setVideoSyncStatus] = useState(null)
  const [isSyncingVideos, setIsSyncingVideos] = useState(false)
  const [failedVideos, setFailedVideos] = useState([])
  const videoUploadRef = useRef(null)

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Check if item is a video
      const isVideo = isVideoContent(item)

      // Handle filter categories
      if (filterCategory === 'videos') {
        if (!isVideo) return false
      } else if (filterCategory !== 'all') {
        if (item.category !== filterCategory) return false
        // Also exclude videos from other category filters
        if (isVideo) return false
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesTags = item.tags?.some(tag =>
          tag.toLowerCase().includes(searchLower)
        )
        const matchesUrl = item.sourceUrl?.toLowerCase().includes(searchLower)
        if (!matchesTags && !matchesUrl) {
          return false
        }
      }
      return true
    })
  }, [items, filterCategory, searchTerm])

  // Save images directly to a folder using File System Access API
  const handleSaveToFolder = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      setSaveStatus('Your browser does not support folder saving. Use Chrome or Edge.')
      return
    }

    try {
      setIsSaving(true)
      setSaveStatus('Select the public/templates folder...')

      // Let user pick directory
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'desktop',
      })

      setSaveStatus('Saving images...')

      // Create category subdirectories
      const categories = ['templates', 'stickers', 'backgrounds']
      const categoryHandles = {}

      for (const cat of categories) {
        try {
          categoryHandles[cat] = await dirHandle.getDirectoryHandle(cat, { create: true })
        } catch (e) {
          console.error(`Failed to create ${cat} directory:`, e)
        }
      }

      // Save each image
      let savedCount = 0
      let failedCount = 0
      const metadata = { templates: [], stickers: [], backgrounds: [] }

      for (const item of items) {
        try {
          // Fetch the image
          const response = await fetch(item.mediaUrl)
          if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

          const blob = await response.blob()

          // Determine file extension
          let ext = 'jpg'
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('png')) ext = 'png'
          else if (contentType.includes('gif')) ext = 'gif'
          else if (contentType.includes('webp')) ext = 'webp'

          // Generate filename from tags or ID
          const baseName = (item.tags?.[0] || item.id || `image-${Date.now()}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 50)
          const fileName = `${baseName}.${ext}`

          // Get the category directory
          const catHandle = categoryHandles[item.category]
          if (!catHandle) {
            console.error(`No directory handle for category: ${item.category}`)
            failedCount++
            continue
          }

          // Write the file
          const fileHandle = await catHandle.getFileHandle(fileName, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()

          // Add to metadata
          metadata[item.category].push({
            file: fileName,
            name: item.tags?.[0] || baseName,
            tags: item.tags || [],
            sourceUrl: item.sourceUrl,
            approvedAt: item.approvedAt,
          })

          savedCount++
          setSaveStatus(`Saved ${savedCount}/${items.length} images...`)
        } catch (e) {
          console.error(`Failed to save image:`, e, item)
          failedCount++
        }
      }

      // Save metadata.json
      try {
        const metaHandle = await dirHandle.getFileHandle('metadata.json', { create: true })
        const writable = await metaHandle.createWritable()
        await writable.write(JSON.stringify(metadata, null, 2))
        await writable.close()
      } catch (e) {
        console.error('Failed to save metadata.json:', e)
      }

      setSaveStatus(`Done! Saved ${savedCount} images${failedCount > 0 ? `, ${failedCount} failed` : ''}.`)
      setIsSaving(false)
    } catch (e) {
      if (e.name === 'AbortError') {
        setSaveStatus(null)
      } else {
        setSaveStatus(`Error: ${e.message}`)
      }
      setIsSaving(false)
    }
  }, [items])

  const handleExport = () => {
    // Generate metadata JSON for template picker integration
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items: items.map(item => ({
        id: item.id,
        mediaUrl: item.mediaUrl,
        category: item.category,
        tags: item.tags,
        sourceUrl: item.sourceUrl,
        approvedAt: item.approvedAt,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `approved-content-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportForIntegration = () => {
    // Export in the format expected by the template picker
    const byCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push({
        url: item.mediaUrl,
        name: item.tags?.[0] || `item-${item.id}`,
        tags: item.tags || [],
      })
      return acc
    }, {})

    const blob = new Blob([JSON.stringify(byCategory, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-picker-content-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Sync approved items to the template registry (makes them available in MemeStudio)
  const handleSyncToTemplates = useCallback(async () => {
    setSyncStatus('Syncing to templates...')

    // Direct localStorage test
    console.log('[Sync] === STARTING SYNC ===')
    console.log('[Sync] Items to sync:', items.length)
    console.log('[Sync] localStorage before:', localStorage.getItem('shitpost-template-registry')?.slice(0, 100) || 'EMPTY')

    try {
      const registry = getLocalRegistry()
      console.log('[Sync] Current registry has', registry.templates?.length || 0, 'templates')
      const existingUrls = new Set(registry.templates.map(t => t.imageUrl))

      let addedCount = 0
      let skippedCount = 0

      for (const item of items) {
        // Skip videos - templates must be images
        const isVideo = item.mediaType === 'video' ||
          item.mediaUrl?.includes('.mp4') ||
          item.mediaUrl?.includes('.webm') ||
          item.mediaUrl?.includes('video.twimg.com')

        if (isVideo) {
          skippedCount++
          continue
        }

        // Skip if already in registry
        if (existingUrls.has(item.mediaUrl)) {
          skippedCount++
          continue
        }

        // Create registry entry
        const entry = {
          name: item.tags?.[0] || `approved-${item.id}`,
          category: item.category || 'templates',
          imageCid: `admin-${item.id}`,
          imageUrl: item.mediaUrl, // Use direct URL for admin-approved content
          tags: item.tags || [],
          submittedBy: 'admin',
          displayName: 'Admin',
          xp: 10, // Admin-approved content gets 10 XP
          submittedAt: item.approvedAt || new Date().toISOString(),
          cid: `admin-approved-${item.id}`,
          sourceUrl: item.sourceUrl,
          isAdminApproved: true,
        }

        await addToRegistry(entry)
        addedCount++
        console.log('[Sync] Added template:', entry.name, '- localStorage now:', localStorage.getItem('shitpost-template-registry')?.length || 0, 'chars')
        setSyncStatus(`Added ${addedCount} templates...`)
      }

      // Bust the template cache so the picker reloads fresh data
      console.log('[Sync] === SYNC COMPLETE ===')
      console.log('[Sync] Added:', addedCount, 'Skipped:', skippedCount)
      console.log('[Sync] localStorage after sync:', localStorage.getItem('shitpost-template-registry')?.slice(0, 300) || 'EMPTY!')

      const reloaded = await reloadCustomTemplates()
      console.log('[Sync] After reloadCustomTemplates:', reloaded.length, 'templates loaded')
      console.log('[Sync] localStorage after reload:', localStorage.getItem('shitpost-template-registry')?.slice(0, 300) || 'EMPTY!')

      setSyncStatus(`Done! Added ${addedCount} templates${skippedCount > 0 ? ` (skipped ${skippedCount} - videos or duplicates)` : ''}.`)
    } catch (e) {
      console.error('Failed to sync to templates:', e)
      setSyncStatus(`Error: ${e.message}`)
    }
  }, [items])

  // Sync videos to IndexedDB (makes them available in MemeStudio video editor)
  const handleSyncVideos = useCallback(async () => {
    setIsSyncingVideos(true)
    setVideoSyncStatus('Starting video sync...')
    setFailedVideos([]) // Clear previous failed videos
    console.log('[VideoSync] === STARTING VIDEO SYNC ===')
    console.log('[VideoSync] Total items:', items.length)

    try {
      // Get existing videos to check for duplicates
      const existingVideos = await getAllVideos()
      console.log('[VideoSync] Existing videos in library:', existingVideos.length)
      const existingUrls = new Set(existingVideos.map(v => v.mediaUrl))

      let downloadedCount = 0
      let skippedCount = 0
      let failedCount = 0
      const newFailedVideos = [] // Collect failed videos

      // Filter to only videos
      const videoItems = items.filter(item => {
        const isVideo = item.mediaType === 'video' ||
          item.mediaUrl?.includes('.mp4') ||
          item.mediaUrl?.includes('.webm') ||
          item.mediaUrl?.includes('video.twimg.com')
        console.log('[VideoSync] Item check:', item.mediaUrl?.slice(0, 60), 'isVideo:', isVideo, 'mediaType:', item.mediaType)
        return isVideo
      })

      console.log('[VideoSync] Found video items:', videoItems.length)
      videoItems.forEach((v, i) => console.log(`[VideoSync] Video ${i}:`, v.mediaUrl?.slice(0, 80)))
      setVideoSyncStatus(`Found ${videoItems.length} videos to sync...`)

      for (const item of videoItems) {
        // Skip if already in library
        if (existingUrls.has(item.mediaUrl)) {
          skippedCount++
          continue
        }

        try {
          console.log('[VideoSync] Downloading:', item.mediaUrl?.slice(0, 80))
          console.log('[VideoSync] Source URL:', item.sourceUrl?.slice(0, 80))
          setVideoSyncStatus(`Downloading video ${downloadedCount + 1}/${videoItems.length - skippedCount}...`)

          // Download the video (pass sourceUrl for cobalt.tools to use)
          const blob = await downloadVideo(item.mediaUrl, null, item.sourceUrl)
          console.log('[VideoSync] Downloaded blob:', blob.size, 'bytes, type:', blob.type)

          // Save to IndexedDB
          const savedVideo = await saveVideo({
            id: `video-${item.id}`,
            sourceUrl: item.sourceUrl,
            mediaUrl: item.mediaUrl,
            name: item.tags?.[0] || `Video ${item.id}`,
            tags: item.tags || [],
            source: 'admin-approved',
          }, blob)
          console.log('[VideoSync] Saved to IndexedDB:', savedVideo.id)

          downloadedCount++
          setVideoSyncStatus(`Downloaded ${downloadedCount} videos...`)
        } catch (e) {
          console.error('[VideoSync] Failed to download video:', item.mediaUrl, e)
          failedCount++
          // Track failed videos for manual upload (dedupe by mediaUrl)
          if (!newFailedVideos.some(v => v.mediaUrl === item.mediaUrl)) {
            newFailedVideos.push({
              sourceUrl: item.sourceUrl,
              mediaUrl: item.mediaUrl,
              name: item.tags?.[0] || 'Untitled',
            })
          }
        }
      }

      // Set all failed videos at once
      setFailedVideos(newFailedVideos)

      const statusParts = [`Done! Downloaded ${downloadedCount} videos`]
      if (skippedCount > 0) statusParts.push(`${skippedCount} already in library`)
      if (failedCount > 0) statusParts.push(`${failedCount} failed (use manual upload)`)
      setVideoSyncStatus(statusParts.join(', ') + '.')
    } catch (e) {
      console.error('Failed to sync videos:', e)
      setVideoSyncStatus(`Error: ${e.message}`)
    } finally {
      setIsSyncingVideos(false)
    }
  }, [items])

  // Manual video upload handler
  const handleManualVideoUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    let uploadedCount = 0
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue

      try {
        const savedVideo = await saveVideo({
          id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          tags: [file.name.replace(/\.[^.]+$/, '')],
          source: 'manual-upload',
        }, file)
        console.log('[ManualUpload] Saved video:', savedVideo.id)
        uploadedCount++
      } catch (err) {
        console.error('[ManualUpload] Failed to save video:', err)
      }
    }

    setVideoSyncStatus(`Uploaded ${uploadedCount} video${uploadedCount !== 1 ? 's' : ''} manually!`)
    setFailedVideos([]) // Clear failed list after manual upload
    e.target.value = '' // Reset input
  }, [])

  const stats = useMemo(() => {
    const videos = items.filter(i => isVideoContent(i)).length
    return {
      total: items.length,
      templates: items.filter(i => i.category === 'templates').length - videos,
      stickers: items.filter(i => i.category === 'stickers').length,
      backgrounds: items.filter(i => i.category === 'backgrounds').length,
      videos,
    }
  }, [items])

  return (
    <div className="approved-manager-container">
      <div className="approved-manager-header">
        <h2>Approved Content ({items.length})</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
          >
            <option value="all">All Categories</option>
            <option value="templates">Templates ({stats.templates})</option>
            <option value="stickers">Stickers ({stats.stickers})</option>
            <option value="backgrounds">Backgrounds ({stats.backgrounds})</option>
            <option value="videos">Videos ({stats.videos})</option>
          </select>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0', width: '150px' }}
          />
          <button
            className="export-btn"
            onClick={handleSyncToTemplates}
            disabled={items.length === 0}
            style={{ background: '#9b59b6' }}
          >
            Sync Images
          </button>
          <button
            className="export-btn"
            onClick={handleSyncVideos}
            disabled={isSyncingVideos}
            style={{ background: '#3498db' }}
          >
            {isSyncingVideos ? 'Syncing...' : `Sync Videos (${stats.videos})`}
          </button>
          <button
            className="export-btn"
            onClick={() => videoUploadRef.current?.click()}
            style={{ background: '#9b59b6' }}
          >
            📤 Manual Upload
          </button>
          <input
            ref={videoUploadRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleManualVideoUpload}
            style={{ display: 'none' }}
          />
          <button
            className="export-btn"
            onClick={() => {
              console.log('[DEBUG] All approved items:', items)
              console.log('[DEBUG] Stats:', stats)
              items.forEach((item, i) => {
                console.log(`[DEBUG] Item ${i}:`, {
                  id: item.id,
                  mediaUrl: item.mediaUrl?.slice(0, 80),
                  mediaType: item.mediaType,
                  category: item.category,
                })
              })
              alert(`Check console! ${items.length} items, ${stats.videos} videos detected`)
            }}
            style={{ background: '#f39c12' }}
          >
            Debug Items
          </button>
          <button
            className="export-btn"
            onClick={async () => {
              if (confirm('Clear all community templates? This will remove all synced templates from MemeStudio.')) {
                clearRegistry()
                await reloadCustomTemplates()
                setSyncStatus('Templates cleared. Sync again to re-add images.')
              }
            }}
            style={{ background: '#e74c3c' }}
          >
            Clear Templates
          </button>
          <button
            className="export-btn"
            onClick={async () => {
              if (confirm('Clear all videos from the video library?')) {
                await clearAllVideos()
                setFailedVideos([])
                setVideoSyncStatus('Video library cleared.')
              }
            }}
            style={{ background: '#e74c3c' }}
          >
            Clear Videos
          </button>
          <button
            className="export-btn save-to-folder-btn"
            onClick={handleSaveToFolder}
            disabled={isSaving || items.length === 0}
            style={{ background: '#27ae60' }}
          >
            {isSaving ? 'Saving...' : 'Save to Folder'}
          </button>
          <button className="export-btn" onClick={handleExport} disabled={items.length === 0}>
            Export JSON
          </button>
          <button className="export-btn" onClick={handleExportForIntegration} disabled={items.length === 0}>
            Export for Picker
          </button>
        </div>
      </div>

      {(saveStatus || syncStatus) && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '0.5rem',
          background: (saveStatus || syncStatus).startsWith('Error') ? '#f8d7da' : (saveStatus || syncStatus).startsWith('Done') ? '#d4edda' : '#cce5ff',
          color: (saveStatus || syncStatus).startsWith('Error') ? '#721c24' : (saveStatus || syncStatus).startsWith('Done') ? '#155724' : '#004085',
          borderRadius: '6px',
          fontSize: '0.875rem',
        }}>
          📷 {saveStatus || syncStatus}
        </div>
      )}

      {videoSyncStatus && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: videoSyncStatus.startsWith('Error') ? '#f8d7da' : videoSyncStatus.startsWith('Done') ? '#d4edda' : '#cce5ff',
          color: videoSyncStatus.startsWith('Error') ? '#721c24' : videoSyncStatus.startsWith('Done') ? '#155724' : '#004085',
          borderRadius: '6px',
          fontSize: '0.875rem',
        }}>
          🎬 {videoSyncStatus}
        </div>
      )}

      {failedVideos.length > 0 && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '6px',
          fontSize: '0.875rem',
        }}>
          <strong>⚠️ {failedVideos.length} video(s) couldn't be downloaded automatically</strong>
          <p style={{ margin: '0.5rem 0', color: '#856404' }}>
            Twitter blocks direct downloads. Use one of these options:
          </p>
          <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#856404' }}>
            <li>Click "Manual Upload" and select video files you've downloaded</li>
            <li>Download videos from <a href="https://twitsave.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>twitsave.com</a> or <a href="https://ssstwitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>ssstwitter.com</a></li>
          </ol>
          <div style={{ marginTop: '0.75rem' }}>
            <strong>Failed videos:</strong>
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem', maxHeight: '150px', overflow: 'auto' }}>
              {failedVideos.map((v, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  {v.name}{' '}
                  {v.sourceUrl && (
                    <a
                      href={`https://twitsave.com/info?url=${encodeURIComponent(v.sourceUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0066cc', fontSize: '0.8rem' }}
                    >
                      [Download from TwitSave]
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setFailedVideos([])}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: '#856404',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="approved-empty">
          <p>No approved content yet</p>
          <p style={{ fontSize: '0.875rem', color: '#999' }}>
            Review and approve content from the Review tab
          </p>
        </div>
      ) : (
        <table className="approved-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Source</th>
              <th>Category</th>
              <th>Tags</th>
              <th>Approved</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <img src={item.mediaUrl} alt="" />
                </td>
                <td>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#4a90d9',
                      textDecoration: 'none',
                      maxWidth: '200px',
                      display: 'inline-block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.sourceUrl}
                  </a>
                </td>
                <td>
                  <span className="category-badge">{item.category}</span>
                </td>
                <td>
                  {item.tags?.join(', ') || '-'}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#666' }}>
                  {new Date(item.approvedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f5f7fa',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#666',
      }}>
        <strong>Save to Folder:</strong> Click "Save to Folder" and select <code>frontend/public/templates</code> to save images directly.
        Images are organized by category (templates/, stickers/, backgrounds/) with a metadata.json file.
        <br /><br />
        <strong>Provenance Tracking:</strong> All approved content is logged with source URLs for DMCA compliance.
      </div>
    </div>
  )
}

export default ApprovedManager
