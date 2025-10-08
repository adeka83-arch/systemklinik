import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Check } from 'lucide-react'
// Simple cn function without external dependencies
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface FormTemplate {
  id: string
  title: string
  description: string
  size: string
  color: string
  icon: React.ComponentType<any>
  bgColor: string
  borderColor: string
  textColor: string
  usage: string
}

interface FormTemplateCardProps {
  template: FormTemplate
  isSelected: boolean
  onClick: () => void
}

export const FormTemplateCard: React.FC<FormTemplateCardProps> = ({
  template,
  isSelected,
  onClick
}) => {
  const Icon = template.icon

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 relative group",
        "hover:scale-[1.02] hover:shadow-md",
        isSelected 
          ? `${template.borderColor} border-2 ${template.bgColor} shadow-md` 
          : 'border-gray-200 hover:border-pink-300'
      )}
      onClick={onClick}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center z-10">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            isSelected ? template.bgColor : "bg-gray-50 group-hover:bg-pink-50"
          )}>
            <Icon className={cn(
              "h-6 w-6 transition-colors",
              isSelected ? template.textColor : "text-gray-600 group-hover:text-pink-600"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className={cn(
              "text-sm font-semibold transition-colors",
              isSelected ? template.textColor : "text-gray-800 group-hover:text-pink-800"
            )}>
              {template.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium",
                  isSelected 
                    ? `${template.bgColor} ${template.textColor}` 
                    : "bg-gray-100 text-gray-600 group-hover:bg-pink-100 group-hover:text-pink-700"
                )}
              >
                {template.size}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        <p className={cn(
          "text-xs leading-relaxed transition-colors",
          isSelected ? "text-gray-700" : "text-gray-600"
        )}>
          {template.description}
        </p>
        
        <p className={cn(
          "text-xs leading-relaxed transition-colors",
          isSelected ? template.textColor : "text-gray-500"
        )}>
          {template.usage}
        </p>
      </CardContent>
    </Card>
  )
}