import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

export function createXrayRoutes(app: Hono, supabase: any) {
  // ================= X-RAY IMAGES ENDPOINTS =================

  // GET X-ray images for a patient
  app.get('/make-server-73417b67/xray-images', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const patientId = c.req.query('patientId')
      if (!patientId) {
        return c.json({ error: 'Patient ID is required' }, 400)
      }

      console.log('📸 Fetching X-ray images for patient:', patientId)

      // Get images from KV store
      const imageKeys = await kv.getByPrefix(`xray_image_${patientId}_`)
      const images = []

      for (const imageRecord of imageKeys) {
        try {
          // Refresh signed URL for each image
          const { data: signedUrl } = await supabase.storage
            .from('make-73417b67-xray-images')
            .createSignedUrl(imageRecord.fileName, 60 * 60 * 24 * 7) // 1 week
          
          if (signedUrl?.signedUrl) {
            images.push({
              ...imageRecord,
              fileUrl: signedUrl.signedUrl
            })
          } else {
            // Keep original URL if refresh fails
            images.push(imageRecord)
          }
        } catch (urlError) {
          console.log('Error refreshing X-ray image URL:', urlError)
          // Keep original record even if URL refresh fails
          images.push(imageRecord)
        }
      }

      console.log('✅ Retrieved X-ray images:', images.length)
      return c.json({ images })
      
    } catch (error) {
      console.log('❌ Error fetching X-ray images:', error)
      return c.json({ error: 'Failed to fetch X-ray images' }, 500)
    }
  })

  // POST Upload X-ray image
  app.post('/make-server-73417b67/xray-images', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const formData = await c.req.formData()
      const file = formData.get('file') as File
      const patientId = formData.get('patientId') as string
      const patientName = formData.get('patientName') as string
      const description = formData.get('description') as string
      const type = formData.get('type') as string

      if (!file || !patientId || !description || !type) {
        return c.json({ error: 'Missing required fields' }, 400)
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return c.json({ error: 'File must be an image' }, 400)
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return c.json({ error: 'File size must be less than 10MB' }, 400)
      }

      console.log('📸 Uploading X-ray image:', {
        fileName: file.name,
        fileSize: file.size,
        patientId,
        type
      })

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `xray_${patientId}_${timestamp}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('make-73417b67-xray-images')
        .upload(fileName, file)

      if (uploadError) {
        console.log('❌ Storage upload error:', uploadError)
        return c.json({ error: 'Failed to upload file' }, 500)
      }

      // Create signed URL
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('make-73417b67-xray-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 1 week

      if (urlError) {
        console.log('❌ Signed URL error:', urlError)
        return c.json({ error: 'Failed to generate signed URL' }, 500)
      }

      // Store image record in KV
      const imageId = `xray_image_${patientId}_${timestamp}`
      const imageRecord = {
        id: imageId,
        patientId,
        patientName,
        fileName,
        fileUrl: signedUrl.signedUrl,
        originalFileName: file.name,
        description,
        type,
        uploadDate: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      await kv.set(imageId, imageRecord)

      console.log('✅ X-ray image uploaded successfully:', fileName)
      return c.json({ 
        success: true, 
        image: imageRecord 
      })
      
    } catch (error) {
      console.log('❌ Error uploading X-ray image:', error)
      return c.json({ error: 'Failed to upload X-ray image' }, 500)
    }
  })

  // DELETE X-ray image
  app.delete('/make-server-73417b67/xray-images/:imageId', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const imageId = c.req.param('imageId')
      if (!imageId) {
        return c.json({ error: 'Image ID is required' }, 400)
      }

      console.log('🗑️ Deleting X-ray image:', imageId)

      // Get image record
      const imageRecord = await kv.get(imageId)
      if (!imageRecord) {
        return c.json({ error: 'Image not found' }, 404)
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('make-73417b67-xray-images')
        .remove([imageRecord.fileName])

      if (storageError) {
        console.log('⚠️ Storage deletion warning:', storageError)
        // Continue with KV deletion even if storage fails
      }

      // Delete from KV store
      await kv.del(imageId)

      console.log('✅ X-ray image deleted successfully')
      return c.json({ success: true })
      
    } catch (error) {
      console.log('❌ Error deleting X-ray image:', error)
      return c.json({ error: 'Failed to delete X-ray image' }, 500)
    }
  })
}