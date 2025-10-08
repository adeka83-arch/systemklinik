import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from './command'
import { cn } from './utils'

interface Option {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDisplayItems?: number
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder = "Pilih item...",
  className,
  disabled = false,
  maxDisplayItems = 3
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter(item => item !== value))
    } else {
      onSelectedChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectedChange(selected.filter(item => item !== value))
  }

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    }
    
    if (selected.length <= maxDisplayItems) {
      return selected.map(value => {
        const option = options.find(opt => opt.value === value)
        return option?.label || value
      }).join(', ')
    }
    
    return `${selected.length} item dipilih`
  }

  const filteredOptions = options.filter(option =>
    (option.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto px-3 py-2",
            "border-pink-200 focus:border-pink-400 hover:border-pink-300",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : selected.length <= maxDisplayItems ? (
              selected.map(value => {
                const option = options.find(opt => opt.value === value)
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="bg-pink-100 text-pink-700 hover:bg-pink-200 px-2 py-1 text-xs flex items-center gap-1"
                  >
                    <span>{option?.label || value}</span>
                    <span
                      onClick={(e) => handleRemove(value, e)}
                      className="hover:bg-pink-300 rounded-full p-0.5 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleRemove(value, e as any)
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                )
              })
            ) : (
              <Badge
                variant="secondary"
                className="bg-pink-100 text-pink-700 px-2 py-1 text-xs"
              >
                {selected.length} item dipilih
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-w-md max-h-96" align="start">
        <Command className="max-h-96">
          <CommandInput
            placeholder="Cari item..."
            value={search}
            onValueChange={setSearch}
            className="border-0 focus:ring-0"
          />
          <CommandEmpty>Tidak ada item ditemukan.</CommandEmpty>
          {filteredOptions.length > 10 && (
            <div className="px-3 py-1 text-xs text-muted-foreground border-b bg-gray-50">
              Menampilkan {filteredOptions.length} item • Scroll untuk melihat semua
            </div>
          )}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div
                      className={cn(
                        "h-4 w-4 border border-pink-300 rounded flex items-center justify-center",
                        selected.includes(option.value) && "bg-pink-600 border-pink-600"
                      )}
                    >
                      {selected.includes(option.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
        {selected.length > 0 && (
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectedChange([])}
              className="text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50 w-full"
            >
              Hapus Semua ({selected.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}