/**
 * BusinessPilot - Database & Domain Entity Types
 * Multi-Tenant SaaS Business Management & Team Productivity Platform
 */

export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'employee';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'weekly_off'
  | 'holiday'
  | 'pending_approval';

export type HalfDayType = 'first_half' | 'second_half' | 'none';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveCategory = 'paid' | 'casual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';

export type TaskStatus =
  | 'to_do'
  | 'in_progress'
  | 'waiting_for_response'
  | 'on_hold'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type FollowUpStatus = 'pending' | 'completed' | 'rescheduled' | 'missed' | 'cancelled';
export type FollowUpType = 'client_call' | 'lead_followup' | 'project_milestone' | 'meeting' | 'task_review';

export type SubscriptionPlanTier = 'starter' | 'growth' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  currency: string;
  timezone: string;
  working_hours_start: string; // e.g. "09:00"
  working_hours_end: string;   // e.g. "18:00"
  half_day_end_time: string;   // e.g. "13:30" (configurable half-day end time)
  work_days_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  employee_id: string;
  department_id?: string;
  team_id?: string;
  designation: string;
  reporting_manager_id?: string;
  joining_date: string;
  status: 'active' | 'invited' | 'suspended' | 'terminated';
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Department {
  id: string;
  business_id: string;
  name: string;
  code?: string;
  description?: string;
  head_member_id?: string;
  created_at: string;
}

export interface Team {
  id: string;
  business_id: string;
  department_id: string;
  name: string;
  team_lead_member_id?: string;
  created_at: string;
}

export interface Project {
  id: string;
  business_id: string;
  name: string;
  client_name?: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  start_date?: string;
  target_end_date?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  business_id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  check_in_time?: string; // ISO string
  check_out_time?: string; // ISO string
  total_working_minutes: number;
  late_minutes: number;
  early_departure_minutes: number;
  overtime_minutes: number;
  status: AttendanceStatus;
  half_day_type: HalfDayType;
  notes?: string;
  is_corrected: boolean;
  corrected_by?: string;
  correction_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRequest {
  id: string;
  business_id: string;
  member_id: string;
  date: string;
  request_type: 'half_day' | 'early_departure' | 'check_in_correction' | 'check_out_correction';
  half_day_type?: HalfDayType;
  available_until?: string; // e.g. "13:30"
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_comments?: string;
  created_at: string;
}

export interface LeaveType {
  id: string;
  business_id: string;
  name: string;
  category: LeaveCategory;
  days_allowed_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  business_id: string;
  member_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_type?: HalfDayType;
  total_days: number;
  reason: string;
  document_url?: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_comments?: string;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  business_id: string;
  member_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
}

export interface Task {
  id: string;
  business_id: string;
  project_id?: string;
  title: string;
  description: string;
  created_by_member_id: string;
  primary_assignee_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  start_date?: string;
  due_date: string;
  estimated_hours?: number;
  actual_hours?: number;
  deliverables?: string;
  is_overdue: boolean;
  completed_at?: string;
  approved_by_member_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  member_id: string;
  assigned_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_member_id: string;
  content: string;
  attachment_url?: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  business_id: string;
  assigned_member_id: string;
  related_entity_type: 'lead' | 'client' | 'task' | 'project';
  related_entity_name: string;
  title: string;
  follow_up_type: FollowUpType;
  due_date: string;
  due_time?: string;
  notes?: string;
  outcome?: string;
  next_follow_up_date?: string;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  business_id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  tasks_completed_count: number;
  tasks_pending_count: number;
  followups_completed_count: number;
  followups_pending_count: number;
  calls_made?: number;
  leads_contacted?: number;
  meetings_completed?: number;
  blockers?: string;
  next_day_plan?: string;
  linked_task_ids: string[];
  linked_followup_ids: string[];
  submitted_at: string;
}

export interface NotificationItem {
  id: string;
  business_id: string;
  recipient_member_id: string;
  title: string;
  message: string;
  type: 'task' | 'attendance' | 'leave' | 'follow_up' | 'report' | 'system';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  business_id: string;
  author_member_id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  target_role?: UserRole;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionPlanTier;
  price_monthly_inr: number;
  price_yearly_inr: number;
  max_employees: number;
  max_departments: number;
  has_leave_management: boolean;
  has_follow_ups: boolean;
  has_advanced_reports: boolean;
  has_api_integrations: boolean;
  is_active: boolean;
}

export interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string;
  auto_renew: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  actor_member_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}
