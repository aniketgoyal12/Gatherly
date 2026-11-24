import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  Users,
  CheckCircle2,
  DollarSign,
  Star,
  Percent,
  Smile,
  Meh,
  Frown,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  eventId: string;
  eventTitle: string;
  capacity: number;
  totalRegistrations: number;
  checkedInAttendance: number;
  noShowCount: number;
  noShowPercentage: number;
  financials: {
    grossRevenue: number;
    actualExpenses: number;
    netProfit: number;
    plannedBudget: number;
  };
}

interface ReviewItem {
  _id?: string;
  id?: string;
  rating: number;
  review: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  userId?: {
    name?: string;
  };
  createdAt?: string;
}

interface FeedbackData {
  reviews: ReviewItem[];
  totalReviews: number;
  averageRating: number;
}

export const EventAnalytics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId') || '';

  // Event Selector State
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Failed to load events for analytics', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch Analytics & Feedback for Selected Event
  const fetchEventAnalytics = useCallback(async () => {
    if (!selectedEventId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch analytics and feedback
      const [analyticsRes, feedbackRes] = await Promise.all([
        apiClient.get(`/events/${selectedEventId}/analytics`),
        apiClient.get(`/feedback/event/${selectedEventId}`),
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setFeedback(feedbackRes.data?.data || null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load event analytics');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEventAnalytics();
  }, [fetchEventAnalytics]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  const selectedEvent = events.find((ev) => (ev._id || ev.id) === selectedEventId);

  // KPI Computations
  const totalRegistrations = analytics?.totalRegistrations || 0;
  const checkedIn = analytics?.checkedInAttendance || 0;
  const noShow = analytics?.noShowCount || 0;
  const turnoutRate =
    totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0;
  const grossRevenue = analytics?.financials?.grossRevenue || 0;
  const plannedBudget = analytics?.financials?.plannedBudget || 0;
  const actualExpenses = analytics?.financials?.actualExpenses || 0;
  const netProfit = analytics?.financials?.netProfit || (grossRevenue - actualExpenses);
  const avgRating = feedback?.averageRating || 0;
  const totalReviews = feedback?.totalReviews || 0;

  // Chart 1: Attendance Donut (Checked In vs No Show)
  const attendanceChartData = [
    { name: 'Checked In', value: checkedIn, color: '#10b981' }, // Emerald
    { name: 'No Show / Pending', value: Math.max(0, noShow), color: '#0f172a' }, // Deep Navy
  ];

  // Chart 2: Financial Comparison Bar Chart
  const financialChartData = [
    {
      name: 'Planned Budget',
      amount: plannedBudget,
      fill: '#0f172a', // Deep Navy
    },
    {
      name: 'Actual Spent',
      amount: actualExpenses,
      fill: '#f97316', // Coral
    },
    {
      name: 'Gross Revenue',
      amount: grossRevenue,
      fill: '#10b981', // Emerald
    },
    {
      name: 'Net Profit',
      amount: Math.max(0, netProfit),
      fill: '#38bdf8', // Sky Blue
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Event Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-coral-500" />
            <span>Turnout Intelligence & Review Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Event Turnout & Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Real-time gate check-in conversion, gross ticket revenue vs expenses, and attendee sentiment analysis.
          </p>
        </div>

        {/* Event Selector & Refresh */}
        <div className="flex items-center gap-2.5">
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

          <button
            onClick={() => fetchEventAnalytics()}
            title="Refresh analytics data"
            className="p-2 rounded-xl border border-cream-300 text-navy-700 hover:bg-cream-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <Card variant="subtle" className="p-8 text-center space-y-3 border-dashed border-2 border-cream-300">
          <p className="text-xs font-semibold text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchEventAnalytics()}>
            Retry
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-navy-600">Calculating turnout analytics and financial metrics...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* 5 Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Total Registrations */}
            <Card variant="cream" className="p-4 border border-cream-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block">
                Total Bookings
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-navy-950">{totalRegistrations}</span>
                <Users className="w-4 h-4 text-navy-500" />
              </div>
              <p className="text-[10px] text-navy-500 mt-1">
                {analytics?.capacity ? `${Math.round((totalRegistrations / analytics.capacity) * 100)}% cap` : 'Atomic hold'}
              </p>
            </Card>

            {/* KPI 2: Checked-In */}
            <Card variant="cream" className="p-4 border border-cream-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Checked-In
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700">{checkedIn}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">QR gate verified</p>
            </Card>

            {/* KPI 3: Turnout Rate % */}
            <Card variant="cream" className="p-4 border border-cream-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-coral-600 block">
                Turnout Rate
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-coral-600">{turnoutRate}%</span>
                <Percent className="w-4 h-4 text-coral-500" />
              </div>
              <p className="text-[10px] text-coral-500 mt-1">
                {analytics?.noShowPercentage || 0}% no-show
              </p>
            </Card>

            {/* KPI 4: Gross Revenue */}
            <Card variant="cream" className="p-4 border border-cream-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block">
                Gross Revenue
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-navy-950">
                  ₹{grossRevenue.toLocaleString('en-IN')}
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] text-navy-500 mt-1">
                Profit: ₹{netProfit.toLocaleString('en-IN')}
              </p>
            </Card>

            {/* KPI 5: Average Rating */}
            <Card variant="cream" className="p-4 border border-cream-300 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Rating & Reviews
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700 flex items-center gap-1">
                  <span>{avgRating}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                </span>
                <span className="text-xs text-navy-500 font-bold">/ 5.0</span>
              </div>
              <p className="text-[10px] text-amber-600 mt-1">{totalReviews} attendee ratings</p>
            </Card>
          </div>

          {/* Interactive Visualizations: Attendance Pie + Financials Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart 1: Turnout vs No-Show (Donut / Pie) (5 Cols) */}
            <Card variant="cream" className="lg:col-span-5 p-6 border border-cream-300 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-950">Attendance vs No-Show Ratio</h3>
                  <p className="text-[11px] text-navy-500">Gate ticket scan conversion</p>
                </div>
                <Badge variant="navy" size="sm">
                  {turnoutRate}% Turnout
                </Badge>
              </div>

              {totalRegistrations === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-navy-500">
                  No ticket registrations yet to plot attendance.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                      >
                        {attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [
                          `${val ?? 0} Attendees (${totalRegistrations > 0 ? Math.round(((Number(val) || 0) / totalRegistrations) * 100) : 0}%)`,
                          'Volume',
                        ]}
                        contentStyle={{
                          backgroundColor: '#070d18',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Financial Flow Comparison Bar Chart (7 Cols) */}
            <Card variant="cream" className="lg:col-span-7 p-6 border border-cream-300 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-950">Financial Performance Overview</h3>
                  <p className="text-[11px] text-navy-500">
                    Planned budget vs actual logged costs vs ticket sales
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Net: ₹{netProfit.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialChartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2d9c8' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                      axisLine={{ stroke: '#e2d9c8' }}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [`₹${Number(val ?? 0).toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: '#070d18',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {financialChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Attendee Feedback & Sentiment Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Attendee Reviews & Sentiment Stream</span>
                </h3>
                <p className="text-xs text-navy-600">
                  Post-event ratings collected from verified checked-in attendees.
                </p>
              </div>
              <Badge variant="coral" size="sm">
                {totalReviews} Total Reviews
              </Badge>
            </div>

            {!feedback?.reviews || feedback.reviews.length === 0 ? (
              <Card variant="subtle" className="p-8 text-center space-y-2 border-dashed border-2 border-cream-300">
                <p className="text-xs font-semibold text-navy-800">No reviews submitted yet.</p>
                <p className="text-[11px] text-navy-500">
                  Attendees will receive prompt notifications to review this event once marked as completed.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedback.reviews.map((rev, idx) => {
                  const sentiment = rev.sentiment || 'neutral';
                  const sentimentIcon =
                    sentiment === 'positive' ? (
                      <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    ) : sentiment === 'negative' ? (
                      <Frown className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Meh className="w-3.5 h-3.5 text-amber-600" />
                    );

                  return (
                    <Card key={idx} variant="cream" className="p-4 border border-cream-300 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-navy-950 text-xs">
                            {rev.userId?.name || 'Verified Attendee'}
                          </h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-cream-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sentiment === 'positive'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sentiment === 'negative'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sentimentIcon}
                          <span>{sentiment}</span>
                        </span>
                      </div>

                      <p className="text-xs text-navy-700 leading-relaxed italic bg-cream-100/60 p-2.5 rounded-xl border border-cream-200">
                        "{rev.review || 'No detailed written review provided.'}"
                      </p>

                      <div className="text-[10px] text-navy-500 text-right">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAnalytics;
