import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CheckCircle2, 
  X,
  MessageCircle,
  Image as ImageIcon,
  ExternalLink,
  ArrowRight,
  Smartphone,
  Download,
  Upload,
  Cloud
} from 'lucide-react'

interface VoucherFixShowcaseProps {
  className?: string
}

export function VoucherFixShowcase({ className = "" }: VoucherFixShowcaseProps) {
  const [activeView, setActiveView] = useState<'before' | 'after'>('before')

  const beforeFeatures = [
    { text: 'Hanya pesan teks voucher', icon: <MessageCircle className="h-4 w-4 text-red-500" />, status: 'bad' },
    { text: 'Tidak ada gambar visual', icon: <X className="h-4 w-4 text-red-500" />, status: 'bad' },
    { text: 'Download manual ke komputer', icon: <Download className="h-4 w-4 text-yellow-500" />, status: 'ok' },
    { text: 'Harus kirim gambar terpisah', icon: <X className="h-4 w-4 text-red-500" />, status: 'bad' }
  ]

  const afterFeatures = [
    { text: 'Pesan teks + link gambar', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, status: 'good' },
    { text: 'Gambar voucher profesional', icon: <ImageIcon className="h-4 w-4 text-green-500" />, status: 'good' },
    { text: 'Auto upload ke cloud storage', icon: <Cloud className="h-4 w-4 text-green-500" />, status: 'good' },
    { text: 'URL langsung dalam WhatsApp', icon: <ExternalLink className="h-4 w-4 text-green-500" />, status: 'good' }
  ]

  const beforeMessage = `Halo Muhammad Rakha!

🎉 VOUCHER DISKON SPESIAL 🎉

✨ voucher 17an ✨

🏷️ Kode Voucher: DENTALNYMO
🎯 Diskon: 17%
⏰ Berlaku hingga: 30 September 2025

📎 PENTING: Gambar voucher sudah didownload ke komputer Anda. Silakan kirim gambar voucher tersebut setelah mengirim pesan ini.

📍 Falasifah Dental Clinic
📞 WhatsApp: 085283228355

#FalasifhDental #VoucherDiskon`

  const afterMessage = `Halo Muhammad Rakha!

🎉 VOUCHER DISKON SPESIAL 🎉

✨ voucher 17an ✨

🏷️ Kode Voucher: DENTALNYMO
🎯 Diskon: 17%
⏰ Berlaku hingga: 30 September 2025

🖼️ Gambar Voucher: https://supabase.co/storage/voucher-DENTALNYMO.png

📍 Falasifah Dental Clinic
📞 WhatsApp: 085283228355

#FalasifhDental #VoucherDiskon`

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl text-pink-800 mb-2">Perbaikan Sistem Voucher WhatsApp</h2>
        <p className="text-pink-600">Sebelum dan sesudah perbaikan untuk masalah gambar voucher yang tidak terkirim</p>
      </div>

      {/* Status Alert */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>✅ Masalah Telah Diperbaiki!</strong> Sistem voucher sekarang otomatis menghasilkan gambar voucher, 
          meng-upload ke cloud storage, dan mengirim URL gambar langsung dalam pesan WhatsApp.
        </AlertDescription>
      </Alert>

      {/* Toggle Buttons */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <Button
            variant={activeView === 'before' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('before')}
            className={activeView === 'before' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-200'}
          >
            <X className="h-4 w-4 mr-2" />
            Sebelum Perbaikan
          </Button>
          <Button
            variant={activeView === 'after' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('after')}
            className={activeView === 'after' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-200'}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Setelah Perbaikan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features Comparison */}
        <Card className={`${activeView === 'before' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${activeView === 'before' ? 'text-red-800' : 'text-green-800'}`}>
              {activeView === 'before' ? <X className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              {activeView === 'before' ? 'Sebelum Perbaikan' : 'Setelah Perbaikan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activeView === 'before' ? beforeFeatures : afterFeatures).map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  {feature.icon}
                  <span className="text-sm text-gray-700">{feature.text}</span>
                  <Badge 
                    variant={feature.status === 'good' ? 'default' : feature.status === 'ok' ? 'secondary' : 'destructive'}
                    className="ml-auto text-xs"
                  >
                    {feature.status === 'good' ? 'Bagus' : feature.status === 'ok' ? 'OK' : 'Masalah'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Message Preview */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Preview Pesan WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-blue-200 max-h-96 overflow-y-auto">
              <div className="text-xs text-green-600 mb-2 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                WhatsApp Message Preview
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-line font-mono">
                {activeView === 'before' ? beforeMessage : afterMessage}
              </div>
              
              {activeView === 'after' && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 text-green-700 text-xs">
                    <ImageIcon className="h-3 w-3" />
                    <span>Link gambar voucher dapat diklik langsung!</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Flow */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800">Alur Teknis Perbaikan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ImageIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">1. Generate Canvas</h4>
              <p className="text-xs text-gray-600">Buat gambar voucher dengan HTML5 Canvas</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">2. Upload Cloud</h4>
              <p className="text-xs text-gray-600">Upload ke Supabase Storage dengan public URL</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">3. Generate Message</h4>
              <p className="text-xs text-gray-600">Buat pesan WhatsApp dengan URL gambar</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ExternalLink className="h-6 w-6 text-pink-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">4. Send WhatsApp</h4>
              <p className="text-xs text-gray-600">Kirim pesan dengan link gambar yang bisa diklik</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <Button
              onClick={() => setActiveView(activeView === 'before' ? 'after' : 'before')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {activeView === 'before' ? 'Lihat Setelah Perbaikan' : 'Lihat Sebelum Perbaikan'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}