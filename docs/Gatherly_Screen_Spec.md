# Gatherly Complete UI Screen Specification (Screens S-01 through S-32)

> **Last updated:** 2026-11-23  
> **Status:** Production Ready & Code-Verified  
> **Color Standard:** 60% Deep Navy (`#080D1A`), 30% Warm Cream (`#FDFBF7`), 10% Energetic Coral (`#FF6B5B`)  
> **Scope:** Full MVP Scope aligned with Project Plan, System Architecture, and Backend REST APIs.

---

## 1. Global Navigation & Layout Architecture

1. **`PublicLayout` (`frontend/src/components/layouts/PublicLayout.tsx`):**
   - **Target Audience:** Unauthenticated visitors & public event explorers.
   - **Header Elements:** Logo icon + wordmark, Discover link, My Tickets quick link, Sign In & Get Started action buttons.
   - **Footer Elements:** Platform overview, role workspace links, cryptographic verification badges, copyright.

2. **`AttendeeLayout` (`frontend/src/components/layouts/AttendeeLayout.tsx`):**
   - **Target Audience:** Logged-in attendees booking passes, reviewing tickets, and managing their profile.
   - **Header Elements:** Brand logo, Discover link, My Tickets link with active indicator, Notification bell with live pulse, Universal Profile link with avatar initials, Sign Out button.

3. **`DashboardLayout` (`frontend/src/components/layouts/DashboardLayout.tsx`):**
   - **Target Audience:** Organizers, Super Admins, and Staff gate personnel.
   - **Sidebar Elements:** Collapsible 60% Navy sidebar with role-tailored navigation items, active route pill indicators, collapse toggle, user status badge, and secure logout.

---

## 2. Comprehensive Screen Matrix (S-01 to S-32)

### S-01: Home Discovery
- **Final Route:** `/`
- **File Path:** `frontend/src/pages/attendee/HomeDiscovery.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public (All)
- **Guard Behaviour:** None.
- **Key UI Elements:** Hero banner, search bar with category pills, featured hackathons/festivals, trending collegiate events grid, value propositions.
- **API Calls:** `GET /api/v1/events?status=published&limit=8` (Public)
- **Navigates to:** `/search`, `/events/:id`, `/login`, `/register`.

### S-02: Search & Filter
- **Final Route:** `/search` (alias `/events` redirects here)
- **File Path:** `frontend/src/pages/attendee/SearchResults.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public (All)
- **Guard Behaviour:** None.
- **Key UI Elements:** Keyword search input (supports `?q=` and `?search=`), category filter buttons, free vs paid radio pills, event cards grid, pagination controls.
- **API Calls:** `GET /api/v1/events?search=&category=&page=&limit=9` (Public)
- **Navigates to:** `/events/:id`.

