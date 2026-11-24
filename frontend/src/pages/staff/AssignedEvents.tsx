import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Calendar,
  QrCode,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';

interface StaffEvent extends Event {
  assignedGate?: string | null;
}

export const AssignedEvents: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Strictly fetch assigned shifts for current staff credentials
      const res = await apiClient.get('/tickets/staff/assigned-events');
      const assignedList: StaffEvent[] = res.data?.data?.events || [];
      setEvents(assignedList);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load assigned shifts for gate duty.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gate Access Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Assigned Event Shifts
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Active verification shifts assigned to your credentials. Select an event to launch the live QR camera scanner.
          </p>
        </div>

        <button
          onClick={fetchAssignedEvents}
          title="Refresh Events"
          className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-navy-600">Loading assigned shifts...</p>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-coral-500" />}
          title="No assigned shifts found"
          description="You currently have no event gate assignments. Contact the event organizer to be added to an event shift roster."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            const eid = (event._id || event.id) as string;
            const venueName =
              typeof event.venueId === 'object' && event.venueId?.name
                ? event.venueId.name
                : typeof event.venue === 'object' && event.venue?.name
                ? event.venue.name
                : 'Physical Venue';

            return (
              <Card key={eid} variant="cream" className="border border-cream-300 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                {/* Banner / Header */}
                <div className="h-40 relative bg-navy-950 overflow-hidden">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-end p-5 bg-gradient-to-tr from-navy-950 via-navy-900 to-coral-600 text-white">
                      <span className="text-xs font-bold text-coral-300 uppercase tracking-wider">
                        {event.category}
                      </span>
                      <h3 className="text-base font-black truncate">{event.title}</h3>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {event.assignedGate && (
                      <Badge variant="navy" size="sm">
                        📍 {event.assignedGate}
                      </Badge>
                    )}
                    <Badge variant="coral" size="sm">
                      Gate Station
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-navy-950 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-navy-600 line-clamp-2 mt-1">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-cream-200 text-xs">
                    <div className="flex items-center gap-2 text-navy-800">
                      <Clock className="w-3.5 h-3.5 text-navy-500" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        ·{' '}
                        {new Date(event.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-navy-800">
                      <MapPin className="w-3.5 h-3.5 text-coral-500" />
                      <span className="truncate">{venueName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-navy-800">
                      <Users className="w-3.5 h-3.5 text-navy-500" />
                      <span>Capacity: {event.capacity} total attendees</span>
                    </div>
                  </div>

                  {/* Open Scanner CTA */}
                  <div className="pt-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate(`/staff/scanner/${eid}`)}
                      leftIcon={<QrCode className="w-4 h-4" />}
                      className="w-full shadow-sm"
                    >
                      Launch Scanner Desk
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignedEvents;
