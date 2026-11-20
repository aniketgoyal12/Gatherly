import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { User, Event, AuditLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, pendingRes, eventsRes, logsRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/pending-events'),
        apiClient.get('/events', { params: { limit: 50 } }),
        apiClient.get('/admin/audit-logs'),
      ]);

      setUsers(usersRes.data?.data?.users || []);
      setPendingEvents(pendingRes.data?.data?.events || []);
      setAllEvents(eventsRes.data?.data?.events || []);
      setAuditLogs(logsRes.data?.data?.logs || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load Super Admin dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalUsers = users.length;
  const organizersCount = users.filter((u) => u.role === 'organizer').length;
  const pendingApprovalsCount = pendingEvents.length;
  const publishedEventsCount = allEvents.filter((e) => e.status === 'published').length;
  const totalAuditEvents = auditLogs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-coral-500" />
            <span>Platform Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Super Admin Overview
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Global telemetry, moderation queues, user privileges, and security audit logs across Gatherly.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh Telemetry"
            className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/admin/approvals">
            <Button variant="primary" size="sm" leftIcon={<Clock className="w-4 h-4" />}>
              Review Queue ({pendingApprovalsCount})
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Platform KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Users */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
            Registered Accounts
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">{totalUsers}</span>
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-navy-500 mt-1">
            {organizersCount} Organizers · {totalUsers - organizersCount} Attendees/Staff
          </p>
        </Card>

        {/* KPI 2: Pending Approvals */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
            Pending Moderation
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {pendingApprovalsCount}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">
            {pendingApprovalsCount > 0 ? 'Requires immediate action' : 'Queue fully cleared'}
          </p>
        </Card>

        {/* KPI 3: Published Events */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Published Live Events
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {publishedEventsCount}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Publicly discoverable</p>
        </Card>

        {/* KPI 4: Security Audit Trail */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">
            Audit Log Entries
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-coral-600">
              {totalAuditEvents}
            </span>
            <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-coral-500 mt-1">Immutable security ledger</p>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals Preview + Recent Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pending Approvals Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Event Moderation Queue</span>
            </h3>
            <Link
              to="/admin/approvals"
              className="text-xs font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingEvents.length === 0 ? (
            <Card variant="subtle" className="p-8 text-center space-y-2 border-dashed border-2 border-cream-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-navy-950">Queue is completely clear!</p>
              <p className="text-[11px] text-navy-500">
                All submitted events have been reviewed and published.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingEvents.slice(0, 3).map((event) => {
                const eid = event._id || event.id;
                const orgName =
                  typeof event.organizerId === 'object' ? event.organizerId?.name : 'Organizer';

                return (
                  <Card key={eid} variant="cream" className="p-4 border border-cream-300 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" size="sm" dot>
                            Needs Review
                          </Badge>
                          <span className="text-[11px] font-semibold text-coral-600">
                            {event.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-navy-950 text-sm mt-1">{event.title}</h4>
                        <p className="text-[11px] text-navy-600 mt-0.5">
                          Submitted by <strong className="text-navy-900">{orgName}</strong> ·{' '}
                          {event.capacity} Capacity ·{' '}
                          {event.ticketPrice ? `₹${event.ticketPrice}` : 'FREE'}
                        </p>
                      </div>

                      <Link to="/admin/approvals">
                        <Button variant="primary" size="sm" className="text-xs py-1 px-3">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quick Platform Governance Navigation Cards */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-navy-950 mb-3">Admin Governance Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/admin/approvals">
                <Card variant="cream" interactive className="p-4 border border-cream-300 text-left space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-navy-950 text-xs">Event Approvals</h4>
                  <p className="text-[11px] text-navy-600">Review, approve, or reject event blueprints.</p>
                </Card>
              </Link>

              <Link to="/admin/users">
                <Card variant="cream" interactive className="p-4 border border-cream-300 text-left space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center border border-navy-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-navy-950 text-xs">User Governance</h4>
                  <p className="text-[11px] text-navy-600">Manage privileges, suspend or activate accounts.</p>
                </Card>
              </Link>

              <Link to="/admin/reports">
                <Card variant="cream" interactive className="p-4 border border-cream-300 text-left space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-navy-950 text-xs">Audit & Reports</h4>
                  <p className="text-[11px] text-navy-600">Export compliance and operational audit trails.</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Audit Log Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Recent Security Audit Feed</span>
            </h3>
            <Link
              to="/admin/reports"
              className="text-xs font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1"
            >
              <span>Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card variant="cream" className="border border-cream-300 p-4 space-y-3 shadow-xs">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-navy-500 text-center py-6">No audit records recorded yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-cream-200">
                {auditLogs.slice(0, 5).map((log, idx) => {
                  const actor = typeof log.userId === 'object' ? log.userId?.name : 'System';
                  return (
                    <div key={idx} className={`space-y-1 ${idx > 0 ? 'pt-2.5' : ''}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-navy-950 font-mono text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-navy-500">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[11px] text-navy-600">
                        Target: <strong className="text-navy-900">{log.entityType}</strong> · By{' '}
                        {actor}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
