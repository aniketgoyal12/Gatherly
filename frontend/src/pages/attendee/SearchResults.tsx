import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Event, ApiResponse } from '@/types';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ticket,
  X,
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

export const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'All';

  const [query, setQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [page, setPage] = useState(1);

  const [events, setEvents] = useState<Event[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    setQuery(queryParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, categoryParam]);

  const fetchFilteredEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 9,
        status: 'published',
      };

      if (query.trim()) params.search = query.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await apiClient.get<
        ApiResponse<{ events: Event[]; pagination: { total: number; page: number; pages: number } }>
      >('/events', { params });

      const fetchedEvents = res.data?.data?.events || [];
      const pagination = res.data?.data?.pagination;

      // In-memory filter for price (Free vs Paid)
      let filtered = fetchedEvents;
      if (priceFilter === 'Free') {
        filtered = fetchedEvents.filter((e) => !e.ticketPrice || e.ticketPrice === 0);
      } else if (priceFilter === 'Paid') {
        filtered = fetchedEvents.filter((e) => e.ticketPrice && e.ticketPrice > 0);
      }

      setEvents(filtered);
      setTotalPages(pagination?.pages || 1);
      setTotalCount(pagination?.total || filtered.length);
    } catch (err) {
      console.error('Failed to search events:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, priceFilter, page]);

  useEffect(() => {
    fetchFilteredEvents();
  }, [fetchFilteredEvents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
    });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    setSearchParams({
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(cat !== 'All' ? { category: cat } : {}),
    });
  };

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setPriceFilter('All');
    setPage(1);
    setSearchParams({});
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Search Filter Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Explore & Filter Events
            </h1>
            <p className="text-xs sm:text-sm text-navy-600 font-medium">
              Showing {totalCount} matching experiences
            </p>
          </div>

          {(query || selectedCategory !== 'All' || priceFilter !== 'All') && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              leftIcon={<X className="w-3.5 h-3.5" />}
              className="self-start sm:self-auto text-xs"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by keywords, title, tech stack..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-xl text-navy-950 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-500"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-cream-200/70 hover:bg-cream-300 text-navy-800 border border-cream-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Price Filters (All / Free / Paid) */}
          <div className="flex items-center gap-1 p-1 bg-cream-200/80 rounded-xl border border-cream-300">
            {(['All', 'Free', 'Paid'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPriceFilter(p);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  priceFilter === p
                    ? 'bg-coral-500 text-white shadow-xs'
                    : 'text-navy-700 hover:text-navy-950'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
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
        <EmptyState
          icon={<Search className="w-6 h-6 text-coral-600" />}
          title="No Matching Events Found"
          description="Try broadening your search term or selecting a different category filter."
          actionLabel="Reset Filters"
          onAction={clearAllFilters}
          className="my-12"
        />
      ) : (
        <div className="space-y-8">
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
                  {/* Banner Image or Fallback */}
                  <div className="relative w-full h-44 bg-gradient-to-tr from-navy-950 via-navy-900 to-navy-800 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-10 h-10 rounded-xl bg-coral-500/20 text-coral-400 flex items-center justify-center mb-2 border border-coral-500/30">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-cream-200 uppercase tracking-widest">
                          {event.category}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <Badge variant="navy" size="sm">
                        {event.category}
                      </Badge>
                    </div>

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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-cream-300">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-navy-800">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
