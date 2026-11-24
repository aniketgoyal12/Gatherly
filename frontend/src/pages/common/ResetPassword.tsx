import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        resetToken: token,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Password reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <Card variant="cream" className="max-w-md w-full p-8 space-y-6 shadow-xl border border-cream-300 rounded-3xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">Set New Password</h1>
          <p className="text-xs text-navy-600">Enter your new secure password below to regain account access.</p>
        </div>

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-800">Password successfully updated!</p>
            <p className="text-[11px] text-navy-600">Redirecting to sign-in terminal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <Input
              type="password"
              label="New Password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-semibold text-navy-600 hover:text-navy-950">
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
