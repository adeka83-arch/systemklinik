import { Button } from './ui/button'
import { Receipt } from 'lucide-react'

interface PrescriptionButtonProps {
  patient: any
  onPrint: (patient: any, type: 'prescription') => void
}

export function PrescriptionButton({ patient, onPrint }: PrescriptionButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onPrint(patient, 'prescription')}
      className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
    >
      <Receipt className="h-4 w-4" />
      Resep Obat
    </Button>
  )
}