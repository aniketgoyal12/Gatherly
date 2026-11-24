import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';

interface StaffAssignment {
  _id: string;
  gate?: string | null;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
}

export const EventStaffAssignment: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();

  const [staffList, setStaffList] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Staff Input
  const [email, setEmail] = useState('');
  const [gate, setGate] = useState('');
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);

  const fetchStaff = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/events/${eventId}/staff`);
      setStaffList(res.data?.data?.staff || []);
    } catch (err) {
      console.error('Failed to load event staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [eventId]);

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !email.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedTempPassword(null);

    try {
      const res = await apiClient.post(`/events/${eventId}/staff`, {
        email: email.trim().toLowerCase(),
        gate: gate.trim() || null,
      });

      const tempPass = res.data?.data?.temporaryPassword;
      if (tempPass) {
        setCreatedTempPassword(tempPass);
      }

      setSuccessMessage('Staff member successfully assigned to event shift!');
      setEmail('');
      setGate('');
      fetchStaff();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(axiosErr.response?.data?.message || 'Failed to assign staff.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!eventId) return;
    if (!confirm('Are you sure you want to remove this staff assignment?')) return;

    try {
      await apiClient.delete(`/events/${eventId}/staff/${staffId}`);
      setStaffList((prev) => prev.filter((s) => s._id !== staffId && s.userId?._id !== staffId));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr.response?.data?.message || 'Failed to remove staff.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="space-y-4">
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizer Dashboard</span>
        </Link>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-coral-500" />
            <span>Gate Shift Allocation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Event Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Assign staff personnel by email to verify QR tickets at specific gates. Staff can only access events assigned to them.
          </p>
        </div>
      </div>

      {/* Temp Password Generated Callout */}
      {createdTempPassword && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm">New Staff Account Provisioned</h3>
          </div>
          <p className="text-xs">
            A staff account was automatically created for this email. Share these temporary credentials with the staff member:
          </p>
          <div className="p-3 bg-white rounded-xl border border-amber-200 font-mono text-xs font-bold text-navy-950">
            Temporary Password: <span className="text-coral-600">{createdTempPassword}</span>
          </div>
          <p className="text-[11px] text-amber-700">
            The staff member will be required to change their password upon first login.
          </p>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Staff Form */}
      <Card variant="cream" className="p-6 sm:p-8 border border-cream-300 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-coral-500" />
          <span>Assign Staff Member</span>
        </h3>

        <form onSubmit={handleAssignStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-1">
            <Input
              type="email"
              label="Staff Email"
              placeholder="scanner@gatherly.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              type="text"
              label="Assigned Gate (Optional)"
              placeholder="e.g. Gate A - North Entrance"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={submitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Assign to Event
            </Button>
          </div>
        </form>
      </Card>

      {/* Assigned Staff Table */}
      <Card variant="cream" className="border border-cream-300 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-950">
            Active Gate Staff ({staffList.length})
          </h3>
          <Badge variant="navy" size="sm">
            Staff Roster
          </Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-navy-600">Loading roster...</p>
          </div>
        ) : staffList.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-coral-500" />}
            title="No Staff Assigned Yet"
            description="Add gate scanners by entering their email address above."
            className="my-8"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100/80 text-navy-700 font-bold uppercase tracking-wider border-b border-cream-200">
                <tr>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Assigned Gate</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {staffList.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-cream-100/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-navy-950">
                        {assignment.userId?.name || 'Staff User'}
                      </div>
                      <div className="text-navy-500 text-[11px] font-mono">
                        {assignment.userId?.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {assignment.gate ? (
                        <span className="px-2.5 py-1 rounded-full bg-cream-200 border border-cream-300 font-medium text-navy-900">
                          📍 {assignment.gate}
                        </span>
                      ) : (
                        <span className="text-navy-400 italic">All Gates</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="navy" size="sm">
                        {assignment.userId?.role || 'staff'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRemoveStaff(assignment._id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EventStaffAssignment;
