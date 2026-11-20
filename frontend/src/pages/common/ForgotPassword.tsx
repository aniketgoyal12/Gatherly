import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ApiResponse } from '@/types';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step State: 1 = Request Token, 2 = Enter Token & Reset Password, 3 = Completed Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // STEP 1: Request Password Reset Token
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please provide a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<{ resetToken?: string; message?: string }>>(
        '/auth/forgot-password',
        { email: email.trim() }
      );

      const serverResetToken = res.data?.data?.resetToken;

      if (serverResetToken) {
        // Pre-fill token in dev mode
        setResetToken(serverResetToken);
        setSuccessInfo('Reset code generated! Proceed below to set your new password.');
      } else {
        setSuccessInfo('Password reset instructions dispatched. Please check your inbox.');
      }

      setStep(2);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to process password reset request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Submit Reset Password with Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetToken.trim()) {
      setErrorMessage('Please enter the reset token received.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-type.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post<ApiResponse<null>>('/auth/reset-password', {
        resetToken: resetToken.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Invalid or expired reset token. Please request a new link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cream-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <img
              src="/logo.png"
              alt="Gatherly Logo"
              className="h-10 sm:h-12 w-auto mx-auto object-contain transition-transform group-hover:scale-102"
            />
          </Link>
          <p className="text-xs sm:text-sm text-navy-600 font-medium">
            Account Recovery & Security Credentials
          </p>
        </div>

        {/* Elevated Card */}
        <Card variant="cream" className="p-6 sm:p-8 shadow-xl border border-cream-300 rounded-3xl">
          {/* Step 3: SUCCESS STATE */}
          {step === 3 ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="success" size="sm">
                  Success
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-navy-600 leading-relaxed max-w-xs mx-auto">
                  Your credentials have been securely updated in Gatherly. You can now log in with your new password.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/login')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In with New Password
              </Button>
            </div>
          ) : (
            <>
              {/* Step Indicators */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center font-bold text-xs">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy-950">
                      {step === 1 ? 'Forgot Password' : 'Set New Password'}
                    </h2>
                    <p className="text-[10px] text-navy-500 font-medium">
                      Step {step} of 2 · {step === 1 ? 'Verify Email' : 'Reset Credentials'}
                    </p>
                  </div>
                </div>

                <Badge variant={step === 1 ? 'coral' : 'navy'} size="sm">
                  Step {step}/2
                </Badge>
              </div>

              {/* Informational Alert Box */}
              {successInfo && (
                <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successInfo}</span>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: REQUEST TOKEN FORM */}
              {step === 1 && (
                <form onSubmit={handleRequestToken} className="space-y-4">
                  <p className="text-xs text-navy-600 leading-relaxed">
                    Enter the email associated with your Gatherly account. We will dispatch a 15-minute secure recovery token.
                  </p>

                  <Input
                    label="Registered Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                    autoFocus
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={loading}
                    className="w-full mt-2"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Send Recovery Code
                  </Button>

                  <div className="pt-2 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 hover:text-navy-950 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              )}

              {/* STEP 2: ENTER TOKEN & NEW PASSWORD FORM */}
              {step === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    label="Reset Token / Code"
                    type="text"
                    placeholder="Paste 64-character token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    required
                    helperText="Token is valid for 15 minutes"
                  />

                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-navy-400 hover:text-navy-700 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                    autoComplete="new-password"
                  />

                  <Input
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                    autoComplete="new-password"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={loading}
                    className="w-full mt-2"
                    rightIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Update Password
                  </Button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setErrorMessage(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Re-enter Email</span>
                    </button>

                    <Link
                      to="/login"
                      className="text-xs font-semibold text-coral-600 hover:text-coral-700 hover:underline"
                    >
                      Cancel & Return
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </Card>

        {/* Security Help Footer */}
        <p className="text-center text-xs text-navy-500">
          Didn't receive an email? Check your spam folder or verify your registered email address.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
