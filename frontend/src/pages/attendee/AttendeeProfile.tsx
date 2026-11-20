import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Registration, Ticket, ApiResponse } from '@/types';
import {
  User,
  Mail,
  Shield,
  Ticket as TicketIcon,
  Bell,
  LogOut,
  Calendar,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export const AttendeeProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bookingCount, setBookingCount] = useState(0);
  const [activeTicketCount, setActiveTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        const [regRes, ticketRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<{ registrations: Registration[] }>>('/registrations/my'),
          apiClient.get<ApiResponse<{ tickets: Ticket[] }>>('/tickets/my-tickets'),
        ]);

        if (regRes.status === 'fulfilled') {
          const regs = regRes.value.data?.data?.registrations || [];
          setBookingCount(regs.length);
        }

        if (ticketRes.status === 'fulfilled') {
          const tickets = ticketRes.value.data?.data?.tickets || [];
          const active = tickets.filter((t) => t.ticketStatus === 'valid').length;
          setActiveTicketCount(active);
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const defaultInterests = user?.interests && user.interests.length > 0
    ? user.interests
    : ['Artificial Intelligence', 'Full-Stack Development', 'Cloud Architecture', 'Product Design', 'Hackathons'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Profile Banner Card */}
      <Card variant="cream" className="p-6 sm:p-8 border border-cream-300 shadow-lg rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Initials Badge */}
          <div className="w-20 h-20 rounded-3xl bg-navy-950 text-coral-400 border-2 border-coral-500/30 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AT'}
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-navy-950 tracking-tight">
                {user?.name || 'Attendee'}
              </h1>
              <Badge variant="coral" size="sm">
                {(user?.role || 'attendee').toUpperCase()}
              </Badge>
              <Badge variant="success" size="sm" dot>
                {user?.accountStatus || 'ACTIVE'}
              </Badge>
            </div>

            <p className="text-xs text-navy-600 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-navy-400" />
              <span>{user?.email}</span>
            </p>

            <p className="text-xs text-navy-500 leading-relaxed pt-1">
              {user?.bio || 'Gatherly community member exploring conferences, workshops, and tech networking events.'}
            </p>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs border-cream-300 hover:bg-rose-50 hover:border-rose-200"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Activity Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="cream" className="p-5 border border-cream-300 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-coral-50 text-coral-600 border border-coral-200 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">Total Bookings</span>
            <h3 className="text-xl font-black text-navy-950">{bookingCount} Events</h3>
          </div>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">Active Passes</span>
            <h3 className="text-xl font-black text-navy-950">{activeTicketCount} Valid QR</h3>
          </div>
        </Card>

        <Card variant="cream" className="p-5 border border-cream-300 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy-100 text-navy-950 border border-navy-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">Pass Security</span>
            <h3 className="text-xl font-black text-navy-950">SHA-256 Validated</h3>
          </div>
        </Card>
      </div>

      {/* Topics & Interests */}
      <div className="p-6 rounded-3xl bg-cream-50 border border-cream-300 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-coral-500" />
            <span>Event Interests & Topics</span>
          </h3>
          <span className="text-[10px] font-bold uppercase text-navy-400">Personalized Feed</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {defaultInterests.map((interest, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-200 text-navy-900 border border-cream-300 hover:border-coral-500 transition-colors"
            >
              #{interest}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Access Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/my-tickets" className="block group">
          <div className="p-6 rounded-3xl bg-cream-50 border border-cream-300 group-hover:border-coral-500 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center border border-coral-200">
                <TicketIcon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-navy-400 group-hover:text-coral-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-bold text-navy-950">My Tickets Wallet</h4>
            <p className="text-xs text-navy-600">Access your digital QR passes, print passes, and submit reviews.</p>
          </div>
        </Link>

        <Link to="/notifications" className="block group">
          <div className="p-6 rounded-3xl bg-cream-50 border border-cream-300 group-hover:border-coral-500 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-950 flex items-center justify-center border border-navy-300">
                <Bell className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-navy-400 group-hover:text-coral-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-bold text-navy-950">Notifications Center</h4>
            <p className="text-xs text-navy-600">View real-time event reminders, booking confirmations, and alert pings.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AttendeeProfile;
