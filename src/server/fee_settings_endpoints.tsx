import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export function createFeeSettingsRoutes(app: Hono, supabase: any) {
  // Get fee settings
  app.get('/make-server-73417b67/fee-settings', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const feeSettings = await kv.getByPrefix('fee_setting_')
      console.log('Fee settings fetched:', feeSettings.length, 'records')
      
      return c.json({ success: true, feeSettings })
    } catch (error) {
      console.log('Error getting fee settings:', error)
      return c.json({ error: 'Failed to get fee settings' }, 500)
    }
  })

  // Create fee setting
  app.post('/make-server-73417b67/fee-settings', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      console.log('Creating fee setting with data:', body)
      
      const feeSettingId = `fee_setting_${Date.now()}`
      const feeSetting = { 
        ...body, 
        id: feeSettingId, 
        createdAt: new Date().toISOString() 
      }
      
      await kv.set(feeSettingId, feeSetting)
      console.log('Fee setting created:', feeSettingId)
      
      return c.json({ success: true, feeSetting })
    } catch (error) {
      console.log('Error creating fee setting:', error)
      return c.json({ error: 'Failed to create fee setting' }, 500)
    }
  })

  // Update fee setting
  app.put('/make-server-73417b67/fee-settings/:id', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id')
      const body = await c.req.json()
      
      console.log('Updating fee setting:', id, 'with data:', body)
      
      const existingFeeSetting = await kv.get(id)
      if (!existingFeeSetting) {
        console.log('Fee setting not found:', id)
        return c.json({ error: 'Fee setting not found' }, 404)
      }
      
      const updatedFeeSetting = { 
        ...existingFeeSetting,
        ...body,
        id, 
        createdAt: existingFeeSetting.createdAt,
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(id, updatedFeeSetting)
      console.log('Fee setting updated successfully:', id, updatedFeeSetting)
      
      return c.json({ success: true, feeSetting: updatedFeeSetting })
    } catch (error) {
      console.log('Error updating fee setting:', error)
      return c.json({ error: 'Failed to update fee setting' }, 500)
    }
  })

  // Delete fee setting
  app.delete('/make-server-73417b67/fee-settings/:id', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id')
      console.log('Attempting to delete fee setting:', id)
      
      const existingRecord = await kv.get(id)
      if (!existingRecord) {
        console.log('Fee setting not found for deletion:', id)
        return c.json({ error: 'Fee setting not found' }, 404)
      }
      
      console.log('Found existing fee setting, deleting:', existingRecord)
      await kv.del(id)
      console.log('Fee setting deleted successfully:', id)
      
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting fee setting:', error)
      return c.json({ error: 'Failed to delete fee setting' }, 500)
    }
  })
}