import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event, Registration, Task, TaskStatus, TaskPriority } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Check,
  Tag,
  Kanban,
  ListTodo,
  ChevronRight,
  UserCheck,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ExtendedRegistration {
  _id?: string;
  id?: string;
  userId: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  eventId: {
    _id?: string;
    id?: string;
    title: string;
    startDate?: string;
    ticketPrice?: number;
  };
  ticketType?: string;
  ticketTierName?: string;
  bookingStatus: string;
  createdAt?: string;
}

export const RegistrationsMgmt: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId') || '';

  // Event Selector State
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Registrations State
  const [registrations, setRegistrations] = useState<ExtendedRegistration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Tasks State (Operations Kanban)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

  // Active Tab: Attendee List vs Operations Kanban
  const [activeTab, setActiveTab] = useState<'attendees' | 'operations'>('attendees');

  // 1. Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await apiClient.get('/events', { params: { limit: 50 } });
        const list: Event[] = res.data?.data?.events || [];
        setEvents(list);
        if (list.length > 0 && !selectedEventId) {
          const defaultId = list[0]._id || list[0].id || '';
          setSelectedEventId(defaultId);
          setSearchParams({ eventId: defaultId });
        }
      } catch (err) {
        console.error('Failed to load events for registrations', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch Registrations for Selected Event
  const fetchRegistrations = useCallback(async () => {
    if (!selectedEventId) return;
    setIsLoadingRegistrations(true);
    setRegistrationsError(null);
    try {
      const res = await apiClient.get('/registrations', {
        params: { eventId: selectedEventId },
      });
      const list = res.data?.data?.registrations || [];
      setRegistrations(list);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setRegistrationsError(e.response?.data?.message || 'Failed to fetch event registrations');
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, [selectedEventId]);

  // 3. Fetch Tasks for Selected Event
  const fetchTasks = useCallback(async () => {
    if (!selectedEventId) return;
    setIsLoadingTasks(true);
    try {
      const res = await apiClient.get('/tasks', {
        params: { eventId: selectedEventId },
      });
      const list = res.data?.data?.tasks || [];
      setTasks(list);
    } catch (err) {
      console.warn('Failed to load tasks for event', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchRegistrations();
    fetchTasks();
  }, [fetchRegistrations, fetchTasks]);

  // Handle Event Selector Change
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  // Create Task (POST /tasks)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !taskTitle.trim()) return;

    setIsCreatingTask(true);
    setTaskModalError(null);
    try {
      await apiClient.post('/tasks', {
        eventId: selectedEventId,
        title: taskTitle.trim(),
        priority: taskPriority,
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
      });

      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDeadline('');
      await fetchTasks();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setTaskModalError(e.response?.data?.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Update Task Status (PATCH /tasks/:id/status)
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  // Filter Registrations
  const filteredRegistrations = registrations.filter((reg) => {
    const attendee = typeof reg.userId === 'object' ? reg.userId : null;
    const nameMatch = attendee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const emailMatch = attendee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesSearch = searchTerm.trim() === '' || nameMatch || emailMatch;

    const tier = reg.ticketType || reg.ticketTierName || 'standard';
    const matchesTier = tierFilter === 'all' || tier.toLowerCase() === tierFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' || reg.bookingStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Client-side CSV Export
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('No attendee registrations to export.');
      return;
    }

    const headers = ['Registration ID', 'Attendee Name', 'Attendee Email', 'Ticket Tier', 'Booking Status', 'Date Booked'];
    const rows = filteredRegistrations.map((reg) => {
      const attendee = typeof reg.userId === 'object' ? reg.userId : null;
      return [
        reg._id || reg.id || '',
        `"${attendee?.name || 'Guest'}"`,
        `"${attendee?.email || ''}"`,
        reg.ticketType || 'standard',
        reg.bookingStatus,
        reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const eventName = selectedEvent?.title.replace(/[^a-zA-Z0-9]/g, '_') || 'Event';
    link.setAttribute('download', `${eventName}_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEvent = events.find((ev) => (ev._id || ev.id) === selectedEventId);

  // Summary Metrics
  const totalBookings = registrations.length;
  const confirmedCount = registrations.filter((r) => r.bookingStatus === 'confirmed').length;
  const reservedCount = registrations.filter((r) => r.bookingStatus === 'reserved' || r.bookingStatus === 'pending').length;
  const cancelledCount = registrations.filter((r) => r.bookingStatus === 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Event Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-coral-500" />
            <span>Attendee Logistics & On-Ground Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Registrations & Operations
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Audit attendee passes, filter booking tiers, export CSV rosters, and coordinate gate staff tasks.
          </p>
        </div>

        {/* Event Selector & CSV Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-64">
            <select
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500 shadow-xs"
            >
              {events.map((ev) => {
                const eid = ev._id || ev.id || '';
                return (
                  <option key={eid} value={eid}>
                    {ev.title} ({ev.status})
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            variant="cream"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5 text-navy-700" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* 4 Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">Total Bookings</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">{totalBookings}</span>
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-navy-500 mt-1">
            Capacity: {selectedEvent?.capacity || 0} seats
          </p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Confirmed Passes</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{confirmedCount}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Cryptographic QR issued</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">Reserved / Hold</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{reservedCount}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">15-minute checkout TTL</p>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">Cancelled</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-coral-600">{cancelledCount}</span>
            <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-coral-500 mt-1">Seats released back</p>
        </Card>
      </div>

      {/* Main Panel View Switcher: Attendees List vs Operations Kanban */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-cream-300 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('attendees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'attendees'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-cream-100 text-navy-800 hover:bg-cream-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendee Directory ({filteredRegistrations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'operations'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-cream-100 text-navy-800 hover:bg-cream-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-coral-400" />
              <span>Operations Kanban ({tasks.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchRegistrations();
              fetchTasks();
            }}
            title="Refresh Data"
            className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TAB 1: ATTENDEE DIRECTORY */}
        {activeTab === 'attendees' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-cream-50 p-3 rounded-2xl border border-cream-300">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search attendee by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Tier Filter */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="free">Free</option>
                  <option value="early_bird">Early Bird</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reserved">Reserved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Attendee Registrations Table */}
            {isLoadingRegistrations ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-navy-600">Loading attendee records...</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6 text-coral-500" />}
                title="No registrations found"
                description={
                  searchTerm
                    ? `No attendees match "${searchTerm}".`
                    : "No attendees have registered for this event yet."
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-cream-50 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream-200/60 border-b border-cream-300 text-navy-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Attendee Details</th>
                      <th className="py-3 px-3">Ticket Tier</th>
                      <th className="py-3 px-3">Booking Status</th>
                      <th className="py-3 px-3">Date Registered</th>
                      <th className="py-3 px-4 text-right">Pass Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {filteredRegistrations.map((reg) => {
                      const attendee = typeof reg.userId === 'object' ? reg.userId : null;
                      const tier = reg.ticketType || reg.ticketTierName || 'standard';

                      return (
                        <tr key={reg._id || reg.id} className="hover:bg-cream-100/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-navy-950 text-cream-100 flex items-center justify-center font-bold text-xs shrink-0">
                                {attendee?.name ? attendee.name.charAt(0).toUpperCase() : 'G'}
                              </div>
                              <div>
                                <h4 className="font-bold text-navy-950">{attendee?.name || 'Registered Guest'}</h4>
                                <div className="text-[11px] text-navy-600 flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-navy-400" />
                                  <span>{attendee?.email || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="capitalize font-bold text-navy-900 bg-cream-200 px-2 py-0.5 rounded-md text-[10px]">
                              {tier}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {reg.bookingStatus === 'confirmed' ? (
                              <Badge variant="success" size="sm" dot>
                                Confirmed
                              </Badge>
                            ) : reg.bookingStatus === 'reserved' || reg.bookingStatus === 'pending' ? (
                              <Badge variant="warning" size="sm" dot>
                                Reserved (Hold)
                              </Badge>
                            ) : (
                              <Badge variant="danger" size="sm">
                                Cancelled
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-3 text-navy-600 text-[11px]">
                            {reg.createdAt
                              ? new Date(reg.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-navy-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Valid Gate Entry</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPERATIONS KANBAN */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Column 1: Pending / To Do */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 text-cream-100">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <ListTodo className="w-3.5 h-3.5 text-coral-400" />
                  <span>To Do</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-navy-800 text-[10px] font-bold">
                  {tasks.filter((t) => t.status === 'pending').length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'pending')
                  .map((task) => {
                    const tid = task._id || task.id || '';
                    return (
                      <Card key={tid} variant="cream" className="p-4 border border-cream-300 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-navy-950 text-xs">{task.title}</h4>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              task.priority === 'urgent' || task.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-cream-200 text-navy-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {task.deadline && (
                          <div className="flex items-center gap-1 text-[10px] text-navy-600">
                            <Clock className="w-3 h-3 text-navy-400" />
                            <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-cream-200 flex justify-end">
                          <button
                            onClick={() => handleUpdateTaskStatus(tid, 'in_progress')}
                            className="text-[10px] font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1"
                          >
                            <span>Move to In Progress</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500 text-white">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>In Progress</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-600 text-[10px] font-bold">
                  {tasks.filter((t) => t.status === 'in_progress').length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'in_progress')
                  .map((task) => {
                    const tid = task._id || task.id || '';
                    return (
                      <Card key={tid} variant="cream" className="p-4 border border-amber-200 bg-amber-50/30 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-navy-950 text-xs">{task.title}</h4>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {task.priority}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
                          <button
                            onClick={() => handleUpdateTaskStatus(tid, 'pending')}
                            className="text-[10px] text-navy-600 hover:underline"
                          >
                            ← To Do
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(tid, 'completed')}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                          >
                            <span>Complete</span>
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 text-white">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-[10px] font-bold">
                  {tasks.filter((t) => t.status === 'completed').length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'completed')
                  .map((task) => {
                    const tid = task._id || task.id || '';
                    return (
                      <Card key={tid} variant="cream" className="p-4 border border-emerald-200 bg-emerald-50/40 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-navy-950 text-xs line-through text-navy-600">
                            {task.title}
                          </h4>
                          <Badge variant="success" size="sm">
                            Done
                          </Badge>
                        </div>
                        <div className="pt-2 border-t border-cream-200 flex justify-end">
                          <button
                            onClick={() => handleUpdateTaskStatus(tid, 'in_progress')}
                            className="text-[10px] text-navy-500 hover:underline"
                          >
                            Reopen
                          </button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE OPERATION TASK MODAL */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Operation / Gate Task"
        description={`Assign a logistics, check-in, or vendor coordination task for "${selectedEvent?.title || 'Selected Event'}".`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
          {taskModalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {taskModalError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Task Title <span className="text-coral-500">*</span>
            </label>
            <Input
              placeholder="e.g. Set up gate 2 QR barcode scanners and verify offline cache"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full text-xs py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Critical / Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Deadline
              </label>
              <Input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cream-300">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isCreatingTask}
              isLoading={isCreatingTask}
            >
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RegistrationsMgmt;
