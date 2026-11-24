import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { Event, ApiResponse } from '@/types';
import {
  Calendar,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [status, setStatus] = useState<string>('draft');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiClient.get<ApiResponse<{ event: Event }>>(`/events/${id}`);
        const ev = res.data?.data?.event;
        if (ev) {
          setTitle(ev.title);
          setDescription(ev.description);
          setCategory(ev.category);
          setCapacity(ev.capacity);
          setTicketPrice(ev.ticketPrice || 0);
          setStatus(ev.status);

          if (ev.startDate) {
            setStartDate(new Date(ev.startDate).toISOString().slice(0, 16));
          }
          if (ev.endDate) {
            setEndDate(new Date(ev.endDate).toISOString().slice(0, 16));
          }

          if (ev.status !== 'draft' && ev.status !== 'rejected') {
            setErrorMessage(`This event has status '${ev.status}'. Published or completed events cannot be modified directly.`);
          }
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.put(`/events/${id}`, {
        title,
        description,
        category,
        capacity: Number(capacity),
        ticketPrice: Number(ticketPrice),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      setSuccessMessage('Event updated successfully!');
      setTimeout(() => navigate('/organizer/dashboard'), 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(axiosErr.response?.data?.message || 'Failed to update event.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-navy-600">Loading event specifications...</p>
      </div>
    );
  }

  const isEditable = status === 'draft' || status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/organizer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Organizer Dashboard</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Edit Event Blueprint
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Update event scheduling, capacity, and ticketing parameters.
          </p>
        </div>
        <Badge variant={status === 'published' ? 'success' : status === 'rejected' ? 'danger' : 'navy'}>
          Status: {status.toUpperCase()}
        </Badge>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card variant="cream" className="p-6 sm:p-8 border border-cream-300 rounded-3xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditable}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1.5">
              Event Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isEditable}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-950 text-xs focus:ring-2 focus:ring-coral-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!isEditable}
              required
            />

            <Input
              type="number"
              label="Capacity (Max Attendees)"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              disabled={!isEditable}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Date & Time"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!isEditable}
              required
            />

            <Input
              type="datetime-local"
              label="End Date & Time"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!isEditable}
              required
            />
          </div>

          <Input
            type="number"
            label="Ticket Price (₹) (0 for Free)"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(Number(e.target.value))}
            disabled={!isEditable}
            helperText="No platform convenience fee charged to attendees."
          />

          {isEditable && (
            <div className="pt-4 flex gap-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={submitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default EditEvent;