### S-03: Event Details
- **Final Route:** `/events/:id`
- **File Path:** `frontend/src/pages/attendee/EventDetails.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public (All)
- **Guard Behaviour:** None.
- **Key UI Elements:** Event promotional banner, title, date/time chips, venue address & facility badges, about markdown, organizer card, attendee review stars, sticky booking card with price and remaining capacity.
- **API Calls:** `GET /api/v1/events/:id` (Public), `GET /api/v1/feedback/event/:id` (Public)
- **Navigates to:** `/checkout/:id`.

### S-04: Checkout & Booking
- **Final Route:** `/checkout/:id`
- **File Path:** `frontend/src/pages/attendee/CheckoutBooking.tsx`
- **Layout:** `AttendeeLayout`
- **Allowed Roles:** `attendee`
- **Guard Behaviour:** If unauthenticated, redirect to `/login?returnUrl=/checkout/:id`. If organizer/staff/admin, show 403 Forbidden.
- **Key UI Elements:** Event summary card, ticket tier selection, attendee details box, simulated payment modal, FIFO waitlist prompt when event is full. Zero convenience fee (Total Payable = Ticket Price).
- **API Calls:** `POST /api/v1/registrations/reserve`, `POST /api/v1/payments/create-order`, `POST /api/v1/payments/verify`, `POST /api/v1/waitlist`.
- **Navigates to:** `/payment/success`, `/payment/failure`, `/my-tickets`.

### S-05: Digital Wallet & My Tickets
- **Final Route:** `/my-tickets`
- **File Path:** `frontend/src/pages/attendee/MyTickets.tsx`
- **Layout:** `AttendeeLayout`
- **Allowed Roles:** `attendee`
- **Guard Behaviour:** Redirects to `/login?returnUrl=/my-tickets` if not logged in.
- **Key UI Elements:** Upcoming vs Past filter tabs, boarding pass style ticket cards, offline-renderable QR code generated from HMAC `signedTicketToken`, Print Ticket CTA, Cancel Booking & Refund modal trigger, Review Event modal trigger.
- **API Calls:** `GET /api/v1/tickets/my-tickets`, `PATCH /api/v1/registrations/:id/cancel`, `POST /api/v1/feedback`.
- **Navigates to:** `/events/:id`, `/search`.

### S-06: Universal Profile
- **Final Route:** `/profile`
- **File Path:** `frontend/src/pages/common/UniversalProfile.tsx`
- **Layout:** `AttendeeLayout` (or role dashboard)
- **Allowed Roles:** `attendee`, `organizer`, `super_admin`, `staff`
- **Guard Behaviour:** Requires active authenticated session.
- **Key UI Elements:** User role badge, editable name, email display, optional phone number field, security credentials section to change password.
- **API Calls:** `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `POST /api/v1/auth/change-password`.
- **Navigates to:** Dashboard / Home.

### S-07: Organizer Dashboard
- **Final Route:** `/organizer` (and `/organizer/dashboard`)
- **File Path:** `frontend/src/pages/organizer/OrganizerDashboard.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Restricted to organizers and super admins.
- **Key UI Elements:** 4 KPI stat cards (Total Events, Published, Pending Approval, Drafts), event status filter tabs, searchable events table with banner thumbnails, deep-linked quick actions (`?eventId=`), Submit for Approval CTA, Mark Completed CTA, Cancel Event CTA.
- **API Calls:** `GET /api/v1/events?organizerId=me`, `PATCH /api/v1/events/:id/submit`, `PATCH /api/v1/events/:id/complete`, `PATCH /api/v1/events/:id/cancel`.
- **Navigates to:** `/organizer/create-event`, `/organizer/events/:id/edit`, `/organizer/events/:id/staff`, `/organizer/budget?eventId=`, `/organizer/registrations?eventId=`, `/organizer/analytics?eventId=`.

### S-08: Create Event Wizard
- **Final Route:** `/organizer/create-event` (and `/organizer/events/new`)
- **File Path:** `frontend/src/pages/organizer/CreateEvent.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Restricted to organizers and super admins.
- **Key UI Elements:** Multi-step wizard (Basic Details, Date & Time, Physical Venue selection, Capacity & Ticket Pricing, Banner Upload).
- **API Calls:** `POST /api/v1/events`, `PATCH /api/v1/events/:id/banner`, `GET /api/v1/venues`.
- **Navigates to:** `/organizer/dashboard`.

### S-09: AI Event Planner Studio
- **Final Route:** `/organizer/ai-planner`
- **File Path:** `frontend/src/pages/organizer/AiEventPlanner.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Restricted to organizers and super admins.
- **Key UI Elements:** AI prompt generator (event type, theme, budget constraints, expected attendees), generated milestone timeline, budget breakdown, task checklist, "Apply to Event" CTA.
- **API Calls:** `POST /api/v1/ai/event-plan`, `POST /api/v1/ai/approve-plan`.
- **Navigates to:** `/organizer/budget`, `/organizer/create-event`.

### S-10: Budget & Expense Tracker
- **Final Route:** `/organizer/budget` (deep links: `/organizer/budget?eventId=:id`)
- **File Path:** `frontend/src/pages/organizer/BudgetManagement.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Restricted to organizers and super admins.
- **Key UI Elements:** Event dropdown selector (pre-selects from `?eventId=`), Total Planned Budget card, Total Spent card, Remaining Budget card, `>= 80%` budget threshold warning alert, logged expense ledger table, Configure Budget modal, Record Expense modal.
- **API Calls:** `GET /api/v1/events/:eventId/budget`, `POST /api/v1/events/:eventId/budget`, `POST /api/v1/events/:eventId/budget/expenses`.
- **Navigates to:** `/organizer/dashboard`.

