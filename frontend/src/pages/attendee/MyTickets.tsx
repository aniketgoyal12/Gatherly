import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import type { Ticket, Event, ApiResponse } from '@/types';
import {
  Ticket as TicketIcon,
  Calendar,
  Clock,
  MapPin,
  Download,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  ArrowRight,
  MessageSquarePlus,
} from 'lucide-react';

export const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedEventForReview, setSelectedEventForReview] = useState<{ id: string; title: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<{ tickets: Ticket[] }>>('/tickets/my-tickets');
      setTickets(res.data?.data?.tickets || []);
    } catch (err) {
      console.error('Failed to fetch my tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Submit Feedback Handler
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForReview) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      await apiClient.post('/feedback', {
        eventId: selectedEventForReview.id,
        rating: reviewRating,
        review: reviewText.trim(),
      });

      setReviewSuccess(true);
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setReviewSuccess(false);
        setReviewText('');
        setSelectedEventForReview(null);
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setReviewError(axiosErr.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Split into Upcoming vs Past Tickets
  const now = new Date();
  const upcomingTickets = tickets.filter((t) => {
    const reg = typeof t.registrationId === 'object' && t.registrationId !== null ? t.registrationId : null;
    const event = typeof reg?.eventId === 'object' && reg?.eventId !== null ? (reg.eventId as unknown as Event) : null;
    const eventDate = event?.startDate ? new Date(event.startDate) : null;

    if (t.ticketStatus === 'checked_in') return false;
    if (eventDate && eventDate < now) return false;
    return true;
  });

  const pastTickets = tickets.filter((t) => {
    const reg = typeof t.registrationId === 'object' && t.registrationId !== null ? t.registrationId : null;
    const event = typeof reg?.eventId === 'object' && reg?.eventId !== null ? (reg.eventId as unknown as Event) : null;
    const eventDate = event?.startDate ? new Date(event.startDate) : null;

    if (t.ticketStatus === 'checked_in') return true;
    if (eventDate && eventDate < now) return true;
    return false;
  });

  const currentTickets = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-300">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <TicketIcon className="w-7 h-7 text-coral-500" />
            <span>My Digital Tickets Wallet</span>
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 font-medium">
            Cryptographically signed gate passes. Display QR code on your phone for instant venue entry.
          </p>
        </div>

        <Link to="/events">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Explore More Events
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-navy-950 text-white shadow-xs'
              : 'bg-cream-200/80 hover:bg-cream-300 text-navy-800'
          }`}
        >
          Upcoming & Active ({upcomingTickets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'past'
              ? 'bg-navy-950 text-white shadow-xs'
              : 'bg-cream-200/80 hover:bg-cream-300 text-navy-800'
          }`}
        >
          Past / Checked-In ({pastTickets.length})
        </button>
      </div>

      {/* Ticket List Rendering */}
      {loading ? (
        <div className="space-y-4 py-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-cream-50 border border-cream-200 animate-pulse flex flex-col sm:flex-row gap-6 items-center"
            >
              <div className="w-36 h-36 rounded-2xl bg-cream-300 shrink-0" />
              <div className="flex-1 space-y-2 w-full">
                <div className="h-5 bg-cream-300 rounded w-1/3" />
                <div className="h-4 bg-cream-200 rounded w-3/4" />
                <div className="h-4 bg-cream-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : currentTickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="w-6 h-6 text-coral-600" />}
          title={activeTab === 'upcoming' ? 'No Active Tickets' : 'No Past Event Passes'}
          description={
            activeTab === 'upcoming'
              ? 'You have no upcoming event passes reserved. Browse published events to book your ticket!'
              : 'Completed event passes will be cataloged here once you check in.'
          }
          actionLabel="Discover Events"
          onAction={() => (window.location.href = '/events')}
          className="my-12"
        />
      ) : (
        <div className="space-y-6">
          {currentTickets.map((ticket) => {
            const ticketId = (ticket._id || ticket.id) as string;
            const reg = typeof ticket.registrationId === 'object' && ticket.registrationId !== null ? ticket.registrationId : null;
            const event = typeof reg?.eventId === 'object' && reg?.eventId !== null ? (reg.eventId as unknown as Event) : null;
            const eventTitle = event?.title || 'Gatherly Scheduled Event';
            const eventCategory = event?.category || 'General';
            const eventDate = event?.startDate;
            const qrPayload = ticket.rawQrToken || ticket.tokenHash || ticketId;
            const isCheckedIn = ticket.ticketStatus === 'checked_in';

            return (
              <div
                key={ticketId}
                className="overflow-hidden rounded-3xl bg-cream-50 border border-cream-300 shadow-md flex flex-col md:flex-row hover:border-coral-500/40 transition-all"
              >
                {/* Left Section: Boarding Pass Event Details */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="navy" size="sm">
                        {eventCategory}
                      </Badge>
                      <Badge
                        variant={isCheckedIn ? 'info' : ticket.ticketStatus === 'valid' ? 'success' : 'danger'}
                        size="sm"
                        dot
                      >
                        {isCheckedIn ? 'Checked In' : ticket.ticketStatus.toUpperCase()}
                      </Badge>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight leading-tight">
                      {eventTitle}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-navy-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-coral-500 shrink-0" />
                        <span>{formatDate(eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-coral-500 shrink-0" />
                        <span>{formatTime(eventDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pass Metadata & Actions */}
                  <div className="pt-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 block">
                        Ticket Reference
                      </span>
                      <span className="font-mono text-xs font-bold text-navy-800">#{ticketId.slice(-8)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Print Pass
                      </Button>

                      {/* Review Button for Checked-In / Past Events */}
                      {event && (
                        <Button
                          variant="cream"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForReview({
                              id: (event._id || event.id) as string,
                              title: eventTitle,
                            });
                            setFeedbackModalOpen(true);
                          }}
                          leftIcon={<MessageSquarePlus className="w-3.5 h-3.5 text-coral-500" />}
                          className="text-xs"
                        >
                          Review Event
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Tear-off QR Stance */}
                <div className="md:w-64 bg-cream-100 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-cream-300 text-center space-y-3">
                  <div className="bg-white p-3.5 rounded-2xl shadow-inner border border-cream-200">
                    <QRCodeSVG
                      value={qrPayload}
                      size={140}
                      level="H"
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-navy-500 flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3 text-coral-500" />
                      <span>Gate Scan Code</span>
                    </p>
                    <p className="text-[10px] text-navy-400">Scan at entrance for entry</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Leave Event Review"
        description={selectedEventForReview?.title || 'Share your feedback'}
      >
        {reviewSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-navy-950">Review Submitted!</h3>
            <p className="text-xs text-navy-600">Thank you for rating this event.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-5">
            {/* Star Rating Selector */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Overall Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-cream-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-navy-700 ml-2">{reviewRating} of 5 Stars</span>
              </div>
            </div>

            {/* Review Comment */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Your Comments & Feedback
              </label>
              <textarea
                rows={4}
                placeholder="What did you enjoy most? How was the organization and speaker sessions?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 bg-cream-50 border border-cream-300 rounded-xl text-navy-950 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-500"
              />
            </div>

            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFeedbackModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submittingReview}
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MyTickets;
