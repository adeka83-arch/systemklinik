import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Palette, Settings, X, Check, Save, Eye, RotateCcw, Cloud } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface ThemeCustomizerProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
  accessToken?: string
}

const colorThemes = [
  {
    name: 'Pink Classic',
    id: 'pink',
    primary: '#ec4899',
    secondary: '#f3e8ff',
    accent: '#fce7f3',
    description: 'Tema default pink yang elegan',
    gradient: 'from-pink-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#ec4899',
      '--primary-foreground': '#ffffff',
      '--secondary': '#f3e8ff',
      '--secondary-foreground': '#1f2937',
      '--muted': '#f9fafb',
      '--muted-foreground': '#6b7280',
      '--accent': '#fce7f3',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#f9fafb',
      '--ring': '#ec4899'
    }
  },
  {
    name: 'Ocean Blue',
    id: 'blue',
    primary: '#0ea5e9',
    secondary: '#e0f2fe',
    accent: '#bae6fd',
    description: 'Tema biru ocean yang menenangkan',
    gradient: 'from-blue-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#0ea5e9',
      '--primary-foreground': '#ffffff',
      '--secondary': '#e0f2fe',
      '--secondary-foreground': '#1f2937',
      '--muted': '#f0f9ff',
      '--muted-foreground': '#6b7280',
      '--accent': '#bae6fd',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#f0f9ff',
      '--ring': '#0ea5e9'
    }
  },
  {
    name: 'Forest Green',
    id: 'green',
    primary: '#10b981',
    secondary: '#ecfdf5',
    accent: '#d1fae5',
    description: 'Tema hijau forest yang fresh',
    gradient: 'from-green-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#10b981',
      '--primary-foreground': '#ffffff',
      '--secondary': '#ecfdf5',
      '--secondary-foreground': '#1f2937',
      '--muted': '#f0fdf4',
      '--muted-foreground': '#6b7280',
      '--accent': '#d1fae5',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#f0fdf4',
      '--ring': '#10b981'
    }
  },
  {
    name: 'Sunset Orange',
    id: 'orange',
    primary: '#f59e0b',
    secondary: '#fffbeb',
    accent: '#fef3c7',
    description: 'Tema orange sunset yang hangat',
    gradient: 'from-orange-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#f59e0b',
      '--primary-foreground': '#ffffff',
      '--secondary': '#fffbeb',
      '--secondary-foreground': '#1f2937',
      '--muted': '#fffbeb',
      '--muted-foreground': '#6b7280',
      '--accent': '#fef3c7',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#fffbeb',
      '--ring': '#f59e0b'
    }
  },
  {
    name: 'Royal Purple',
    id: 'purple',
    primary: '#8b5cf6',
    secondary: '#f5f3ff',
    accent: '#ede9fe',
    description: 'Tema purple royal yang mewah',
    gradient: 'from-purple-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#8b5cf6',
      '--primary-foreground': '#ffffff',
      '--secondary': '#f5f3ff',
      '--secondary-foreground': '#1f2937',
      '--muted': '#faf5ff',
      '--muted-foreground': '#6b7280',
      '--accent': '#ede9fe',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#faf5ff',
      '--ring': '#8b5cf6'
    }
  },
  {
    name: 'Crimson Red',
    id: 'red',
    primary: '#ef4444',
    secondary: '#fef2f2',
    accent: '#fecaca',
    description: 'Tema merah crimson yang berani',
    gradient: 'from-red-50 to-white',
    cssVars: {
      '--background': '#ffffff',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#ef4444',
      '--primary-foreground': '#ffffff',
      '--secondary': '#fef2f2',
      '--secondary-foreground': '#1f2937',
      '--muted': '#fef2f2',
      '--muted-foreground': '#6b7280',
      '--accent': '#fecaca',
      '--accent-foreground': '#1f2937',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#e5e7eb',
      '--input': '#fef2f2',
      '--ring': '#ef4444'
    }
  }
]

