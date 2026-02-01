#!/usr/bin/env node
/**
 * Migration Script: Import existing templates to Supabase
 *
 * This script reads templates from:
 * 1. frontend/public/templates/metadata.json (admin-curated templates)
 * 2. Uploads images from frontend/public/templates/templates/ to Supabase Storage
 * 3. Inserts metadata into community_templates table
 *
 * Usage:
 *   cd backend
 *   node scripts/migrate-templates.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 *   - Run supabase-setup.sql first to create storage bucket
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Get file extension and mime type
function getFileInfo(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  return {
    ext,
    mimeType: mimeTypes[ext] || 'image/jpeg',
  }
}

async function migrateTemplates() {
  console.log('🚀 Starting template migration to Supabase...\n')

  // 1. Read metadata.json
  const metadataPath = join(ROOT_DIR, 'frontend', 'public', 'templates', 'metadata.json')

  if (!existsSync(metadataPath)) {
    console.error('❌ metadata.json not found at:', metadataPath)
    process.exit(1)
  }

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
  console.log(`📋 Found ${metadata.templates?.length || 0} templates in metadata.json\n`)

  if (!metadata.templates || metadata.templates.length === 0) {
    console.log('No templates to migrate.')
    return
  }

  // 2. Check which templates already exist in database
  const { data: existingTemplates, error: fetchError } = await supabase
    .from('community_templates')
    .select('name, source_type')
    .eq('source_type', 'migration')

  if (fetchError) {
    console.error('❌ Failed to fetch existing templates:', fetchError.message)
    process.exit(1)
  }

  const existingNames = new Set(existingTemplates?.map(t => t.name) || [])
  console.log(`📊 Found ${existingNames.size} previously migrated templates\n`)

  // 3. Process each template
  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const template of metadata.templates) {
    const templateName = template.name || template.file.replace(/\.[^.]+$/, '')

    // Skip if already migrated
    if (existingNames.has(templateName)) {
      console.log(`⏭️  Skipping (already exists): ${templateName}`)
      skipCount++
      continue
    }

    const filePath = join(ROOT_DIR, 'frontend', 'public', 'templates', 'templates', template.file)

    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${template.file}`)
      errorCount++
      continue
    }

    try {
      // Read image file
      const fileBuffer = readFileSync(filePath)
      const { ext, mimeType } = getFileInfo(template.file)

      // Generate unique storage path
      const storagePath = `curated/${randomUUID()}.${ext}`

      // Upload to Supabase Storage
      console.log(`📤 Uploading: ${templateName}...`)

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('templates')
        .getPublicUrl(storagePath)

      // Insert into database
      const { error: insertError } = await supabase
        .from('community_templates')
        .insert({
          name: templateName,
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          category: 'templates',
          tags: template.tags || [],
          source_type: 'migration',
          is_curated: true,
          status: 'approved',
          xp: 0,
        })

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`)
      }

      console.log(`✅ Migrated: ${templateName}`)
      successCount++

    } catch (error) {
      console.error(`❌ Failed to migrate ${templateName}: ${error.message}`)
      errorCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`   ✅ Successfully migrated: ${successCount}`)
  console.log(`   ⏭️  Skipped (existing): ${skipCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log('='.repeat(50))

  if (successCount > 0) {
    console.log('\n🎉 Migration complete! Templates are now in Supabase.')
    console.log('   Images stored in: templates bucket (curated/ folder)')
    console.log('   Metadata stored in: community_templates table')
  }
}

// Run migration
migrateTemplates().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
