import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  QrCode,
  Camera,
  CameraOff,
  Keyboard,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  AlertCircle,
  Users,
} from 'lucide-react';

interface CheckInOutcome {
  status: 'success' | 'duplicate' | 'invalid';
  title: string;
  message: string;
  ticket?: {
    id?: string;
    ticketStatus?: string;
    checkedInAt?: string;
  };
  liveTotalCheckedIn?: number;
  duplicateInfo?: {
    issue?: string;
    checkedInAt?: string;
  };
}

export const QrScanner: React.FC = () => {
  const { eventId: pathEventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeEventId = pathEventId || searchParams.get('eventId') || '';

  // Events list & Selected Event
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEventId);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual Input State
  const [manualToken, setManualToken] = useState('');
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Result Overlay State
  const [resultOutcome, setResultOutcome] = useState<CheckInOutcome | null>(null);

  // 1. Fetch Assigned Shifts for Staff (or events for selection)
  useEffect(() => {
    const fetchAssigned = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await apiClient.get('/tickets/staff/assigned-events');
        const list: Event[] = res.data?.data?.events || [];
        setEvents(list);

        if (!selectedEventId && list.length > 0) {
          const firstId = (list[0]._id || list[0].id) as string;
          setSelectedEventId(firstId);
        }
      } catch (err) {
        console.error('Failed to load assigned shifts', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchAssigned();
  }, []);

  useEffect(() => {
    if (pathEventId && pathEventId !== selectedEventId) {
      setSelectedEventId(pathEventId);
    }
  }, [pathEventId]);

  // Handle Event Change
  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    navigate(`/staff/scanner/${id}`, { replace: true });
  };

  // 2. Process Token Check-In
  const processCheckInToken = async (token: string) => {
    if (!selectedEventId) {
      alert('Please select an assigned event before verifying tickets.');
      return;
    }

    try {
      const res = await apiClient.post('/tickets/check-in', {
        qrToken: token.trim(),
        eventId: selectedEventId,
      });

      const data = res.data?.data;
      setResultOutcome({
        status: 'success',
        title: 'ACCESS GRANTED',
        message: 'Ticket verified and admission recorded.',
        ticket: data?.ticket,
        liveTotalCheckedIn: data?.liveTotalCheckedIn,
      });
    } catch (err: unknown) {
      const e = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            error?: { details?: Array<{ issue?: string; checkedInAt?: string }> };
            data?: { details?: Array<{ issue?: string; checkedInAt?: string }> };
          };
        };
      };

      const statusCode = e.response?.status;
      if (statusCode === 409) {
        const details = e.response?.data?.error?.details?.[0] || e.response?.data?.data?.details?.[0];
        setResultOutcome({
          status: 'duplicate',
          title: 'TICKET ALREADY USED',
          message: e.response?.data?.message || 'This ticket pass was checked in earlier.',
          duplicateInfo: details,
        });
      } else {
        setResultOutcome({
          status: 'invalid',
          title: 'ACCESS DENIED',
          message: e.response?.data?.message || 'Invalid QR code or ticket is for a different event.',
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
        () => {}
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error('Camera startup error', err);
      const e = err as { message?: string };
      setCameraError(
        e.message || 'Unable to access camera. Please allow camera permissions or use manual code entry.'
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
      setManualError('Please enter a ticket pass token.');
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
        <span className="text-[11px] font-mono text-navy-400">Gate Duty Station</span>
      </div>

      {/* Event Header & Selector */}
      <Card variant="cream" className="p-5 border border-cream-300 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="coral" size="sm">
              Current Shift
            </Badge>
          </div>
          {selectedEvent && (
            <span className="text-xs font-mono font-bold text-navy-700">
              {new Date(selectedEvent.startDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {events.length > 1 ? (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-navy-600 mb-1">
              Select Assigned Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs font-bold text-navy-950 focus:ring-2 focus:ring-coral-500 focus:outline-none"
            >
              {events.map((ev) => {
                const eid = (ev._id || ev.id) as string;
                return (
                  <option key={eid} value={eid}>
                    {ev.title}
                  </option>
                );
              })}
            </select>
          </div>
        ) : selectedEvent ? (
          <div>
            <h2 className="text-lg font-black text-navy-950">{selectedEvent.title}</h2>
            <p className="text-xs text-navy-600">Capacity: {selectedEvent.capacity} attendees</p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            No active shift selected. Please select an event from Assigned Shifts.
          </div>
        )}
      </Card>

      {/* Main Scanner Card */}
      <Card variant="cream" className="p-6 border border-cream-300 rounded-3xl shadow-xl space-y-5 text-center">
        <div>
          <h1 className="text-xl font-black text-navy-950 tracking-tight flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-coral-500" />
            <span>QR Camera Scanner</span>
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Align attendee QR code inside viewfinder for instant HMAC verification.
          </p>
        </div>

        {/* Viewfinder Target */}
        <div className="relative rounded-2xl overflow-hidden bg-navy-950 min-h-[280px] flex items-center justify-center border-2 border-dashed border-cream-300 shadow-inner">
          <div id="qr-reader" className="w-full max-w-[280px] overflow-hidden" />

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/80 p-6 text-white space-y-3">
              <Camera className="w-12 h-12 text-cream-300 stroke-1" />
              <p className="text-xs text-cream-200 max-w-xs leading-relaxed">
                Camera is idle. Click below to start live video stream.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={startScanner}
                leftIcon={<Camera className="w-4 h-4" />}
                disabled={!selectedEventId}
              >
                Start Camera
              </Button>
            </div>
          )}
        </div>

        {/* Camera Control Action */}
        {isScanning && (
          <Button
            variant="outline"
            size="sm"
            onClick={stopScanner}
            leftIcon={<CameraOff className="w-4 h-4" />}
            className="w-full"
          >
            Pause Camera
          </Button>
        )}

        {cameraError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Fallback Manual Code Entry */}
        <div className="pt-4 border-t border-cream-200 text-left space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy-800">
            <Keyboard className="w-4 h-4 text-coral-500" />
            <span>Manual Code Verification</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter GAT- token or ticket hash"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                disabled={isVerifyingManual}
              />
            </div>
            <Button
              type="submit"
              variant="navy"
              size="md"
              isLoading={isVerifyingManual}
              disabled={!selectedEventId}
            >
              Verify
            </Button>
          </form>

          {manualError && (
            <p className="text-xs text-rose-600 font-semibold">{manualError}</p>
          )}
        </div>
      </Card>

      {/* INLINE VERIFICATION RESULT MODAL OVERLAY */}
      {resultOutcome && (
        <Modal
          isOpen={true}
          onClose={() => {
            setResultOutcome(null);
            setManualToken('');
          }}
          title="Gate Verification Outcome"
        >
          <div className="text-center space-y-5 p-2">
            {resultOutcome.status === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <Badge variant="success" size="md" className="mb-1">
                    Verified Gate Pass
                  </Badge>
                  <h2 className="text-2xl font-black text-emerald-700 tracking-tight">
                    {resultOutcome.title}
                  </h2>
                  <p className="text-xs text-navy-600">{resultOutcome.message}</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-navy-600">Checked In At:</span>
                    <span className="font-mono font-bold text-navy-950">
                      {resultOutcome.ticket?.checkedInAt
                        ? new Date(resultOutcome.ticket.checkedInAt).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  {resultOutcome.liveTotalCheckedIn !== undefined && (
                    <div className="flex justify-between border-t border-emerald-200 pt-1">
                      <span className="text-navy-600">Live Event Attendance:</span>
                      <span className="font-bold text-emerald-800">
                        {resultOutcome.liveTotalCheckedIn} attendees inside
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {resultOutcome.status === 'duplicate' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-500 text-amber-600 flex items-center justify-center mx-auto shadow-md">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <Badge variant="warning" size="md" className="mb-1">
                    Conflict 409
                  </Badge>
                  <h2 className="text-2xl font-black text-amber-700 tracking-tight">
                    {resultOutcome.title}
                  </h2>
                  <p className="text-xs text-navy-600">{resultOutcome.message}</p>
                </div>

                {resultOutcome.duplicateInfo && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-left">
                    <p className="font-bold text-amber-950">Prior Check-in Detected:</p>
                    <p className="text-amber-800 text-[11px]">
                      {resultOutcome.duplicateInfo.issue || 'Ticket already marked checked_in in ledger.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {resultOutcome.status === 'invalid' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 border-4 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                  <XCircle className="w-10 h-10" />
                </div>
                <div>
                  <Badge variant="danger" size="md" className="mb-1">
                    Entry Denied
                  </Badge>
                  <h2 className="text-2xl font-black text-rose-700 tracking-tight">
                    {resultOutcome.title}
                  </h2>
                  <p className="text-xs text-navy-600">{resultOutcome.message}</p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setResultOutcome(null);
                setManualToken('');
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Scan Next Ticket
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QrScanner;
