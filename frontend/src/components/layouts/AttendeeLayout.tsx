import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Compass,
  Ticket,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  ArrowLeft,
} from 'lucide-react';

export const AttendeeLayout: React.FC = () => {
  const { user, logout } = useAuth();
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
      {/* 60% Navy Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-navy-800 text-cream-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="Gatherly Logo"
                  className="h-9 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive('/') ? 'bg-navy-900 text-white shadow-xs' : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/search"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/search') || isActive('/events') ? 'bg-navy-900 text-white shadow-xs' : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-coral-400" />
                  <span>Discover</span>
                </Link>
                <Link
                  to="/my-tickets"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/my-tickets') ? 'bg-navy-900 text-white shadow-xs' : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-coral-400" />
                  <span>My Tickets</span>
                </Link>
              </nav>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-cream-300 hover:text-white hover:bg-navy-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
              </Link>

              <div className="h-5 w-px bg-navy-800" />

              <Link to="/profile" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-bold text-cream-100">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-bold text-white truncate max-w-[120px]">{user?.name}</p>
                  <span className="text-[10px] text-coral-400 font-semibold block capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-cream-400 hover:text-rose-400 hover:bg-navy-900 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <Link to="/notifications" className="p-2 text-cream-300 hover:text-white">
                <Bell className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-cream-200 hover:bg-navy-900 transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-navy-800 px-4 pt-3 pb-6 space-y-3 bg-navy-950/98">
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-cream-200 hover:bg-navy-900"
              >
                Home
              </Link>
              <Link
                to="/search"
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
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-cream-200 hover:bg-navy-900"
              >
                My Profile
              </Link>
            </div>

            <div className="pt-3 border-t border-navy-800">
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
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-navy-800 text-cream-300 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-cream-400">
          <p>© 2026 Gatherly Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-coral-500 fill-coral-500" />
            <span>for Full-Stack Major Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AttendeeLayout;
