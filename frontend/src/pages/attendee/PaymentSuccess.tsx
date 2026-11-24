import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Ticket, ArrowRight, Home } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || 'pay_confirmed';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <Card variant="cream" className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border border-cream-300 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge variant="success" size="md">
            Payment Verified (200 OK)
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Transaction Successful!
          </h1>
          <p className="text-xs sm:text-sm text-navy-600">
            Your payment has been securely confirmed. Your digital gate pass has been issued with an HMAC SHA-256 cryptographic signature.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-cream-100 border border-cream-200 text-left text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-navy-500 font-sans">Payment Ref:</span>
            <span className="text-navy-950 font-bold">{paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500 font-sans">Gate Entry:</span>
            <span className="text-emerald-700 font-bold">Authorized</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link to="/my-tickets">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<Ticket className="w-4 h-4" />}>
              View Ticket in Wallet
            </Button>
          </Link>

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

export default PaymentSuccess;
