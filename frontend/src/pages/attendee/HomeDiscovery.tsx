import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Event, ApiResponse } from '@/types';
import {
  Compass,
  Search,
  Sparkles,
  Calendar,
  MapPin,
  Ticket,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technology',
  'Music & Arts',
  'Business',
  'Workshops',
  'Academic',
  'Social',
];

export const HomeDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { limit: 12, status: 'published' };
        if (selectedCategory !== 'All') {
          params.category = selectedCategory;
        }

        const res = await apiClient.get<ApiResponse<{ events: Event[] }>>('/events', { params });
        setEvents(res.data?.data?.events || []);
      } catch (err) {
        console.error('Failed to fetch published events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 60% Navy Hero Section with Live Search */}
      <section className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-cream-50 pt-16 sm:pt-20 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-navy-800 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-coral-500/30 text-coral-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-coral-400 animate-pulse" />
            <span>Discover Events Powered by Gatherly</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Find Experiences. <span className="text-coral-500">Book Instantly.</span>
            <br />
            Join the Community.
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-cream-300 leading-relaxed font-normal">
            From tech summits and AI hackathons to acoustic concerts and leadership workshops. Verified cryptographic QR passes with zero scalping.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-cream-50 rounded-2xl shadow-xl border border-cream-200"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3 w-full">
              <Search className="w-5 h-5 text-navy-400 shrink-0" />
              <input
                type="text"
                placeholder="Search conferences, workshops, festivals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-navy-950 placeholder-navy-400 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0">
              <span>Find Events</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Category Quick Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-coral-500 text-white shadow-xs'
                    : 'bg-navy-900/90 hover:bg-navy-800 text-cream-200 border border-navy-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Events Grid Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-300">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-coral-500" />
              <span>{selectedCategory === 'All' ? 'Upcoming & Featured Events' : `${selectedCategory} Events`}</span>
            </h2>
            <p className="text-xs sm:text-sm text-navy-600 font-medium">
              Verified registrations with instant cryptographic QR entry
            </p>
          </div>

          <Link to="/search">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Events
            </Button>
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="cream" className="p-4 space-y-4 animate-pulse">
                <div className="w-full h-44 rounded-xl bg-cream-300" />
                <div className="space-y-2">
                  <div className="h-4 bg-cream-300 rounded w-1/3" />
                  <div className="h-5 bg-cream-300 rounded w-4/5" />
                  <div className="h-3 bg-cream-200 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-cream-50 rounded-3xl border border-cream-300 max-w-lg mx-auto p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">No Published Events Found</h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              There are currently no published events in this category. Check back soon or browse all categories.
            </p>
            <Button variant="primary" size="sm" onClick={() => setSelectedCategory('All')}>
              Reset Category Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventId = (event._id || event.id) as string;
              const venue = typeof event.venueId === 'object' && event.venueId !== null ? event.venueId : null;
              const venueName = venue?.name || (event as { locationName?: string }).locationName || 'Gatherly Venue';
              const isFree = !event.ticketPrice || event.ticketPrice === 0;

              return (
                <Card
                  key={eventId}
                  variant="cream"
                  interactive
                  className="flex flex-col overflow-hidden border border-cream-300 hover:border-coral-500/50 transition-all rounded-3xl"
                >
                  {/* Banner Image or Stylized Gradient Fallback */}
                  <div className="relative w-full h-44 sm:h-48 bg-gradient-to-tr from-navy-950 via-navy-900 to-navy-800 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center mb-2 border border-coral-500/30">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-cream-200 uppercase tracking-widest">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {/* Category Floating Pill */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="navy" size="sm">
                        {event.category}
                      </Badge>
                    </div>

                    {/* Price Floating Pill */}
                    <div className="absolute bottom-3 right-3">
                      {isFree ? (
                        <Badge variant="success" size="md">
                          FREE
                        </Badge>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-navy-950 text-white border border-navy-700 shadow-md">
                          ₹{event.ticketPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-navy-950 line-clamp-2 leading-snug">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-navy-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                          <span className="truncate">{venueName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-navy-500">
                          <Users className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                          <span>Capacity: {event.capacity} Attendees</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer CTA */}
                    <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-900">
                        {isFree ? 'Free Admission' : `From ₹${event.ticketPrice}`}
                      </span>

                      <Link to={`/events/${eventId}`}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          View Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeDiscovery;
