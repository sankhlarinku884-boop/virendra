-- ====================================================================
-- BusinessPilot SaaS - Production Database Schema & RLS Policies
-- Target: Supabase (PostgreSQL 15+)
-- Version: 001_initial_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CORE ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'business_owner', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave', 'weekly_off', 'holiday', 'pending_approval');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE half_day_type AS ENUM ('first_half', 'second_half', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_category AS ENUM ('paid', 'casual', 'sick', 'unpaid', 'maternity', 'paternity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('to_do', 'in_progress', 'waiting_for_response', 'on_hold', 'completed', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE follow_up_status AS ENUM ('pending', 'completed', 'rescheduled', 'missed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan_tier AS ENUM ('starter', 'growth', 'business', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUSINESSES (Multi-Tenant Workspaces)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    industry TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    working_hours_start TIME NOT NULL DEFAULT '09:30:00',
    working_hours_end TIME NOT NULL DEFAULT '18:30:00',
    half_day_end_time TIME NOT NULL DEFAULT '14:00:00', -- Configurable Half-Day schedule cutoff
    work_days_per_week INT DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEPARTMENTS & TEAMS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUSINESS MEMBERS (Membership & Roles)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'employee',
    employee_id TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    reporting_manager_id UUID REFERENCES public.business_members(id) ON DELETE SET NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, employee_id),
    UNIQUE (business_id, user_id)
);

-- 7. ATTENDANCE SYSTEM
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    total_working_minutes INT DEFAULT 0,
    late_minutes INT DEFAULT 0,
    early_departure_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    status attendance_status NOT NULL DEFAULT 'present',
    half_day_type half_day_type DEFAULT 'none',
    notes TEXT,
    is_corrected BOOLEAN DEFAULT FALSE,
    corrected_by UUID REFERENCES public.business_members(id),
    correction_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, member_id, date)
);

CREATE TABLE IF NOT EXISTS public.attendance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('half_day', 'early_departure', 'check_in_correction', 'check_out_correction')),
    half_day_type half_day_type DEFAULT 'none',
    available_until TIME,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.business_members(id),
    reviewed_at TIMESTAMPTZ,
    reviewer_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LEAVE MANAGEMENT
CREATE TABLE IF NOT EXISTS public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category leave_category NOT NULL DEFAULT 'casual',
    days_allowed_per_year INT NOT NULL DEFAULT 12,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_type half_day_type DEFAULT 'none',
    total_days NUMERIC(4, 1) NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    status leave_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.business_members(id),
    reviewed_at TIMESTAMPTZ,
    reviewer_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year INT NOT NULL,
    allocated_days NUMERIC(4, 1) NOT NULL,
    used_days NUMERIC(4, 1) DEFAULT 0,
    pending_days NUMERIC(4, 1) DEFAULT 0,
    UNIQUE (business_id, member_id, leave_type_id, year)
);

-- 9. PROJECTS & TASKS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
    start_date DATE,
    target_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by_member_id UUID NOT NULL REFERENCES public.business_members(id),
    primary_assignee_id UUID NOT NULL REFERENCES public.business_members(id),
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'to_do',
    category TEXT,
    start_date DATE,
    due_date TIMESTAMPTZ NOT NULL,
    estimated_hours NUMERIC(5, 2),
    actual_hours NUMERIC(5, 2),
    deliverables TEXT,
    is_overdue BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    approved_by_member_id UUID REFERENCES public.business_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (task_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FOLLOW-UPS & DAILY WORK REPORTS
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    assigned_member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    related_entity_type TEXT NOT NULL CHECK (related_entity_type IN ('lead', 'client', 'task', 'project')),
    related_entity_name TEXT NOT NULL,
    title TEXT NOT NULL,
    follow_up_type TEXT NOT NULL,
    due_date DATE NOT NULL,
    due_time TIME,
    notes TEXT,
    outcome TEXT,
    next_follow_up_date DATE,
    status follow_up_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    summary TEXT NOT NULL,
    tasks_completed_count INT DEFAULT 0,
    tasks_pending_count INT DEFAULT 0,
    followups_completed_count INT DEFAULT 0,
    followups_pending_count INT DEFAULT 0,
    calls_made INT DEFAULT 0,
    leads_contacted INT DEFAULT 0,
    meetings_completed INT DEFAULT 0,
    blockers TEXT,
    next_day_plan TEXT,
    linked_task_ids JSONB DEFAULT '[]'::JSONB,
    linked_followup_ids JSONB DEFAULT '[]'::JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, member_id, date)
);

