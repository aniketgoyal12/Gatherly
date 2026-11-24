import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Verification token is missing from the URL.');
        return;
      }

      try {
        await apiClient.post('/auth/verify-email', { token });
        setStatus('success');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setStatus('error');
        setErrorMessage(axiosErr.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    triggerVerification();
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <Card variant="cream" className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border border-cream-300 rounded-3xl">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-navy-950">Verifying Email Address...</h2>
            <p className="text-xs text-navy-600">Validating your cryptographic confirmation token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Email Verified
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
                Account Confirmed!
              </h1>
              <p className="text-xs sm:text-sm text-navy-600">
                Your email has been verified. You now enjoy full access to book tickets, receive live updates, and manage events.
              </p>
            </div>
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Verification Failed
              </span>
              <h1 className="text-2xl font-black text-navy-950 tracking-tight">
                Invalid or Expired Link
              </h1>
              <p className="text-xs text-navy-600">{errorMessage}</p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="md" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
