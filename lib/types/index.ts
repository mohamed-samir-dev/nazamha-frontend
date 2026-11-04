export type StaffPermission =
  | "attendance"
  | "students"
  | "groups"
  | "teachers"
  | "reports"
  | "payments"
  | "exams";

export interface CenterUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  manager_name?: string;
  whatsapp?: string;
  governorate?: string;
  is_active: boolean;
  user_type: "center";
  created_at: string;
  last_login_at?: string;
}

export interface CenterRoom {
  id: string;
  name: string;
  capacity: number;
  center_id: string;
  is_active: boolean;
  created_at: string;
}

export interface CenterAuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  created_at: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  center_id: string;
  teacher_id: string | null;
  teacher_name?: string | null;
  teacher_subject?: string | null;
  permissions: StaffPermission[];
  is_active: boolean;
  user_type: "staff";
  last_login_at?: string | null;
  created_at: string;
}

export interface CenterTeacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  is_active: boolean;
  center_id: string;
  created_at: string;
  students_count?: number;
}

export interface CenterTeacherFinancialRow {
  id: string;
  name: string;
  subject: string | null;
  is_active: boolean;
  students_count: number;
  subscriptions_revenue: number;
  book_sales_revenue: number;
  total_revenue: number;
  transactions_count: number;
}

export interface CenterFinancialReport {
  teachers: CenterTeacherFinancialRow[];
  totals: {
    revenue: number;
    subscriptions: number;
    book_sales: number;
    transactions: number;
  };
}

export interface CenterDashboardTeacherRow {
  id: string;
  name: string;
  subject: string | null;
  is_active: boolean;
  assistants_count: number;
  students_count: number;
  current_month_revenue: number;
}

export interface CenterDashboardActivity {
  id: string;
  action: string;
  resource_type: string;
  new_data: Record<string, any>;
  created_at: string;
}

export interface CenterDashboardData {
  center: CenterUser;
  teachers_count: number;
  active_teachers_count: number;
  assistants_count: number;
  active_assistants_count: number;
  current_month_revenue: number;
  previous_month_revenue: number;
  revenue_growth: number | null;
  current_month: number;
  current_year: number;
  teachers: CenterDashboardTeacherRow[];
}

export interface BookDef {
  id: string;
  name: string;
  price: number;
  grade_id?: string;
}

export interface Book {
  id: string;
  teacher_id: string;
  name: string;
  description?: string | null;
  cover_image?: string | null;
  grade_id?: string | null;
  group_id?: string | null;
  price: number;
  status: "available" | "unavailable";
  sort_order: number;
  code?: string | null;
  academic_year?: string | null;
  buyers_count?: number;
  total_revenue?: number;
  created_at?: string;
}

export interface BookSale {
  id: string;
  teacher_id: string;
  book_id: string | { id: string; name: string; price: number };
  student_id: string | { id: string; name: string; code?: string; group_id?: string };
  price: number;
  discount: number;
  discount_reason?: string | null;
  final_price: number;
  is_exempt: boolean;
  paid?: boolean;
  subscription_id?: string | null;
  month: number;
  year: number;
  status: "active" | "cancelled";
  created_at?: string;
}

export interface StudentBookRow {
  book_id: string;
  name: string;
  price: number;
  purchased: boolean;
  paid: boolean;
  amount: number | null;
  discount: number | null;
  is_exempt: boolean;
  receipt_number: string | null;
  purchase_date: string | null;
  sale_id: string | null;
}

export interface Teacher {
  id: string;
  teacherCode?: string;
  name: string;
  email?: string;
  phone?: string;
  monthly_price?: number;
  books?: BookDef[];
  is_admin: boolean;
  is_super_admin?: boolean;
  hidden_from_admin?: boolean;
  subscription_price?: number;
  financial_permissions?: string[];
  allowed_teacher_ids?: string[] | null;
  has_bills_feature: boolean;
  has_attendance_feature: boolean;
  is_center_mode: boolean;
  has_centers_feature?: boolean;
  whatsapp_template?: string;
  plan_id?: string | null;
  is_active?: boolean;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  created_at: string;
  academic_year?: { active_months: number[]; active_month_years?: { month: number; year: number }[] };
  settings?: {
    timezone?: string;
    language?: string;
    currency?: string;
    allow_online_payment?: boolean;
    payment_grace_period_days?: number;
  };
  banner?: {
    enabled: boolean;
    message: string;
    type: "info" | "warning" | "success" | "danger";
  };
}

export interface SubTeacher {
  id: string;
  name: string;
  phone?: string;
  center_id: string;
  grade_ids?: string[];
  created_at: string;
}

export interface Grade {
  id: string;
  name: string;
  start_code?: number;
  prefix?: string;
  monthly_price?: number | null;
  teacher_id?: string;
  created_at?: string;
}

