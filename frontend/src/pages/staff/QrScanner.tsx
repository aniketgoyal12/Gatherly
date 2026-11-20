import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  QrCode,
  Camera,
  CameraOff,
  Keyboard,
  ArrowLeft,
} from 'lucide-react';

export const QrScanner: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlEventId = searchParams.get('eventId') || '';

  // Events list & Selected Event
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual Input State
  const [manualToken, setManualToken] = useState('');
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // 1. Fetch Events for dropdown
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
        console.error('Failed to load events for scanner', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Update URL param when event selector changes
  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  // 2. Process Token (via Scan or Manual Entry)
  const processCheckInToken = async (token: string) => {
    if (!selectedEventId) {
      alert('Please select an event before scanning tickets.');
      return;
    }

    // Stop scanner before navigating away
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner', err);
      }
    }

    try {
      const res = await apiClient.post('/tickets/check-in', {
        qrToken: token.trim(),
        eventId: selectedEventId,
      });

      // 200 Success -> Navigate to result
      navigate('/staff/result', {
        state: {
          status: 'success',
          eventId: selectedEventId,
          data: res.data?.data,
          token: token.trim(),
        },
      });
    } catch (err: unknown) {
      const e = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            data?: unknown;
            error?: { details?: unknown };
          };
        };
      };

      const statusCode = e.response?.status;
      if (statusCode === 409) {
        // 409 Duplicate Checked In
        navigate('/staff/result', {
          state: {
            status: 'duplicate',
            eventId: selectedEventId,
            error: e.response?.data?.message || 'Ticket Already Checked In',
            details: e.response?.data?.error?.details || e.response?.data?.data,
            token: token.trim(),
          },
        });
      } else {
        // 400 / 404 Invalid or wrong event
        navigate('/staff/result', {
          state: {
            status: 'invalid',
            eventId: selectedEventId,
            error: e.response?.data?.message || 'Invalid Ticket / Access Denied',
            token: token.trim(),
          },
        });
      }
    }
  };

  // 3. Start Camera
  const startScanner = async () => {
    setCameraError(null);
    try {
      const qrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (decodedText) {
            processCheckInToken(decodedText);
          }
        },
        () => {
          // Frame parse error - ignore
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error('Camera startup error', err);
      const e = err as { message?: string };
      setCameraError(
        e.message || 'Unable to access camera. Please check browser permissions or use manual code entry.'
      );
      setIsScanning(false);
    }
  };

  // 4. Stop Camera
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  // Manual Form Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setManualError('Please enter a ticket code or token.');
      return;
    }
    setManualError(null);
    setIsVerifyingManual(true);
    await processCheckInToken(manualToken);
    setIsVerifyingManual(false);
  };

  const selectedEvent = events.find((ev) => (ev._id || ev.id) === selectedEventId);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/assigned-events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 hover:text-coral-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Assigned Shifts</span>
        </Link>
        <Badge variant="coral" size="sm">
          Gate Scanner Active
        </Badge>
      </div>

      {/* Event Header & Selector Card */}
      <Card variant="cream" className="p-5 border border-cream-300 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600">
            Current Verification Gate
          </span>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
            Live Gate Duty
          </span>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
        >
          {events.map((ev) => {
            const eid = ev._id || ev.id || '';
            return (
              <option key={eid} value={eid}>
                {ev.title} ({ev.category})
              </option>
            );
          })}
        </select>

        {selectedEvent && (
          <p className="text-[11px] text-navy-600">
            Capacity: <strong>{selectedEvent.capacity}</strong> · Scheduled for{' '}
            {new Date(selectedEvent.startDate).toLocaleDateString()}
          </p>
        )}
      </Card>

      {/* Camera QR Viewfinder Card (Navy/Cream/Coral 60:30:10) */}
      <Card variant="navy" className="overflow-hidden border border-navy-800 shadow-xl relative text-cream-50">
        <div className="p-4 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-xs font-bold tracking-wider uppercase text-white">
              Optical QR Target Reticle
            </h3>
          </div>

          <button
            onClick={isScanning ? stopScanner : startScanner}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              isScanning
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-coral-500 hover:bg-coral-600 text-white'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative min-h-[320px] bg-navy-950 flex items-center justify-center p-4">
          {/* HTML5 QR Container */}
          <div id="qr-reader" className="w-full max-w-[320px] rounded-2xl overflow-hidden" />

          {/* Fallback Display when Camera is Inactive */}
          {!isScanning && (
            <div className="text-center space-y-3 p-6 z-10">
              <div className="w-16 h-16 rounded-3xl bg-navy-900 border border-navy-800 text-coral-400 flex items-center justify-center mx-auto shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Camera Viewfinder Paused</h4>
                <p className="text-xs text-cream-400 mt-1 max-w-xs mx-auto">
                  Click "Start Camera" above to scan mobile tickets or use manual code verification below.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={startScanner}>
                Launch Camera
              </Button>
            </div>
          )}

          {/* Corner Reticle Accents */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-8 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-dashed border-coral-500/60 rounded-3xl relative">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-coral-500 rounded-tl-xl animate-pulse" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-coral-500 rounded-tr-xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-coral-500 rounded-bl-xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-coral-500 rounded-br-xl animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs font-semibold text-center">
            {cameraError}
          </div>
        )}
      </Card>

      {/* Manual Token Input Card (Fallback) */}
      <Card variant="cream" className="p-5 border border-cream-300 space-y-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-coral-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy-800">
            Manual Ticket Token Verification
          </h4>
        </div>
        <p className="text-xs text-navy-600">
          If attendee mobile screen is damaged, type or paste the printed 64-character token or ticket code.
        </p>

        {manualError && (
          <p className="text-xs text-rose-600 font-semibold">{manualError}</p>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <Input
            placeholder="Paste raw QR token string (e.g. gath_...)"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="font-mono text-xs"
          />

          <Button
            type="submit"
            variant="navy"
            size="md"
            disabled={isVerifyingManual || !manualToken.trim()}
            isLoading={isVerifyingManual}
            className="w-full"
          >
            Verify & Check-In Ticket
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default QrScanner;
