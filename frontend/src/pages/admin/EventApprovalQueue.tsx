import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  Tag,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const EventApprovalQueue: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action Loading & Notifications
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalEvent, setRejectModalEvent] = useState<Event | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchPendingEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/pending-events');
      setPendingEvents(res.data?.data?.events || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch pending approval events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  // Approve & Publish (PATCH /events/:id/review with { action: 'approve' })
  const handleApprove = async (event: Event) => {
    const eid = event._id || event.id;
    if (!eid) return;

    setActionLoadingId(eid);
    setSuccessBanner(null);
    try {
      await apiClient.patch(`/events/${eid}/review`, { action: 'approve' });
      setSuccessBanner(`"${event.title}" has been approved and published to the public portal!`);
      await fetchPendingEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to approve event');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject with Mandatory Reason (PATCH /events/:id/review with { action: 'reject', rejectionReason })
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalEvent) return;
    const eid = rejectModalEvent._id || rejectModalEvent.id;
    if (!eid) return;

    if (!rejectionReason.trim()) {
      setRejectError('Please specify a rejection reason for the organizer.');
      return;
    }

    setIsRejecting(true);
    setRejectError(null);
    try {
      await apiClient.patch(`/events/${eid}/review`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
      });

      setSuccessBanner(`"${rejectModalEvent.title}" was rejected with feedback dispatched to organizer.`);
      setRejectModalEvent(null);
      setRejectionReason('');
      await fetchPendingEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setRejectError(e.response?.data?.message || 'Failed to reject event');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Event Moderation Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Pending Event Approvals
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Review submitted event blueprints, inspect venue capacity, and approve for public ticketing or reject with feedback.
          </p>
        </div>

        <button
          onClick={fetchPendingEvents}
          title="Refresh Queue"
          className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
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

      {/* Queue Body */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-navy-600">Loading pending event submissions...</p>
        </div>
      ) : pendingEvents.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
          title="No pending event approvals"
          description="All submitted events have been reviewed. Organizers will submit new event drafts shortly."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-navy-600">
            <span>
              Showing <strong>{pendingEvents.length}</strong> event{pendingEvents.length === 1 ? '' : 's'} awaiting review
            </span>
          </div>

          <div className="space-y-6">
            {pendingEvents.map((event) => {
              const eid = event._id || event.id;
              const orgName =
                typeof event.organizerId === 'object' ? event.organizerId?.name : 'Event Organizer';
              const orgEmail =
                typeof event.organizerId === 'object' ? event.organizerId?.email : '';
              const venueName =
                typeof event.venueId === 'object' && event.venueId?.name
                  ? event.venueId.name
                  : typeof event.venue === 'object' && event.venue?.name
                  ? event.venue.name
                  : 'Online / Virtual Venue';
              const venueAddress =
                typeof event.venueId === 'object' && event.venueId?.address
                  ? event.venueId.address
                  : '';
              const isActionLoading = actionLoadingId === eid;

              return (
                <Card key={eid} variant="cream" className="border border-cream-300 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Event Banner Column */}
                    <div className="md:col-span-4 bg-navy-950 relative min-h-[160px] md:min-h-full">
                      {event.bannerUrl ? (
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-navy-950 via-navy-900 to-coral-600">
                          <Tag className="w-8 h-8 text-coral-400 mb-2" />
                          <span className="font-bold text-sm">{event.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div className="md:col-span-8 p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" size="sm" dot>
                            Pending Super Admin Review
                          </Badge>
                          <Badge variant="navy" size="sm">
                            {event.category}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-navy-500 font-mono">
                          Submitted {new Date(event.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-navy-950">{event.title}</h3>
                        <p className="text-xs text-navy-600 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-cream-100 border border-cream-200 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                            Organizer
                          </span>
                          <span className="font-semibold text-navy-950 truncate block mt-0.5">
                            {orgName}
                          </span>
                          <span className="text-[10px] text-navy-600 truncate block">{orgEmail}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                            Date & Schedule
                          </span>
                          <span className="font-semibold text-navy-950 block mt-0.5">
                            {new Date(event.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-navy-600 block">
                            {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                            Venue
                          </span>
                          <span className="font-semibold text-navy-950 truncate block mt-0.5">
                            {venueName}
                          </span>
                          <span className="text-[10px] text-navy-600 truncate block">{venueAddress || 'Online'}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                            Pricing & Capacity
                          </span>
                          <span className="font-bold text-navy-950 block mt-0.5">
                            {event.ticketPrice ? `₹${event.ticketPrice}` : 'FREE'}
                          </span>
                          <span className="text-[10px] text-navy-600 block">{event.capacity} seats</span>
                        </div>
                      </div>

                      {/* Approval / Rejection Action Bar */}
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-cream-200">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActionLoading}
                          onClick={() => {
                            setRejectModalEvent(event);
                            setRejectionReason('');
                            setRejectError(null);
                          }}
                          leftIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Reject with Feedback
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isActionLoading}
                          isLoading={isActionLoading}
                          onClick={() => handleApprove(event)}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve & Publish
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* REJECT EVENT MODAL */}
      <Modal
        isOpen={!!rejectModalEvent}
        onClose={() => setRejectModalEvent(null)}
        title="Reject Event Blueprint"
        description={`Provide mandatory feedback explaining why "${rejectModalEvent?.title}" is being rejected.`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2">
          {rejectError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {rejectError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Rejection Reason & Required Changes <span className="text-coral-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Please provide a verified physical venue address and specify valid safety permits for this large capacity event..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs p-3 bg-cream-50 border border-cream-300 rounded-xl text-navy-950 focus:outline-none focus:border-coral-500"
              required
            />
            <p className="text-[11px] text-navy-500">
              This feedback will be dispatched directly to the organizer's notification inbox.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-300">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalEvent(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isRejecting}
              isLoading={isRejecting}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventApprovalQueue;
