import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, X, Users, Award } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface SelectedFieldTripEmployee {
  employeeId: string
  employeeName: string
  position: string
  bonus: number
}

interface FieldTripEmployeeSectionProps {
  employees: Employee[]
  selectedEmployees: SelectedFieldTripEmployee[]
  onAddEmployee: (employeeId: string) => void
  onUpdateEmployeeBonus: (index: number, bonus: number) => void
  onRemoveEmployee: (index: number) => void
}

export function FieldTripEmployeeSection({
  employees,
  selectedEmployees,
  onAddEmployee,
  onUpdateEmployeeBonus,
  onRemoveEmployee
}: FieldTripEmployeeSectionProps) {
  const availableEmployees = employees.filter(employee => 
    !selectedEmployees.find(selected => selected.employeeId === employee.id)
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const totalEmployeeBonuses = selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-green-600" />
        <Label className="text-base font-semibold text-green-800">
          Karyawan Pendamping
        </Label>
      </div>
      
      {/* Add Employee Dropdown */}
      {availableEmployees.length > 0 && (
        <div className="flex gap-2">
          <select
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            onChange={(e) => {
              if (e.target.value) {
                onAddEmployee(e.target.value)
                e.target.value = ''
              }
            }}
            defaultValue=""
          >
            <option value="">Pilih karyawan pendamping...</option>
            {availableEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.position}
              </option>
            ))}
          </select>
          <Button 
            type="button" 
            className="bg-green-600 hover:bg-green-700"
            disabled={availableEmployees.length === 0}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected Employees List */}
      {selectedEmployees.length > 0 ? (
        <div className="space-y-3">
          {selectedEmployees.map((employee, index) => (
            <div 
              key={`${employee.employeeId}-${index}`} 
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1">
                <Award className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">{employee.employeeName}</div>
                  <div className="text-sm text-green-600">{employee.position}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Label className="text-xs text-green-700 mb-1">Bonus Kegiatan</Label>
                  <Input
                    type="number"
                    value={employee.bonus}
                    onChange={(e) => onUpdateEmployeeBonus(index, parseInt(e.target.value) || 0)}
                    className="w-32 text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveEmployee(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Total Employee Bonuses */}
          <div className="flex justify-between items-center pt-2 border-t border-green-200">
            <span className="font-medium text-green-800">Total Bonus Karyawan:</span>
            <span className="font-bold text-green-900">{formatCurrency(totalEmployeeBonuses)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Belum ada karyawan pendamping dipilih</p>
          <p className="text-sm">Pilih karyawan dari dropdown di atas</p>
        </div>
      )}
    </div>
  )
}