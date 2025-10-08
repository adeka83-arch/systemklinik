import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
}

interface TreatmentSelectProps {
  value: string
  onValueChange: (value: string) => void
  treatmentProducts: TreatmentProduct[]
  selectedCategory?: string
  placeholder?: string
  formatCurrency: (amount: number) => string
}

export function TreatmentSelectFixed({ 
  value, 
  onValueChange, 
  treatmentProducts, 
  selectedCategory, 
  placeholder = "Pilih tindakan spesifik (kosongkan untuk semua)",
  formatCurrency 
}: TreatmentSelectProps) {
  // Filter and deduplicate products
  const filteredAndDeduplicatedProducts = treatmentProducts
    .filter(product => !selectedCategory || product.category === selectedCategory)
    .reduce((unique: TreatmentProduct[], product) => {
      // Remove duplicates based on product name
      if (!unique.find(p => p.name === product.name)) {
        unique.push(product)
      }
      return unique
    }, [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="border-pink-200 focus:border-pink-400">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredAndDeduplicatedProducts.map((product, index) => (
          <SelectItem key={`treatment-${product.id}-${index}-${product.name}`} value={product.name}>
            {product.name} - {formatCurrency(product.price)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}