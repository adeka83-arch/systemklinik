import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Printer, X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Monitor, Fullscreen } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PrintPreviewProps {
  data: {
    title: string
    content: string
    recordCount: number
    onConfirmPrint: () => void
  }
  onClose: () => void
  onConfirmPrint: () => void
}

const PrintPreviewComponent = ({ 
  data, 
  onClose, 
  onConfirmPrint
}: PrintPreviewProps) => {
  const { title, content, recordCount } = data
  const [isLoading, setIsLoading] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  const handlePrint = useCallback(async () => {
    setIsLoading(true)
    try {
      data.onConfirmPrint()
      onClose()
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Gagal mencetak laporan')
    } finally {
      setIsLoading(false)
    }
  }, [data, onClose])

  const handleDownload = useCallback(() => {
    try {
      const printContent = generateFullHTML(title, content, recordCount)
      const blob = new Blob([printContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Laporan berhasil diunduh sebagai file HTML!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Gagal mengunduh laporan')
    }
  }, [title, content, recordCount])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 150))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomLevel(100)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case '=':
        case '+':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleZoomIn()
          }
          break
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleZoomOut()
          }
          break
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            resetZoom()
          }
          break
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handlePrint()
          }
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlePrint, onClose, handleZoomIn, handleZoomOut, resetZoom])

  const generateFullHTML = (title: string, tableContent: string, recordCount: number): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            h1 { 
              color: #9d174d; 
              text-align: center; 
              margin-bottom: 10px;
              font-size: 24px;
            }
            h2 { 
              color: #9d174d; 
              text-align: center; 
              margin-bottom: 20px;
              font-size: 18px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #9d174d; 
              padding-bottom: 15px;
            }
            .date-info {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 8px; 
              text-align: left;
              vertical-align: top;
            }
            th { 
              background-color: #fce7f3; 
              font-weight: bold;
              color: #9d174d;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              font-size: 10px; 
              color: #666;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            .summary-info {
              background-color: #fef7ff;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 10px;
              font-size: 12px;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 10px;
              }
              .no-print { 
                display: none; 
              }
              table {
                font-size: 9px;
              }
              th, td {
                padding: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Falasifah Dental Clinic</h1>
            <h2>${title}</h2>
            <div class="date-info">
              <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p>Waktu: ${new Date().toLocaleTimeString('id-ID')}</p>
            </div>
          </div>
          
          <div class="summary-info">
            <strong>Ringkasan Laporan:</strong><br>
            Total data: ${recordCount} record<br>
            Periode: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
          </div>
          
          ${tableContent}
          
          <div class="footer">
            <p><strong>Total data: ${recordCount} record</strong></p>
            <p>Laporan digenerate oleh Sistem Manajemen Klinik Falasifah Dental Clinic</p>
            <p>Alamat: [Alamat Klinik] | Telepon: [Nomor Telepon] | Email: [Email Klinik]</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col transition-all duration-300">
      {/* Header/Toolbar */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-8 py-5 shadow-xl border-b-2 border-pink-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Preview Cetak - Falasifah Dental Clinic</h1>
              <p className="text-pink-100 text-sm">{title} - {recordCount} record data | Zoom: {zoomLevel}%</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-pink-500/20 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="h-8 w-8 p-0 text-white hover:text-pink-200 hover:bg-pink-500/30"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[50px] text-center text-white">
                {zoomLevel}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="h-8 w-8 p-0 text-white hover:text-pink-200 hover:bg-pink-500/30"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-8 w-8 p-0 text-white hover:text-pink-200 hover:bg-pink-500/30"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <Button
              variant="outline"
              onClick={handleDownload}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={handlePrint}
              disabled={isLoading}
              className="bg-white text-pink-700 hover:bg-pink-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isLoading ? 'Mencetak...' : 'Cetak'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-pink-500/30"
            >
              <X className="h-4 w-4 mr-1" />
              Tutup
            </Button>
          </div>
        </div>
        
        {/* Shortcuts Info */}
        <div className="mt-3 flex items-center justify-between text-pink-100 text-xs">
          <div>
            <p><strong>Shortcuts:</strong> ESC (Tutup) | Ctrl/Cmd + Plus/Minus (Zoom) | Ctrl/Cmd + 0 (Reset Zoom) | Ctrl/Cmd + Enter (Print)</p>
          </div>
          <div className="flex items-center gap-2 text-pink-200">
            <span className="bg-green-500 w-2 h-2 rounded-full"></span>
            <span>Siap Cetak</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <ScrollArea className="h-full w-full">
          <div 
            className="p-12 min-h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Preview Header */}
            <div className="text-center mb-12 pb-8 border-b-2 border-pink-700">
              <h1 className="text-5xl font-bold text-pink-800 mb-4">
                Falasifah Dental Clinic
              </h1>
              <h2 className="text-3xl text-pink-700 mb-6">
                {title}
              </h2>
              <div className="text-lg text-gray-600">
                <p className="mb-2">Dicetak pada: {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p>Waktu: {new Date().toLocaleTimeString('id-ID')}</p>
              </div>
            </div>

            {/* Summary Info */}
            <div className="bg-pink-50 p-8 rounded-xl mb-8 border-2 border-pink-200">
              <h3 className="text-2xl font-semibold text-pink-800 mb-4">
                Ringkasan Laporan:
              </h3>
              <div className="text-lg text-pink-700 space-y-2">
                <p>Total data: <span className="font-semibold">{recordCount} record</span></p>
                <p>Periode: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
                <p>Status: <span className="font-semibold text-green-600">Siap untuk dicetak</span></p>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-pink-200 p-6">
              <div 
                className="text-base print-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-pink-300 text-center text-gray-500">
              <p className="text-sm">
                Laporan digenerate oleh Sistem Manajemen Klinik Falasifah Dental Clinic
              </p>
              <p className="text-xs mt-2">
                © {new Date().getFullYear()} Falasifah Dental Clinic. All rights reserved.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export const PrintPreview = memo(PrintPreviewComponent)