### S-11: Registrations & Operations Kanban
- **Final Route:** `/organizer/registrations` (and `/organizer/attendees`)
- **File Path:** `frontend/src/pages/organizer/RegistrationsMgmt.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Restricted to organizers and super admins.
- **Key UI Elements:** Event filter, confirmed attendees table with phone and contact info, search by attendee name/email, registration status filter chips.
- **API Calls:** `GET /api/v1/registrations?eventId=`.
- **Navigates to:** `/organizer/dashboard`.

### S-12: Event Analytics & Turnout
- **Final Route:** `/organizer/analytics` (deep links: `/organizer/analytics?eventId=:id`)
- **File Path:** `frontend/src/pages/organizer/EventAnalytics.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Enforces event ownership check on backend.
- **Key UI Elements:** Event selector, Total RSVPs, Checked-In Attendance, No-Show rate calculation, Gross Revenue vs Actual Expenses vs Net Profit financials, attendee review sentiment preview.
- **API Calls:** `GET /api/v1/events/:eventId/analytics`, `GET /api/v1/feedback/event/:eventId`.
- **Navigates to:** `/organizer/dashboard`.

### S-13: Platform Overview Dashboard
- **Final Route:** `/admin` (and `/admin/dashboard`)
- **File Path:** `frontend/src/pages/admin/AdminDashboard.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `super_admin`
- **Guard Behaviour:** Restricted strictly to Super Admins.
- **Key UI Elements:** Platform-wide metrics (Total Users, Published Events, Pending Approvals, Total Platform Ticket Revenue), quick review queue links.
- **API Calls:** `GET /api/v1/admin/pending-events`, `GET /api/v1/admin/users`.
- **Navigates to:** `/admin/approvals`, `/admin/users`, `/admin/reports`.

### S-14: Event Moderation Queue
- **Final Route:** `/admin/approvals`
- **File Path:** `frontend/src/pages/admin/EventApprovalQueue.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `super_admin`
- **Guard Behaviour:** Restricted strictly to Super Admins.
- **Key UI Elements:** Pending events review cards, event capacity vs venue capacity checks, Approve CTA, Reject with mandatory Reason modal.
- **API Calls:** `GET /api/v1/admin/pending-events`, `PATCH /api/v1/events/:id/approval`.
- **Navigates to:** `/admin`.

### S-15: User & Role Governance
- **Final Route:** `/admin/users`
- **File Path:** `frontend/src/pages/admin/UserManagement.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `super_admin`
- **Guard Behaviour:** Restricted strictly to Super Admins.
- **Key UI Elements:** Searchable users roster, role badges, suspension/activation toggle buttons, phone numbers, account status chips.
- **API Calls:** `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id/status`.
- **Navigates to:** `/admin`.

### S-16: Audit & Compliance Reports
- **Final Route:** `/admin/reports`
- **File Path:** `frontend/src/pages/admin/ReportsAnalytics.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `super_admin`
- **Guard Behaviour:** Restricted strictly to Super Admins.
- **Key UI Elements:** Immutable system audit logs, administrative action events, platform commission summary report.
- **API Calls:** `GET /api/v1/admin/audit-logs`.
- **Navigates to:** `/admin`.

