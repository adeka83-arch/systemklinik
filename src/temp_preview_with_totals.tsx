import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Printer, X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Monitor, Fullscreen } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PrintPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPrint: () => void
  title: string
  content: string
  recordCount: number
}

interface SalaryTotals {
  totalEmployees: number
  totalBaseSalary: number
  totalBonus: number
  totalHolidayAllowance: number
  totalSalary: number
  averageSalary: number
}

export const PrintPreview = ({ 
  isOpen, 
  onClose, 
  onConfirmPrint, 
  title, 
  content, 
  recordCount 
}: PrintPreviewProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isFullPage, setIsFullPage] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isAnimating, setIsAnimating] = useState(false)

  // Extract salary totals from content if it's a salary report
  const extractSalaryTotals = (content: string): SalaryTotals | null => {
    if (!title.toLowerCase().includes('gaji')) return null
    
    try {
      // Create a temporary DOM element to parse the HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      
      // Look for the summary box data
      const summaryBox = tempDiv.querySelector('div[style*="grid-template-columns"]')
      if (!summaryBox) return null
      
      const summaryItems = summaryBox.querySelectorAll('div[style*="border-left"]')
      if (!summaryItems || summaryItems.length < 4) return null
      
      // Extract values from the summary items
      const employeeCount = parseInt(summaryItems[0]?.textContent?.match(/(\d+)/)?.[1] || '0')
      const totalSalaryText = summaryItems[1]?.textContent?.replace(/[^\d]/g, '') || '0'
      const totalBonusText = summaryItems[2]?.textContent?.replace(/[^\d]/g, '') || '0'
      const totalHolidayText = summaryItems[3]?.textContent?.replace(/[^\d]/g, '') || '0'
      
      const totalSalary = parseInt(totalSalaryText)
      const totalBonus = parseInt(totalBonusText)
      const totalHolidayAllowance = parseInt(totalHolidayText)
      
      // Calculate base salary (total - bonus - holiday allowance)
      const totalBaseSalary = totalSalary - totalBonus - totalHolidayAllowance
      
      return {
        totalEmployees: employeeCount,
        totalBaseSalary: Math.max(0, totalBaseSalary),
        totalBonus,
        totalHolidayAllowance,
        totalSalary,
        averageSalary: employeeCount > 0 ? Math.round(totalSalary / employeeCount) : 0
      }
    } catch (error) {
      console.log('Error extracting salary totals:', error)
      return null
    }
  }

  const salaryTotals = extractSalaryTotals(content)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handlePrint = async () => {
    setIsLoading(true)
    try {
      await onConfirmPrint()
      onClose()
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Gagal mencetak laporan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    try {
      const printContent = generateFullHTML(title, content, recordCount)
      const blob = new Blob([printContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Laporan berhasil diunduh sebagai file HTML!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Gagal mengunduh laporan')
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }

  const resetZoom = () => {
    setZoomLevel(100)
  }

  const toggleFullScreen = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsFullScreen(!isFullScreen)
      if (!isFullScreen) {
        setIsFullPage(false) // Reset modal full page when entering full screen
      }
      setTimeout(() => setIsAnimating(false), 100)
    }, 150)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          if (isFullScreen) {
            setIsFullScreen(false)
          } else {
            onClose()
          }
          break
        case 'F11':
          event.preventDefault()
          if (isFullScreen) {
            setIsFullScreen(false)
          } else {
            toggleFullScreen()
          }
          break
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleFullScreen()
          }
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
  }, [isOpen, isFullPage, isFullScreen, handlePrint, onClose])

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

  // Full Screen Component
  const FullScreenPreview = () => (
    <div className={`fixed inset-0 z-[100] bg-white flex flex-col full-screen-preview transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Full Screen Header/Toolbar */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-8 py-5 shadow-xl border-b-2 border-pink-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Preview Full Screen - Falasifah Dental Clinic</h1>
              <p className="text-pink-100 text-sm">{title} - {recordCount} record data | Zoom: {zoomLevel}%</p>
            </div>
          </div>
          
          {/* Full Screen Controls */}
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
              onClick={() => setIsFullScreen(false)}
              className="text-white hover:bg-pink-500/30"
            >
              <X className="h-4 w-4 mr-1" />
              Keluar
            </Button>
          </div>
        </div>
        
        {/* Shortcuts Info */}
        <div className="mt-3 flex items-center justify-between text-pink-100 text-xs">
          <div>
            <p><strong>Shortcuts:</strong> ESC/F11 (Keluar Full Screen) | Ctrl/Cmd + F (Toggle Full Screen) | Ctrl/Cmd + Plus/Minus (Zoom) | Ctrl/Cmd + 0 (Reset Zoom) | Ctrl/Cmd + Enter (Print)</p>
          </div>
          <div className="flex items-center gap-2 text-pink-200">
            <span className="bg-green-500 w-2 h-2 rounded-full"></span>
            <span>Ready to Print</span>
          </div>
        </div>
      </div>

      {/* Full Screen Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <ScrollArea className="h-full w-full">
          <div 
            className="p-12 min-h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Preview Header */}
            <div className="text-center mb-12 pb-8 border-b-3 border-pink-700">
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

            {/* Enhanced Summary for Salary Reports */}
            {salaryTotals && (
              <div className="mt-8 p-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-300">
                <h4 className="font-bold text-pink-800 mb-6 text-center text-2xl">💰 RINGKASAN PENGGAJIAN</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg border-l-4 border-pink-600 shadow-md">
                    <div className="text-sm text-gray-600 mb-2">Jumlah Karyawan</div>
                    <div className="font-bold text-2xl text-pink-800">{salaryTotals.totalEmployees} orang</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border-l-4 border-red-600 shadow-md">
                    <div className="text-sm text-gray-600 mb-2">Total Penggajian</div>
                    <div className="font-bold text-xl text-red-600">{formatCurrency(salaryTotals.totalSalary)}</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border-l-4 border-green-600 shadow-md">
                    <div className="text-sm text-gray-600 mb-2">Total Bonus</div>
                    <div className="font-bold text-xl text-green-600">{formatCurrency(salaryTotals.totalBonus)}</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600 shadow-md">
                    <div className="text-sm text-gray-600 mb-2">Rata-rata Gaji</div>
                    <div className="font-bold text-xl text-blue-600">{formatCurrency(salaryTotals.averageSalary)}</div>
                  </div>
                </div>
                <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">💳 TOTAL YANG HARUS DIBAYAR</div>
                    <div className="text-4xl font-bold text-red-600">{formatCurrency(salaryTotals.totalSalary)}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      (Gaji Pokok: {formatCurrency(salaryTotals.totalBaseSalary)} + Bonus: {formatCurrency(salaryTotals.totalBonus)} + Tunjangan: {formatCurrency(salaryTotals.totalHolidayAllowance)})
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Footer */}
            <div className="mt-12 pt-8 border-t-3 border-pink-300 text-center text-gray-600">
              <div className="text-lg space-y-3">
                <p className="font-semibold text-pink-800 text-xl">Total data dalam laporan: {recordCount} record</p>
                <p className="text-pink-700 text-lg">Laporan digenerate oleh Sistem Manajemen Klinik Falasifah Dental Clinic</p>
                <div className="text-base text-gray-500 mt-4 space-y-2">
                  <p>Alamat: [Alamat Klinik] | Telepon: [Nomor Telepon]</p>
                  <p>Email: [Email Klinik] | Website: [Website Klinik]</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  // Return Full Screen if active, otherwise return Dialog
  if (isFullScreen) {
    return <FullScreenPreview />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullPage ? 'w-[98vw] h-[98vh]' : 'max-w-7xl max-h-[95vh]'} flex flex-col transition-all duration-300`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-pink-800" />
              <DialogTitle className="text-pink-800">
                Preview Laporan
              </DialogTitle>
            </div>
            
            {/* Preview Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-pink-50 rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="h-8 w-8 p-0 text-pink-600 hover:text-pink-800 hover:bg-pink-100"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                
                <span className="text-xs text-pink-700 font-medium min-w-[40px] text-center">
                  {zoomLevel}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 150}
                  className="h-8 w-8 p-0 text-pink-600 hover:text-pink-800 hover:bg-pink-100"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetZoom}
                  className="h-8 w-8 p-0 text-pink-600 hover:text-pink-800 hover:bg-pink-100"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Full Screen Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullScreen}
                className="text-pink-600 hover:text-pink-800 hover:bg-pink-50"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Full Screen
              </Button>
              
              {/* Full Page Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullPage(!isFullPage)}
                className="text-pink-600 hover:text-pink-800 hover:bg-pink-50"
              >
                {isFullPage ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-1" />
                    Normal
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Full Page
                  </>
                )}
              </Button>
            </div>
          </div>
          <DialogDescription className="text-pink-600">
            {title} - {recordCount} record data
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className={`${isFullPage ? 'h-[calc(98vh-140px)]' : 'h-[calc(95vh-140px)]'} w-full rounded-md border border-pink-200`}>
            <div 
              className="p-8 bg-white min-h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
            >
              {/* Preview Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-pink-700">
                <h1 className={`${isFullPage ? 'text-4xl' : 'text-3xl'} font-bold text-pink-800 mb-3`}>
                  Falasifah Dental Clinic
                </h1>
                <h2 className={`${isFullPage ? 'text-2xl' : 'text-xl'} text-pink-700 mb-4`}>
                  {title}
                </h2>
                <div className={`${isFullPage ? 'text-base' : 'text-sm'} text-gray-600`}>
                  <p className="mb-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p>Waktu: {new Date().toLocaleTimeString('id-ID')}</p>
                </div>
              </div>

              {/* Summary Info */}
              <div className="bg-pink-50 p-6 rounded-lg mb-6 border border-pink-200">
                <h3 className={`${isFullPage ? 'text-lg' : 'text-base'} font-semibold text-pink-800 mb-3`}>
                  Ringkasan Laporan:
                </h3>
                <div className={`${isFullPage ? 'text-base' : 'text-sm'} text-pink-700 space-y-1`}>
                  <p>Total data: <span className="font-semibold">{recordCount} record</span></p>
                  <p>Periode: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
                  <p>Status: Siap untuk dicetak</p>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <div 
                  className={`${isFullPage ? 'text-sm' : 'text-xs'} print-content`}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>

              {/* Enhanced Summary for Salary Reports */}
              {salaryTotals && (
                <div className="mt-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-300">
                  <h4 className="font-bold text-pink-800 mb-4 text-center text-lg">💰 RINGKASAN PENGGAJIAN</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-pink-600 shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">Jumlah Karyawan</div>
                      <div className="font-bold text-lg text-pink-800">{salaryTotals.totalEmployees} orang</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-red-600 shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">Total Penggajian</div>
                      <div className="font-bold text-lg text-red-600">{formatCurrency(salaryTotals.totalSalary)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-600 shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">Total Bonus</div>
                      <div className="font-bold text-lg text-green-600">{formatCurrency(salaryTotals.totalBonus)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-600 shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">Rata-rata Gaji</div>
                      <div className="font-bold text-lg text-blue-600">{formatCurrency(salaryTotals.averageSalary)}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">💳 TOTAL YANG HARUS DIBAYAR</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(salaryTotals.totalSalary)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        (Gaji Pokok: {formatCurrency(salaryTotals.totalBaseSalary)} + Bonus: {formatCurrency(salaryTotals.totalBonus)} + Tunjangan: {formatCurrency(salaryTotals.totalHolidayAllowance)})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Footer */}
              <div className="mt-8 pt-6 border-t-2 border-pink-300 text-center text-gray-600">
                <div className={`${isFullPage ? 'text-base' : 'text-sm'} space-y-2`}>
                  <p className="font-semibold text-pink-800">Total data dalam laporan: {recordCount} record</p>
                  <p className="text-pink-700">Laporan digenerate oleh Sistem Manajemen Klinik Falasifah Dental Clinic</p>
                  <div className={`${isFullPage ? 'text-sm' : 'text-xs'} text-gray-500 mt-3 space-y-1`}>
                    <p>Alamat: [Alamat Klinik] | Telepon: [Nomor Telepon]</p>
                    <p>Email: [Email Klinik] | Website: [Website Klinik]</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-pink-200 gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Shortcuts:</strong> ESC (Tutup) | F11 (Full Screen) | Ctrl/Cmd + F (Full Screen) | Ctrl/Cmd + Plus/Minus (Zoom) | Ctrl/Cmd + 0 (Reset Zoom) | Ctrl/Cmd + Enter (Print)</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Batal
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Download HTML
            </Button>
            
            <Button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Printer className="h-4 w-4" />
              {isLoading ? 'Mencetak...' : 'Cetak Sekarang'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}