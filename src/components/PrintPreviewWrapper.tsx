import { memo } from 'react'
import { PrintPreview } from './PrintPreview'

interface PreviewData {
  title: string
  content: string
  recordCount: number
  onConfirmPrint: () => void
}

interface PrintPreviewWrapperProps {
  isOpen: boolean
  data: PreviewData | null
  onClose: () => void
  onConfirm: () => void
}

const PrintPreviewWrapperComponent = ({ 
  isOpen,
  data, 
  onClose, 
  onConfirm 
}: PrintPreviewWrapperProps) => {
  // Only render PrintPreview when open and data is available
  if (!isOpen || !data) {
    return null
  }

  return (
    <PrintPreview
      data={data}
      onClose={onClose}
      onConfirmPrint={onConfirm}
    />
  )
}

export const PrintPreviewWrapper = memo(PrintPreviewWrapperComponent)