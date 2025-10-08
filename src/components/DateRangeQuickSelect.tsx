import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { CalendarDays } from 'lucide-react'
import { getQuickDateRangeOptions, getCurrentQuickOption } from '../utils/dateHelpers'

interface DateRangeQuickSelectProps {
  startDate: string
  endDate: string
  onRangeChange: (startDate: string, endDate: string) => void
  className?: string
  label?: string
  labelClassName?: string
}

export function DateRangeQuickSelect({ 
  startDate, 
  endDate, 
  onRangeChange, 
  className = '',
  label = 'Periode Cepat',
  labelClassName = 'text-pink-700'
}: DateRangeQuickSelectProps) {
  const quickOptions = getQuickDateRangeOptions()
  const currentOption = getCurrentQuickOption(startDate, endDate)

  const handleQuickSelect = (value: string) => {
    const option = quickOptions.find(opt => opt.value === value)
    if (option && option.range) {
      onRangeChange(option.range.start, option.range.end)
    }
    // If 'custom' is selected, we don't change the dates - user can modify manually
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="quickDateRange" className={labelClassName}>
        {label}
      </Label>
      <Select value={currentOption} onValueChange={handleQuickSelect}>
        <SelectTrigger className="border-pink-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-pink-500" />
            <SelectValue placeholder="Pilih periode" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {quickOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}