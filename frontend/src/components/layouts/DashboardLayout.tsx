import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  CalendarPlus,
  Sparkles,
  DollarSign,
  Users,
  BarChart3,
  ShieldCheck,
  UserCheck,
  FileText,
  QrCode,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bell,
  Home,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'organizer';

  // Role-Specific Navigation Definitions matching User's 19-screen map
  const organizerNav: NavItem[] = [
    { label: 'Overview', href: '/organizer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Create Event', href: '/organizer/events/new', icon: <CalendarPlus className="w-4 h-4" /> },
    { label: 'AI Planner', href: '/organizer/ai-planner', icon: <Sparkles className="w-4 h-4 text-coral-400" /> },
    { label: 'Budget Tracker', href: '/organizer/budget', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'Registrations', href: '/organizer/attendees', icon: <Users className="w-4 h-4" /> },
    { label: 'Analytics', href: '/organizer/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const adminNav: NavItem[] = [
    { label: 'Platform Overview', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Event Approvals', href: '/admin/approvals', icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
    { label: 'User Management', href: '/admin/users', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Audit & Reports', href: '/admin/reports', icon: <FileText className="w-4 h-4" /> },
  ];

  const staffNav: NavItem[] = [
    { label: 'Assigned Events', href: '/staff', icon: <Calendar className="w-4 h-4" /> },
    { label: 'QR Scanner', href: '/staff/scan', icon: <QrCode className="w-4 h-4 text-emerald-400" /> },
  ];

  const navItems =
    role === 'super_admin' ? adminNav : role === 'staff' ? staffNav : organizerNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/organizer' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-cream-100 text-navy-950 font-sans selection:bg-coral-500 selection:text-white">
      {/* 60% Navy Collapsible Sidebar */}
      <aside
        className={`bg-navy-950 border-r border-navy-800 text-cream-100 flex flex-col justify-between transition-all duration-300 z-40 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="/logo-icon.png"
                alt="Gatherly"
                className="w-8 h-8 rounded-xl object-contain shrink-0 shadow-xs border border-navy-800"
              />
              {!collapsed && (
                <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                  Gatherly<span className="text-coral-500">.</span>
                </span>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg text-cream-400 hover:text-white hover:bg-navy-900 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* User Role Card */}
          <div className="p-3 border-b border-navy-800/80">
            <div className="p-2 rounded-xl bg-navy-900/80 border border-navy-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Workspace'}</p>
                  <span className="text-[10px] text-coral-400 uppercase tracking-wider font-semibold block capitalize">
                    {role.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'bg-navy-900 text-white shadow-xs border-l-3 border-coral-500'
                      : 'text-cream-300 hover:text-white hover:bg-navy-900/60'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`shrink-0 ${active ? 'text-coral-400' : 'text-cream-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-navy-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-cream-300 hover:text-white hover:bg-navy-900 transition-colors"
            title="Return to Public Site"
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Portal</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-navy-900 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-cream-50 border-b border-cream-300 flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-navy-950 capitalize tracking-tight">
              {role.replace('_', ' ')} Workspace
            </h2>
            <Badge variant="navy" size="sm">
              Live Session
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="p-2 rounded-xl text-navy-600 hover:text-navy-950 hover:bg-cream-200 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500" />
            </Link>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cream-300 text-xs font-semibold text-navy-800 hover:bg-cream-200 transition-colors"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-navy-500" />
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet Canvas */}
        <main className="flex-1 bg-cream-100 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
