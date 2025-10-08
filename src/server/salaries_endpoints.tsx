import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Salaries Routes
export const salariesRoutes = (app: Hono) => {
  // Get all salaries
  app.get('/make-server-73417b67/salaries', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const salaries = await kv.getByPrefix('salary_')
      console.log('Salaries fetched:', salaries.length, 'records')
      
      // Sort by creation date descending
      const sortedSalaries = salaries.sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
      
      // Log sample salary data for debugging
      if (sortedSalaries.length > 0) {
        console.log('Sample salary data:', {
          id: sortedSalaries[0].id,
          employeeName: sortedSalaries[0].employeeName,
          baseSalary: sortedSalaries[0].baseSalary,
          bonus: sortedSalaries[0].bonus,
          totalSalary: sortedSalaries[0].totalSalary
        })
      }
      
      return c.json({ salaries: sortedSalaries })
    } catch (error) {
      console.log('Error getting salaries:', error)
      return c.json({ error: 'Failed to get salaries' }, 500)
    }
  })

  // Create new salary
  app.post('/make-server-73417b67/salaries', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const salaryId = `salary_${Date.now()}`
      
      console.log('Creating salary with data:', {
        employeeName: body.employeeName,
        baseSalary: body.baseSalary,
        bonus: body.bonus,
        totalSalary: body.totalSalary
      })
      
      const salary = { 
        ...body, 
        id: salaryId, 
        createdAt: new Date().toISOString()
      }
      
      await kv.set(salaryId, salary)
      console.log('Salary created successfully:', salaryId)
      return c.json({ salary })
    } catch (error) {
      console.log('Error creating salary:', error)
      return c.json({ error: 'Failed to create salary' }, 500)
    }
  })

  // Update existing salary
  app.put('/make-server-73417b67/salaries/:id', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id')
      const body = await c.req.json()
      
      console.log('Updating salary with data:', {
        id: id,
        employeeName: body.employeeName,
        baseSalary: body.baseSalary,
        bonus: body.bonus,
        totalSalary: body.totalSalary
      })
      
      const existingSalary = await kv.get(id)
      if (!existingSalary) {
        return c.json({ error: 'Salary not found' }, 404)
      }
      
      const updatedSalary = { 
        ...existingSalary, 
        ...body, 
        id, 
        createdAt: existingSalary.createdAt || existingSalary.created_at,
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(id, updatedSalary)
      console.log('Salary updated successfully:', id)
      return c.json({ salary: updatedSalary })
    } catch (error) {
      console.log('Error updating salary:', error)
      return c.json({ error: 'Failed to update salary' }, 500)
    }
  })

  // Delete salary
  app.delete('/make-server-73417b67/salaries/:id', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id')
      
      const existingSalary = await kv.get(id)
      if (!existingSalary) {
        return c.json({ error: 'Salary not found' }, 404)
      }
      
      await kv.del(id)
      console.log('Salary deleted successfully:', id)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting salary:', error)
      return c.json({ error: 'Failed to delete salary' }, 500)
    }
  })
}