import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  Search,
  Ticket,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  QrCode,
  LogOut,
  User,
  Heart,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-navy-950 font-sans selection:bg-coral-500 selection:text-white">
      {/* 60% Navy Sticky Header Navbar */}
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-navy-800 text-cream-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="Gatherly Logo"
                  className="h-9 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </Link>

              {/* Navigation Links (Desktop) */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive('/')
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/events"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/events')
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-coral-400" />
                  <span>Discover</span>
                </Link>
                <Link
                  to="/my-tickets"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/my-tickets')
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-cream-300" />
                  <span>My Tickets</span>
                </Link>
              </nav>
            </div>

            {/* Right Controls: Role Portal, Notification Bell, User Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Role-Specific Portal Button */}
              {isAuthenticated && user && (
                <>
                  {user.role === 'organizer' && (
                    <Link to="/organizer">
                      <Button variant="navy" size="sm" className="bg-navy-900 border-navy-700 text-xs">
                        <LayoutDashboard className="w-3.5 h-3.5 text-coral-400" />
                        <span>Organizer Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  {user.role === 'super_admin' && (
                    <Link to="/admin">
                      <Button variant="navy" size="sm" className="bg-navy-900 border-navy-700 text-xs">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Super Admin Console</span>
                      </Button>
                    </Link>
                  )}
                  {user.role === 'staff' && (
                    <Link to="/staff/scan">
                      <Button variant="navy" size="sm" className="bg-navy-900 border-navy-700 text-xs">
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Gate Scanner</span>
                      </Button>
                    </Link>
                  )}
                </>
              )}

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-cream-300 hover:text-white hover:bg-navy-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
              </Link>

              <div className="h-5 w-px bg-navy-800" />

              {/* Auth Profile / Login */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-bold text-cream-100 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-left text-xs leading-tight">
                      <p className="font-bold text-white truncate max-w-[120px]">{user.name}</p>
                      <span className="text-[10px] text-cream-400 capitalize block">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-cream-400 hover:text-rose-400 hover:bg-navy-900 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="border-navy-700 text-cream-100 hover:bg-navy-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center gap-2">
              <Link to="/notifications" className="p-2 text-cream-300 hover:text-white">
                <Bell className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-cream-200 hover:bg-navy-900 transition-colors"
                aria-label="Toggle mobile navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-navy-800 px-4 pt-3 pb-6 space-y-3 bg-navy-950/98 animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-cream-200 hover:bg-navy-900"
              >
                Home
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-cream-200 hover:bg-navy-900"
              >
                Discover Events
              </Link>
              <Link
                to="/my-tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-cream-200 hover:bg-navy-900"
              >
                My Tickets
              </Link>
            </div>

            {isAuthenticated && user ? (
              <div className="pt-3 border-t border-navy-800 space-y-2">
                <div className="flex items-center gap-2.5 px-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-xs font-bold text-cream-100">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <Badge variant="coral" size="sm">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {user.role === 'organizer' && (
                  <Link
                    to="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-coral-400 hover:bg-navy-900"
                  >
                    Organizer Dashboard
                  </Link>
                )}
                {user.role === 'super_admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-purple-400 hover:bg-navy-900"
                  >
                    Super Admin Console
                  </Link>
                )}
                {user.role === 'staff' && (
                  <Link
                    to="/staff/scan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-emerald-400 hover:bg-navy-900"
                  >
                    Staff Gate Scanner
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-navy-900 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-navy-800 flex gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-navy-700 text-cream-100">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Outlet for Public Views */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 60% Navy Clean Footer */}
      <footer className="bg-navy-950 border-t border-navy-800 text-cream-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="space-y-3">
              <img src="/logo.png" alt="Gatherly" className="h-8 w-auto object-contain" />
              <p className="text-xs text-cream-400 leading-relaxed max-w-sm">
                AI-Powered Event Planning and Management Platform. End-to-end event lifecycle coordination,
                cryptographic QR ticketing, and real-time gate validation.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MERN + FastAPI Architecture Live</span>
              </div>
            </div>

            {/* Attendee Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cream-100 mb-3">
                Attendee Portal
              </h4>
              <ul className="space-y-2 text-xs text-cream-400">
                <li>
                  <Link to="/events" className="hover:text-coral-400 transition-colors">
                    Explore Hackathons & Summits
                  </Link>
                </li>
                <li>
                  <Link to="/my-tickets" className="hover:text-coral-400 transition-colors">
                    My Tickets & Dynamic QR
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className="hover:text-coral-400 transition-colors">
                    Notifications Feed
                  </Link>
                </li>
              </ul>
            </div>

            {/* Organizer & Admin Portals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cream-100 mb-3">
                Role Workspaces
              </h4>
              <ul className="space-y-2 text-xs text-cream-400">
                <li>
                  <Link to="/organizer" className="hover:text-coral-400 transition-colors">
                    Organizer Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/organizer/events/new" className="hover:text-coral-400 transition-colors">
                    Create New Event
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-coral-400 transition-colors">
                    Super Admin Console
                  </Link>
                </li>
                <li>
                  <Link to="/staff/scan" className="hover:text-coral-400 transition-colors">
                    Gate Check-in Station
                  </Link>
                </li>
              </ul>
            </div>

            {/* Technical & Security Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cream-100 mb-3">
                Security & Platform
              </h4>
              <div className="space-y-2 text-xs text-cream-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SHA-256 Hashed Ticket Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-coral-400 shrink-0" />
                  <span>FastAPI AI Blueprint Engine</span>
                </div>
                <p className="text-[11px] text-cream-500 pt-1">
                  Engineered for College Major Project · Strict 60:30:10 Design Standard.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-navy-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 gap-3">
            <p>© 2026 Gatherly Platform. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-coral-500 fill-coral-500" />
              <span>for Full-Stack Major Project</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
