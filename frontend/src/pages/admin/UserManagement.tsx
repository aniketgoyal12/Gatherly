import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import type { User, UserAccountStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Action Loading & Notifications
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data?.data?.users || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch registered users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle User Status (PATCH /admin/users/:id/status)
  const handleToggleStatus = async (targetUser: User) => {
    const uid = targetUser._id || targetUser.id;
    if (!uid) return;

    if (uid === currentUser?.id || uid === currentUser?._id) {
      alert('Security Protection: You cannot suspend your own active Super Admin account.');
      return;
    }

    const nextStatus: UserAccountStatus =
      targetUser.accountStatus === 'active' ? 'suspended' : 'active';

    if (
      !window.confirm(
        `Are you sure you want to mark account "${targetUser.name}" (${targetUser.email}) as ${nextStatus.toUpperCase()}?`
      )
    ) {
      return;
    }

    setActionLoadingId(uid);
    setFeedbackMessage(null);
    try {
      await apiClient.patch(`/admin/users/${uid}/status`, { accountStatus: nextStatus });
      setFeedbackMessage(
        `User "${targetUser.name}" account status updated to ${nextStatus.toUpperCase()}.`
      );
      await fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to update user account status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = searchTerm.trim() === '' || nameMatch || emailMatch;

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Summary Metrics
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.accountStatus === 'active').length;
  const suspendedCount = users.filter((u) => u.accountStatus === 'suspended').length;
  const organizerCount = users.filter((u) => u.role === 'organizer').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-coral-500" />
            <span>Identity & Access Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            User Account Management
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Audit user accounts, enforce security policies, filter by role privileges, and suspend compromised credentials.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          title="Refresh User List"
          className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">Total Users</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">{totalUsers}</span>
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Platform registered identities</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Active Accounts</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{activeCount}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Full authentication granted</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">Suspended</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{suspendedCount}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-rose-500 mt-1">Login blocked at gateway</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">Organizers</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-coral-600">{organizerCount}</span>
            <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-coral-500 mt-1">Event publishing permissions</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-cream-50 p-3 rounded-2xl border border-cream-300">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
          >
            <option value="all">All Roles</option>
            <option value="attendee">Attendees</option>
            <option value="organizer">Organizers</option>
            <option value="staff">Gate Staff</option>
            <option value="super_admin">Super Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-navy-600">Retrieving user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-coral-500" />}
          title="No users match filters"
          description="Try clearing your search query or adjusting role and status filter dropdowns."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-cream-50 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-200/60 border-b border-cream-300 text-navy-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Member Since</th>
                <th className="py-3 px-4 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filteredUsers.map((u) => {
                const uid = u._id || u.id;
                const isCurrent = uid === currentUser?.id || uid === currentUser?._id;
                const isActionLoading = actionLoadingId === uid;

                return (
                  <tr key={uid} className="hover:bg-cream-100/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-950 text-cream-100 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-navy-950 text-sm">{u.name}</h4>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-coral-600 bg-coral-50 px-1.5 py-0.2 rounded border border-coral-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-navy-600 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-navy-400" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="capitalize font-bold text-navy-950 bg-cream-200 px-2 py-0.5 rounded-md text-[10px]">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {u.accountStatus === 'active' ? (
                        <Badge variant="success" size="sm" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>
                          Suspended
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-navy-600 text-[11px]">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] text-navy-400 italic">Self Account</span>
                      ) : (
                        <Button
                          variant={u.accountStatus === 'active' ? 'danger' : 'outline'}
                          size="sm"
                          disabled={isActionLoading}
                          isLoading={isActionLoading}
                          onClick={() => handleToggleStatus(u)}
                          className="text-[11px] py-1 px-3"
                        >
                          {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
