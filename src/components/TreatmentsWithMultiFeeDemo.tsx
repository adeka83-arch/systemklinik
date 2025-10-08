import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Calculator, Zap } from 'lucide-react'
import { TreatmentsWithFeeSettings } from './TreatmentsWithFeeSettings'
import { TreatmentFormWithMultiFee } from './TreatmentFormWithMultiFee'

interface TreatmentsWithMultiFeeDemoProps {
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

export function TreatmentsWithMultiFeeDemo({ 
  accessToken, 
  refreshTrigger, 
  adminFee, 
  clinicSettings 
}: TreatmentsWithMultiFeeDemoProps) {
  const [activeTab, setActiveTab] = useState('treatments')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sistem Tindakan Lengkap
          </TabsTrigger>
          <TabsTrigger value="multi-fee-demo" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Demo Multi Fee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <TreatmentsWithFeeSettings
            accessToken={accessToken}
            refreshTrigger={refreshTrigger}
            adminFee={adminFee}
            clinicSettings={clinicSettings}
          />
        </TabsContent>

        <TabsContent value="multi-fee-demo" className="mt-6">
          <TreatmentFormWithMultiFee
            accessToken={accessToken}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}