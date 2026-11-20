import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

interface ResultLocationState {
  status: 'success' | 'duplicate' | 'invalid';
  eventId?: string;
  data?: {
    valid?: boolean;
    ticket?: {
      id?: string;
      ticketStatus?: string;
      checkedInAt?: string;
    };
    liveTotalCheckedIn?: number;
  };
  error?: string;
  details?: Array<{ issue?: string; checkedInAt?: string }> | Record<string, unknown>;
  token?: string;
}

export const CheckInResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as ResultLocationState) || {
    status: 'invalid',
    error: 'No check-in transaction data received.',
  };

  const status = state.status || 'invalid';
  const eventId = state.eventId || '';
  const returnScannerUrl = eventId ? `/staff/scanner?eventId=${eventId}` : '/staff/scanner';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-bold text-navy-600">
          <Link
            to={returnScannerUrl}
            className="inline-flex items-center gap-1.5 hover:text-coral-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Scanner</span>
          </Link>
          <span className="font-mono text-[11px]">Gate Station Verification</span>
        </div>

        {/* 1. SUCCESS CARD: 200 ACCESS GRANTED */}
        {status === 'success' && (
          <Card
            variant="cream"
            className="border-2 border-emerald-500 overflow-hidden shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn"
          >
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <Badge variant="success" size="md" dot className="mb-2">
                  Verified SHA-256 Gate Pass
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                  ACCESS GRANTED
                </h1>
                <p className="text-xs text-navy-600 mt-1">
                  Ticket confirmed and gate entry recorded atomically in platform ledger.
                </p>
              </div>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-left space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                <span className="text-navy-600 font-semibold">Verification Status</span>
                <span className="font-bold text-emerald-800 uppercase">Checked In Now</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-navy-600 font-semibold">Timestamp</span>
                <span className="font-mono text-navy-950">
                  {state.data?.ticket?.checkedInAt
                    ? new Date(state.data.ticket.checkedInAt).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </span>
              </div>

              {state.data?.liveTotalCheckedIn !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-600 font-semibold">Total Event Gate Count</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {state.data.liveTotalCheckedIn} Attendees
                  </span>
                </div>
              )}
            </div>

            {/* Next Action Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(returnScannerUrl)}
              leftIcon={<QrCode className="w-5 h-5" />}
              className="w-full shadow-lg text-base py-3.5"
            >
              Scan Next Attendee
            </Button>
          </Card>
        )}

        {/* 2. DUPLICATE CARD: 409 ALREADY CHECKED IN */}
        {status === 'duplicate' && (
          <Card
            variant="cream"
            className="border-2 border-amber-500 overflow-hidden shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn"
          >
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-500 text-amber-600 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <AlertTriangle className="w-12 h-12" />
              </div>

              <div>
                <Badge variant="warning" size="md" dot className="mb-2">
                  Potential Pass Duplication
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight">
                  ALREADY CHECKED IN
                </h1>
                <p className="text-xs text-navy-700 mt-1">
                  Warning: This cryptographic QR token was previously scanned and verified at a gate station.
                </p>
              </div>
            </div>

            {/* Duplicate Details Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 pb-2 border-b border-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Duplicate Scan Detected</span>
              </div>
              <p className="text-navy-700">
                {state.error || 'This ticket was already checked in previously.'}
              </p>
              {state.token && (
                <p className="text-[10px] text-navy-500 font-mono truncate">
                  Token: {state.token}
                </p>
              )}
            </div>

            {/* Next Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(returnScannerUrl)}
                leftIcon={<QrCode className="w-5 h-5" />}
                className="w-full shadow-lg text-base py-3.5 bg-amber-600 hover:bg-amber-700 border-amber-700"
              >
                Scan Next Attendee
              </Button>

              <Link to="/staff/assigned-events" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Shifts
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* 3. INVALID CARD: 400 / 404 INVALID TICKET / ACCESS DENIED */}
        {status === 'invalid' && (
          <Card
            variant="cream"
            className="border-2 border-rose-500 overflow-hidden shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn"
          >
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <XCircle className="w-12 h-12" />
              </div>

              <div>
                <Badge variant="danger" size="md" className="mb-2">
                  Gate Security Rejection
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-black text-rose-700 tracking-tight">
                  ACCESS DENIED
                </h1>
                <p className="text-xs text-navy-700 mt-1">
                  Ticket code is invalid, cancelled, forged, or belongs to a different event.
                </p>
              </div>
            </div>

            {/* Rejection Details */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-left space-y-1.5">
              <span className="font-bold text-rose-950 block">Rejection Reason:</span>
              <p className="text-rose-800 leading-relaxed font-semibold">
                {state.error || 'The presented QR code does not match any valid issued ticket for this event.'}
              </p>
            </div>

            {/* Next Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(returnScannerUrl)}
                leftIcon={<QrCode className="w-5 h-5" />}
                className="w-full shadow-lg text-base py-3.5 bg-rose-600 hover:bg-rose-700 border-rose-700"
              >
                Scan Next Attendee
              </Button>

              <Link to="/staff/assigned-events" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Shifts
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CheckInResult;
