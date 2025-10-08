import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Zap, 
  Smartphone, 
  MessageSquare, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Bell, 
  Camera, 
  FileImage, 
  Workflow,
  Bot,
  Shield,
  Database,
  Globe,
  Truck,
  Users,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'

interface DevelopmentSuggestion {
  id: string
  title: string
  description: string
  category: 'urgent' | 'important' | 'enhancement' | 'innovation'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  benefits: string[]
  icon: any
  tags: string[]
}

const suggestions: DevelopmentSuggestion[] = [
  // Urgent & Important
  {
    id: 'mobile-app',
    title: 'Aplikasi Mobile',
    description: 'Aplikasi mobile untuk dokter dan staff agar bisa akses sistem dari mana saja',
    category: 'urgent',
    priority: 'high',
    estimatedTime: '2-3 bulan',
    benefits: ['Akses real-time', 'Notifikasi push', 'Offline capability', 'Geo-location check-in'],
    icon: Smartphone,
    tags: ['React Native', 'Mobile', 'Offline']
  },
  {
    id: 'whatsapp-integration',
    title: 'Integrasi WhatsApp Business',
    description: 'Kirim reminder appointment, hasil lab, dan invoice langsung via WhatsApp',
    category: 'urgent',
    priority: 'high',
    estimatedTime: '2-4 minggu',
    benefits: ['Komunikasi otomatis', 'Engagement tinggi', 'Reminder appointment', 'Customer service'],
    icon: MessageSquare,
    tags: ['WhatsApp API', 'Automation', 'Communication']
  },
  {
    id: 'online-booking',
    title: 'Online Booking System',
    description: 'Sistem booking online untuk pasien dengan kalender dokter real-time',
    category: 'important',
    priority: 'high',
    estimatedTime: '3-4 minggu',
    benefits: ['Self-service booking', 'Calendar sync', 'Automated reminders', 'Reduce no-shows'],
    icon: Calendar,
    tags: ['Booking', 'Calendar', 'Patient Portal']
  },
  {
    id: 'payment-gateway',
    title: 'Payment Gateway',
    description: 'Integrasi dengan Midtrans/Xendit untuk pembayaran digital',
    category: 'important',
    priority: 'medium',
    estimatedTime: '2-3 minggu',
    benefits: ['Cashless payment', 'Auto-reconciliation', 'Multiple payment methods', 'QR Code'],
    icon: CreditCard,
    tags: ['Payment', 'Digital', 'Fintech']
  },

  // Enhancements
  {
    id: 'advanced-analytics',
    title: 'Advanced Analytics & BI',
    description: 'Dashboard analytics mendalam dengan predictive insights dan forecasting',
    category: 'enhancement',
    priority: 'medium',
    estimatedTime: '4-6 minggu',
    benefits: ['Business insights', 'Trend analysis', 'Revenue forecasting', 'Performance metrics'],
    icon: BarChart3,
    tags: ['Analytics', 'BI', 'Machine Learning']
  },
  {
    id: 'smart-notifications',
    title: 'Smart Notification System',
    description: 'Sistem notifikasi pintar dengan AI untuk prioritas dan timing optimal',
    category: 'enhancement',
    priority: 'medium',
    estimatedTime: '3-4 minggu',
    benefits: ['Smart routing', 'Priority management', 'Delivery optimization', 'Multi-channel'],
    icon: Bell,
    tags: ['AI', 'Notifications', 'Smart']
  },
  {
    id: 'telemedicine',
    title: 'Telemedicine Platform',
    description: 'Platform konsultasi online dengan video call dan digital prescription',
    category: 'enhancement',
    priority: 'medium',
    estimatedTime: '6-8 minggu',
    benefits: ['Remote consultation', 'Digital prescription', 'Video conferencing', 'E-health records'],
    icon: Camera,
    tags: ['Telemedicine', 'Video Call', 'Digital Health']
  },
  {
    id: 'document-ai',
    title: 'Document AI & OCR',
    description: 'AI untuk scan dan ekstrak data dari dokumen medis secara otomatis',
    category: 'innovation',
    priority: 'low',
    estimatedTime: '4-5 minggu',
    benefits: ['Auto data entry', 'Document digitization', 'OCR accuracy', 'Time saving'],
    icon: FileImage,
    tags: ['AI', 'OCR', 'Automation']
  },

  // Innovation
  {
    id: 'workflow-automation',
    title: 'Advanced Workflow Automation',
    description: 'Otomatisasi workflow kompleks dengan rule engine dan trigger system',
    category: 'innovation',
    priority: 'medium',
    estimatedTime: '5-7 minggu',
    benefits: ['Process automation', 'Rule-based actions', 'Workflow optimization', 'Efficiency boost'],
    icon: Workflow,
    tags: ['Automation', 'Workflow', 'Rules Engine']
  },
  {
    id: 'ai-assistant',
    title: 'AI Medical Assistant',
    description: 'AI assistant untuk bantu diagnosis, drug interaction, dan clinical decision',
    category: 'innovation',
    priority: 'low',
    estimatedTime: '8-12 minggu',
    benefits: ['Clinical decision support', 'Drug interaction checker', 'Diagnosis assistance', 'Medical knowledge'],
    icon: Bot,
    tags: ['AI', 'Medical AI', 'Clinical Decision']
  },
  {
    id: 'blockchain-records',
    title: 'Blockchain Medical Records',
    description: 'Sistem rekam medis berbasis blockchain untuk security dan interoperability',
    category: 'innovation',
    priority: 'low',
    estimatedTime: '10-16 minggu',
    benefits: ['Immutable records', 'Interoperability', 'Patient ownership', 'Security'],
    icon: Shield,
    tags: ['Blockchain', 'Security', 'Interoperability']
  },
  {
    id: 'iot-integration',
    title: 'IoT Medical Devices',
    description: 'Integrasi dengan perangkat medis IoT untuk data real-time',
    category: 'innovation',
    priority: 'low',
    estimatedTime: '6-8 minggu',
    benefits: ['Real-time data', 'Device integration', 'Automated readings', 'Remote monitoring'],
    icon: Database,
    tags: ['IoT', 'Medical Devices', 'Real-time']
  },
  // Dental Specific Features
  {
    id: 'digital-xray-integration',
    title: 'Digital X-Ray Integration',
    description: 'Integrasi langsung dengan perangkat X-Ray digital untuk upload otomatis hasil',
    category: 'enhancement',
    priority: 'medium',
    estimatedTime: '3-4 minggu',
    benefits: ['Upload otomatis', 'Digital workflow', 'DICOM support', 'Cloud storage'],
    icon: Camera,
    tags: ['X-Ray', 'DICOM', 'Digital Imaging']
  },
  {
    id: 'dental-charting',
    title: 'Digital Dental Charting',
    description: 'Sistem charting gigi digital interaktif untuk dokumentasi treatment',
    category: 'enhancement',
    priority: 'high',
    estimatedTime: '4-6 minggu',
    benefits: ['Visual documentation', 'Interactive charts', 'Treatment planning', 'Progress tracking'],
    icon: FileImage,
    tags: ['Dental Chart', 'Documentation', 'Visual']
  },
  {
    id: 'appointment-reminder',
    title: 'Smart Appointment Reminder',
    description: 'Sistem reminder pintar untuk appointment dengan multiple channels (SMS, WA, Email)',
    category: 'important',
    priority: 'high',
    estimatedTime: '2-3 minggu',
    benefits: ['Reduce no-shows', 'Multi-channel', 'Smart scheduling', 'Auto follow-up'],
    icon: Bell,
    tags: ['Reminder', 'SMS', 'Multi-channel']
  }
]

