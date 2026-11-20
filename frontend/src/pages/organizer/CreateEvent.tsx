import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Venue } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
  Upload,
  Sparkles,
  Check,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Tag,
  AlertCircle,
  Plus,
  Eye,
  Send,
  FileEdit,
} from 'lucide-react';

const CATEGORIES = [
  'Technology',
  'Music & Arts',
  'Business',
  'Workshops',
  'Academic',
  'Social',
  'Health & Wellness',
  'Sports',
];

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill state if routed from AI Event Planner or previous step
  const prefill = (location.state as {
    title?: string;
    category?: string;
    capacity?: number;
    description?: string;
    budget?: number;
  }) || {};

  // Step Wizard State (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Basics
  const [title, setTitle] = useState(prefill.title || '');
  const [category, setCategory] = useState(prefill.category || 'Technology');
  const [description, setDescription] = useState(prefill.description || '');
  const [capacity, setCapacity] = useState<number>(prefill.capacity || 100);

  // Step 2: Schedule & Venue
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venueId, setVenueId] = useState<string>('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);

  // Inline "Create Venue" Modal State
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueCapacity, setNewVenueCapacity] = useState<number>(200);
  const [newVenueFacilities, setNewVenueFacilities] = useState('WiFi, Projector, Sound System');
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [venueModalError, setVenueModalError] = useState<string | null>(null);

  // Step 3: Pricing & Media
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Fetch Venues on Mount
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoadingVenues(true);
      try {
        const res = await apiClient.get('/venues');
        const venueList: Venue[] = res.data?.data?.venues || [];
        setVenues(venueList);
        if (venueList.length > 0 && !venueId) {
          setVenueId(venueList[0]._id || venueList[0].id || '');
        }
      } catch (err) {
        console.error('Failed to load venues', err);
      } finally {
        setIsLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  // Set default start/end dates if empty
  useEffect(() => {
    if (!startDate) {
      const now = new Date();
      now.setDate(now.getDate() + 7); // Default 1 week from now
      now.setHours(10, 0, 0, 0);
      const isoStart = now.toISOString().slice(0, 16);
      setStartDate(isoStart);

      now.setHours(18, 0, 0, 0);
      const isoEnd = now.toISOString().slice(0, 16);
      setEndDate(isoEnd);
    }
  }, [startDate]);

  // Inline Venue Creation
  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim() || !newVenueAddress.trim()) {
      setVenueModalError('Venue name and physical address are required.');
      return;
    }

    setIsCreatingVenue(true);
    setVenueModalError(null);
    try {
      const facilitiesArray = newVenueFacilities
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await apiClient.post('/venues', {
        name: newVenueName.trim(),
        address: newVenueAddress.trim(),
        capacity: Number(newVenueCapacity) || 100,
        facilities: facilitiesArray,
      });

      const created: Venue = res.data?.data?.venue;
      if (created) {
        setVenues((prev) => [...prev, created]);
        setVenueId(created._id || created.id || '');
        setIsVenueModalOpen(false);
        setNewVenueName('');
        setNewVenueAddress('');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setVenueModalError(e.response?.data?.message || 'Failed to create venue');
    } finally {
      setIsCreatingVenue(false);
    }
  };

  // Banner File Selection & Preview
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setBannerError('Only JPEG, PNG, or WEBP image formats are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setBannerError('Image file size must be less than 5MB.');
        return;
      }
      setBannerError(null);
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setBannerPreview(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation before advancing steps
  const validateStep = (step: number): boolean => {
    setSubmitError(null);
    if (step === 1) {
      if (title.trim().length < 3) {
        setSubmitError('Event title must be at least 3 characters.');
        return false;
      }
      if (description.trim().length < 10) {
        setSubmitError('Event description must be at least 10 characters.');
        return false;
      }
      if (capacity <= 0) {
        setSubmitError('Capacity must be greater than zero.');
        return false;
      }
    } else if (step === 2) {
      if (!startDate || !endDate) {
        setSubmitError('Please specify valid start and end dates.');
        return false;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        setSubmitError('End date/time must be strictly after the start date/time.');
        return false;
      }
    } else if (step === 3) {
      if (isPaid && ticketPrice <= 0) {
        setSubmitError('Please specify a positive ticket price for paid events.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submission (Draft or Submit for Approval)
  const handleSubmit = async (submitForApproval: boolean = false) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create Event (POST /events)
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        venueId: venueId || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: Number(capacity),
        ticketPrice: isPaid ? Number(ticketPrice) : 0,
      };

      const res = await apiClient.post('/events', payload);
      const event = res.data?.data?.event;
      const eventId = event?._id || event?.id;

      if (!eventId) {
        throw new Error('Event created, but no ID was returned by server.');
      }

      setCreatedEventId(eventId);

      // 2. Upload Banner if provided (PATCH /events/:id/banner)
      if (bannerFile) {
        try {
          const formData = new FormData();
          formData.append('banner', bannerFile);
          await apiClient.patch(`/events/${eventId}/banner`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (bannerUploadError) {
          console.warn('Banner upload encountered an issue, event created as draft:', bannerUploadError);
        }
      }

      // 3. Submit for approval if requested (PATCH /events/:id/submit)
      if (submitForApproval) {
        await apiClient.patch(`/events/${eventId}/submit`);
      }

      // Redirect to Organizer Dashboard with success
      navigate('/organizer/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(e.response?.data?.message || 'Failed to create event. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVenue = venues.find((v) => (v._id || v.id) === venueId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="space-y-2">
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 hover:text-coral-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizer Console</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Create New Event
            </h1>
            <p className="text-xs sm:text-sm text-navy-600">
              Configure event details, booking capacity, venue logistics, and marketing imagery.
            </p>
          </div>
          <Link to="/organizer/ai-planner">
            <Button variant="cream" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-coral-500" />}>
              Generate with AI
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { num: 1, label: 'Basics' },
          { num: 2, label: 'Schedule & Venue' },
          { num: 3, label: 'Pricing & Media' },
          { num: 4, label: 'Review & Publish' },
        ].map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => {
                if (isDone) setCurrentStep(step.num);
              }}
              className={`p-3 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-navy-950 text-cream-100 border-navy-800 shadow-sm'
                  : isDone
                  ? 'bg-cream-200/80 text-navy-900 border-cream-300 cursor-pointer hover:bg-cream-200'
                  : 'bg-cream-50 text-navy-400 border-cream-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isCurrent
                      ? 'bg-coral-500 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cream-300 text-navy-600'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className="text-xs font-bold hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Error Banner */}
      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: BASICS */}
      {currentStep === 1 && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 border border-cream-300">
          <CardHeader className="p-0 pb-2">
            <CardTitle>Step 1: Event Fundamentals</CardTitle>
            <CardDescription>
              Set the event title, category, attendee capacity, and overarching description.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Event Title <span className="text-coral-500">*</span>
              </label>
              <Input
                placeholder="e.g. Gatherly Global Tech Summit 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-[11px] text-navy-500">Minimum 3 characters</p>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Category <span className="text-coral-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      category === cat
                        ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                        : 'bg-cream-100 text-navy-800 border-cream-300 hover:bg-cream-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Max Capacity (Attendees) <span className="text-coral-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 150"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                leftIcon={<Users className="w-4 h-4 text-navy-400" />}
              />
              <p className="text-[11px] text-navy-500">
                Used to trigger atomic seat holds and automatic waitlist queueing when sold out.
              </p>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Description <span className="text-coral-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Describe keynotes, agenda highlights, guest speakers, prerequisites, and what attendees will take away..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 bg-cream-50 border border-cream-300 rounded-xl text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20"
              />
              <div className="flex justify-between text-[11px] text-navy-500">
                <span>Minimum 10 characters</span>
                <span>{description.length} characters</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SCHEDULE & VENUE */}
      {currentStep === 2 && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 border border-cream-300">
          <CardHeader className="p-0 pb-2">
            <CardTitle>Step 2: Dates & Venue Logistics</CardTitle>
            <CardDescription>
              Schedule start and end timestamps, choose an on-ground venue or configure a new facility.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Start & End DateTime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Start Date & Time <span className="text-coral-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4 text-navy-400" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  End Date & Time <span className="text-coral-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={<Clock className="w-4 h-4 text-navy-400" />}
                />
              </div>
            </div>

            {/* Venue Dropdown & Add Button */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Venue Location
                </label>
                <button
                  type="button"
                  onClick={() => setIsVenueModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-coral-600 hover:text-coral-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Venue</span>
                </button>
              </div>

              {isLoadingVenues ? (
                <div className="p-3 text-xs text-navy-600">Loading registered venues...</div>
              ) : (
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-cream-50 border border-cream-300 rounded-xl text-navy-950 focus:outline-none focus:border-coral-500"
                >
                  <option value="">-- Virtual / Online Event (No Physical Venue) --</option>
                  {venues.map((venue) => {
                    const vid = venue._id || venue.id || '';
                    return (
                      <option key={vid} value={vid}>
                        {venue.name} · {venue.address} (Max: {venue.capacity} guests)
                      </option>
                    );
                  })}
                </select>
              )}

              {selectedVenue && (
                <div className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 text-xs space-y-1">
                  <div className="font-bold text-navy-950 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-coral-500" />
                    <span>{selectedVenue.name}</span>
                  </div>
                  <p className="text-navy-600 text-[11px]">{selectedVenue.address}</p>
                  {selectedVenue.facilities && selectedVenue.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedVenue.facilities.map((fac, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-cream-200 text-navy-800 text-[10px] font-semibold">
                          {fac}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PRICING & MEDIA */}
      {currentStep === 3 && (
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 border border-cream-300">
          <CardHeader className="p-0 pb-2">
            <CardTitle>Step 3: Ticketing & Marketing Banner</CardTitle>
            <CardDescription>
              Configure registration fees (Free vs Paid with Razorpay) and upload a high-impact cover banner.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {/* Free vs Paid Toggle */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Ticket Pricing Model
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaid(false);
                    setTicketPrice(0);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    !isPaid
                      ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                      : 'bg-cream-100 text-navy-900 border-cream-300 hover:bg-cream-200'
                  }`}
                >
                  <div className="font-black text-sm">Free Admission</div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Instant confirmation with cryptographically signed QR code ticket pass.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isPaid
                      ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                      : 'bg-cream-100 text-navy-900 border-cream-300 hover:bg-cream-200'
                  }`}
                >
                  <div className="font-black text-sm flex items-center justify-between">
                    <span>Paid Ticket</span>
                    <Badge variant="coral" size="sm">
                      Razorpay
                    </Badge>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Integrated test payments with HMAC SHA-256 signature verification.
                  </p>
                </button>
              </div>

              {isPaid && (
                <div className="pt-2 space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Ticket Price (INR ₹) <span className="text-coral-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 499"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                  />
                </div>
              )}
            </div>

            {/* Event Banner Image Upload */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Event Banner Image
              </label>

              {bannerError && (
                <p className="text-xs text-rose-600 font-semibold">{bannerError}</p>
              )}

              <div className="rounded-2xl border-2 border-dashed border-cream-300 p-6 text-center bg-cream-100/50 space-y-4">
                {bannerPreview ? (
                  <div className="space-y-3">
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="w-full h-48 object-cover rounded-xl shadow-xs border border-cream-300"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs font-semibold text-navy-700">
                        {bannerFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                        }}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-navy-950">
                      Upload promotional event banner
                    </p>
                    <p className="text-[11px] text-navy-500">
                      PNG, JPG, or WEBP up to 5MB (16:9 ratio recommended)
                    </p>
                  </div>
                )}

                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBannerSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-950 text-cream-100 hover:bg-navy-900 cursor-pointer shadow-xs transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{bannerPreview ? 'Change Banner' : 'Select Banner'}</span>
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: REVIEW & PUBLISH */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card variant="cream" className="overflow-hidden border border-cream-300 shadow-md">
            {/* Banner preview or gradient */}
            {bannerPreview ? (
              <div className="w-full h-52 sm:h-64 relative overflow-hidden bg-navy-950">
                <img
                  src={bannerPreview}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <Badge variant="coral" size="sm" className="mb-2">
                    {category}
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black">{title}</h2>
                </div>
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-r from-navy-950 via-navy-900 to-coral-600 p-6 flex flex-col justify-end text-white">
                <Badge variant="coral" size="sm" className="mb-2 w-max">
                  {category}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black">{title}</h2>
              </div>
            )}

            <CardContent className="p-6 space-y-6">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-cream-100 border border-cream-300 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                    Schedule
                  </span>
                  <p className="font-semibold text-navy-950 mt-0.5">
                    {new Date(startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] text-navy-600">
                    {new Date(startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                    Venue
                  </span>
                  <p className="font-semibold text-navy-950 mt-0.5 truncate">
                    {selectedVenue?.name || 'Online / Virtual'}
                  </p>
                  <p className="text-[11px] text-navy-600 truncate">
                    {selectedVenue?.address || 'Link will be sent'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                    Capacity
                  </span>
                  <p className="font-semibold text-navy-950 mt-0.5">{capacity} Attendees</p>
                  <p className="text-[11px] text-navy-600">Atomic hold active</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                    Ticket Price
                  </span>
                  <p className="font-bold text-navy-950 mt-0.5">
                    {isPaid ? `₹${ticketPrice.toLocaleString('en-IN')}` : 'FREE'}
                  </p>
                  <p className="text-[11px] text-navy-600">
                    {isPaid ? 'Razorpay test checkout' : 'Instant QR ticket'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-800">
                  Event Overview
                </h4>
                <p className="text-xs sm:text-sm text-navy-700 leading-relaxed whitespace-pre-line bg-cream-50 p-4 rounded-xl border border-cream-200">
                  {description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-xl bg-navy-950 text-cream-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold block text-white">Ready to publish?</span>
                  <span className="text-cream-400 text-[11px]">
                    Save as draft to tweak later, or submit immediately for Super Admin approval.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="cream"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleSubmit(false)}
                    leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                    className="flex-1 sm:flex-none"
                  >
                    Save as Draft
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    onClick={() => handleSubmit(true)}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="flex-1 sm:flex-none"
                  >
                    Save & Submit for Approval
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons (Back & Next) */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Previous Step
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Continue to Step {currentStep + 1}
          </Button>
        )}
      </div>

      {/* Inline Create Venue Modal */}
      <Modal
        isOpen={isVenueModalOpen}
        onClose={() => setIsVenueModalOpen(false)}
        title="Add New Venue Facility"
        description="Register a new physical venue and its seating capacity into the platform."
      >
        <form onSubmit={handleCreateVenue} className="space-y-4 pt-2">
          {venueModalError && (
            <p className="text-xs text-rose-600 font-semibold">{venueModalError}</p>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Venue Name <span className="text-coral-500">*</span>
            </label>
            <Input
              placeholder="e.g. Innovation Auditorium, Hall B"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Physical Address <span className="text-coral-500">*</span>
            </label>
            <Input
              placeholder="e.g. 104 Tech Boulevard, Koramangala, Bengaluru"
              value={newVenueAddress}
              onChange={(e) => setNewVenueAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Max Seating Capacity
            </label>
            <Input
              type="number"
              min={1}
              value={newVenueCapacity}
              onChange={(e) => setNewVenueCapacity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Facilities (Comma Separated)
            </label>
            <Input
              placeholder="High-speed WiFi, Projector, Sound System, Parking"
              value={newVenueFacilities}
              onChange={(e) => setNewVenueFacilities(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVenueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isCreatingVenue}
              isLoading={isCreatingVenue}
            >
              Save Venue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CreateEvent;
