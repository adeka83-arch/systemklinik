import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CheckCircle, 
  Upload, 
  Image as ImageIcon, 
  ExternalLink,
  Smartphone,
  Download,
  Share2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface VoucherImageDemoProps {
  onClose?: () => void
}

export function VoucherImageDemo({ onClose }: VoucherImageDemoProps) {
  const [step, setStep] = useState(1)

  // Generate demo voucher image
  const generateDemoVoucherImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size
      canvas.width = 800
      canvas.height = 600
      
      if (!ctx) {
        resolve('')
        return
      }
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, '#ec4899')
      gradient.addColorStop(1, '#be185d')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
      
      // Add decorative elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.arc(700, 100, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(100, 500, 60, 0, Math.PI * 2)
      ctx.fill()
      
      // White background for content
      ctx.fillStyle = 'white'
      ctx.roundRect(50, 50, 700, 500, 20)
      ctx.fill()
      
      // Title
      ctx.fillStyle = '#be185d'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('VOUCHER DISKON', 400, 120)
      
      // Voucher title
      ctx.font = 'bold 36px Arial'
      ctx.fillText('DEMO VOUCHER SPESIAL', 400, 180)
      
      // Discount value
      ctx.fillStyle = '#dc2626'
      ctx.font = 'bold 72px Arial'
      ctx.fillText('17%', 400, 280)
      ctx.fillStyle = '#be185d'
      ctx.font = '24px Arial'
      ctx.fillText('DISKON', 400, 310)
      
      // Voucher code
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 32px Arial'
      ctx.fillText('Kode: DENTALNYMO', 400, 370)
      
      // Expiry date
      ctx.font = '20px Arial'
      ctx.fillText('Berlaku hingga: 30 September 2025', 400, 410)
      
      // Clinic info
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#be185d'
      ctx.fillText('Falasifah Dental Clinic', 400, 460)
      
      ctx.font = '18px Arial'
      ctx.fillStyle = '#1f2937'
      ctx.fillText('WhatsApp: 085283228355', 400, 490)
      
      // Description
      ctx.font = '16px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('hanya berlaku untuk 1 kali tindakan', 400, 520)
      
      resolve(canvas.toDataURL('image/png'))
    })
  }

  const steps = [
    {
      id: 1,
      title: 'Masalah Sebelumnya',
      description: 'Voucher diskon hanya berupa teks tanpa gambar visual',
      icon: <AlertDescription className="h-6 w-6 text-red-600" />,
      color: 'red'
    },
    {
      id: 2,
      title: 'Solusi Baru',
      description: 'Generate gambar voucher otomatis dengan canvas HTML5',
      icon: <ImageIcon className="h-6 w-6 text-blue-600" />,
      color: 'blue'
    },
    {
      id: 3,
      title: 'Upload ke Cloud',
      description: 'Upload gambar ke Supabase Storage dengan URL publik',
      icon: <Upload className="h-6 w-6 text-green-600" />,
      color: 'green'
    },
    {
      id: 4,
      title: 'Kirim ke WhatsApp',
      description: 'Pesan WhatsApp dengan link gambar voucher yang bisa diakses',
      icon: <Share2 className="h-6 w-6 text-purple-600" />,
      color: 'purple'
    }
  ]

  const handleDemoStep = async (stepNumber: number) => {
    setStep(stepNumber)
    
    if (stepNumber === 2) {
      toast.info('Membuat demo gambar voucher...')
      const imageUrl = await generateDemoVoucherImage()
      console.log('Demo voucher image generated:', imageUrl.substring(0, 50) + '...')
      
      // Download demo image
      const downloadLink = document.createElement('a')
      downloadLink.download = `demo-voucher-${Date.now()}.png`
      downloadLink.href = imageUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      toast.success('Demo gambar voucher berhasil dibuat dan didownload!')
    }
    
    if (stepNumber === 3) {
      toast.success('Simulasi upload ke cloud storage berhasil!')
    }
    
    if (stepNumber === 4) {
      toast.success('Simulasi pengiriman ke WhatsApp berhasil!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-pink-600" />
          <h2 className="text-2xl text-pink-800">Perbaikan Sistem Voucher</h2>
          <Sparkles className="h-6 w-6 text-pink-600" />
        </div>
        <p className="text-pink-600">
          Sekarang voucher diskon dikirim dengan gambar visual yang menarik!
        </p>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Masalah Dipecahkan:</strong> Voucher diskon yang sebelumnya hanya berupa teks, 
          sekarang disertai dengan gambar voucher profesional yang di-upload ke cloud dan 
          dapat diakses langsung melalui WhatsApp.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((stepItem) => (
          <Card 
            key={stepItem.id}
            className={`cursor-pointer transition-all duration-200 ${
              step >= stepItem.id 
                ? `border-${stepItem.color}-200 bg-${stepItem.color}-50` 
                : 'border-gray-200 bg-gray-50'
            } hover:shadow-md`}
            onClick={() => handleDemoStep(stepItem.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    step >= stepItem.id 
                      ? `bg-${stepItem.color}-100` 
                      : 'bg-gray-100'
                  }`}>
                    {stepItem.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{stepItem.title}</CardTitle>
                  </div>
                </div>
                {step >= stepItem.id && (
                  <CheckCircle className={`h-5 w-5 text-${stepItem.color}-600`} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{stepItem.description}</p>
              {stepItem.id === step && (
                <Badge 
                  variant="secondary" 
                  className={`mt-2 bg-${stepItem.color}-100 text-${stepItem.color}-800 border-${stepItem.color}-200`}
                >
                  Sedang Aktif
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-pink-200 bg-pink-50">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Demo WhatsApp Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-pink-200">
            <div className="text-sm font-medium text-green-600 mb-2">
              💬 Contoh Pesan WhatsApp:
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {`Halo Muhammad Rakha Fitriansyah!

🎉 *VOUCHER DISKON SPESIAL* 🎉

✨ voucher 17an ✨

🏷️ *Kode Voucher:* DENTALNYMO
🎯 *Diskon:* 17%
💰 *Minimal pembelian:* Rp -2
🎫 *Terbatas untuk 1 penggunaan pertama*
⏰ *Berlaku hingga:* 30 September 2025

🖼️ *Gambar Voucher:* https://supabase.co/storage/voucher-image.png

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355
🕒 *Jam Buka:* Senin - Sabtu, 08:00 - 20:00

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang
2. Berlaku untuk semua treatment
3. Tidak dapat digabung dengan promo lain

*Buruan datang sebelum voucher habis!* 🦷✨`}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => handleDemoStep(2)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Demo Generate Gambar
        </Button>
        
        <Button
          onClick={() => window.open('https://wa.me/6285283228355', '_blank')}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Test WhatsApp
        </Button>
        
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Tutup Demo
          </Button>
        )}
      </div>
    </div>
  )
}