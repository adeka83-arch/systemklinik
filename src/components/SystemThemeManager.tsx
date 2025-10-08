import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Palette, 
  RefreshCw, 
  CheckCircle, 
  Download,
  Upload,
  Monitor,
  Smartphone,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface SystemThemeManagerProps {
  accessToken: string
  onThemeUpdate: () => void
}

interface ColorScheme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
  preview: string
}

export function SystemThemeManager({ accessToken, onThemeUpdate }: SystemThemeManagerProps) {
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedScheme, setSelectedScheme] = useState('pink')
  
  const [customColors, setCustomColors] = useState({
    primary: '#ec4899',
    secondary: '#f3e8ff',
    accent: '#8b5cf6',
    background: '#ffffff',
    foreground: '#1f2937',
    muted: '#f3f4f6'
  })

  const predefinedSchemes: ColorScheme[] = [
    {
      id: 'pink',
      name: 'Pink Medical',
      description: 'Current dental/medical theme',
      colors: {
        primary: '#ec4899',
        secondary: '#f3e8ff',
        accent: '#8b5cf6',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#f3f4f6'
      },
      preview: 'from-pink-100 to-purple-100'
    },
    {
      id: 'blue',
      name: 'Professional Blue',
      description: 'Corporate and professional look',
      colors: {
        primary: '#3b82f6',
        secondary: '#e0f2fe',
        accent: '#06b6d4',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#f1f5f9'
      },
      preview: 'from-blue-100 to-cyan-100'
    },
    {
      id: 'green',
      name: 'Health Green',
      description: 'Natural and healthy theme',
      colors: {
        primary: '#10b981',
        secondary: '#ecfdf5',
        accent: '#059669',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#f0fdf4'
      },
      preview: 'from-green-100 to-emerald-100'
    },
    {
      id: 'purple',
      name: 'Modern Purple',
      description: 'Creative and modern appearance',
      colors: {
        primary: '#8b5cf6',
        secondary: '#f5f3ff',
        accent: '#a855f7',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#f3f4f6'
      },
      preview: 'from-purple-100 to-violet-100'
    },
    {
      id: 'orange',
      name: 'Warm Orange',
      description: 'Friendly and welcoming theme',
      colors: {
        primary: '#f97316',
        secondary: '#fff7ed',
        accent: '#ea580c',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#fef3c7'
      },
      preview: 'from-orange-100 to-amber-100'
    },
    {
      id: 'red',
      name: 'Dynamic Red',
      description: 'Bold and energetic theme',
      colors: {
        primary: '#ef4444',
        secondary: '#fef2f2',
        accent: '#dc2626',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#fee2e2'
      },
      preview: 'from-red-100 to-rose-100'
    }
  ]

  const [componentPreviews] = useState([
    { name: 'Dashboard Cards', component: 'card' },
    { name: 'Navigation Menu', component: 'nav' },
    { name: 'Form Elements', component: 'form' },
    { name: 'Buttons & Actions', component: 'button' },
    { name: 'Tables & Reports', component: 'table' },
    { name: 'Modals & Dialogs', component: 'modal' }
  ])

  useEffect(() => {
    // Load current theme settings
    const currentScheme = predefinedSchemes.find(scheme => scheme.id === selectedScheme)
    if (currentScheme) {
      setCustomColors(currentScheme.colors)
    }
  }, [selectedScheme])

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => ({ ...prev, [colorKey]: value }))
  }

  const applyScheme = (schemeId: string) => {
    const scheme = predefinedSchemes.find(s => s.id === schemeId)
    if (scheme) {
      setSelectedScheme(schemeId)
      setCustomColors(scheme.colors)
    }
  }

  const saveTheme = async () => {
    setLoading(true)
    
    try {
      // Generate CSS custom properties
      const cssVariables = {
        '--color-primary': customColors.primary,
        '--color-secondary': customColors.secondary,
        '--color-accent': customColors.accent,
        '--color-background': customColors.background,
        '--color-foreground': customColors.foreground,
        '--color-muted': customColors.muted
      }

      // Save theme configuration
      const themeData = {
        scheme: selectedScheme,
        customColors,
        cssVariables,
        updatedAt: new Date().toISOString()
      }

      // Here you would save to your backend
      // const response = await fetch(`${serverUrl}/theme-settings`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${accessToken}`
      //   },
      //   body: JSON.stringify(themeData)
      // })

      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Apply theme to document root
      const root = document.documentElement
      Object.entries(cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })

      toast.success('✅ Theme applied successfully!')
      toast.success('🎨 All components updated with new colors')
      onThemeUpdate()

    } catch (error) {
      console.error('Save theme error:', error)
      toast.error('Failed to save theme settings')
    } finally {
      setLoading(false)
    }
  }

  const exportTheme = () => {
    const themeConfig = {
      name: `Custom Theme - ${new Date().toLocaleDateString()}`,
      scheme: selectedScheme,
      colors: customColors,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(themeConfig, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinic-theme-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Theme configuration exported!')
  }

  const resetToDefault = () => {
    applyScheme('pink')
    toast.success('Theme reset to default')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert className="border-purple-200 bg-purple-50">
          <Palette className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Live Theme Editor:</strong> Changes will be applied immediately across all system components 
            including forms, reports, and interfaces.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Predefined Color Schemes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-600" />
              Predefined Color Schemes
            </CardTitle>
            <CardDescription>
              Choose from professionally designed color schemes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedSchemes.map((scheme) => (
                <motion.div
                  key={scheme.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedScheme === scheme.id 
                      ? 'border-pink-500 bg-pink-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => applyScheme(scheme.id)}
                >
                  <div className={`h-16 rounded-lg bg-gradient-to-r ${scheme.preview} mb-3 border`}></div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{scheme.name}</h4>
                    {selectedScheme === scheme.id && (
                      <Badge className="bg-pink-100 text-pink-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>
                  
                  {/* Color palette preview */}
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: scheme.colors.primary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: scheme.colors.secondary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: scheme.colors.accent }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: scheme.colors.muted }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom Color Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-pink-600" />
              Custom Color Editor
            </CardTitle>
            <CardDescription>
              Fine-tune colors for your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: value }}
                    ></div>
                    <div className="flex-1">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-full h-10 border-pink-200 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-full mt-1 text-xs border-pink-200"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Component Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Component Preview
            </CardTitle>
            <CardDescription>
              Preview how your theme will look across different components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {componentPreviews.map((item, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <div className="flex gap-1">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <Smartphone className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Mini preview based on component type */}
                  <div className="space-y-2">
                    {item.component === 'card' && (
                      <div 
                        className="p-3 rounded-md border-2"
                        style={{ 
                          borderColor: customColors.primary,
                          backgroundColor: customColors.secondary
                        }}
                      >
                        <div 
                          className="h-2 rounded mb-2"
                          style={{ backgroundColor: customColors.primary }}
                        ></div>
                        <div 
                          className="h-1 rounded mb-1 w-3/4"
                          style={{ backgroundColor: customColors.muted }}
                        ></div>
                        <div 
                          className="h-1 rounded w-1/2"
                          style={{ backgroundColor: customColors.muted }}
                        ></div>
                      </div>
                    )}
                    
                    {item.component === 'button' && (
                      <div className="flex gap-2">
                        <div 
                          className="px-3 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: customColors.primary }}
                        >
                          Primary
                        </div>
                        <div 
                          className="px-3 py-1 rounded text-xs border"
                          style={{ 
                            backgroundColor: customColors.secondary,
                            borderColor: customColors.primary,
                            color: customColors.primary
                          }}
                        >
                          Secondary
                        </div>
                      </div>
                    )}
                    
                    {item.component === 'form' && (
                      <div className="space-y-2">
                        <div 
                          className="h-6 rounded border"
                          style={{ backgroundColor: customColors.background }}
                        ></div>
                        <div 
                          className="h-4 rounded w-1/3"
                          style={{ backgroundColor: customColors.accent }}
                        ></div>
                      </div>
                    )}
                    
                    {/* Default preview for other components */}
                    {!['card', 'button', 'form'].includes(item.component) && (
                      <div 
                        className="h-8 rounded"
                        style={{ 
                          background: `linear-gradient(45deg, ${customColors.primary}, ${customColors.accent})`
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={saveTheme}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 flex-1 min-w-fit"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Applying Theme...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Apply Theme
              </>
            )}
          </Button>

          <Button
            onClick={exportTheme}
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={resetToDefault}
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </motion.div>
    </div>
  )
}