import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, RotateCcw, Home, Compass } from 'lucide-react';

export const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const errorMsg = searchParams.get('error') || 'Payment authorization was rejected or timed out by the gateway.';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <Card variant="cream" className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border border-cream-300 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge variant="danger" size="md">
            Payment Failed
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Checkout Incomplete
          </h1>
          <p className="text-xs sm:text-sm text-navy-600">
            {errorMsg}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-cream-100 border border-cream-200 text-left text-xs text-navy-700 space-y-1">
          <p className="font-bold">Next Steps:</p>
          <p className="text-[11px] text-navy-600">
            • No funds were deducted from your bank or card.
          </p>
          <p className="text-[11px] text-navy-600">
            • You can retry checkout or use an alternate payment method.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {eventId ? (
            <Link to={`/checkout/${eventId}`}>
              <Button variant="primary" size="lg" className="w-full" rightIcon={<RotateCcw className="w-4 h-4" />}>
                Retry Checkout
              </Button>
            </Link>
          ) : (
            <Link to="/search">
              <Button variant="primary" size="lg" className="w-full" rightIcon={<Compass className="w-4 h-4" />}>
                Browse Events
              </Button>
            </Link>
          )}

          <Link to="/">
            <Button variant="outline" size="sm" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailure;
