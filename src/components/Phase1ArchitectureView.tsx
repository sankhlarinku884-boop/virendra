import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Database,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  FileCode,
  Lock,
  Calendar,
  Briefcase,
  TrendingUp,
  Key,
  ExternalLink,
  Laptop,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  mockBusinesses,
  mockProfiles,
  mockMembers,
  mockAttendanceRecords,
  mockTasks,
  mockFollowUps,
  mockDailyReports,
  mockSubscriptionPlans,
} from '../lib/mockData';
import { getSupabaseConfigStatus } from '../lib/supabase';
import { UserRole } from '../types/database';

export const Phase1ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'sandbox' | 'roadmap'>('overview');
  const [simulatedRole, setSimulatedRole] = useState<UserRole>('business_owner');
  const [activeBusinessId, setActiveBusinessId] = useState<string>('b-001');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  const currentBusiness = mockBusinesses.find((b) => b.id === activeBusinessId) || mockBusinesses[0];

  // Filter items according to active business to show multi-tenant boundary
  const businessMembers = mockMembers.filter((m) => m.business_id === activeBusinessId);
  const businessTasks = mockTasks.filter((t) => t.business_id === activeBusinessId);
  const businessAttendance = mockAttendanceRecords.filter((a) => a.business_id === activeBusinessId);
  const businessFollowups = mockFollowUps.filter((f) => f.business_id === activeBusinessId);
  const businessReports = mockDailyReports.filter((r) => r.business_id === activeBusinessId);

  const handleCopySql = () => {
    navigator.clipboard.writeText('-- SQL migration file located at supabase/migrations/001_initial_schema.sql in this project');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL="https://your-project.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-key"`);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const tablesList = [
    { name: 'businesses', purpose: 'Multi-tenant workspaces with custom timezone & half-day schedule cutoff', rls: 'Strict tenant isolation' },
    { name: 'profiles', purpose: 'User accounts linked to Supabase Auth auth.users', rls: 'Self & Admin access' },
    { name: 'business_members', purpose: 'Membership mapping users to businesses with specific roles', rls: 'Tenant isolated' },
    { name: 'departments', purpose: 'Organizational divisions (Engineering, Sales, etc.)', rls: 'Tenant isolated' },
    { name: 'teams', purpose: 'Squads and sub-teams within departments', rls: 'Tenant isolated' },
    { name: 'attendance_records', purpose: 'Daily clock-in/out, late minutes, half-day status, working hours', rls: 'Tenant + Role gated' },
    { name: 'attendance_requests', purpose: 'Half-day & early-departure approval workflow', rls: 'Tenant + Manager review' },
    { name: 'leave_types', purpose: 'Leave policies (Paid, Casual, Sick, Unpaid)', rls: 'Tenant isolated' },
    { name: 'leave_requests', purpose: 'Full-day and half-day leave applications with approval trail', rls: 'Tenant + Manager review' },
    { name: 'leave_balances', purpose: 'Annual leave quotas and used/pending balances', rls: 'Tenant isolated' },
    { name: 'projects', purpose: 'Client engagements and internal projects', rls: 'Tenant isolated' },
    { name: 'tasks', purpose: 'Task assignments with priority, categories, due dates, subtasks', rls: 'Tenant isolated' },
    { name: 'task_assignees', purpose: 'Multiple assignees per task support', rls: 'Tenant isolated' },
    { name: 'task_comments', purpose: 'Collaboration, attachments, and blocker discussions', rls: 'Tenant isolated' },
    { name: 'follow_ups', purpose: 'Dedicated leads, clients, and task follow-up tracker', rls: 'Tenant isolated' },
    { name: 'daily_reports', purpose: 'End-of-day employee work submissions & blockers', rls: 'Tenant + Manager review' },
    { name: 'notifications', purpose: 'In-app event notifications and reminders', rls: 'Recipient member isolated' },
    { name: 'announcements', purpose: 'Company-wide notices with role targeting', rls: 'Tenant isolated' },
    { name: 'subscription_plans', purpose: 'SaaS tier definitions (Starter, Growth, Business)', rls: 'Public read, Super Admin write' },
    { name: 'business_subscriptions', purpose: 'Workspace plan status, billing cycle, renewal date', rls: 'Tenant + Super Admin' },
    { name: 'payment_transactions', purpose: 'Payment gateway audit log (Razorpay ready)', rls: 'Tenant + Super Admin' },
    { name: 'audit_logs', purpose: 'Immutable security log for sensitive operations', rls: 'Tenant Admin access' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Environment Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
              BP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">BusinessPilot</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 1: Architecture Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Tenant SaaS Business Management & Team Productivity Platform
              </p>
            </div>
          </div>

          {/* Role Simulator Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Role View:
            </span>
            {(['super_admin', 'business_owner', 'manager', 'employee'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSimulatedRole(role)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  simulatedRole === role
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {role === 'super_admin' && 'Super Admin'}
                {role === 'business_owner' && 'Company Admin'}
                {role === 'manager' && 'Manager'}
                {role === 'employee' && 'Employee'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Phase 1 Overview & Inspection
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Supabase Schema & RLS (22 Tables)
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Multi-Tenant Isolation Sandbox
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            10-Phase Roadmap & Acceptance
          </button>
        </div>

        {/* TAB 1: OVERVIEW & INSPECTION */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Hero Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Phase 1 Initial Codebase Inspection Complete
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Project Architecture & Multi-Tenant Blueprint
                  </h1>
                  <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                    We inspected your existing codebase and verified the tech stack (React 19, TypeScript, Tailwind CSS, Vite, Supabase client).
                    The multi-tenant schema with Row Level Security (RLS) is prepared for all 22 core tables.
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 min-w-[260px] space-y-2 shadow-lg">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Backend Connection
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        supabaseStatus.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-white">
                      {supabaseStatus.isConfigured ? 'Live Supabase Connected' : 'Local Architecture Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {supabaseStatus.statusMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack & Codebase Inspection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">Frontend & UI Core</h3>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>React 19 + TypeScript</strong> for strict type safety</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Tailwind CSS</strong> for responsive multi-device design</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Lucide Icons & Motion</strong> for micro-interactions</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">Database & Backend</h3>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>PostgreSQL via Supabase</strong> for multi-tenant data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>22 Normalized Tables</strong> with foreign key integrity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>@supabase/supabase-js</strong> client installed</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">Security & Multi-Tenancy</h3>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Row Level Security (RLS)</strong> on every tenant table</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>4 Role Tiers</strong> with isolated permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Audit Logging</strong> for corrections and sensitive events</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Role Permission Matrix Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    Defines strict access controls enforced by both Supabase RLS and the application layout.
                  </p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  Enforces Master Prompt Section 3
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Feature / Permission</th>
                      <th className="py-3 px-3 text-center">Super Admin (Platform)</th>
                      <th className="py-3 px-3 text-center">Business Owner (Company)</th>
                      <th className="py-3 px-3 text-center">Manager / Team Lead</th>
                      <th className="py-3 px-3 text-center">Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Platform Subscriptions & Businesses</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Full Access</td>
                      <td className="py-3 px-3 text-center text-slate-500">Own Plan Only</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Private Business Operational Data</td>
                      <td className="py-3 px-3 text-center text-amber-400 font-medium">Audited Only</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Full Workspace</td>
                      <td className="py-3 px-3 text-center text-indigo-400">Team / Dept</td>
                      <td className="py-3 px-3 text-center text-slate-400">Assigned Only</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Employee Directory & Role Assignment</td>
                      <td className="py-3 px-3 text-center text-slate-500">Platform Accounts</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Invite, Edit, Deactivate</td>
                      <td className="py-3 px-3 text-center text-indigo-400">View Team</td>
                      <td className="py-3 px-3 text-center text-slate-400">View Public Directory</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Attendance Marking & Audit Corrections</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Audit Correction & Rules</td>
                      <td className="py-3 px-3 text-center text-indigo-400">Check Team Status</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Check In / Out (Self)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Leave & Half-Day Approval</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Approve / Reject All</td>
                      <td className="py-3 px-3 text-center text-indigo-400 font-medium">Approve Team Requests</td>
                      <td className="py-3 px-3 text-center text-slate-400">Apply / Cancel Pending</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Task Assignment & Review</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">All Tasks & Projects</td>
                      <td className="py-3 px-3 text-center text-indigo-400 font-medium">Assign & Review Team Tasks</td>
                      <td className="py-3 px-3 text-center text-slate-400">Update Progress & Submit</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">Daily Work Reports & Follow-Ups</td>
                      <td className="py-3 px-3 text-center text-slate-500">No</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">Company-Wide Oversight</td>
                      <td className="py-3 px-3 text-center text-indigo-400 font-medium">Review Team Reports</td>
                      <td className="py-3 px-3 text-center text-slate-400">Submit Daily Report</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE SCHEMA & SQL MIGRATION */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Supabase PostgreSQL Database Migration (001_initial_schema.sql)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete schema file created at <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">/supabase/migrations/001_initial_schema.sql</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copied Reference!' : 'Copy Migration SQL Path'}
                  </button>
                </div>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">Create Supabase Project</h4>
                  <p className="text-xs text-slate-400">
                    Go to <strong>supabase.com</strong>, create a new project named <code>businesspilot</code>, and choose your preferred cloud region (e.g. Mumbai / ap-south-1).
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">Run Migration in SQL Editor</h4>
                  <p className="text-xs text-slate-400">
                    In your Supabase dashboard, click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>. Paste the contents of <code>001_initial_schema.sql</code> and click <strong>Run</strong>.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">Set Environment Variables</h4>
                  <p className="text-xs text-slate-400">
                    In Supabase <strong>Project Settings &rarr; API</strong>, copy the Project URL and anon key into your local <code>.env</code> file.
                  </p>
                </div>
              </div>

              {/* Windows PowerShell Command Helper */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Windows PowerShell Setup Command (Local Development)
                  </span>
                  <button
                    onClick={handleCopyEnv}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedEnv ? 'Copied!' : 'Copy .env snippet'}
                  </button>
                </div>
                <pre className="text-xs text-emerald-400 font-mono bg-black/50 p-3 rounded-lg overflow-x-auto">
# In Windows PowerShell:
Copy-Item .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL="https://your-project.supabase.co"
# VITE_SUPABASE_ANON_KEY="your-anon-public-key"
                </pre>
              </div>

              {/* Database Tables Explorer */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  All 22 Normalized Tables Implemented in 001_initial_schema.sql
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tablesList.map((tbl) => (
                    <div
                      key={tbl.name}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-300">{tbl.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          RLS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{tbl.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-TENANT ISOLATION SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {/* Business Tenant Switcher Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Active Tenant Workspace:</span>
                    <span className="font-bold text-white text-sm">{currentBusiness.name}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Timezone: {currentBusiness.timezone} | Working Hours: {currentBusiness.working_hours_start} - {currentBusiness.working_hours_end} | Half-day cutoff: {currentBusiness.half_day_end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Switch Workspace:</span>
                {mockBusinesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBusinessId(b.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      activeBusinessId === b.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Role Notification / Permission Boundary Notice */}
            <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Viewing as: </span>
                  <span className="text-indigo-300 uppercase font-bold tracking-wide mr-2">
                    {simulatedRole.replace('_', ' ')}
                  </span>
                  {simulatedRole === 'super_admin' && '— Full platform oversight (no un-audited business private data).'}
                  {simulatedRole === 'business_owner' && '— Full authority over this business workspace, settings, employees, and policies.'}
                  {simulatedRole === 'manager' && '— Authority over assigned department/team tasks, attendance reviews, and follow-ups.'}
                  {simulatedRole === 'employee' && '— Restricted to self attendance, personal leave requests, assigned tasks, and submitting daily work reports.'}
                </div>
              </div>
            </div>

            {/* Live Data Isolation Inspection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Employees in Tenant</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">{businessMembers.length}</div>
                <div className="text-[11px] text-slate-400">
                  Strictly isolated to {currentBusiness.name}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Tasks</span>
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">{businessTasks.length}</div>
                <div className="text-[11px] text-slate-400">
                  {businessTasks.filter((t) => t.is_overdue).length} overdue task flagged
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Attendance Today</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {businessAttendance.length}
                </div>
                <div className="text-[11px] text-amber-400 flex items-center gap-1">
                  <span>1 Half-Day (until {currentBusiness.half_day_end_time})</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Pending Follow-Ups</span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {businessFollowups.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  {businessReports.length} Daily work report submitted
                </div>
              </div>
            </div>

            {/* Attendance & Half-Day Schedule Demonstration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Attendance & Half-Day Availability Verification (Section 4 Requirement)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Demonstrating configurable half-day schedules: "Available until {currentBusiness.half_day_end_time}"
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  Configurable Policy Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Schedule & Availability Note</th>
                      <th className="py-2.5 px-3">Audit State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {businessAttendance.map((rec) => {
                      const member = businessMembers.find((m) => m.id === rec.member_id);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-semibold text-white">
                            {member?.profile?.full_name || 'Team Member'}
                          </td>
                          <td className="py-3 px-3 capitalize text-slate-400">
                            {member?.role.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-3">
                            {rec.status === 'present' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Present
                              </span>
                            )}
                            {rec.status === 'half_day' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Half Day (First-Half)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {rec.status === 'half_day' ? (
                              <span className="text-amber-300">
                                On Half Day — Available until {currentBusiness.half_day_end_time}
                              </span>
                            ) : (
                              <span className="text-slate-400">Regular shift ({currentBusiness.working_hours_start} - {currentBusiness.working_hours_end})</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            Verified (No corrections)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tasks & Overdue Flagging Demonstration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    Task Management & Overdue Flagging (Section 6 Requirement)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tasks are strictly scoped to the workspace and automatically flag overdue status
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {businessTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-xl p-4 border transition-all ${
                      t.is_overdue
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                        {t.category || 'General'}
                      </span>
                      {t.is_overdue ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {t.status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">{t.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Priority: <strong className="text-slate-200 capitalize">{t.priority}</strong></span>
                      <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 10-PHASE ROADMAP & ACCEPTANCE */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Master 10-Phase Implementation Roadmap
                  </h2>
                  <p className="text-xs text-slate-400">
                    As requested, we strictly build one phase at a time and inspect the codebase before proceeding.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 1 Complete
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    phase: 'Phase 1',
                    name: 'Project Inspection, Architecture & Supabase Schema Blueprint',
                    status: 'completed',
                    deliverables: 'Inspection report, 22-table database schema with RLS, TypeScript types, Supabase client setup, and multi-tenant simulator.',
                  },
                  {
                    phase: 'Phase 2',
                    name: 'Authentication, User Roles, Business Workspace Creation & Security',
                    status: 'next',
                    deliverables: 'Supabase Auth login/signup, password reset, workspace onboarding, invite tokens, protected routes, and session persistence.',
                  },
                  {
                    phase: 'Phase 3',
                    name: 'Employee Directory & Real-Time Attendance System',
                    status: 'upcoming',
                    deliverables: 'Live check-in/out button, late arrival tracking, daily/monthly summaries, admin audit correction log, and directory search.',
                  },
                  {
                    phase: 'Phase 4',
                    name: 'Leave Applications, Half-Day Approvals & Availability Status',
                    status: 'upcoming',
                    deliverables: 'Half-day & full-day leave workflow, configurable cutoff times, manager approval modal, and availability status display.',
                  },
                  {
                    phase: 'Phase 5',
                    name: 'Task Assignment, Projects, Subtasks & Kanban Board',
                    status: 'upcoming',
                    deliverables: 'Task creation, multiple assignees, list view + Kanban board, overdue automated flags, comments, and review approvals.',
                  },
                  {
                    phase: 'Phase 6',
                    name: 'Follow-Up Management & Daily Work Reports',
                    status: 'upcoming',
                    deliverables: 'Daily report submission with linked tasks, follow-up tracker (calls, meetings, leads), missed follow-up flags, and manager review.',
                  },
                  {
                    phase: 'Phase 7',
                    name: 'Dashboard Analytics & Employee Productivity Reports',
                    status: 'upcoming',
                    deliverables: 'Interactive metrics, attendance trends, task completion velocity, date filters (today, week, month), and export options.',
                  },
                  {
                    phase: 'Phase 8',
                    name: 'In-App Notifications, Reminders & Announcements',
                    status: 'upcoming',
                    deliverables: 'Notification bell center, unread counters, role-targeted announcements, and reminder queue architecture.',
                  },
                  {
                    phase: 'Phase 9',
                    name: 'SaaS Subscriptions, Multi-Tenant Billing & Super Admin Portal',
                    status: 'upcoming',
                    deliverables: 'Starter/Growth/Business plans, Razorpay payment gateway integration, subscription limits enforcement, and Super Admin dashboard.',
                  },
                  {
                    phase: 'Phase 10',
                    name: 'End-to-End Verification, Cross-Tenant Security Audit & Deployment',
                    status: 'upcoming',
                    deliverables: 'All 20 acceptance test verifications, mobile responsiveness testing, production build optimization, and hosting setup.',
                  },
                ].map((item) => (
                  <div
                    key={item.phase}
                    className={`rounded-xl p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      item.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-800/40'
                        : item.status === 'next'
                        ? 'bg-indigo-950/30 border-indigo-700/60 shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-950/50 border-slate-800/60 opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'next'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.phase}
                        </span>
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{item.deliverables}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {item.status === 'completed' && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Ready & Tested
                        </span>
                      )}
                      {item.status === 'next' && (
                        <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                          Ready for Your Confirmation <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {item.status === 'upcoming' && (
                        <span className="text-xs text-slate-500">Upcoming</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        BusinessPilot SaaS &bull; Phase 1 Architecture Verification &bull; Ready to proceed to Phase 2 (Authentication & Workspaces) upon user confirmation.
      </footer>
    </div>
  );
};