### S-17: Assigned Shifts
- **Final Route:** `/staff` (and `/staff/assigned-events`)
- **File Path:** `frontend/src/pages/staff/AssignedEvents.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `staff`, `organizer`, `super_admin`
- **Guard Behaviour:** Shows only events assigned to current staff credentials in `EventStaff`. No fallback to public events.
- **Key UI Elements:** Assigned shift cards with venue name, schedule, assigned gate badge (`📍 Gate A`), "Launch Scanner Desk" CTA.
- **API Calls:** `GET /api/v1/tickets/staff/assigned-events`.
- **Navigates to:** `/staff/scanner/:eventId`.

### S-18: Mobile Camera QR Scanner
- **Final Route:** `/staff/scanner/:eventId` (and `/staff/scanner`)
- **File Path:** `frontend/src/pages/staff/QrScanner.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `staff`, `organizer`, `super_admin`
- **Guard Behaviour:** Requires valid assigned event; guards against scanner launch without event selection.
- **Key UI Elements:** Live camera viewfinder with target reticle, pause/resume camera controls, manual token fallback input, live verification result overlay modal.
- **API Calls:** `POST /api/v1/tickets/check-in`, `GET /api/v1/tickets/staff/assigned-events`.
- **Navigates to:** `/staff/assigned-events`.

### S-19: Check-In Result Standalone View
- **Final Route:** `/staff/result`
- **File Path:** `frontend/src/pages/staff/CheckInResult.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `staff`, `organizer`, `super_admin`
- **Guard Behaviour:** Standalone fallback view for external scanner redirects.
- **Key UI Elements:** Audio-visual verification badge (Access Granted / Duplicate Used / Invalid), Return to Scanner button.
- **Navigates to:** `/staff/scanner`.

### S-20: Login & Register
- **Final Route:** `/login` & `/register`
- **File Path:** `frontend/src/pages/common/LoginRegister.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public
- **Guard Behaviour:** If authenticated, redirects to role dashboard or `?returnUrl=`.
- **Key UI Elements:** Tab toggle (Sign In vs Register), email, password, optional phone, "Register as Organizer" toggle (sets role=organizer, accountStatus=active; public register creates attendee; staff/admin cannot self-signup), demo login auto-fill shortcuts.
- **API Calls:** `POST /api/v1/auth/login`, `POST /api/v1/auth/register`.
- **Navigates to:** Return URL or role dashboard.

### S-21: Notifications Center
- **Final Route:** `/notifications`
- **File Path:** `frontend/src/pages/common/NotificationsCenter.tsx`
- **Layout:** `AttendeeLayout` (or role dashboard)
- **Allowed Roles:** Authenticated (All)
- **Guard Behaviour:** Requires active login.
- **Key UI Elements:** Chronological feed of ticket confirmations, event approval updates, cancellations, and gate notices.
- **API Calls:** `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`.
- **Navigates to:** Destination entity links.

### S-22: Forgot Password
- **Final Route:** `/forgot-password`
- **File Path:** `frontend/src/pages/common/ForgotPassword.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public
- **Guard Behaviour:** None.
- **Key UI Elements:** Email input, submit reset request CTA, success banner with link to reset simulation.
- **API Calls:** `POST /api/v1/auth/forgot-password`.
- **Navigates to:** `/login`, `/reset-password/:token`.

### S-23: Reset Password
- **Final Route:** `/reset-password/:token`
- **File Path:** `frontend/src/pages/common/ResetPassword.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public
- **Guard Behaviour:** Validates reset token format.
- **Key UI Elements:** New password input, confirm password input, Submit CTA, auto-redirect to `/login` upon success.
- **API Calls:** `POST /api/v1/auth/reset-password`.
- **Navigates to:** `/login`.

