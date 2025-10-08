import { useState } from 'react'
import { toast } from 'sonner@2.0.3'

interface PreviewData {
  title: string
  content: string
  recordCount: number
  onConfirmPrint: () => void
}

export const usePrintPreview = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  const showPreview = (data: PreviewData) => {
    setPreviewData(data)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewData(null)
  }

  const confirmPrint = async () => {
    if (previewData?.onConfirmPrint) {
      try {
        previewData.onConfirmPrint()
        toast.success('Laporan berhasil dicetak!')
      } catch (error) {
        console.error('Print confirmation error:', error)
        toast.error('Gagal mencetak laporan')
      }
    }
  }

  return {
    isPreviewOpen,
    previewData,
    showPreview,
    closePreview,
    confirmPrint
  }
}