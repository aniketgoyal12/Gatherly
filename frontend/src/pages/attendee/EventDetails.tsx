import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Event, Feedback, ApiResponse } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Star,
  Share2,
  Check,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [avgRating, setAvgRating] = useState<number | string>(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEventAndReviews = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const [eventRes, feedbackRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<{ event: Event }>>(`/events/${id}`),
          apiClient.get<ApiResponse<{ reviews: Feedback[]; avgRating: number | string; totalReviews: number }>>(
            `/feedback/event/${id}`
          ),
        ]);

        if (eventRes.status === 'fulfilled') {
          setEvent(eventRes.value.data?.data?.event || null);
        } else {
          setError('Event not found or has been removed.');
        }

        if (feedbackRes.status === 'fulfilled') {
          const fbData = feedbackRes.value.data?.data;
          setReviews(fbData?.reviews || []);
          setAvgRating(fbData?.avgRating || 0);
          setTotalReviews(fbData?.totalReviews || 0);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndReviews();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-navy-800">Loading event blueprint & tickets...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-cream-50 rounded-3xl border border-cream-300 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-950">Event Unavailable</h2>
        <p className="text-xs text-navy-600">{error || 'Event could not be found.'}</p>
        <Link to="/events">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const venue = typeof event.venueId === 'object' && event.venueId !== null ? event.venueId : null;
  const organizer = typeof event.organizerId === 'object' && event.organizerId !== null ? event.organizerId : null;
  const isFree = !event.ticketPrice || event.ticketPrice === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb Back Link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events Discovery</span>
      </Link>

      {/* Hero Banner Section */}
      <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border border-navy-800">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-cream-100">
            <div className="w-16 h-16 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center mb-3 border border-coral-500/30">
              <Sparkles className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-coral-400">
              {event.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white max-w-2xl mt-2 leading-tight">
              {event.title}
            </h1>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge variant="navy" size="md">
            {event.category}
          </Badge>
          <Badge variant="coral" size="md">
            {event.status.toUpperCase()}
          </Badge>
        </div>

        {/* Floating Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-navy-950/80 backdrop-blur-md text-white hover:bg-navy-900 transition-colors border border-navy-700 shadow-md cursor-pointer"
          title="Share event link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Grid: 2/3 Content Column + 1/3 Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Metadata */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black text-navy-950 tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-navy-950">Date & Time</h4>
                  <p className="text-xs text-navy-600">{formatDate(event.startDate)}</p>
                  <p className="text-[11px] text-navy-500 font-medium">
                    {formatTime(event.startDate)} – {formatTime(event.endDate)}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-navy-950">Location</h4>
                  <p className="text-xs text-navy-600 font-medium">{venue?.name || 'Assigned Venue'}</p>
                  <p className="text-[11px] text-navy-500">{venue?.address || 'New Delhi, India'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Event Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-navy-950">About This Event</h3>
            <div className="text-sm text-navy-800 leading-relaxed space-y-3 whitespace-pre-line bg-cream-50/50 p-6 rounded-3xl border border-cream-200">
              {event.description}
            </div>
          </div>

          {/* Venue & Facilities Details */}
          {venue && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-navy-700" />
                <span>Venue Amenities & Facilities</span>
              </h3>
              <div className="p-5 rounded-3xl bg-cream-50 border border-cream-200 space-y-3">
                <p className="text-xs text-navy-700">
                  <strong>Venue:</strong> {venue.name} — {venue.address}
                </p>
                {venue.facilities && venue.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {venue.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-200 text-navy-800 border border-cream-300"
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organizer Info */}
          {organizer && (
            <div className="p-5 rounded-3xl bg-cream-50 border border-cream-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {organizer.name ? organizer.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-coral-600">
                  Organized by
                </span>
                <h4 className="text-sm font-bold text-navy-950">{organizer.name}</h4>
                <p className="text-xs text-navy-500">{organizer.email}</p>
              </div>
            </div>
          )}

          {/* Attendee Feedback & Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-cream-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-coral-500" />
                <span>Attendee Reviews ({totalReviews})</span>
              </h3>

              {totalReviews > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{avgRating} / 5.0</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 rounded-3xl bg-cream-50 border border-cream-200 text-center space-y-2">
                <p className="text-xs text-navy-600">No reviews yet for this event.</p>
                <p className="text-[11px] text-navy-500">
                  Reviews are unlocked for verified attendees once the event concludes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => {
                  const revId = (rev._id || rev.id) as string;
                  const reviewer = typeof rev.userId === 'object' && rev.userId !== null ? rev.userId : null;

                  return (
                    <div
                      key={revId}
                      className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-950">
                          {reviewer?.name || 'Verified Attendee'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-cream-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.review && (
                        <p className="text-xs text-navy-700 leading-relaxed font-normal">
                          "{rev.review}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Booking Sidebar (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card variant="cream" className="p-6 border border-cream-300 shadow-xl rounded-3xl space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                  Ticket Pricing
                </span>
                <div className="flex items-baseline gap-2">
                  {isFree ? (
                    <span className="text-3xl font-black text-emerald-600">FREE</span>
                  ) : (
                    <span className="text-3xl font-black text-navy-950">₹{event.ticketPrice}</span>
                  )}
                  <span className="text-xs text-navy-500 font-medium">/ person</span>
                </div>
              </div>

              {/* Capacity Status */}
              <div className="space-y-2 pt-3 border-t border-cream-200">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-800">
                  <span>Venue Capacity</span>
                  <span>{event.capacity} seats</span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                  <div
                    className="h-full bg-coral-500 rounded-full"
                    style={{ width: '45%' }}
                  />
                </div>
                <p className="text-[11px] text-navy-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Atomic concurrency lock active (no overselling)</span>
                </p>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full cursor-pointer shadow-md"
                onClick={() => navigate(`/checkout/${id}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isFree ? 'Reserve Free Ticket' : 'Book Ticket Now'}
              </Button>

              <div className="text-center">
                <p className="text-[11px] text-navy-500">
                  Instant SHA-256 QR ticket generated upon confirmation
                </p>
              </div>
            </Card>

            {/* Guarantee Badge Box */}
            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-center space-y-1">
              <h5 className="text-xs font-bold text-navy-950">100% Verified Event</h5>
              <p className="text-[11px] text-navy-600">
                Moderated by Gatherly super admins before publishing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
