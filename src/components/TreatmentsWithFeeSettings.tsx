import { TreatmentsWithDiscount } from './TreatmentsWithDiscount'
import { TreatmentsFeeManagement } from './TreatmentsFeeManagement'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Settings } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
}

interface TreatmentsWithFeeProps {
  accessToken: string
  refreshTrigger?: number
  adminFee?: number
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
}

export function TreatmentsWithFeeSettings({ 
  accessToken, 
  refreshTrigger, 
  adminFee, 
  clinicSettings 
}: TreatmentsWithFeeProps) {
  const [activeTab, setActiveTab] = useState('treatments')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [treatmentProducts, setTreatmentProducts] = useState<TreatmentProduct[]>([])

  useEffect(() => {
    fetchDoctors()
    fetchTreatmentProducts()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Clean doctor names from duplicate drg. prefix using utility function
        const cleanedDoctors = cleanDoctorNames(data.doctors || [])
        setDoctors(cleanedDoctors)
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const fetchTreatmentProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filter untuk tindakan, laboratorium, dan konsultasi
        const filteredProducts = (data.products || []).filter((product: TreatmentProduct) => 
          ['Tindakan', 'Laboratorium', 'Konsultasi'].includes(product.category)
        )
        
        // Remove duplicates by name to prevent key conflicts
        const uniqueProducts = filteredProducts.reduce((unique: TreatmentProduct[], product: TreatmentProduct) => {
          if (!unique.find(p => p.name === product.name && p.category === product.category)) {
            unique.push(product)
          }
          return unique
        }, [])
        
        setTreatmentProducts(uniqueProducts)
      }
    } catch (error) {
      console.log('Error fetching treatment products:', error)
    }
  }

  const handleFeeSettingsChange = () => {
    // This will trigger a refresh in the treatments component if needed
    console.log('Fee settings updated')
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Data Tindakan
          </TabsTrigger>
          <TabsTrigger value="fee-settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pengaturan Fee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <TreatmentsWithDiscount
            accessToken={accessToken}
            refreshTrigger={refreshTrigger}
            adminFee={adminFee}
            clinicSettings={clinicSettings}
          />
        </TabsContent>

        <TabsContent value="fee-settings" className="mt-6">
          <TreatmentsFeeManagement
            accessToken={accessToken}
            doctors={doctors}
            treatmentProducts={treatmentProducts}
            onFeeSettingsChange={handleFeeSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}