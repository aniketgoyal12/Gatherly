import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Ticket,
  CalendarCheck,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface LoginRegisterProps {
  initialTab?: 'login' | 'register';
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user } = useAuth();

  // Tab State: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    if (location.pathname === '/register' || location.search.includes('tab=register')) {
      return 'register';
    }
    return initialTab;
  });

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tab with pathname changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
    setErrorMessage(null);
  }, [location.pathname]);

  // Role-based redirection helper
  const handleRoleRedirect = (roleToRedirect: UserRole) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      navigate(from, { replace: true });
      return;
    }

    switch (roleToRedirect) {
      case 'organizer':
        navigate('/organizer', { replace: true });
        break;
      case 'super_admin':
        navigate('/admin', { replace: true });
        break;
      case 'staff':
        navigate('/staff', { replace: true });
        break;
      case 'attendee':
      default:
        navigate('/', { replace: true });
        break;
    }
  };

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      handleRoleRedirect(user.role);
    }
  }, [isAuthenticated, user]);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      handleRoleRedirect(loggedInUser.role);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const registeredUser = await register(name.trim(), email.trim(), password, role);
      handleRoleRedirect(registeredUser.role);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Registration failed. This email may already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Auto-Fill
  const fillDemoAccount = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setRole(demoRole);
    setErrorMessage(null);
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
            AI-Powered Event Operations & QR Access
          </p>
        </div>

        {/* Elevated Auth Card */}
        <Card variant="cream" className="p-6 sm:p-8 shadow-xl border border-cream-300 rounded-3xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-cream-200/80 rounded-2xl mb-6 border border-cream-300">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'text-navy-700 hover:text-navy-950'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'text-navy-700 hover:text-navy-950'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  helperText="Default password: Password@123"
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
                  autoComplete="current-password"
                />

                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-coral-600 hover:text-coral-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Gatherly
              </Button>

              {/* Demo Account Quick Switcher */}
              <div className="pt-4 border-t border-cream-200 mt-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                    Quick Demo Personas
                  </span>
                  <Badge variant="coral" size="sm">
                    Click to Test
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('attendee@gatherly.com', 'attendee')}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Attendee</span>
                    </div>
                    <p className="text-[10px] text-navy-500 truncate">attendee@gatherly.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('organizer@gatherly.com', 'organizer')}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <CalendarCheck className="w-3.5 h-3.5 text-coral-500" />
                      <span>Organizer</span>
                    </div>
                    <p className="text-[10px] text-navy-500 truncate">organizer@gatherly.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('staff@gatherly.com', 'staff')}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gate Staff</span>
                    </div>
                    <p className="text-[10px] text-navy-500 truncate">staff@gatherly.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin@gatherly.com', 'super_admin')}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <Building className="w-3.5 h-3.5 text-purple-600" />
                      <span>Super Admin</span>
                    </div>
                    <p className="text-[10px] text-navy-500 truncate">admin@gatherly.com</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
                autoComplete="name"
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              {/* Account Role Selector */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('attendee')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'attendee'
                        ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold shadow-xs'
                        : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
                    }`}
                  >
                    <Ticket className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs block">Attendee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('organizer')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'organizer'
                        ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold shadow-xs'
                        : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 mx-auto mb-1 text-coral-500" />
                    <span className="text-xs block">Organizer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'staff'
                        ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold shadow-xs'
                        : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs block">Staff</span>
                  </button>
                </div>
              </div>

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
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
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
          )}
        </Card>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-navy-600">
          By signing up, you agree to Gatherly's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginRegister;
