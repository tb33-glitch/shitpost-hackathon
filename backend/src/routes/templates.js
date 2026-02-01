/**
 * Community Templates API Routes
 * CRUD operations for community-submitted meme templates using Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY // Use service key for backend

let supabase = null

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

// SSRF Protection - Block private networks
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254']
const BLOCKED_IP_PATTERNS = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^127\./]

function isBlockedUrl(urlString) {
  try {
    const url = new URL(urlString)
    if (BLOCKED_HOSTS.includes(url.hostname)) return true
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(url.hostname)) return true
    }
    return false
  } catch {
    return true
  }
}

// Get file extension from URL or content-type
function getFileExtension(url, contentType) {
  // Try from URL first
  const urlMatch = url.match(/\.([a-z]+)(\?|$)/i)
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ext === 'jpg' ? 'jpeg' : ext
    }
  }
  // Fall back to content-type
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpeg'
    if (contentType.includes('png')) return 'png'
    if (contentType.includes('gif')) return 'gif'
    if (contentType.includes('webp')) return 'webp'
  }
  return 'jpeg' // Default
}

export default async function templatesRoutes(fastify, options) {

  // Get all community templates
  fastify.get('/', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({
        error: 'Database not configured',
        message: 'Supabase credentials not set',
      })
    }

    try {
      const { data, error } = await db
        .from('community_templates')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      return {
        success: true,
        templates: data || [],
        count: data?.length || 0,
      }
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch templates')
      return reply.status(500).send({
        error: 'Failed to fetch templates',
        message: err.message,
      })
    }
  })

  // Get a single template by ID
  fastify.get('/:id', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()
    const { id } = request.params

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    try {
      const { data, error } = await db
        .from('community_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        return reply.status(404).send({ error: 'Template not found' })
      }

      return { success: true, template: data }
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch template')
      return reply.status(500).send({ error: 'Failed to fetch template' })
    }
  })

  // Submit a new template
  fastify.post('/', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['name', 'image_url'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          image_url: { type: 'string', format: 'uri' },
          image_cid: { type: 'string' },
          category: { type: 'string', maxLength: 50 },
          tags: { type: 'array', items: { type: 'string' } },
          submitted_by: { type: 'string', maxLength: 50 },
          display_name: { type: 'string', maxLength: 50 },
          source_url: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const {
      name,
      image_url,
      image_cid,
      category = 'templates',
      tags = [],
      submitted_by,
      display_name,
      source_url,
    } = request.body

    try {
      const { data, error } = await db
        .from('community_templates')
        .insert({
          name,
          image_url,
          image_cid,
          category,
          tags,
          submitted_by,
          display_name,
          source_url,
          status: 'approved', // Auto-approve for now, can add moderation later
          xp: 10,
        })
        .select()
        .single()

      if (error) throw error

      fastify.log.info({ id: data.id, name }, 'Template submitted')

      return {
        success: true,
        template: data,
        message: 'Template submitted successfully',
      }
    } catch (err) {
      fastify.log.error(err, 'Failed to submit template')
      return reply.status(500).send({
        error: 'Failed to submit template',
        message: err.message,
      })
    }
  })

  // Import template from external URL (downloads image, uploads to Supabase Storage)
  fastify.post('/import', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['name', 'source_url'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          source_url: { type: 'string', format: 'uri' },
          category: { type: 'string', maxLength: 50 },
          tags: { type: 'array', items: { type: 'string' } },
          submitted_by: { type: 'string', maxLength: 50 },
          display_name: { type: 'string', maxLength: 50 },
          is_curated: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const {
      name,
      source_url,
      category = 'templates',
      tags = [],
      submitted_by,
      display_name,
      is_curated = false,
    } = request.body

    // SSRF protection
    if (isBlockedUrl(source_url)) {
      return reply.status(403).send({ error: 'URL not allowed' })
    }

    try {
      // 1. Download the image from the source URL
      fastify.log.info({ source_url }, 'Downloading image')

      const imageResponse = await fetch(source_url, {
        headers: {
          'User-Agent': 'shitpost-importer/1.0',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      })

      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`)
      }

      const contentType = imageResponse.headers.get('content-type') || ''
      if (!contentType.includes('image')) {
        throw new Error('URL does not point to an image')
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

      // Check file size (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        throw new Error('Image too large (max 10MB)')
      }

      // 2. Generate unique filename and upload to Supabase Storage
      const ext = getFileExtension(source_url, contentType)
      const filename = `${randomUUID()}.${ext}`
      const storagePath = `imports/${filename}`

      fastify.log.info({ storagePath, size: imageBuffer.length }, 'Uploading to Supabase Storage')

      const { data: uploadData, error: uploadError } = await db.storage
        .from('templates')
        .upload(storagePath, imageBuffer, {
          contentType: `image/${ext}`,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // 3. Get public URL for the uploaded image
      const { data: urlData } = db.storage
        .from('templates')
        .getPublicUrl(storagePath)

      const publicUrl = urlData.publicUrl

      // 4. Save metadata to database
      const { data, error } = await db
        .from('community_templates')
        .insert({
          name,
          image_url: publicUrl,
          storage_path: storagePath,
          category,
          tags,
          submitted_by,
          display_name,
          source_url,
          source_type: 'scraper',
          is_curated,
          status: 'approved',
          xp: 10,
        })
        .select()
        .single()

      if (error) throw error

      fastify.log.info({ id: data.id, name, storagePath }, 'Template imported successfully')

      return {
        success: true,
        template: data,
        message: 'Template imported and stored successfully',
      }
    } catch (err) {
      fastify.log.error(err, 'Failed to import template')
      return reply.status(500).send({
        error: 'Failed to import template',
        message: err.message,
      })
    }
  })

  // Batch import multiple templates
  fastify.post('/import-batch', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['templates'],
        properties: {
          templates: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'source_url'],
              properties: {
                name: { type: 'string' },
                source_url: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
            maxItems: 20,
          },
          submitted_by: { type: 'string' },
          display_name: { type: 'string' },
          is_curated: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const { templates, submitted_by, display_name, is_curated = false } = request.body
    const results = []

    for (const template of templates) {
      try {
        // Skip blocked URLs
        if (isBlockedUrl(template.source_url)) {
          results.push({ name: template.name, success: false, error: 'URL not allowed' })
          continue
        }

        // Download image
        const imageResponse = await fetch(template.source_url, {
          headers: { 'User-Agent': 'shitpost-importer/1.0' },
          signal: AbortSignal.timeout(30000),
        })

        if (!imageResponse.ok) {
          results.push({ name: template.name, success: false, error: `Download failed: ${imageResponse.status}` })
          continue
        }

        const contentType = imageResponse.headers.get('content-type') || ''
        if (!contentType.includes('image')) {
          results.push({ name: template.name, success: false, error: 'Not an image' })
          continue
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        if (imageBuffer.length > 10 * 1024 * 1024) {
          results.push({ name: template.name, success: false, error: 'Image too large' })
          continue
        }

        // Upload to storage
        const ext = getFileExtension(template.source_url, contentType)
        const filename = `${randomUUID()}.${ext}`
        const storagePath = `imports/${filename}`

        const { error: uploadError } = await db.storage
          .from('templates')
          .upload(storagePath, imageBuffer, {
            contentType: `image/${ext}`,
            upsert: false,
          })

        if (uploadError) {
          results.push({ name: template.name, success: false, error: uploadError.message })
          continue
        }

        const { data: urlData } = db.storage.from('templates').getPublicUrl(storagePath)

        // Save to database
        const { data, error } = await db
          .from('community_templates')
          .insert({
            name: template.name,
            image_url: urlData.publicUrl,
            storage_path: storagePath,
            category: template.category || 'templates',
            tags: template.tags || [],
            submitted_by,
            display_name,
            source_url: template.source_url,
            source_type: 'scraper',
            is_curated,
            status: 'approved',
            xp: 10,
          })
          .select()
          .single()

        if (error) {
          results.push({ name: template.name, success: false, error: error.message })
        } else {
          results.push({ name: template.name, success: true, id: data.id })
        }
      } catch (err) {
        results.push({ name: template.name, success: false, error: err.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    fastify.log.info({ total: templates.length, success: successCount }, 'Batch import complete')

    return {
      success: true,
      total: templates.length,
      imported: successCount,
      failed: templates.length - successCount,
      results,
    }
  })

  // Admin: Update template (name, category, tags)
  fastify.patch('/:id', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          category: { type: 'string', maxLength: 50 },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        },
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()
    const { id } = request.params

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const { status, name, category, tags } = request.body

    // Require at least one field to update
    if (!status && !name && !category && !tags) {
      return reply.status(400).send({ error: 'No fields to update' })
    }

    try {
      const updates = {}
      if (status) updates.status = status
      if (name) updates.name = name
      if (category) updates.category = category
      if (tags) updates.tags = tags
      updates.updated_at = new Date().toISOString()

      const { data, error } = await db
        .from('community_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      fastify.log.info({ id, updates }, 'Template updated')
      return { success: true, template: data }
    } catch (err) {
      fastify.log.error(err, 'Failed to update template')
      return reply.status(500).send({ error: 'Failed to update template' })
    }
  })

  // Admin: Delete template (also removes from storage)
  fastify.delete('/:id', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()
    const { id } = request.params

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    try {
      // First, get the template to find storage_path
      const { data: template, error: fetchError } = await db
        .from('community_templates')
        .select('storage_path')
        .eq('id', id)
        .single()

      if (fetchError) {
        fastify.log.warn({ id, error: fetchError }, 'Template not found')
      }

      // Delete from Supabase Storage if storage_path exists
      if (template?.storage_path) {
        const { error: storageError } = await db.storage
          .from('templates')
          .remove([template.storage_path])

        if (storageError) {
          fastify.log.warn({ id, path: template.storage_path, error: storageError }, 'Failed to delete from storage')
        } else {
          fastify.log.info({ path: template.storage_path }, 'Deleted from storage')
        }
      }

      // Delete from database
      const { error } = await db
        .from('community_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      fastify.log.info({ id }, 'Template deleted')
      return { success: true, message: 'Template deleted' }
    } catch (err) {
      fastify.log.error(err, 'Failed to delete template')
      return reply.status(500).send({ error: 'Failed to delete template' })
    }
  })

  // Batch delete templates
  fastify.post('/delete-batch', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'string' }, maxItems: 50 },
        },
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()
    const { ids } = request.body

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    let deleted = 0
    let failed = 0

    for (const id of ids) {
      try {
        // Get storage path
        const { data: template } = await db
          .from('community_templates')
          .select('storage_path')
          .eq('id', id)
          .single()

        // Delete from storage
        if (template?.storage_path) {
          await db.storage.from('templates').remove([template.storage_path])
        }

        // Delete from database
        const { error } = await db
          .from('community_templates')
          .delete()
          .eq('id', id)

        if (error) throw error
        deleted++
      } catch (err) {
        fastify.log.error({ id, error: err }, 'Failed to delete template')
        failed++
      }
    }

    fastify.log.info({ deleted, failed }, 'Batch delete complete')
    return { success: true, deleted, failed }
  })

  // Get XP leaderboard
  fastify.get('/leaderboard', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    try {
      // Aggregate XP by submitted_by wallet
      const { data, error } = await db
        .from('community_templates')
        .select('submitted_by, display_name, xp')
        .eq('status', 'approved')

      if (error) throw error

      // Group by wallet and sum XP
      const xpByWallet = {}
      for (const template of data || []) {
        const wallet = template.submitted_by || 'anonymous'
        if (!xpByWallet[wallet]) {
          xpByWallet[wallet] = {
            address: wallet,
            display_name: template.display_name,
            xp: 0,
            template_count: 0,
          }
        }
        xpByWallet[wallet].xp += template.xp || 10
        xpByWallet[wallet].template_count += 1
        if (template.display_name) {
          xpByWallet[wallet].display_name = template.display_name
        }
      }

      const leaderboard = Object.values(xpByWallet)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 20)

      return { success: true, leaderboard }
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch leaderboard')
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' })
    }
  })

  // Direct file upload to Supabase Storage
  fastify.post('/upload', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const db = getSupabase()

    if (!db) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    try {
      const data = await request.file()

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' })
      }

      const buffer = await data.toBuffer()
      const contentType = data.mimetype || 'image/jpeg'

      // Validate it's an image
      if (!contentType.startsWith('image/')) {
        return reply.status(400).send({ error: 'Only image files are allowed' })
      }

      // Check file size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Image too large (max 10MB)' })
      }

      // Get extension from mimetype
      let ext = 'jpeg'
      if (contentType.includes('png')) ext = 'png'
      else if (contentType.includes('gif')) ext = 'gif'
      else if (contentType.includes('webp')) ext = 'webp'

      // Generate unique filename
      const filename = `${randomUUID()}.${ext}`
      const storagePath = `uploads/${filename}`

      // Upload to Supabase Storage
      const { error: uploadError } = await db.storage
        .from('templates')
        .upload(storagePath, buffer, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = db.storage
        .from('templates')
        .getPublicUrl(storagePath)

      // Parse name from filename or use query param
      const originalName = data.filename || 'Untitled'
      const name = request.query.name || originalName.replace(/\.[^.]+$/, '')
      const submittedBy = request.query.submitted_by || 'admin'
      const displayName = request.query.display_name || 'Admin'

      // Save to database
      const { data: template, error: dbError } = await db
        .from('community_templates')
        .insert({
          name,
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          category: 'templates',
          tags: [],
          submitted_by: submittedBy,
          display_name: displayName,
          source_type: 'upload',
          status: 'approved',
          xp: 10,
        })
        .select()
        .single()

      if (dbError) throw dbError

      fastify.log.info({ id: template.id, name, storagePath }, 'Template uploaded directly')

      return {
        success: true,
        template,
        message: 'Template uploaded successfully',
      }
    } catch (err) {
      fastify.log.error(err, 'Failed to upload template')
      return reply.status(500).send({
        error: 'Failed to upload template',
        message: err.message,
      })
    }
  })
}
