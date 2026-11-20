import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  Sparkles,
  Ticket,
  CalendarPlus,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Shield,
  UserCheck,
} from 'lucide-react';

// Starter Home View
const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 pb-20">
      {/* 60% Navy Hero Section */}
      <section className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-cream-50 pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-navy-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-coral-500/30 text-coral-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-coral-400 animate-pulse" />
            <span>AI-Powered Event Platform · MERN + FastAPI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Plan Smarter. <span className="text-coral-500">Connect Seamlessly.</span>
            <br />
            Manage with Gatherly.
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-cream-300 leading-relaxed font-normal">
            The unified platform connecting Event Organizers, Attendees, Gate Staff, and Super Admins.
            Built with automated AI blueprinting, cryptographic QR ticketing, and atomic seat reservation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link to="/events">
              <Button variant="primary" size="lg">
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Button>
            </Link>
            <Link to="/organizer">
              <Button variant="cream" size="lg">
                <CalendarPlus className="w-4 h-4 text-coral-500" />
                <span>Host an Event</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Value Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="cream" interactive className="p-6">
            <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center mb-4 border border-coral-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-950 mb-1">AI Event Blueprinting</h3>
            <p className="text-xs text-navy-700 leading-relaxed">
              Generate structured multi-day schedules, vendor checklists, and itemized budget estimates using our Python FastAPI microservice.
            </p>
          </Card>

          <Card variant="cream" interactive className="p-6">
            <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-950 flex items-center justify-center mb-4 border border-navy-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-950 mb-1">Cryptographic QR Entry</h3>
            <p className="text-xs text-navy-700 leading-relaxed">
              SHA-256 signed ticket tokens with instant mobile camera check-in to prevent counterfeit tickets and duplicate venue scans.
            </p>
          </Card>

          <Card variant="cream" interactive className="p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-950 mb-1">Atomic Booking & Ops</h3>
            <p className="text-xs text-navy-700 leading-relaxed">
              Race-condition-free seat allocations, seamless Razorpay test checkout, and real-time Socket.IO attendance feeds.
            </p>
          </Card>
        </div>
      </section>

      {/* Design System Verification Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="cream" className="p-6 border border-cream-300">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gatherly Design System (60:30:10)</CardTitle>
                <CardDescription>
                  Tailwind CSS v4 theme tokens configured and active across components.
                </CardDescription>
              </div>
              <Badge variant="coral" size="sm">
                Ready for Step-by-Step
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-950 text-cream-100 border border-navy-800">
                <span className="font-bold block text-sm">60% Navy</span>
                <span className="text-[11px] text-cream-400">#080D1A · Headers, Sidebars, Text</span>
              </div>
              <div className="p-3 rounded-xl bg-cream-100 text-navy-950 border border-cream-300">
                <span className="font-bold block text-sm">30% Cream</span>
                <span className="text-[11px] text-navy-600">#FDFBF7 · Canvas, Cards, Surfaces</span>
              </div>
              <div className="p-3 rounded-xl bg-coral-500 text-white shadow-xs">
                <span className="font-bold block text-sm">10% Coral</span>
                <span className="text-[11px] text-coral-100">#FF6B5B · CTAs, Badges, Highlights</span>
              </div>
            </div>

            {user && (
              <div className="pt-2 text-xs text-navy-700">
                Logged in as <strong className="text-navy-950">{user.name}</strong> (
                <span className="capitalize font-semibold text-coral-600">{user.role}</span>)
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

// Generic Scaffold View for Planned Screens
const PagePlaceholder: React.FC<{
  title: string;
  category: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}> = ({ title, category, description, actionText, actionLink }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <Badge variant="coral" size="sm" className="mb-2">
          {category}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-navy-600 mt-1">{description}</p>
      </div>

      {actionText && actionLink && (
        <Link to={actionLink}>
          <Button variant="primary" size="sm">
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>

    <Card variant="cream" className="p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto">
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-navy-950">Foundation Scaffold Active</h3>
      <p className="text-xs text-navy-600 max-w-md mx-auto leading-relaxed">
        This screen is configured with its designated route, layout, and role permission guards.
        Ready for vertical slice implementation!
      </p>
    </Card>
  </div>
);

// Demo Auth View
const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = React.useState('alex@gatherly.io');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card variant="cream" className="max-w-md w-full p-6 sm:p-8 space-y-6 shadow-md">
        <div className="text-center space-y-1">
          <img src="/logo.png" alt="Gatherly" className="h-9 w-auto mx-auto mb-3" />
          <h2 className="text-2xl font-black text-navy-950">Welcome Back</h2>
          <p className="text-xs text-navy-600">Sign in to your role-based Gatherly portal.</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
            Select Role Demo Account:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setEmail('alex@gatherly.io')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                email === 'alex@gatherly.io'
                  ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold'
                  : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
              }`}
            >
              <span className="block font-bold">Attendee</span>
              <span className="text-[10px] opacity-75">alex@gatherly.io</span>
            </button>

            <button
              onClick={() => setEmail('organizer@gatherly.io')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                email === 'organizer@gatherly.io'
                  ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold'
                  : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
              }`}
            >
              <span className="block font-bold">Organizer</span>
              <span className="text-[10px] opacity-75">organizer@gatherly.io</span>
            </button>

            <button
              onClick={() => setEmail('admin@gatherly.io')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                email === 'admin@gatherly.io'
                  ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold'
                  : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
              }`}
            >
              <span className="block font-bold">Super Admin</span>
              <span className="text-[10px] opacity-75">admin@gatherly.io</span>
            </button>

            <button
              onClick={() => setEmail('staff@gatherly.io')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                email === 'staff@gatherly.io'
                  ? 'border-coral-500 bg-coral-50 text-coral-700 font-bold'
                  : 'border-cream-300 bg-cream-100 hover:bg-cream-200 text-navy-800'
              }`}
            >
              <span className="block font-bold">Gate Staff</span>
              <span className="text-[10px] opacity-75">staff@gatherly.io</span>
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={async () => {
            const role = email.includes('admin')
              ? 'super_admin'
              : email.includes('organizer')
              ? 'organizer'
              : email.includes('staff')
              ? 'staff'
              : 'attendee';

            try {
              await login(email);
            } catch {
              // Simulated fallback login for immediate offline usability
              const mockUser = {
                id: `usr_${Date.now()}`,
                name: email.split('@')[0].toUpperCase(),
                email,
                role,
                accountStatus: 'active' as const,
              };
              localStorage.setItem('gatherly_user', JSON.stringify(mockUser));
              localStorage.setItem('gatherly_token', `demo_jwt_${role}`);
              window.location.href =
                role === 'organizer' ? '/organizer' : role === 'super_admin' ? '/admin' : '/';
            }
          }}
        >
          <span>Sign In as {email.split('@')[0]}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        {user && (
          <p className="text-center text-xs text-emerald-700 font-semibold">
            Currently authenticated as {user.name} ({user.role})
          </p>
        )}
      </Card>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Views wrapped with PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/events"
              element={
                <div className="max-w-7xl mx-auto px-4 py-10">
                  <PagePlaceholder
                    title="Event Discovery & Search"
                    category="Attendee Screen 1 & 2"
                    description="Explore published conferences, hackathons, and workshops with instant search and category filters."
                  />
                </div>
              }
            />
            <Route
              path="/my-tickets"
              element={
                <div className="max-w-7xl mx-auto px-4 py-10">
                  <PagePlaceholder
                    title="My Booked Tickets & Passes"
                    category="Attendee Screen 5"
                    description="Digital wallet displaying cryptographically signed QR tickets with offline viewing and PDF download."
                  />
                </div>
              }
            />
            <Route
              path="/notifications"
              element={
                <div className="max-w-7xl mx-auto px-4 py-10">
                  <PagePlaceholder
                    title="Real-Time Notifications"
                    category="Common Feed"
                    description="Live broadcast alerts, booking confirmations, and schedule change announcements."
                  />
                </div>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
          </Route>

          {/* Organizer Workspace (Protected) wrapped with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/organizer"
              element={
                <PagePlaceholder
                  title="Organizer Performance Dashboard"
                  category="Organizer Screen 7"
                  description="High-level KPI metrics: Gross ticket revenue, attendee check-in rate, and active events."
                  actionText="Create New Event"
                  actionLink="/organizer/events/new"
                />
              }
            />
            <Route
              path="/organizer/events/new"
              element={
                <PagePlaceholder
                  title="Event Creation Wizard"
                  category="Organizer Screen 8"
                  description="3-step form to configure event title, dates, venue/online format, and ticket pricing tiers."
                />
              }
            />
            <Route
              path="/organizer/ai-planner"
              element={
                <PagePlaceholder
                  title="AI Event Blueprint Studio"
                  category="Organizer Screen 9"
                  description="Generate complete day-wise itineraries, session schedules, and budget allocations with FastAPI."
                />
              }
            />
            <Route
              path="/organizer/budget"
              element={
                <PagePlaceholder
                  title="Budget & Expense Tracker"
                  category="Organizer Screen 10"
                  description="Itemized expense allocation across Venue, Catering, AV, Marketing, and Contingency."
                />
              }
            />
            <Route
              path="/organizer/attendees"
              element={
                <PagePlaceholder
                  title="Registrations & Attendees List"
                  category="Organizer Screen 11"
                  description="Manage registrations, verify ticket status, and monitor checked-in guests."
                />
              }
            />
            <Route
              path="/organizer/analytics"
              element={
                <PagePlaceholder
                  title="Event Analytics & Turnout"
                  category="Organizer Screen 12"
                  description="Ticket sales progression curves, turn-out prediction accuracy, and attendee ratings."
                />
              }
            />
          </Route>

          {/* Super Admin Console (Protected) wrapped with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/admin"
              element={
                <PagePlaceholder
                  title="Platform Overview & Governance"
                  category="Super Admin Screen 13"
                  description="Platform-wide gross volume, active user accounts, and microservice health monitor."
                />
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <PagePlaceholder
                  title="Event Moderation Queue"
                  category="Super Admin Screen 14"
                  description="Review newly submitted events and approve or reject them with mandatory feedback."
                />
              }
            />
            <Route
              path="/admin/users"
              element={
                <PagePlaceholder
                  title="User & Organizer Management"
                  category="Super Admin Screen 15"
                  description="Manage user permissions, review organizer credentials, and suspend/activate accounts."
                />
              }
            />
            <Route
              path="/admin/reports"
              element={
                <PagePlaceholder
                  title="Financial & Audit Reports"
                  category="Super Admin Screen 16"
                  description="Exportable platform commission logs, transaction histories, and security audit trails."
                />
              }
            />
          </Route>

          {/* Staff Gate Station (Protected) wrapped with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['staff', 'organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/staff"
              element={
                <PagePlaceholder
                  title="Assigned Event Shifts"
                  category="Staff Screen 17"
                  description="Events assigned to your staff credentials for on-ground verification duty."
                  actionText="Launch Gate Scanner"
                  actionLink="/staff/scan"
                />
              }
            />
            <Route
              path="/staff/scan"
              element={
                <PagePlaceholder
                  title="Mobile Camera QR Scanner"
                  category="Staff Screen 18 & 19"
                  description="Camera targeting reticle with instant audio-visual check-in feedback and manual ticket code entry."
                />
              }
            />
          </Route>

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6 text-center">
                <Card variant="cream" className="max-w-md p-8 space-y-4">
                  <Badge variant="coral" size="sm">404 Error</Badge>
                  <h2 className="text-2xl font-bold text-navy-950">Page Not Found</h2>
                  <p className="text-xs text-navy-600">The requested URL route does not exist.</p>
                  <Link to="/">
                    <Button variant="primary" size="sm">Return Home</Button>
                  </Link>
                </Card>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
