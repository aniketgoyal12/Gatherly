import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AttendeeLayout } from '@/components/layouts/AttendeeLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Common / Auth Screens
import { LoginRegister } from '@/pages/common/LoginRegister';
import { ForgotPassword } from '@/pages/common/ForgotPassword';
import { ResetPassword } from '@/pages/common/ResetPassword';
import { VerifyEmail } from '@/pages/common/VerifyEmail';
import { UniversalProfile } from '@/pages/common/UniversalProfile';
import { NotificationsCenter } from '@/pages/common/NotificationsCenter';
import { Forbidden } from '@/pages/common/Forbidden';
import { NotFound } from '@/pages/common/NotFound';

// Attendee Screens
import { HomeDiscovery } from '@/pages/attendee/HomeDiscovery';
import { SearchResults } from '@/pages/attendee/SearchResults';
import { EventDetails } from '@/pages/attendee/EventDetails';
import { CheckoutBooking } from '@/pages/attendee/CheckoutBooking';
import { MyTickets } from '@/pages/attendee/MyTickets';
import { PaymentSuccess } from '@/pages/attendee/PaymentSuccess';
import { PaymentFailure } from '@/pages/attendee/PaymentFailure';

// Organizer Screens
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { CreateEvent } from '@/pages/organizer/CreateEvent';
import { EditEvent } from '@/pages/organizer/EditEvent';
import { EventStaffAssignment } from '@/pages/organizer/EventStaffAssignment';
import { AiEventPlanner } from '@/pages/organizer/AiEventPlanner';
import { BudgetManagement } from '@/pages/organizer/BudgetManagement';
import { RegistrationsMgmt } from '@/pages/organizer/RegistrationsMgmt';
import { EventAnalytics } from '@/pages/organizer/EventAnalytics';

// Super Admin Screens
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { EventApprovalQueue } from '@/pages/admin/EventApprovalQueue';
import { UserManagement } from '@/pages/admin/UserManagement';
import { ReportsAnalytics } from '@/pages/admin/ReportsAnalytics';

// Staff Gate Station Screens
import { AssignedEvents } from '@/pages/staff/AssignedEvents';
import { QrScanner } from '@/pages/staff/QrScanner';
import { CheckInResult } from '@/pages/staff/CheckInResult';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========================================================= */}
          {/* 1. PUBLIC SCREENS (Wrapped with PublicLayout)             */}
          {/* ========================================================= */}
          <Route element={<PublicLayout />}>
            {/* Screen S-01: Home Discovery */}
            <Route path="/" element={<HomeDiscovery />} />

            {/* Screen S-02: Search & Filter (and alias /events -> /search) */}
            <Route path="/search" element={<SearchResults />} />
            <Route path="/events" element={<Navigate to="/search" replace />} />

            {/* Screen S-03: Event Details */}
            <Route path="/events/:id" element={<EventDetails />} />

            {/* Screen S-20: Login & Register */}
            <Route path="/login" element={<LoginRegister initialTab="login" />} />
            <Route path="/register" element={<LoginRegister initialTab="register" />} />

            {/* Screen S-22: Forgot Password */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Screen S-23: Reset Password */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Screen S-24: Verify Email */}
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Screen S-30: 403 Forbidden */}
            <Route path="/403" element={<Forbidden />} />

            {/* Screen S-31: 404 Not Found */}
            <Route path="/404" element={<NotFound />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. PROTECTED ATTENDEE MODULE (Wrapped with AttendeeLayout)*/}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['attendee', 'organizer', 'super_admin', 'staff']}>
                <AttendeeLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen S-04: Checkout & Booking (Restricted to attendee only) */}
            <Route
              path="/checkout/:id"
              element={
                <ProtectedRoute allowedRoles={['attendee']}>
                  <CheckoutBooking />
                </ProtectedRoute>
              }
            />

            {/* Screen S-25: Payment Success */}
            <Route
              path="/payment/success"
              element={
                <ProtectedRoute allowedRoles={['attendee']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />

            {/* Screen S-26: Payment Failure */}
            <Route
              path="/payment/failure"
              element={
                <ProtectedRoute allowedRoles={['attendee']}>
                  <PaymentFailure />
                </ProtectedRoute>
              }
            />

            {/* Screen S-05: Digital Wallet & My Tickets */}
            <Route
              path="/my-tickets"
              element={
                <ProtectedRoute allowedRoles={['attendee']}>
                  <MyTickets />
                </ProtectedRoute>
              }
            />

            {/* Screen S-06: Universal Profile (Available to all authenticated roles) */}
            <Route path="/profile" element={<UniversalProfile />} />

            {/* Screen S-21: Notifications Center */}
            <Route path="/notifications" element={<NotificationsCenter />} />
          </Route>

          {/* ========================================================= */}
          {/* 3. ORGANIZER WORKSPACE (Protected: organizer, super_admin) */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen S-07: Organizer Dashboard */}
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />

            {/* Screen S-08: Create Event Wizard */}
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route path="/organizer/events/new" element={<CreateEvent />} />

            {/* Screen S-27: Edit Event Blueprint */}
            <Route path="/organizer/events/:id/edit" element={<EditEvent />} />

            {/* Screen S-28: Event Staff Shift Assignment */}
            <Route path="/organizer/events/:id/staff" element={<EventStaffAssignment />} />

            {/* Screen S-09: AI Event Planner Studio */}
            <Route path="/organizer/ai-planner" element={<AiEventPlanner />} />

            {/* Screen S-10: Budget & Expense Tracker */}
            <Route path="/organizer/budget" element={<BudgetManagement />} />

            {/* Screen S-11: Registrations & Operations Kanban */}
            <Route path="/organizer/registrations" element={<RegistrationsMgmt />} />
            <Route path="/organizer/attendees" element={<RegistrationsMgmt />} />

            {/* Screen S-12: Event Analytics & Turnout */}
            <Route path="/organizer/analytics" element={<EventAnalytics />} />
          </Route>

          {/* ========================================================= */}
          {/* 4. SUPER ADMIN CONSOLE (Protected: super_admin)           */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen S-13: Platform Overview Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Screen S-14: Event Moderation Queue */}
            <Route path="/admin/approvals" element={<EventApprovalQueue />} />

            {/* Screen S-15: User & Role Governance */}
            <Route path="/admin/users" element={<UserManagement />} />

            {/* Screen S-16: Audit & Compliance Reports */}
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
          </Route>

          {/* ========================================================= */}
          {/* 5. STAFF GATE STATION (Protected: staff, organizer, admin) */}
          {/* ========================================================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['staff', 'organizer', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Screen S-17: Assigned Shifts */}
            <Route path="/staff" element={<AssignedEvents />} />
            <Route path="/staff/assigned-events" element={<AssignedEvents />} />

            {/* Screen S-18: Mobile Camera QR Scanner */}
            <Route path="/staff/scanner/:eventId" element={<QrScanner />} />
            <Route path="/staff/scanner" element={<QrScanner />} />
            <Route path="/staff/scan" element={<QrScanner />} />

            {/* Screen S-19: Check-In Result Standalone View */}
            <Route path="/staff/result" element={<CheckInResult />} />
          </Route>

          {/* ========================================================= */}
          {/* 6. CATCH-ALL ROUTE (HTTP 404)                             */}
          {/* ========================================================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
