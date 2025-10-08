export interface ReportsProps {
  accessToken: string
}

export interface AttendanceReport {
  id: string
  doctorName: string
  shift: string
  date: string
  type: string
  time: string
}

export interface SalaryReport {
  id: string
  employeeName: string
  month: string
  year: string
  period?: string // Display format like "Januari 2024"
  baseSalary: number
  bonus: number
  holidayAllowance: number

  totalSalary: number
}

export interface DoctorFeeReport {
  doctorId?: string
  doctor: string
  doctorName: string // Add doctorName field for display
  shift: string
  date: string
  period: string // Add period field for display
  treatmentFee: number
  sittingFee: number
  finalFee: number
  totalFee: number // Add totalFee field for display
  hasTreatments: boolean
  recordCount?: number // For grouped/accumulated records
}

export interface ExpenseReport {
  id: string
  name: string
  description?: string
  amount: number
  date: string
  category: string
  receipt?: string
}

export interface FinancialSummary {
  month: string
  year: string
  treatmentIncome?: number
  salesIncome?: number
  fieldTripIncome?: number
  salaryExpense?: number
  doctorFeeExpense?: number
  fieldTripExpense?: number // New field for field trip fees & bonuses
  expenses?: number
  netProfit?: number
  // Fields for display component
  period?: string
  totalIncome?: number
  totalExpense?: number
  profit?: number
  margin?: number
  // Legacy fields for backward compatibility
  totalTreatments?: number
  totalSales?: number
  totalFieldTripRevenue?: number
  totalSalaries?: number
  totalDoctorFees?: number
  totalExpenses?: number
  netIncome?: number
}

export interface SelectedFieldTripDoctor {
  doctorId: string
  doctorName: string
  specialization: string
  fee: number
}

export interface SelectedFieldTripEmployee {
  employeeId: string
  employeeName: string
  position: string
  bonus: number
}

export interface FieldTripSaleReport {
  id: string
  productName: string
  productCategory: string
  quantity: number
  price: number
  pricePerUnit?: number
  subtotal: number
  discountAmount?: number
  totalAmount: number
  date: string
  location: string
  organization?: string
  doctorName?: string
  employeeName?: string
  notes?: string
  participants?: number
  pricePerParticipant?: number
  created_at?: string
  status?: 'pending' | 'paid' | 'cancelled'
  paymentMethod?: 'cash' | 'transfer' | 'credit'
  customerContact?: string
  eventDate?: string
  doctorFee?: number
  employeeBonus?: number
  // New fields for actual fee and bonus calculations
  selectedDoctors?: SelectedFieldTripDoctor[]
  selectedEmployees?: SelectedFieldTripEmployee[]
  totalDoctorFees?: number
  totalEmployeeBonuses?: number
}

export interface TreatmentReport {
  id: string
  patientName: string
  treatmentName: string
  treatmentType: string
  nominal: number
  amount?: number // Keep for backward compatibility
  cost?: number // Add for backward compatibility
  date: string
  doctorName: string
  calculatedFee?: number
  fee?: number
  paymentStatus?: string // Add payment status field
}

export interface SalesReport {
  id: string
  productName: string
  productCategory?: string // Add for compatibility
  category: string
  quantity: number
  price?: number // Add for compatibility
  pricePerUnit: number
  subtotal?: number // Add subtotal field
  discountAmount?: number // Add discount amount field
  discountPercentage?: number // Add discount percentage field
  totalAmount: number
  date: string
  notes?: string
}

export interface ReportFilters {
  startDate: string
  endDate: string
  month: string
  year: string
  doctor: string
  employee: string
  selectedDoctorId: string
  shift: string
  date: string
  type: string
  searchProduct?: string
  productCategory?: string
  salesMonth?: string
  salesYear?: string
  searchFieldTripProduct?: string
  searchLocation?: string
  fieldTripMonth?: string
  fieldTripYear?: string
  searchPatient?: string
  searchTreatment?: string
  treatmentMonth?: string
  treatmentYear?: string
}