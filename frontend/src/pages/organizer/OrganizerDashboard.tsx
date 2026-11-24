import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event, EventStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Calendar,
  CalendarPlus,
  Sparkles,
  DollarSign,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Send,
  Upload,
  ExternalLink,
  Search,
  RefreshCw,
  Check,
  XCircle,
  MapPin,
  Tag,
  Eye,
} from 'lucide-react';

export const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Row Action States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Banner Upload Modal State
  const [bannerModalEvent, setBannerModalEvent] = useState<Event | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // If activeFilter is 'all', query status='' to retrieve all statuses for organizer
      const statusParam = activeFilter === 'all' ? '' : activeFilter;
      const res = await apiClient.get('/events', {
        params: {
          status: statusParam,
          limit: 50,
        },
      });

      const fetchedEvents: Event[] = res.data?.data?.events || [];
      setEvents(fetchedEvents);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch organizer events');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Submit Event for Approval (PATCH /events/:id/submit)
  const handleSubmitForApproval = async (event: Event) => {
    const eventId = event._id || event.id;
    if (!eventId) return;

    setActionLoadingId(eventId);
    setActionSuccessMessage(null);
    try {
      await apiClient.patch(`/events/${eventId}/submit`);
      setActionSuccessMessage(`"${event.title}" submitted for Super Admin review!`);
      await fetchEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to submit event for approval');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark Event as Completed (PATCH /events/:id/complete)
  const handleMarkCompleted = async (event: Event) => {
    const eventId = event._id || event.id;
    if (!eventId) return;

    if (!window.confirm(`Are you sure you want to mark "${event.title}" as completed? This will dispatch feedback requests to attendees.`)) {
      return;
    }

    setActionLoadingId(eventId);
    setActionSuccessMessage(null);
    try {
      await apiClient.patch(`/events/${eventId}/complete`);
      setActionSuccessMessage(`"${event.title}" marked as completed!`);
      await fetchEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to complete event');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel Event (PATCH /events/:id/cancel)
  const handleCancelEvent = async (event: Event) => {
    const eventId = event._id || event.id;
    if (!eventId) return;

    if (!window.confirm(`Warning: Are you sure you want to cancel "${event.title}"? Registered attendees will be notified and refunds scheduled.`)) {
      return;
    }

    setActionLoadingId(eventId);
    setActionSuccessMessage(null);
    try {
      await apiClient.patch(`/events/${eventId}/cancel`);
      setActionSuccessMessage(`"${event.title}" has been cancelled.`);
      await fetchEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to cancel event');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Banner Upload File Handler
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setBannerError('Please select a valid image file (JPEG, PNG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setBannerError('Image file size must be under 5MB.');
        return;
      }
      setBannerError(null);
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setBannerPreview(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Banner API call (PATCH /events/:id/banner)
  const handleUploadBannerSubmit = async () => {
    if (!bannerModalEvent || !bannerFile) return;
    const eventId = bannerModalEvent._id || bannerModalEvent.id;
    if (!eventId) return;

    setIsUploadingBanner(true);
    setBannerError(null);
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);

      await apiClient.patch(`/events/${eventId}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setActionSuccessMessage(`Banner image updated for "${bannerModalEvent.title}"!`);
      setBannerModalEvent(null);
      setBannerFile(null);
      setBannerPreview(null);
      await fetchEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setBannerError(e.response?.data?.message || 'Failed to upload banner');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // KPI Calculations
  const totalCount = events.length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const pendingCount = events.filter((e) => e.status === 'pending_approval').length;
  const draftCount = events.filter((e) => e.status === 'draft' || e.status === 'rejected').length;

  // Filtered Events for Table
  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'draft'
        ? event.status === 'draft' || event.status === 'rejected'
        : event.status === activeFilter;

    const matchesSearch =
      searchQuery.trim() === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Status Badge Mapper
  const renderStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="success" size="sm" dot>
            Published
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge variant="warning" size="sm" dot>
            Pending Review
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="default" size="sm">
            Draft
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" dot>
            Needs Revision
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="info" size="sm">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" size="sm">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-coral-500" />
            <span>Organizer Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Organizer Performance Hub
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Manage your event lifecycle from AI ideation to real-time gate check-ins and financials.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/organizer/create-event">
            <Button variant="primary" size="sm" leftIcon={<CalendarPlus className="w-4 h-4" />}>
              Create Event
            </Button>
          </Link>
          <Link to="/organizer/ai-planner">
            <Button variant="navy" size="sm" leftIcon={<Sparkles className="w-4 h-4 text-coral-400" />}>
              AI Planner
            </Button>
          </Link>
          <Link to="/organizer/budget">
            <Button variant="cream" size="sm" leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}>
              Budget
            </Button>
          </Link>
          <Link to="/organizer/analytics">
            <Button variant="cream" size="sm" leftIcon={<BarChart3 className="w-4 h-4 text-navy-700" />}>
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Events */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-600">Total Events</span>
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">{totalCount}</span>
            <p className="text-[11px] text-navy-500 mt-0.5">Across all platform states</p>
          </div>
        </Card>

        {/* KPI 2: Published */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Published</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{publishedCount}</span>
            <p className="text-[11px] text-emerald-600 mt-0.5">Live for public discovery</p>
          </div>
        </Card>

        {/* KPI 3: Pending Approval */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">In Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{pendingCount}</span>
            <p className="text-[11px] text-amber-600 mt-0.5">Awaiting admin moderation</p>
          </div>
        </Card>

        {/* KPI 4: Drafts */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-coral-600">Drafts</span>
            <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-coral-600">{draftCount}</span>
            <p className="text-[11px] text-coral-500 mt-0.5">Unpublished or revisions</p>
          </div>
        </Card>
      </div>

      {/* Events Management Section */}
      <div className="space-y-4">
        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-cream-50 p-3 rounded-2xl border border-cream-300">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'pending_approval', label: 'Pending Review' },
              { id: 'draft', label: 'Drafts' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-navy-950 text-cream-100 shadow-xs'
                    : 'text-navy-700 hover:bg-cream-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500"
              />
            </div>
            <button
              onClick={() => fetchEvents()}
              disabled={isLoading}
              title="Refresh events list"
              className="p-1.5 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Events Table / Card List */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-navy-600">Loading your managed events...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center space-y-2">
            <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
            <p className="font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchEvents()}>
              Retry
            </Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6 text-coral-500" />}
            title="No events found"
            description={
              searchQuery
                ? `No events match "${searchQuery}". Try adjusting your search query.`
                : activeFilter === 'all'
                ? "You haven't created any events yet. Launch your first event blueprint now!"
                : `No events in status "${activeFilter}".`
            }
            actionLabel="Create New Event"
            onAction={() => navigate('/organizer/create-event')}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-cream-50 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream-200/60 border-b border-cream-300 text-navy-800 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-3">Schedule & Venue</th>
                  <th className="py-3 px-3">Price & Capacity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filteredEvents.map((event) => {
                  const eventId = event._id || event.id;
                  const isActionLoading = actionLoadingId === eventId;
                  const venueName =
                    typeof event.venueId === 'object' && event.venueId?.name
                      ? event.venueId.name
                      : typeof event.venue === 'object' && event.venue?.name
                      ? event.venue.name
                      : 'Venue TBD';

                  return (
                    <tr key={eventId} className="hover:bg-cream-100/80 transition-colors">
                      {/* Event Banner & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {event.bannerUrl ? (
                            <img
                              src={event.bannerUrl}
                              alt={event.title}
                              className="w-12 h-12 rounded-xl object-cover border border-cream-300 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-900 to-coral-600 flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-xs">
                              {event.title.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-navy-950 text-sm truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-navy-600 text-[11px]">
                              <span className="inline-flex items-center gap-1 font-semibold text-coral-600">
                                <Tag className="w-3 h-3" />
                                {event.category}
                              </span>
                              {event.moderationReason && event.status === 'rejected' && (
                                <span className="text-rose-600 truncate" title={event.moderationReason}>
                                  · Reason: {event.moderationReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Schedule & Venue */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 text-navy-800">
                          <div className="font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-navy-500" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-navy-600 flex items-center gap-1 truncate max-w-[160px]">
                            <MapPin className="w-3 h-3 text-coral-500 shrink-0" />
                            <span className="truncate">{venueName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Price & Capacity */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-navy-950">
                            {event.ticketPrice && event.ticketPrice > 0 ? (
                              `₹${event.ticketPrice.toLocaleString('en-IN')}`
                            ) : (
                              <span className="text-emerald-700">FREE</span>
                            )}
                          </div>
                          <div className="text-[11px] text-navy-600 flex items-center gap-1">
                            <Users className="w-3 h-3 text-navy-400" />
                            <span>{event.capacity} seats</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">{renderStatusBadge(event.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* DRAFT OR REJECTED ACTIONS */}
                          {(event.status === 'draft' || event.status === 'rejected') && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isActionLoading}
                                onClick={() => handleSubmitForApproval(event)}
                                title="Submit event for Super Admin approval"
                                className="text-[11px] py-1 px-2.5"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </Button>

                              <Button
                                variant="cream"
                                size="sm"
                                onClick={() => {
                                  setBannerModalEvent(event);
                                  setBannerPreview(event.bannerUrl || null);
                                  setBannerFile(null);
                                  setBannerError(null);
                                }}
                                title="Upload Banner Image"
                                className="text-[11px] py-1 px-2.5"
                              >
                                <Upload className="w-3 h-3 text-navy-700" />
                                <span>Banner</span>
                              </Button>
                            </>
                          )}

                          {/* PUBLISHED ACTIONS */}
                          {event.status === 'published' && (
                            <>
                              <Button
                                variant="navy"
                                size="sm"
                                disabled={isActionLoading}
                                onClick={() => handleMarkCompleted(event)}
                                title="Mark event as completed"
                                className="text-[11px] py-1 px-2.5"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Complete</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isActionLoading}
                                onClick={() => handleCancelEvent(event)}
                                title="Cancel event and trigger refunds"
                                className="text-[11px] py-1 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Cancel</span>
                              </Button>
                            </>
                          )}

                          {/* QUICK LINKS TO EVENT CONTEXTS */}
                          <Link
                            to={`/organizer/events/${eventId}/edit`}
                            title="Edit Event Blueprint"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-navy-700" />
                          </Link>

                          <Link
                            to={`/organizer/events/${eventId}/staff`}
                            title="Assign Gate Staff"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                          </Link>

                          <Link
                            to={`/events/${eventId}`}
                            title="View Public Event Page"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/organizer/budget?eventId=${eventId}`}
                            title="Manage Budget"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          </Link>

                          <Link
                            to={`/organizer/attendees?eventId=${eventId}`}
                            title="View Registrations"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-navy-700" />
                          </Link>

                          <Link
                            to={`/organizer/analytics?eventId=${eventId}`}
                            title="Event Analytics"
                            className="p-1.5 rounded-lg border border-cream-300 text-navy-700 hover:bg-cream-200 transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-coral-600" />
                          </Link>
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

      {/* Banner Upload Modal */}
      {bannerModalEvent && (
        <Modal
          isOpen={!!bannerModalEvent}
          onClose={() => {
            setBannerModalEvent(null);
            setBannerFile(null);
            setBannerPreview(null);
            setBannerError(null);
          }}
          title={`Upload Event Banner`}
          description={`Update marketing banner for "${bannerModalEvent.title}". Maximum file size: 5MB.`}
        >
          <div className="space-y-4 pt-2">
            {bannerError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {bannerError}
              </div>
            )}

            {/* Preview Box */}
            <div className="rounded-2xl border-2 border-dashed border-cream-300 p-4 text-center bg-cream-100/50">
              {bannerPreview ? (
                <div className="space-y-3">
                  <img
                    src={bannerPreview}
                    alt="Preview"
                    className="w-full h-44 object-cover rounded-xl shadow-xs border border-cream-300"
                  />
                  <p className="text-[11px] text-navy-600">Selected: {bannerFile?.name || 'Existing banner'}</p>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <Upload className="w-8 h-8 text-coral-500 mx-auto" />
                  <p className="text-xs font-semibold text-navy-800">
                    PNG, JPG, or WEBP up to 5MB
                  </p>
                </div>
              )}

              <label className="mt-3 inline-block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerFileSelect}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-950 text-cream-100 hover:bg-navy-900 cursor-pointer shadow-xs transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBannerModalEvent(null)}
                disabled={isUploadingBanner}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUploadBannerSubmit}
                disabled={!bannerFile || isUploadingBanner}
                isLoading={isUploadingBanner}
              >
                Upload & Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrganizerDashboard;
