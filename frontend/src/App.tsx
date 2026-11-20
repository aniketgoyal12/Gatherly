import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Common / Auth Screens (20, 21, 22)
import { LoginRegister } from '@/pages/common/LoginRegister';
import { ForgotPassword } from '@/pages/common/ForgotPassword';
import { NotificationsCenter } from '@/pages/common/NotificationsCenter';

// Attendee Screens (1, 2, 3, 4, 5, 6)
import { HomeDiscovery } from '@/pages/attendee/HomeDiscovery';
import { SearchResults } from '@/pages/attendee/SearchResults';
import { EventDetails } from '@/pages/attendee/EventDetails';
import { CheckoutBooking } from '@/pages/attendee/CheckoutBooking';
import { MyTickets } from '@/pages/attendee/MyTickets';
import { AttendeeProfile } from '@/pages/attendee/AttendeeProfile';

// Organizer Screens (7, 8, 9, 10, 11, 12)
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { CreateEvent } from '@/pages/organizer/CreateEvent';
import { AiEventPlanner } from '@/pages/organizer/AiEventPlanner';
import { BudgetManagement } from '@/pages/organizer/BudgetManagement';
import { RegistrationsMgmt } from '@/pages/organizer/RegistrationsMgmt';
import { EventAnalytics } from '@/pages/organizer/EventAnalytics';

// Super Admin Screens (13, 14, 15, 16)
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { EventApprovalQueue } from '@/pages/admin/EventApprovalQueue';
import { UserManagement } from '@/pages/admin/UserManagement';
import { ReportsAnalytics } from '@/pages/admin/ReportsAnalytics';

// Staff Gate Station Screens (17, 18, 19)
import { AssignedEvents } from '@/pages/staff/AssignedEvents';
import { QrScanner } from '@/pages/staff/QrScanner';
import { CheckInResult } from '@/pages/staff/CheckInResult';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========================================================= */}
          {/* 1. PUBLIC & ATTENDEE MODULE (Wrapped with PublicLayout)   */}
          {/* ========================================================= */}
          <Route element={<PublicLayout />}>
            {/* Screen 1: Home Discovery */}
            <Route path="/" element={<HomeDiscovery />} />

            {/* Screen 2: Search & Filter */}
            <Route path="/search" element={<SearchResults />} />
            <Route path="/events" element={<SearchResults />} />

            {/* Screen 3: Event Details */}
            <Route path="/events/:id" element={<EventDetails />} />

            {/* Screen 4: Checkout & Booking (Protected) */}
            <Route
              path="/checkout/:id"
              element={
                <ProtectedRoute>
                  <CheckoutBooking />
                </ProtectedRoute>
              }
            />

            {/* Screen 5: Digital Wallet & My Tickets (Protected) */}
            <Route
              path="/my-tickets"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />

            {/* Screen 6: Attendee Profile (Protected) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AttendeeProfile />
                </ProtectedRoute>
              }
            />

            {/* Screen 21: Notifications Center (Protected) */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsCenter />
                </ProtectedRoute>
              }
            />

            {/* Screen 20: Login & Register */}
            <Route path="/login" element={<LoginRegister initialTab="login" />} />
            <Route path="/register" element={<LoginRegister initialTab="register" />} />

            {/* Screen 22: Forgot & Reset Password */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. ORGANIZER WORKSPACE (Protected: organizer, super_admin) */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen 7: Organizer Dashboard */}
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />

            {/* Screen 8: Create Event Wizard */}
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route path="/organizer/events/new" element={<CreateEvent />} />

            {/* Screen 9: AI Event Planner Studio */}
            <Route path="/organizer/ai-planner" element={<AiEventPlanner />} />

            {/* Screen 10: Budget & Expense Tracker */}
            <Route path="/organizer/budget" element={<BudgetManagement />} />

            {/* Screen 11: Registrations & Operations Kanban */}
            <Route path="/organizer/registrations" element={<RegistrationsMgmt />} />
            <Route path="/organizer/attendees" element={<RegistrationsMgmt />} />

            {/* Screen 12: Event Analytics & Turnout */}
            <Route path="/organizer/analytics" element={<EventAnalytics />} />
          </Route>

          {/* ========================================================= */}
          {/* 3. SUPER ADMIN CONSOLE (Protected: super_admin)           */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen 13: Platform Overview Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Screen 14: Event Moderation Queue */}
            <Route path="/admin/approvals" element={<EventApprovalQueue />} />

            {/* Screen 15: User & Role Governance */}
            <Route path="/admin/users" element={<UserManagement />} />

            {/* Screen 16: Audit & Compliance Reports */}
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
          </Route>

          {/* ========================================================= */}
          {/* 4. STAFF GATE STATION (Protected: staff, organizer, admin) */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['staff', 'organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen 17: Assigned Shifts */}
            <Route path="/staff" element={<AssignedEvents />} />
            <Route path="/staff/assigned-events" element={<AssignedEvents />} />

            {/* Screen 18: Mobile Camera QR Scanner */}
            <Route path="/staff/scanner" element={<QrScanner />} />
            <Route path="/staff/scan" element={<QrScanner />} />

            {/* Screen 19: Check-In Result Full-Screen View */}
            <Route path="/staff/result" element={<CheckInResult />} />
          </Route>

          {/* ========================================================= */}
          {/* 5. CATCH-ALL REDIRECT FALLBACK                            */}
          {/* ========================================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
