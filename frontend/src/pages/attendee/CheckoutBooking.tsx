import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Event, ApiResponse } from '@/types';
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Download,
  Users,
} from 'lucide-react';

type TicketTierType = 'free' | 'standard' | 'vip' | 'early_bird';

export const CheckoutBooking: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Ticket Tier
  const [selectedTier, setSelectedTier] = useState<TicketTierType>('standard');

  // Response Outcomes
  const [bookingStatus, setBookingStatus] = useState<
    'idle' | 'free_confirmed' | 'payment_required' | 'waitlist_available' | 'waitlist_joined'
  >('idle');

  // Confirmation payload
  const [confirmedTicket, setConfirmedTicket] = useState<{
    id?: string;
    rawQrToken?: string;
    ticketStatus?: string;
  } | null>(null);

  // Razorpay Order payload
  const [razorpayOrder, setRazorpayOrder] = useState<{
    registrationId: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  } | null>(null);

  // Waitlist payload
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await apiClient.get<ApiResponse<{ event: Event }>>(`/events/${eventId}`);
        const ev = res.data?.data?.event;
        setEvent(ev || null);

        if (ev && (!ev.ticketPrice || ev.ticketPrice === 0)) {
          setSelectedTier('free');
        }
      } catch (err) {
        console.error('Failed to load event for checkout:', err);
        setErrorMessage('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Primary Reservation Submission
  const handleReserveTicket = async () => {
    if (!eventId) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<
        ApiResponse<{
          capacityAvailable?: boolean;
          canJoinWaitlist?: boolean;
          registration?: { _id: string };
          ticket?: { id: string; rawQrToken: string; ticketStatus: string };
          registrationId?: string;
          orderId?: string;
          amount?: number;
          currency?: string;
          keyId?: string;
        }>
      >('/registrations/reserve', {
        eventId,
        ticketType: selectedTier,
      });

      const data = res.data?.data;

      // Case 1: Capacity Full -> Prompt Waitlist
      if (data?.canJoinWaitlist || data?.capacityAvailable === false) {
        setBookingStatus('waitlist_available');
        return;
      }

      // Case 2: Free Ticket Confirmed
      if (data?.ticket) {
        setConfirmedTicket(data.ticket);
        setBookingStatus('free_confirmed');
        return;
      }

      // Case 3: Paid Event -> Razorpay Order Created
      if (data?.orderId && data?.registrationId) {
        setRazorpayOrder({
          registrationId: data.registrationId,
          orderId: data.orderId,
          amount: data.amount || event?.ticketPrice || 0,
          currency: data.currency || 'INR',
          keyId: data.keyId,
        });
        setBookingStatus('payment_required');
        return;
      }

      setErrorMessage('Unexpected response received from booking server.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axiosErr.response?.status === 409) {
        setErrorMessage(axiosErr.response?.data?.message || 'You already have an active registration for this event.');
      } else {
        setErrorMessage(
          axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to reserve ticket. Please check your connection.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Razorpay Simulated Payment Verification
  const handleSimulatePayment = async () => {
    if (!razorpayOrder) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const simulatedPaymentId = `pay_${Date.now()}`;
      const simulatedSignature = `sim_sig_${Date.now()}`;

      const res = await apiClient.post<
        ApiResponse<{
          paymentStatus: string;
          ticket: { id: string; rawQrToken: string; ticketStatus: string };
        }>
      >('/payments/verify', {
        registrationId: razorpayOrder.registrationId,
        razorpayOrderId: razorpayOrder.orderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: simulatedSignature,
      });

      const ticketData = res.data?.data?.ticket;
      if (ticketData) {
        navigate(`/payment/success?paymentId=${simulatedPaymentId}`);
      } else {
        navigate('/my-tickets');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Payment verification failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Join Waitlist Action
  const handleJoinWaitlist = async () => {
    if (!eventId) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<
        ApiResponse<{ waitlist: { position: number } }>
      >('/registrations/waitlist', { eventId });

      const pos = res.data?.data?.waitlist?.position || 1;
      setWaitlistPosition(pos);
      setBookingStatus('waitlist_joined');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to join waitlist.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-navy-800">Preparing checkout terminal...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-cream-50 rounded-3xl border border-cream-300 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-950">Event Unavailable</h2>
        <Link to="/events">
          <Button variant="primary" size="sm">
            Browse Other Events
          </Button>
        </Link>
      </div>
    );
  }

  const isFreeEvent = !event.ticketPrice || event.ticketPrice === 0;
  const venue = typeof event.venueId === 'object' && event.venueId !== null ? event.venueId : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header Breadcrumb */}
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Event Details</span>
      </Link>

      {/* OUTCOME 1: TICKET CONFIRMED (FREE OR PAID) */}
      {bookingStatus === 'free_confirmed' && confirmedTicket && (
        <Card variant="cream" className="p-6 sm:p-10 text-center space-y-6 shadow-xl border border-cream-300 rounded-3xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" size="sm">
              Booking Confirmed
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              You're Going to {event.title}!
            </h1>
            <p className="text-xs sm:text-sm text-navy-600 max-w-md mx-auto">
              Your registration has been securely locked in database with SHA-256 cryptographic signature.
            </p>
          </div>

          {/* Interactive QR Pass Preview */}
          <div className="p-6 rounded-3xl bg-cream-100 border border-cream-300 max-w-xs mx-auto space-y-4 shadow-sm">
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG
                value={confirmedTicket.rawQrToken || 'gatherly_default_qr_token'}
                size={180}
                level="H"
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                {selectedTier.toUpperCase()} PASS
              </p>
              <p className="text-[11px] font-mono text-navy-500">
                Ticket Ref: #{confirmedTicket.id?.slice(-8) || 'CONFIRMED'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/my-tickets">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to My Tickets Wallet
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Print / Save Pass
            </Button>
          </div>
        </Card>
      )}

      {/* OUTCOME 2: PAYMENT REQUIRED (RAZORPAY MODAL/FORM) */}
      {bookingStatus === 'payment_required' && razorpayOrder && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 shadow-xl border border-cream-300 rounded-3xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-navy-950">Razorpay Payment Gateway</h2>
            <p className="text-xs text-navy-600">
              Your ticket is temporarily reserved (15m lock). Complete payment to generate QR entry pass.
            </p>
          </div>

          {/* Order Bill Summary */}
          <div className="p-5 rounded-2xl bg-cream-100 border border-cream-200 space-y-3 text-xs">
            <div className="flex justify-between text-navy-700">
              <span>Event:</span>
              <strong className="text-navy-950">{event.title}</strong>
            </div>
            <div className="flex justify-between text-navy-700">
              <span>Tier:</span>
              <span className="font-semibold uppercase">{selectedTier}</span>
            </div>
            <div className="flex justify-between text-navy-700">
              <span>Order ID:</span>
              <span className="font-mono">{razorpayOrder.orderId}</span>
            </div>
            <div className="pt-2 border-t border-cream-300 flex justify-between text-sm font-bold text-navy-950">
              <span>Amount Due:</span>
              <span className="text-coral-600">₹{razorpayOrder.amount}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={submitting}
              onClick={handleSimulatePayment}
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Simulate Razorpay Payment (₹{razorpayOrder.amount})
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setBookingStatus('idle')}
            >
              Cancel Reservation
            </Button>
          </div>
        </Card>
      )}

      {/* OUTCOME 3: CAPACITY EXHAUSTED -> WAITLIST OFFER */}
      {bookingStatus === 'waitlist_available' && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 shadow-xl border border-cream-300 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="warning" size="sm">
              Capacity Full
            </Badge>
            <h2 className="text-xl font-bold text-navy-950">All Allocated Seats Are Reserved</h2>
            <p className="text-xs text-navy-600 max-w-sm mx-auto leading-relaxed">
              This event has reached full capacity. You can join the FIFO Waitlist. If an attendee cancels or their 15-minute checkout expires, you will be auto-offered the next available pass!
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={submitting}
            onClick={handleJoinWaitlist}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Join Priority Waitlist
          </Button>
        </Card>
      )}

      {/* OUTCOME 4: WAITLIST JOINED SUCCESS */}
      {bookingStatus === 'waitlist_joined' && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 shadow-xl border border-cream-300 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" size="sm">
              Waitlist Position #{waitlistPosition}
            </Badge>
            <h2 className="text-xl font-bold text-navy-950">You're on the Waitlist!</h2>
            <p className="text-xs text-navy-600 max-w-sm mx-auto leading-relaxed">
              We've placed you at position #{waitlistPosition}. We will send you an email alert and notification as soon as a seat opens up.
            </p>
          </div>

          <Link to="/events">
            <Button variant="primary" size="md">
              Browse Other Events
            </Button>
          </Link>
        </Card>
      )}

      {/* INITIAL BOOKING FORM */}
      {bookingStatus === 'idle' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Checkout & Ticket Reservation
            </h1>
            <p className="text-xs sm:text-sm text-navy-600 font-medium">
              Review event details and select your ticket pass category.
            </p>
          </div>

          {/* Event Quick Card */}
          <div className="p-5 rounded-3xl bg-cream-50 border border-cream-300 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-navy-950 text-coral-400 flex items-center justify-center shrink-0 border border-navy-800">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-coral-600">
                {event.category}
              </span>
              <h3 className="text-base font-bold text-navy-950">{event.title}</h3>
              <p className="text-xs text-navy-600">📍 {venue?.name || 'Assigned Venue'}</p>
            </div>
          </div>

          {/* Ticket Tier Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Choose Ticket Category
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isFreeEvent ? (
                <button
                  type="button"
                  onClick={() => setSelectedTier('free')}
                  className="p-4 rounded-2xl border-2 border-coral-500 bg-coral-50/50 text-left space-y-1 transition-all shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-950">General Admission</span>
                    <Badge variant="success" size="sm">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-[11px] text-navy-600">Standard venue pass with cryptographic QR code.</p>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedTier('standard')}
                    className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedTier === 'standard'
                        ? 'border-coral-500 bg-coral-50/50 shadow-xs'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-950">Standard Access</span>
                      <span className="text-xs font-black text-navy-950">₹{event.ticketPrice}</span>
                    </div>
                    <p className="text-[11px] text-navy-600">Full conference & workshop entrance.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('vip')}
                    className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedTier === 'vip'
                        ? 'border-coral-500 bg-coral-50/50 shadow-xs'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-950">VIP Pass</span>
                      <span className="text-xs font-black text-navy-950">
                        ₹{Math.round((event.ticketPrice || 100) * 1.5)}
                      </span>
                    </div>
                    <p className="text-[11px] text-navy-600">Priority seating & networking lounge access.</p>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Attendee Details Card */}
          <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 space-y-2 text-xs">
            <h4 className="font-bold text-navy-950">Attendee Information</h4>
            <p className="text-navy-700">
              Name: <strong>{user?.name || 'Logged In User'}</strong>
            </p>
            <p className="text-navy-700">
              Email: <strong>{user?.email}</strong>
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <Button
            variant="primary"
            size="lg"
            className="w-full cursor-pointer shadow-md"
            isLoading={submitting}
            onClick={handleReserveTicket}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isFreeEvent ? 'Confirm Free Registration' : `Proceed to Pay (₹${event.ticketPrice})`}
          </Button>

          <p className="text-center text-[11px] text-navy-500">
            Backed by Gatherly atomic seat lock. No double bookings.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckoutBooking;
