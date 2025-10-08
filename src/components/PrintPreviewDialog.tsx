import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react'

interface PrintPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  recordCount: number
  onConfirmPrint: () => void
}

export function PrintPreviewDialog({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  recordCount, 
  onConfirmPrint 
}: PrintPreviewDialogProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handlePrint = () => {
    onConfirmPrint()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pink-800 flex items-center justify-between">
            <span>Print Preview - {title}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Preview laporan sebelum dicetak. Gunakan zoom untuk menyesuaikan tampilan dan klik "Print Sekarang" untuk mencetak.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
          <div 
            className="print-preview-content"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${10000 / zoom}%`,
              minHeight: '297mm', // A4 height
              padding: '20mm 15mm',
              fontSize: '12px',
              fontFamily: "'Segoe UI', 'Arial', 'Helvetica', sans-serif",
              lineHeight: '1.4',
              color: '#333'
            }}
          >
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '30px',
              borderBottom: '3px solid #ec4899',
              paddingBottom: '20px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#9d174d',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Falasifah Dental Clinic
              </div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                marginBottom: '8px'
              }}>
                Jl. Raya Dental No. 123, Kota Sehat | Telp: (021) 1234-5678 | Email: info@falasifah-dental.com
              </div>
              <div style={{
                fontSize: '18px',
                color: '#ec4899',
                marginBottom: '8px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {title}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                marginBottom: '4px'
              }}>
                <strong>Total Records:</strong> {recordCount} | 
                <strong> Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888',
                fontStyle: 'italic'
              }}>
                Generated at {new Date().toLocaleString('id-ID')}
              </div>
            </div>

            {/* Content */}
            <div 
              className="print-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Footer */}
            <div style={{
              marginTop: '30px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#888',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '15px'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>© {new Date().getFullYear()} Falasifah Dental Clinic</strong> - Sistem Manajemen Klinik Terintegrasi
              </div>
              <div>
                Laporan ini digenerate secara otomatis oleh sistem dan telah diverifikasi untuk akurasi data.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Preview laporan dengan {recordCount} records
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Sekarang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}