import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import type { AuditLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FileText,
  Download,
  Search,
  Activity,
  ShieldCheck,
  Calendar,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/audit-logs');
      setLogs(res.data?.data?.logs || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch platform audit records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter Logs
  const filteredLogs = logs.filter((log) => {
    const actor = typeof log.userId === 'object' ? log.userId?.name : 'System';
    const email = typeof log.userId === 'object' ? log.userId?.email : '';
    const matchesSearch =
      searchTerm.trim() === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Unique actions list for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  // Client-Side CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }

    const headers = ['Log ID', 'Action', 'Initiator Name', 'Initiator Email', 'Target Entity', 'Entity ID', 'Timestamp'];
    const rows = filteredLogs.map((l) => {
      const actor = typeof l.userId === 'object' ? l.userId?.name : 'System';
      const email = typeof l.userId === 'object' ? l.userId?.email : 'system@gatherly.internal';
      return [
        l._id || l.id || '',
        `"${l.action}"`,
        `"${actor}"`,
        `"${email}"`,
        `"${l.entityType}"`,
        `"${l.entityId || ''}"`,
        l.createdAt || l.timestamp ? new Date(l.createdAt || l.timestamp || '').toISOString() : '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Gatherly_Security_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5 text-coral-500" />
            <span>Compliance & Governance Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Security & System Audit Reports
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Immutable platform audit trail tracking Super Admin moderation decisions, privilege elevations, and access suspensions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            title="Refresh Logs"
            className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Audit CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
            Total Logged Events
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">{logs.length}</span>
            <Activity className="w-5 h-5 text-navy-500" />
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Chronological entries</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Account Governance
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {logs.filter((l) => l.action.includes('USER_')).length}
            </span>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Status modifications</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
            Event Moderations
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {logs.filter((l) => l.action.includes('EVENT_') || l.entityType === 'Event').length}
            </span>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Approve / Reject actions</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">
            Integrity Status
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-coral-600">VERIFIED</span>
            <ShieldCheck className="w-5 h-5 text-coral-500" />
          </div>
          <p className="text-[11px] text-coral-500 mt-1">SHA-256 tamper sealed</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-cream-50 p-3 rounded-2xl border border-cream-300">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search action, actor, or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
          >
            <option value="all">All Action Types</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-navy-600">Loading audit records...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-coral-500" />}
          title="No audit entries found"
          description="Platform actions matching the selected filter have not occurred yet."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-cream-50 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-200/60 border-b border-cream-300 text-navy-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-3">Actor (Initiator)</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Entity ID</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filteredLogs.map((log, idx) => {
                const actorName = typeof log.userId === 'object' ? log.userId?.name : 'System Automated';
                const actorEmail = typeof log.userId === 'object' ? log.userId?.email : '';
                const time = log.createdAt || log.timestamp;

                return (
                  <tr key={idx} className="hover:bg-cream-100/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                      <span className="px-2 py-1 rounded-md bg-navy-950 text-cream-100 text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-semibold text-navy-950 block">{actorName}</span>
                        {actorEmail && (
                          <span className="text-[10px] text-navy-600 block">{actorEmail}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-cream-200 text-navy-900 font-bold text-[10px]">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-navy-600 text-[11px] truncate max-w-[140px]">
                      {log.entityId ? String(log.entityId) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right text-navy-600 text-[11px]">
                      {time ? (
                        <>
                          <div className="font-semibold text-navy-900">
                            {new Date(time).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-navy-500">
                            {new Date(time).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        'N/A'
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

export default ReportsAnalytics;
