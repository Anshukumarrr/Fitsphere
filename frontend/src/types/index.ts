export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  photo: string | null;
  role: UserRole;
  is_active: boolean;
  organization: number | null;
  gym_code: string | null;
  membership_plan: string | null;
  membership_expiry: string | null;
  member_branch_id: number | null;
}

export type UserRole =
  | "super_admin"
  | "gym_owner"
  | "receptionist"
  | "trainer"
  | "cleaner"
  | "manager"
  | "security"
  | "instructor"
  | "maintenance"
  | "member";

export interface GymOrganization {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  branches: Branch[];
  branch_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  organization: number;
  name: string;
  code: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  opening_time: string | null;
  closing_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  user: User;
  user_id: number;
  gym_code: string;
  organization: number;
  organization_name: string;
  branch: number | null;
  branch_name: string;
  date_of_birth: string | null;
  gender: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  whatsapp_number: string;
  health_notes: string;
  photo: string | null;
  membership_status: "active" | "expired" | "frozen" | "cancelled";
  membership_start_date: string | null;
  membership_end_date: string | null;
  assigned_trainer: number | null;
  created_at: string;
  updated_at: string;
}

export interface Trainer {
  id: number;
  user: User;
  user_id: number;
  full_name: string;
  organization: number;
  branch: number | null;
  branch_name: string | null;
  specialization: string;
  bio: string;
  qualifications: string;
  years_of_experience: number;
  is_active: boolean;
  hourly_rate: number | null;
  max_members: number;
  active_member_count: number;
  session_rating: number;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  user: User;
  full_name: string;
  role: UserRole;
  branch: number | null;
  branch_name: string | null;
  branch_details: Branch | null;
  is_active: boolean;
  profile_id: number;
  created_at: string;
  specialization: string | null;
  years_of_experience: number | null;
  hourly_rate: number | null;
  max_members: number | null;
  session_rating: number | null;
  total_sessions: number | null;
  active_member_count: number | null;
  bio: string | null;
  qualifications: string | null;
}

export interface MembershipPlan {
  id: number;
  organization: number;
  name: string;
  description: string;
  duration: "monthly" | "quarterly" | "half_yearly" | "yearly";
  duration_days: number;
  price: string;
  billing_cycle: "monthly" | "yearly" | "one_time";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberMembership {
  id: number;
  member: number;
  member_name: string;
  plan: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_frozen: boolean;
  freeze_start: string | null;
  freeze_end: string | null;
  amount_paid: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: number;
  member: number;
  member_name: string;
  branch: number | null;
  branch_name: string;
  trainer: number | null;
  check_in_time: string;
  check_in_method: "qr" | "manual";
  marked_by: number | null;
  session_type: string;
  notes: string;
  organization: number;
}

export interface PTPackage {
  id: number;
  organization: number;
  name: string;
  description: string;
  number_of_sessions: number;
  validity_days: number;
  price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PTSession {
  id: number;
  pt_membership: number;
  member: number;
  member_name: string;
  trainer: number;
  trainer_name: string;
  branch: number | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  progress_notes: string;
  rating: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  member: number;
  member_name: string;
  branch: number | null;
  branch_name: string;
  payment_type: "membership" | "pt_package" | "renewal" | "other";
  payment_method: "cash" | "card" | "upi" | "bank_transfer" | "online";
  status: "pending" | "completed" | "failed" | "refunded";
  amount: string;
  invoice_number: string;
  description: string;
  reference_id: string;
  received_by: number | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
  organization: number;
}

export interface DashboardData {
  active_members: number;
  new_members_this_month: number;
  revenue_this_month: number;
  revenue_today: number;
  attendance_today: number;
  expiring_this_month: number;
  branch_breakdown: { branch__name: string; count: number }[];
}

export interface MemberDashboardData {
  total_check_ins: number;
  check_ins_this_month: number;
  streak: number;
  upcoming_sessions: {
    id: number;
    scheduled_date: string;
    scheduled_time: string;
    trainer_name: string;
  }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  tier: "starter" | "professional" | "enterprise" | "premium";
  description: string;
  max_branches: number;
  max_members: number;
  monthly_price: string;
  annual_price: string;
  features: string[];
  is_active: boolean;
}

export interface AttendanceCode {
  id: number;
  organization: number;
  branch: number | null;
  branch_name: string | null;
  code: string;
  generated_by: number | null;
  generated_by_name: string | null;
  generated_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface Ticket {
  id: number;
  organization: number | null;
  organization_name: string | null;
  raised_by: number;
  raised_by_name: string;
  raised_by_role: UserRole;
  title: string;
  description: string;
  category: "general" | "billing" | "membership" | "equipment" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: number | null;
  assigned_to_name: string | null;
  resolved_by: number | null;
  resolved_by_name: string | null;
  resolution_notes: string;
  can_resolve: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PlatformGymAnalytics {
  gym_id: number;
  gym_name: string;
  total_members: number;
  new_members_this_month: number;
  members_last_month: number;
  member_growth: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_growth: number;
}

export interface AuditLogEntry {
  id: number;
  organization: number | null;
  organization_name: string;
  user: number | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  timestamp: string;
}
