// File lengkap untuk sistem tindakan dengan multi fee
// Menggabungkan semua fitur dari sistem lama dengan multi fee yang baru

import { TreatmentFormWithMultiFee } from './TreatmentFormWithMultiFee'

interface TreatmentSystemMainProps {
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

export function TreatmentSystemMain(props: TreatmentSystemMainProps) {
  return <TreatmentFormWithMultiFee {...props} />
}