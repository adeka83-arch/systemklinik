// Enhanced print utilities with better browser compatibility

export interface PrintOptions {
  filename: string
  title: string
}

export enum PrintMethod {
  POPUP = 'popup',
  IFRAME = 'iframe', 
  BLOB_URL = 'blob_url',
  DOWNLOAD = 'download'
}

export const printHTML = async (htmlContent: string, options: PrintOptions): Promise<{ success: boolean; method: PrintMethod; message?: string }> => {
  console.log('🖨️ Starting enhanced print process...')
  
  // Method 1: Try popup window
  try {
    console.log('🔄 Attempting popup method...')
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
    
    if (printWindow && !printWindow.closed) {
      console.log('✅ Popup window opened successfully')
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
      
      return { success: true, method: PrintMethod.POPUP }
    }
  } catch (error) {
    console.log('❌ Popup method failed:', error)
  }
  
  // Method 2: Try iframe approach
  try {
    console.log('🔄 Attempting iframe method...')
    
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '0'
    iframe.style.height = '0'
    
    document.body.appendChild(iframe)
    
    if (iframe.contentDocument) {
      iframe.contentDocument.write(htmlContent)
      iframe.contentDocument.close()
      
      // Wait for content to load
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print()
          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }, 500)
      }
      
      console.log('✅ Iframe method executed')
      return { success: true, method: PrintMethod.IFRAME }
    }
  } catch (error) {
    console.log('❌ Iframe method failed:', error)
  }
  
  // Method 3: Try blob URL approach
  try {
    console.log('🔄 Attempting blob URL method...')
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const newWindow = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
    
    if (newWindow && !newWindow.closed) {
      console.log('✅ Blob URL method executed')
      
      // Clean up URL after window closes
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 5000)
      
      return { success: true, method: PrintMethod.BLOB_URL }
    }
  } catch (error) {
    console.log('❌ Blob URL method failed:', error)
  }
  
  // Method 4: Fallback to download
  console.log('🔄 Using download fallback method...')
  try {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `${options.filename}.html`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
    
    console.log('✅ Download fallback executed')
    return { 
      success: true, 
      method: PrintMethod.DOWNLOAD,
      message: 'File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.'
    }
  } catch (error) {
    console.error('❌ All print methods failed:', error)
    return { 
      success: false, 
      method: PrintMethod.DOWNLOAD, 
      message: 'Gagal mencetak formulir. Silakan coba lagi.'
    }
  }
}

// Check if browser supports popup windows
export const canOpenPopup = (): boolean => {
  try {
    const testWindow = window.open('', '_blank', 'width=1,height=1')
    if (testWindow) {
      testWindow.close()
      return true
    }
    return false
  } catch {
    return false
  }
}

// Enhanced print function with user feedback
export const printFormWithFeedback = async (
  htmlContent: string, 
  options: PrintOptions
): Promise<{ success: boolean; userMessage: string }> => {
  const result = await printHTML(htmlContent, options)
  
  switch (result.method) {
    case PrintMethod.POPUP:
      return {
        success: true,
        userMessage: `Formulir ${options.title} berhasil dibuka untuk dicetak!`
      }
    case PrintMethod.IFRAME:
      return {
        success: true,
        userMessage: `Formulir ${options.title} sedang dicetak...`
      }
    case PrintMethod.BLOB_URL:
      return {
        success: true,
        userMessage: `Formulir ${options.title} dibuka di tab baru untuk dicetak!`
      }
    case PrintMethod.DOWNLOAD:
      return {
        success: true,
        userMessage: result.message || `File ${options.title} berhasil diunduh! Buka file tersebut dan tekan Ctrl+P untuk mencetak.`
      }
    default:
      return {
        success: false,
        userMessage: result.message || 'Gagal mencetak formulir. Silakan coba lagi.'
      }
  }
}