export function SystemDevelopmentSuggestions() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  const filteredSuggestions = suggestions.filter(suggestion => {
    const categoryMatch = selectedCategory === 'all' || suggestion.category === selectedCategory
    const priorityMatch = selectedPriority === 'all' || suggestion.priority === selectedPriority
    return categoryMatch && priorityMatch
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'important': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'enhancement': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'innovation': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />
      case 'important': return <CheckCircle className="h-4 w-4" />
      case 'enhancement': return <TrendingUp className="h-4 w-4" />
      case 'innovation': return <Lightbulb className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryStats = () => {
    const stats = suggestions.reduce((acc, suggestion) => {
      acc[suggestion.category] = (acc[suggestion.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return stats
  }

  const stats = getCategoryStats()

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Zap className="h-5 w-5" />
            Saran Pengembangan Sistem
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Roadmap dan rekomendasi fitur untuk meningkatkan sistem klinik menjadi lebih modern dan efisien
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{stats.urgent || 0}</div>
              <div className="text-sm text-red-700">Urgent</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{stats.important || 0}</div>
              <div className="text-sm text-orange-700">Important</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{stats.enhancement || 0}</div>
              <div className="text-sm text-blue-700">Enhancement</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{stats.innovation || 0}</div>
              <div className="text-sm text-purple-700">Innovation</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex gap-2">
              <Button 
                variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Semua Kategori
              </Button>
              <Button 
                variant={selectedCategory === 'urgent' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('urgent')}
                className="text-red-600 border-red-200"
              >
                Urgent
              </Button>
              <Button 
                variant={selectedCategory === 'important' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('important')}
                className="text-orange-600 border-orange-200"
              >
                Important
              </Button>
              <Button 
                variant={selectedCategory === 'enhancement' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('enhancement')}
                className="text-blue-600 border-blue-200"
              >
                Enhancement
              </Button>
              <Button 
                variant={selectedCategory === 'innovation' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('innovation')}
                className="text-purple-600 border-purple-200"
              >
                Innovation
              </Button>
            </div>
          </div>

          {/* Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuggestions.map((suggestion) => {
              const Icon = suggestion.icon
              return (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Icon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(suggestion.category)}>
                              {getCategoryIcon(suggestion.category)}
                              <span className="ml-1 capitalize">{suggestion.category}</span>
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(suggestion.priority)}`} title={`Priority: ${suggestion.priority}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Estimasi: {suggestion.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Benefits:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {suggestion.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <CheckCircle className="h-2 w-2 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {suggestion.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Roadmap */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            Roadmap Implementasi (Saran Prioritas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quarter1" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quarter1">Q1 2025</TabsTrigger>
              <TabsTrigger value="quarter2">Q2 2025</TabsTrigger>
              <TabsTrigger value="quarter3">Q3 2025</TabsTrigger>
              <TabsTrigger value="quarter4">Q4 2025</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quarter1" className="space-y-4">
              <h4 className="font-medium text-green-800">Focus: Core Digital Transformation</h4>
              <div className="grid gap-3">
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">Aplikasi Mobile</span>
                    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Foundation untuk akses mobile dan real-time operations</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="font-medium">WhatsApp Integration</span>
                    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Automated patient communication dan reminder system</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quarter2" className="space-y-4">
              <h4 className="font-medium text-green-800">Focus: Patient Experience & Payment</h4>
              <div className="grid gap-3">
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Online Booking System</span>
                    <Badge className="bg-orange-100 text-orange-800">Important</Badge>
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Payment Gateway</span>
                    <Badge className="bg-orange-100 text-orange-800">Important</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quarter3" className="space-y-4">
              <h4 className="font-medium text-green-800">Focus: Analytics & Intelligence</h4>
              <div className="grid gap-3">
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">Advanced Analytics & BI</span>
                    <Badge className="bg-blue-100 text-blue-800">Enhancement</Badge>
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Smart Notification System</span>
                    <Badge className="bg-blue-100 text-blue-800">Enhancement</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quarter4" className="space-y-4">
              <h4 className="font-medium text-green-800">Focus: Innovation & Future Tech</h4>
              <div className="grid gap-3">
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Telemedicine Platform</span>
                    <Badge className="bg-blue-100 text-blue-800">Enhancement</Badge>
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-green-600" />
                    <span className="font-medium">AI Medical Assistant</span>
                    <Badge className="bg-purple-100 text-purple-800">Innovation</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}