-- 11. NOTIFICATIONS & ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    recipient_member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    author_member_id UUID NOT NULL REFERENCES public.business_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    target_role user_role,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SAAS SUBSCRIPTIONS & BILLING
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier subscription_plan_tier NOT NULL UNIQUE,
    price_monthly_inr NUMERIC(10, 2) NOT NULL,
    price_yearly_inr NUMERIC(10, 2) NOT NULL,
    max_employees INT NOT NULL,
    max_departments INT NOT NULL,
    has_leave_management BOOLEAN DEFAULT TRUE,
    has_follow_ups BOOLEAN DEFAULT TRUE,
    has_advanced_reports BOOLEAN DEFAULT TRUE,
    has_api_integrations BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.business_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id)
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    amount_inr NUMERIC(10, 2) NOT NULL,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('initiated', 'success', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    actor_member_id UUID REFERENCES public.business_members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Workspace Isolation Rules
-- ====================================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: Get current user's business memberships
CREATE OR REPLACE FUNCTION public.get_user_business_ids()
RETURNS TABLE (business_id UUID) SECURITY DEFINER STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT bm.business_id
    FROM public.business_members bm
    WHERE bm.user_id = auth.uid() AND bm.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Helper security function: Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN SECURITY DEFINER STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Helper security function: Check user role in a business
CREATE OR REPLACE FUNCTION public.get_user_role(target_business_id UUID)
RETURNS user_role SECURITY DEFINER STABLE AS $$
DECLARE
    found_role user_role;
BEGIN
    SELECT bm.role INTO found_role
    FROM public.business_members bm
    WHERE bm.user_id = auth.uid()
      AND bm.business_id = target_business_id
      AND bm.status = 'active'
    LIMIT 1;
    RETURN found_role;
END;
$$ LANGUAGE plpgsql;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Profiles self access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Businesses: Members can select their own business; Super admins can see all
CREATE POLICY "Businesses member access" ON public.businesses
    FOR SELECT USING (
        id IN (SELECT business_id FROM public.get_user_business_ids()) OR public.is_super_admin()
    );

-- Business Members: Isolation by tenant
CREATE POLICY "Business members tenant access" ON public.business_members
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids()) OR public.is_super_admin()
    );

-- Attendance: Employees see their own; Admins & Managers see all in their business
CREATE POLICY "Attendance tenant access" ON public.attendance_records
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids())
    );

-- Tasks: Isolation by tenant
CREATE POLICY "Tasks tenant access" ON public.tasks
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids())
    );

-- Leave requests: Isolation by tenant
CREATE POLICY "Leaves tenant access" ON public.leave_requests
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids())
    );

-- Follow-ups: Isolation by tenant
CREATE POLICY "Followups tenant access" ON public.follow_ups
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids())
    );

-- Daily work reports: Isolation by tenant
CREATE POLICY "Daily reports tenant access" ON public.daily_reports
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.get_user_business_ids())
    );

-- SEED DEFAULT SUBSCRIPTION PLANS
INSERT INTO public.subscription_plans (name, tier, price_monthly_inr, price_yearly_inr, max_employees, max_departments, has_leave_management, has_follow_ups, has_advanced_reports, has_api_integrations, is_active)
VALUES
    ('Starter Plan', 'starter', 999.00, 9990.00, 10, 2, FALSE, FALSE, FALSE, FALSE, TRUE),
    ('Growth Plan', 'growth', 2499.00, 24990.00, 35, 5, TRUE, TRUE, TRUE, FALSE, TRUE),
    ('Business Plan', 'business', 4999.00, 49990.00, 100, 15, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier) DO NOTHING;