const backgroundStyles = [
  {
    name: 'Gradient Soft',
    id: 'gradient-soft',
    style: 'bg-gradient-to-br from-pink-50 to-white',
    description: 'Gradient lembut',
    bodyClass: 'theme-bg-gradient-soft'
  },
  {
    name: 'Gradient Bold',
    id: 'gradient-bold', 
    style: 'bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50',
    description: 'Gradient berani',
    bodyClass: 'theme-bg-gradient-bold'
  },
  {
    name: 'Solid Light',
    id: 'solid-light',
    style: 'bg-gray-50',
    description: 'Warna solid terang',
    bodyClass: 'theme-bg-solid-light'
  },
  {
    name: 'Gradient Dark',
    id: 'gradient-dark',
    style: 'bg-gradient-to-br from-gray-900 to-gray-800',
    description: 'Gradient gelap (Mode gelap)',
    bodyClass: 'theme-bg-gradient-dark'
  }
]

// Load saved theme from database or localStorage (fallback)
const getSavedTheme = async (userId?: string, accessToken?: string) => {
  // Try to load from database first if user is logged in
  if (userId && accessToken) {
    try {
      const response = await fetch(`${serverUrl}/user-theme/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.theme) {
          console.log('🎨 Loaded theme from database:', data.theme)
          return {
            colorTheme: colorThemes.find(t => t.id === data.theme.colorTheme) || colorThemes[0],
            backgroundStyle: backgroundStyles.find(b => b.id === data.theme.backgroundStyle) || backgroundStyles[0],
            fromDatabase: true
          }
        }
      }
    } catch (error) {
      console.log('Failed to load theme from database, using localStorage fallback:', error)
    }
  }
  
  // Fallback to localStorage
  try {
    const saved = localStorage.getItem('clinic-theme')
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('🎨 Loaded theme from localStorage:', parsed)
      return {
        colorTheme: colorThemes.find(t => t.id === parsed.colorTheme) || colorThemes[0],
        backgroundStyle: backgroundStyles.find(b => b.id === parsed.backgroundStyle) || backgroundStyles[0],
        fromDatabase: false
      }
    }
  } catch (error) {
    console.log('Error loading saved theme from localStorage:', error)
  }
  
  console.log('🎨 Using default theme')
  return {
    colorTheme: colorThemes[0],
    backgroundStyle: backgroundStyles[0],
    fromDatabase: false
  }
}

export function ThemeCustomizer({ isOpen, onClose, userId, accessToken }: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0])
  const [selectedBackground, setSelectedBackground] = useState(backgroundStyles[0])
  const [previewTheme, setPreviewTheme] = useState<typeof colorThemes[0] | null>(null)
  const [previewBackground, setPreviewBackground] = useState<typeof backgroundStyles[0] | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [themeSource, setThemeSource] = useState<'database' | 'localStorage' | 'default'>('default')

  // Apply theme to CSS variables
  const applyThemeVariables = (theme: typeof colorThemes[0]) => {
    const root = document.documentElement
    Object.entries(theme.cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }

  // Apply background class and main app background
  const applyBackgroundClass = (background: typeof backgroundStyles[0]) => {
    const body = document.body
    const appDiv = document.querySelector('.min-h-screen') as HTMLElement
    
    // Remove all theme background classes from body
    backgroundStyles.forEach(bg => {
      body.classList.remove(bg.bodyClass)
    })
    
    // Add new background class to body
    body.classList.add(background.bodyClass)
    
    // Also update the main app div background if it exists
    if (appDiv) {
      // Remove existing background classes
      appDiv.classList.remove('bg-gradient-to-br', 'from-pink-50', 'to-white', 'from-blue-50', 'from-green-50', 'from-orange-50', 'from-purple-50', 'from-red-50', 'from-gray-50', 'from-gray-900', 'to-gray-800')
      
      // Add new background based on current theme
      if (background.id === 'gradient-soft') {
        const currentTheme = previewTheme || selectedTheme
        if (currentTheme.id === 'pink') {
          appDiv.classList.add('bg-gradient-to-br', 'from-pink-50', 'to-white')
        } else if (currentTheme.id === 'blue') {
          appDiv.classList.add('bg-gradient-to-br', 'from-blue-50', 'to-white')
        } else if (currentTheme.id === 'green') {
          appDiv.classList.add('bg-gradient-to-br', 'from-green-50', 'to-white')
        } else if (currentTheme.id === 'orange') {
          appDiv.classList.add('bg-gradient-to-br', 'from-orange-50', 'to-white')
        } else if (currentTheme.id === 'purple') {
          appDiv.classList.add('bg-gradient-to-br', 'from-purple-50', 'to-white')
        } else if (currentTheme.id === 'red') {
          appDiv.classList.add('bg-gradient-to-br', 'from-red-50', 'to-white')
        }
      } else if (background.id === 'gradient-bold') {
        appDiv.classList.add('bg-gradient-to-br', 'from-pink-100', 'via-purple-50', 'to-blue-50')
      } else if (background.id === 'solid-light') {
        appDiv.classList.add('bg-gray-50')
      } else if (background.id === 'gradient-dark') {
        appDiv.classList.add('bg-gradient-to-br', 'from-gray-900', 'to-gray-800')
      }
    }
  }

  // Preview theme (temporary)
  const previewThemeHandler = (theme: typeof colorThemes[0]) => {
    setPreviewTheme(theme)
    setIsPreviewMode(true)
    applyThemeVariables(theme)
    setHasChanges(theme.id !== selectedTheme.id || (previewBackground && previewBackground.id !== selectedBackground.id))
  }

  // Preview background (temporary)
  const previewBackgroundHandler = (background: typeof backgroundStyles[0]) => {
    setPreviewBackground(background)
    setIsPreviewMode(true)
    applyBackgroundClass(background)
    setHasChanges((previewTheme && previewTheme.id !== selectedTheme.id) || background.id !== selectedBackground.id)
  }

  // Save theme to database
  const saveThemeToDatabase = async (colorTheme: string, backgroundStyle: string) => {
    if (!userId || !accessToken) {
      throw new Error('User not authenticated')
    }
    
    const response = await fetch(`${serverUrl}/user-theme/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        colorTheme,
        backgroundStyle
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save theme')
    }
    
    return await response.json()
  }

  // Apply changes permanently
  const applyChanges = async () => {
    const newTheme = previewTheme || selectedTheme
    const newBackground = previewBackground || selectedBackground
    
    setSelectedTheme(newTheme)
    setSelectedBackground(newBackground)
    setPreviewTheme(null)
    setPreviewBackground(null)
    setIsPreviewMode(false)
    setHasChanges(false)

    // Save to database first if user is logged in
    try {
      if (userId && accessToken) {
        await saveThemeToDatabase(newTheme.id, newBackground.id)
        setThemeSource('database')
        toast.success(`Tema "${newTheme.name}" berhasil disimpan ke akun Anda!`)
      } else {
        // Fallback to localStorage if no user
        localStorage.setItem('clinic-theme', JSON.stringify({
          colorTheme: newTheme.id,
          backgroundStyle: newBackground.id
        }))
        setThemeSource('localStorage')
        toast.success(`Tema "${newTheme.name}" berhasil disimpan lokal!`)
      }
    } catch (error) {
      console.error('Error saving theme to database:', error)
      
      // Fallback to localStorage
      try {
        localStorage.setItem('clinic-theme', JSON.stringify({
          colorTheme: newTheme.id,
          backgroundStyle: newBackground.id
        }))
        setThemeSource('localStorage')
        toast.success(`Tema "${newTheme.name}" berhasil disimpan lokal (fallback)!`)
      } catch (localError) {
        console.error('Error saving theme to localStorage:', localError)
        toast.error('Gagal menyimpan pengaturan tema')
      }
    }
  }

  // Cancel preview and restore original theme
  const cancelPreview = () => {
    setPreviewTheme(null)
    setPreviewBackground(null)
    setIsPreviewMode(false)
    setHasChanges(false)
    
    // Restore original theme
    applyThemeVariables(selectedTheme)
    applyBackgroundClass(selectedBackground)
  }

  // Reset to default theme
  const resetToDefault = async () => {
    const defaultTheme = colorThemes[0]
    const defaultBackground = backgroundStyles[0]
    
    setSelectedTheme(defaultTheme)
    setSelectedBackground(defaultBackground)
    setPreviewTheme(null)
    setPreviewBackground(null)
    setIsPreviewMode(false)
    setHasChanges(false)

    applyThemeVariables(defaultTheme)
    applyBackgroundClass(defaultBackground)

    // Save to database first if user is logged in
    try {
      if (userId && accessToken) {
        await saveThemeToDatabase(defaultTheme.id, defaultBackground.id)
        setThemeSource('database')
        toast.success('Tema berhasil direset ke default dan disimpan ke akun!')
      } else {
        // Fallback to localStorage
        localStorage.setItem('clinic-theme', JSON.stringify({
          colorTheme: defaultTheme.id,
          backgroundStyle: defaultBackground.id
        }))
        setThemeSource('localStorage')
        toast.success('Tema berhasil direset ke default!')
      }
    } catch (error) {
      console.error('Error saving theme:', error)
      
      // Fallback to localStorage
      try {
        localStorage.setItem('clinic-theme', JSON.stringify({
          colorTheme: defaultTheme.id,
          backgroundStyle: defaultBackground.id
        }))
        setThemeSource('localStorage')
        toast.success('Tema berhasil direset ke default (lokal)!')
      } catch (localError) {
        console.error('Error saving theme to localStorage:', localError)
        toast.error('Gagal menyimpan pengaturan tema')
      }
    }
  }

  // Load and apply saved theme on component mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      setIsLoading(true)
      try {
        const savedTheme = await getSavedTheme(userId, accessToken)
        
        setSelectedTheme(savedTheme.colorTheme)
        setSelectedBackground(savedTheme.backgroundStyle)
        setThemeSource(savedTheme.fromDatabase ? 'database' : 'localStorage')
        
        applyThemeVariables(savedTheme.colorTheme)
        applyBackgroundClass(savedTheme.backgroundStyle)
        
        console.log('🎨 Theme loaded successfully:', {
          theme: savedTheme.colorTheme.name,
          background: savedTheme.backgroundStyle.name,
          source: savedTheme.fromDatabase ? 'database' : 'localStorage'
        })
      } catch (error) {
        console.error('Error loading theme:', error)
        // Use default theme
        applyThemeVariables(colorThemes[0])
        applyBackgroundClass(backgroundStyles[0])
        setThemeSource('default')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSavedTheme()
  }, [userId, accessToken])

  const currentDisplayTheme = previewTheme || selectedTheme
  const currentDisplayBackground = previewBackground || selectedBackground

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <Card className="h-full rounded-none border-l">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5 text-pink-600" />
                    Kustomisasi Tema
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 space-y-6">
                {/* Preview Mode Indicator */}
                <AnimatePresence>
                  {isPreviewMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-blue-100 border border-blue-300 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 text-blue-800">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Mode Preview</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Perubahan akan diterapkan setelah klik "Terapkan Perubahan"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Preview Card */}
                <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h4>
                  <div 
                    className="rounded-lg border p-3 min-h-[120px] transition-all duration-300"
                    style={{
                      background: currentDisplayBackground.id === 'gradient-soft' 
                        ? `linear-gradient(to bottom right, ${currentDisplayTheme.secondary}, #ffffff)`
                        : currentDisplayBackground.id === 'gradient-bold'
                        ? 'linear-gradient(to bottom right, #fce7f3, #f3e8ff, #e0f2fe)'
                        : currentDisplayBackground.id === 'solid-light'
                        ? '#f9fafb'
                        : 'linear-gradient(to bottom right, #111827, #1f2937)',
                      borderColor: currentDisplayTheme.primary + '40'
                    }}
                  >
                    {/* Mock UI Elements */}
                    <div className="space-y-2">
                      {/* Mock Header */}
                      <div 
                        className="h-8 rounded flex items-center px-3 text-white text-xs font-medium"
                        style={{ backgroundColor: currentDisplayTheme.primary }}
                      >
                        {currentDisplayTheme.name} Preview
                      </div>
                      
                      {/* Mock Card */}
                      <div 
                        className="bg-white rounded p-2 border shadow-sm"
                        style={{ borderColor: currentDisplayTheme.primary + '20' }}
                      >
                        <div 
                          className="h-2 rounded mb-2"
                          style={{ backgroundColor: currentDisplayTheme.accent }}
                        />
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div 
                              key={i}
                              className="flex-1 h-1 rounded"
                              style={{ backgroundColor: currentDisplayTheme.secondary }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Mock Button */}
                      <div 
                        className="h-6 rounded text-white text-xs flex items-center justify-center font-medium"
                        style={{ backgroundColor: currentDisplayTheme.primary }}
                      >
                        Button Example
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Selection Info */}
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: currentDisplayTheme.primary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: currentDisplayTheme.secondary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: currentDisplayTheme.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {currentDisplayTheme.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-4 h-3 rounded border ${currentDisplayBackground.style}`} />
                      <span className="text-xs text-gray-600">
                        {currentDisplayBackground.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color Themes */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Tema Warna</h3>
                  <div className="space-y-2">
                    {colorThemes.map((theme, index) => (
                      <motion.div
                        key={theme.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`theme-preview-card cursor-pointer ${
                          currentDisplayTheme.name === theme.name ? 'selected' : 'not-selected'
                        }`}
                        style={{
                          borderColor: currentDisplayTheme.name === theme.name ? theme.primary : undefined,
                          backgroundColor: currentDisplayTheme.name === theme.name ? theme.secondary + '20' : undefined
                        }}
                        onClick={() => previewThemeHandler(theme)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: theme.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: theme.accent }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{theme.name}</p>
                            <p className="text-xs text-gray-500">{theme.description}</p>
                          </div>
                          {currentDisplayTheme.name === theme.name && (
                            <Check className="h-4 w-4" style={{ color: theme.primary }} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Background Styles */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Gaya Background</h3>
                  <div className="space-y-2">
                    {backgroundStyles.map((bg, index) => (
                      <motion.div
                        key={bg.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className={`theme-preview-card cursor-pointer ${
                          currentDisplayBackground.name === bg.name ? 'selected' : 'not-selected'
                        }`}
                        style={{
                          borderColor: currentDisplayBackground.name === bg.name ? currentDisplayTheme.primary : undefined,
                          backgroundColor: currentDisplayBackground.name === bg.name ? currentDisplayTheme.secondary + '20' : undefined
                        }}
                        onClick={() => previewBackgroundHandler(bg)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-6 rounded border border-gray-300 ${bg.style}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{bg.name}</p>
                            <p className="text-xs text-gray-500">{bg.description}</p>
                          </div>
                          {currentDisplayBackground.name === bg.name && (
                            <Check className="h-4 w-4" style={{ color: currentDisplayTheme.primary }} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                  {/* Apply Changes Button */}
                  <AnimatePresence>
                    {hasChanges && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <Button 
                          onClick={applyChanges}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Terapkan Perubahan
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cancel Preview Button */}
                  <AnimatePresence>
                    {isPreviewMode && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <Button 
                          variant="outline"
                          onClick={cancelPreview}
                          className="w-full border-gray-300"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Batalkan Preview
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reset Button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                    onClick={resetToDefault}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset ke Default
                  </Button>
                </div>

                {/* Theme Source Info */}
                <div className="bg-purple-50 rounded-lg p-3">
                  <h4 className="font-medium text-purple-900 mb-2 text-sm flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Penyimpanan Tema
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">Sumber Tema Aktif</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          themeSource === 'database' 
                            ? 'bg-green-100 text-green-800' 
                            : themeSource === 'localStorage'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {themeSource === 'database' && '☁️ Database'}
                        {themeSource === 'localStorage' && '💾 Lokal'}
                        {themeSource === 'default' && '🎨 Default'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">Sync Antar Device</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          themeSource === 'database' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {themeSource === 'database' ? '✅ Aktif' : '⚠️ Tidak'}
                      </Badge>
                    </div>
                    {userId && (
                      <div className="text-xs text-purple-700 mt-2 p-2 bg-purple-100 rounded">
                        💡 Tema disimpan ke akun Anda dan akan sync di semua device
                      </div>
                    )}
                    {!userId && (
                      <div className="text-xs text-yellow-700 mt-2 p-2 bg-yellow-100 rounded">
                        ⚠️ Login untuk menyimpan tema ke akun dan sync antar device
                      </div>
                    )}
                  </div>
                </div>

                {/* Animation Info */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Fitur Animasi</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800">Particle Background</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Aktif</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800">Hover Effects</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Aktif</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800">Smooth Transitions</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Aktif</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Button to open theme customizer
export function ThemeCustomizerButton({ userId, accessToken }: { userId?: string, accessToken?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          title="Kustomisasi Tema"
        >
          <Palette className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <ThemeCustomizer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}