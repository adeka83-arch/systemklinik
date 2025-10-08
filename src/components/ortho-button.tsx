import { Button } from './ui/button'
import { Smile } from 'lucide-react'

interface OrthoButtonProps {
  patient: any
  onPrint: (patient: any, type: 'ortho-form') => void
}

export function OrthoButton({ patient, onPrint }: OrthoButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onPrint(patient, 'ortho-form')}
      className="flex items-center gap-2"
    >
      <Smile className="h-4 w-4" />
      Formulir Ortodontik
    </Button>
  )
}