export interface Group {
  attendance_sessions?: {id?:string;group_id?:string;session_date:string;time:string;cancelled:boolean;is_extra?:boolean;title?:string}[];
  id: string;
  name: string;
  code?: string | null;
  day_of_week: string;
  time: string;
  is_private?: boolean;
  teacher_id?: string;
  sub_teacher_id?: string | null;
  grade_id?: string | null;
  sessions_per_month?: number;
  monthly_price?: number | null;
  cancelled_sessions?: string[];
  start_date?: string | null; // YYYY-MM-DD
  whatsapp_link?: string | null;
  student_count?: number;
  created_at?: string;
}

export interface Student {
  attendance_resolutions?:Record<string,"compensated"|"exempt">;
  attendance_ends_on?: string;
  attendance_excluded_dates?: string[];
  card_qr_token?: string;
  id: string;
  name: string;
  code?: string;
  group_id: string | null;
  grade_id?: string | null;
  teacher_id?: string;
  months?: boolean[];
  received_books?: string[];
  discount_value?: number;
  discount_reason?: string;
  apply_discount_to_books?: boolean;
  book_discount_value?: number | null;
  family_discount_percent?: number | null;
  family_discount_reason?: string | null;
  family_book_discount_percent?: number | null;
  family_book_discount_reason?: string | null;
  parent_phone?: string;
  parent_job?: string;
  student_email?: string;
  custom_monthly_price?: number | null;
  sibling_family_id?: string | null;
  sibling_family_name?: string | null;
  subscription_start_month?: number | null;
  subscription_start_year?: number | null;
  is_suspended?: boolean;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  notes?: string | null;
  group_join_date?: string | null;
  center_student_code?: string | null;
  created_at?: string;
}

export type SubscriptionStatus = "not_due" | "due" | "paid" | "exempt";

export interface MonthlySubscription {
  id: string;
  /** MongoDB ObjectId string — present in raw API responses before normalisation */
  _id?: string;
  student_id: string;
  teacher_id: string;
  month: number;
  year: number;
  status: SubscriptionStatus;
  amount: number;
  discount: number;
  paid_at?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface AcademicYearSettings {
  active_months: number[];
}

export interface AttendanceRecord {
  attendance_kind?: "regular" | "guest" | "substitute";
  original_group_id?: string;
  session_id?: string;
  qr_text?: string;
  cross_group_action?: "guest" | "compensate" | "exempt";
  target_date?: string;
  reason?: string;
  resolution?: "compensated" | "exempt";
  substitution_id?: string;
  scanner_group_id?: string;
  scanner_session_date?: string;
  cross_group_confirmed?: boolean;
  id: string;
  student_id: string;
  session_date: string;
  month: number;
  year: number;
  status: "present" | "absent";
  group_id?: string | null;
  teacher_id?: string;
  created_at?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: "إيجار" | "رواتب سكرتارية" | "أخرى";
  billing_month: number;
  billing_year: number;
  is_recurring: boolean;
  template_id?: string | null;
  teacher_id?: string;
  created_at?: string;
}

export interface BillTemplate {
  id: string;
  teacher_id: string;
  title: string;
  amount: number;
  category: "إيجار" | "رواتب سكرتارية" | "أخرى";
  is_active: boolean;
  end_month?: number | null;  // 1-12
  end_year?: number | null;
  created_at?: string;
}

export type SalaryType =
  | "monthly"
  | "daily"
  | "hourly"
  | "per_lesson"
  | "percentage"
  | "fixed_plus_bonus";

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  job_title?: string;
  role?: string;
  employment_start_date?: string;
  employment_end_date?: string | null;
  salary_type: SalaryType;
  base_salary: number;
  amount?: number;
  payment_day?: number;
  notes?: string;
  is_active?: boolean;
  is_recurring?: boolean;
  teacher_id?: string;
  created_at?: string;
}

export interface PayrollAdjustment {
  _id?: string;
  amount: number;
  reason: string;
  created_at?: string;
}

export interface PayrollPayment {
  _id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  receipt_attachment?: string;
  recorded_by?: string;
  created_at?: string;
}

export interface Salary {
  id: string;
  employee_id?: string | null;
  employee_name: string;
  teacher_name?: string;
  role: string;
  job_title?: string;
  amount: number;
  basic_salary?: number;
  bonuses?: number;
  additional_payments?: number;
  absence_deductions?: number;
  other_deductions?: number;
  adjustments?: PayrollAdjustment[];
  net_salary?: number;
  paid_amount?: number;
  remaining_amount?: number;
  month: number;
  year: number;
  is_recurring: boolean;
  is_virtual_instance?: boolean;
  status?: "draft" | "approved" | "partially_paid" | "paid" | "overdue" | "cancelled";
  payment_status?: "paid" | "pending";
  payment_method?: string;
  payments?: PayrollPayment[];
  start_month: number;
  start_year: number;
  end_month?: number | null;
  end_year?: number | null;
  recurring_config_id?: string | null;
  due_date?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  notes?: string;
  teacher_id?: string;
  created_at?: string;
  _virtual?: boolean;
}