### S-24: Verify Email
- **Final Route:** `/verify-email/:token`
- **File Path:** `frontend/src/pages/common/VerifyEmail.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public
- **Guard Behaviour:** Validates email verification token.
- **Key UI Elements:** Verification spinner, success banner ("Account Confirmed"), Proceed to Sign In CTA.
- **API Calls:** `POST /api/v1/auth/verify-email`.
- **Navigates to:** `/login`.

### S-25: Payment Success
- **Final Route:** `/payment/success`
- **File Path:** `frontend/src/pages/attendee/PaymentSuccess.tsx`
- **Layout:** `AttendeeLayout`
- **Allowed Roles:** `attendee`
- **Guard Behaviour:** Restricted to attendee.
- **Key UI Elements:** Green checkmark, payment reference, "View Ticket in Wallet" CTA, Return to Home link.
- **Navigates to:** `/my-tickets`, `/`.

### S-26: Payment Failure
- **Final Route:** `/payment/failure`
- **File Path:** `frontend/src/pages/attendee/PaymentFailure.tsx`
- **Layout:** `AttendeeLayout`
- **Allowed Roles:** `attendee`
- **Guard Behaviour:** Restricted to attendee.
- **Key UI Elements:** Error explanation, "Retry Checkout" CTA, Browse Events link.
- **Navigates to:** `/checkout/:eventId`, `/search`.

### S-27: Edit Event Blueprint
- **Final Route:** `/organizer/events/:id/edit`
- **File Path:** `frontend/src/pages/organizer/EditEvent.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Only allowed for events with status `draft` or `rejected`.
- **Key UI Elements:** Title, description, category, capacity, start/end dates, ticket price form fields, Save Changes CTA.
- **API Calls:** `GET /api/v1/events/:id`, `PUT /api/v1/events/:id`.
- **Navigates to:** `/organizer/dashboard`.

### S-28: Event Staff Shift Assignment
- **Final Route:** `/organizer/events/:id/staff`
- **File Path:** `frontend/src/pages/organizer/EventStaffAssignment.tsx`
- **Layout:** `DashboardLayout`
- **Allowed Roles:** `organizer`, `super_admin`
- **Guard Behaviour:** Verifies event ownership.
- **Key UI Elements:** Staff email input, optional gate location input (`Gate A`), temporary password callout box for auto-provisioned staff, active roster table with gate badge and remove button.
- **API Calls:** `GET /api/v1/events/:id/staff`, `POST /api/v1/events/:id/staff`, `DELETE /api/v1/events/:id/staff/:staffId`.
- **Navigates to:** `/organizer/dashboard`.

### S-29: Cancel Booking & Refund Request Modal
- **Location:** Inside `frontend/src/pages/attendee/MyTickets.tsx`
- **Allowed Roles:** `attendee`
- **Key UI Elements:** Warning dialog, reason textarea, "Confirm Cancellation" CTA, automatic refund trigger if ticket was paid.
- **API Calls:** `PATCH /api/v1/registrations/:id/cancel`.

### S-30: 403 Forbidden
- **Final Route:** `/403`
- **File Path:** `frontend/src/pages/common/Forbidden.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public (All)
- **Key UI Elements:** Shield alert icon, access restricted explanation, Go Back button, Public Home button.
- **Navigates to:** `/`.

### S-31: 404 Not Found
- **Final Route:** `/404` (and catch-all `*`)
- **File Path:** `frontend/src/pages/common/NotFound.tsx`
- **Layout:** `PublicLayout`
- **Allowed Roles:** Public (All)
- **Key UI Elements:** 404 illustration, description, Home link, Discover Events CTA.
- **Navigates to:** `/`, `/search`.

### S-32: Scan Verification Overlay Modal
- **Location:** Embedded inside `frontend/src/pages/staff/QrScanner.tsx`
- **Allowed Roles:** `staff`, `organizer`, `super_admin`
- **Key UI Elements:** Full-screen responsive modal overlay with Access Granted (200), Ticket Already Used (409), or Access Denied (400/404) states, live event total attendee counter, "Scan Next Ticket" button.
- **API Calls:** `POST /api/v1/tickets/check-in`.