export type ExpenseType = "rent" | "utilities" | "maintenance" | "supplies" | "transport" | "food" | "other";
export type PaymentMethod = "cash" | "bank_transfer" | "wallet" | "card" | "other";
export type PaymentStatus = "unpaid" | "paid" | "pending" | "partially_paid" | "overdue" | "cancelled";

export interface ExpensePayment {
  _id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  receipt_attachment?: string;
  recorded_by?: string;
  created_at?: string;
}

export interface TeacherExpense {
  id: string;
  title: string;
  expense_type: ExpenseType;
  category?: string;
  amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  month: number;
  year: number;
  is_recurring: boolean;
  start_month?: number;
  start_year?: number;
  end_month?: number | null;
  end_year?: number | null;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  status?: PaymentStatus;
  expense_date?: string;
  paid_date?: string | null;
  recipient?: string;
  notes?: string;
  attachments?: string[];
  payments?: ExpensePayment[];
  recurring_config_id?: string | null;
  teacher_id?: string;
  created_at?: string;
  updated_at?: string;
  _virtual?: boolean;
  is_virtual_instance?: boolean;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: "salary" | "expense";
  employee_id?: string | null;
  category?: string;
  amount: number;
  frequency: "monthly" | "weekly" | "quarterly" | "semi_annual" | "yearly";
  start_date: string;
  end_date?: string | null;
  due_day: number;
  payment_method_preference?: string;
  notes?: string;
  status: "active" | "paused" | "stopped";
  next_due_date?: string;
  created_at?: string;
}

export interface FinancialOverviewData {
  bounds: {
    type: string;
    month?: number;
    year?: number;
    startDate: string;
    endDate: string;
  };
  payroll: {
    total_salaries_due: number;
    total_salaries_paid: number;
    total_salaries_remaining: number;
    employee_count: number;
  };
  expenses: {
    total_expenses_paid: number;
    total_expenses_outstanding: number;
    recurring_expenses_total: number;
    one_time_expenses_total: number;
  };
  cash_flow: {
    cash_inflows: number;
    subscription_inflows: number;
    book_inflows: number;
    cash_outflows: number;
    salaries_outflow: number;
    expenses_outflow: number;
    net_cash_flow: number;
    comparison: {
      prev_cash_inflows: number;
      prev_cash_outflows: number;
      prev_net_cash_flow: number;
      change_percentage: number;
    };
  };
}

export interface ExpenseStatistics {
  year: number;
  totalExpenses: number;
  totalCount: number;
  byType: Record<string, number>;
  byMonth: Record<number, number>;
  byStatus: Record<string, number>;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  has_bills: boolean;
  has_attendance: boolean;
  has_center_mode?: boolean;
  color: string;
  is_active: boolean;
  created_at?: string;
}

export interface ScannedEntry {
  recordId?: string;
  queued?: boolean;
  studentId: string;
  studentName: string;
  time: string;
}

export interface CrossGroupValidation {
  destinationGroupName?:string;
  actualLesson?:{date:string;time:string;group_id:string};
  alreadyPresent?:boolean;
  canRecord?:boolean;
  attendanceUnavailable?:string;
  previous?:CrossGroupLessonOption[];
  future?:CrossGroupLessonOption[];
  previousUnavailable?:string;
  futureUnavailable?:string;
  decision: "allow" | "deny" | "confirm";
  reason: string;
  studentGroupId: string | null;
  studentGroupName: string;
  studentGroupSchedule: string;
  nextScheduledDate: string | null;
  scheduledDateIsToday: boolean;
  scheduledDateIsFuture: boolean;
  scheduledDateInCurrentWeek: boolean;
  scheduledDateInNextWeek: boolean;
}

export interface CrossGroupLessonOption {date:string;time:string;group_id:string;group_name:string;subject:string;status:"absent"|"unrecorded";session_id?:string}

export interface Exam {
  id: string;
  teacher_id: string;
  group_id: string;
  title: string;
  max_score: number;
  exam_date: string;
  created_at?: string;
}

export interface ExamGrade {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  created_at?: string;
}

export interface QuestionBank {
  id: string;
  teacher_id: string;
  title: string;
  subject?: string;
  exam_title?: string;
  exam_date?: string;
  grade_id?: string | null;
  group_id?: string | null;
  total_score?: number | null;
  created_at?: string;
}

export interface Question {
  id: string;
  bank_id: string;
  content: string;
  options?: string[] | null;
  option_images?: (string | null)[] | null;
  correct_answer?: string | null;
  correct_answers?: string[] | null;
  question_type?: "mcq" | "single_choice" | "multiple_choice" | "true_false" | "essay" | null;
  essay_lines?: number | null;
  section_name?: string | null;
  image_base64?: string | null;
  marks?: number | null;
  order?: number;
  teacher_notes?: string | null;
  model_answer?: string | null;
  created_at?: string;
}
