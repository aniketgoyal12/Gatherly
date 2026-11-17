# User Stories: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Frontend Lead & Product Owner  
> **Roles:** Super Admin, Event Organizer, Attendee, Event Staff  
> **Priority Legend:** `M` (Must Have), `H` (High / Should Have), `O` (Optional / Nice to Have)  
> **Status:** `Backlog` \| `In Progress` \| `Done`

---

## 1. Role: Super Admin

Super Admins supervise the entire platform, moderate published events, manage user accounts, and monitor financial/operational metrics across the ecosystem.

| ID | User Story | Priority | Sprint | Status | Acceptance Criteria |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `US-ADM-01` | **As a Super Admin**, I want to review and approve/reject newly submitted events, so that low-quality or fraudulent events are prevented from being published. | M | S2 | Backlog | 1. Admin dashboard displays list of events with status `pending_approval`.<br>2. Can view full event details, organizer profile, venue, and ticket tiers.<br>3. Rejecting an event requires entering a mandatory reason that is emailed to the organizer.<br>4. Approving flips event status to `published` and triggers a notification. |
| `US-ADM-02` | **As a Super Admin**, I want to view a global financial and platform audit log, so that I can monitor ticket transaction volume, fees, and system anomalies. | H | S5 | Backlog | 1. Aggregated view of gross ticket sales, platform commission, and refund totals.<br>2. Filterable audit trail in `auditLogs` collection (actions, IP address, timestamp, actor ID).<br>3. Exportable summary report (CSV/JSON format). |
| `US-ADM-03` | **As a Super Admin**, I want to suspend or revoke access for suspicious users or organizers, so that platform integrity and attendee safety are maintained. | M | S2 | Backlog | 1. User management table allows searching users by email, role, or registration date.<br>2. Action button to toggle `isActive: false` or ban user.<br>3. Banned users are immediately logged out via invalidated JWT refresh tokens.<br>4. Organizers banned automatically have their upcoming events suspended to `cancelled`. |
| `US-ADM-04` | **As a Super Admin**, I want to monitor system health and AI service response latency, so that I can detect outages before users experience failures. | H | S6 | Backlog | 1. Dedicated status widget showing uptime for Express server, FastAPI microservice, and MongoDB connection.<br>2. Average response time for AI generation and ticket reservation endpoints displayed.<br>3. Color-coded health badge (Green / Yellow / Red). |
| `US-ADM-05` | **As a Super Admin**, I want to override ticket refund requests for disputed events, so that attendees can be compensated when organizers fail to fulfill obligations. | O | S5 | Backlog | 1. Admin can initiate manual Razorpay refund on any `paid` payment record.<br>2. Updates `Payment` status to `refunded` and invalidates corresponding `Ticket` records (`refunded`).<br>3. Action is permanently logged in `auditLogs` with admin user ID and reason. |

---

## 2. Role: Event Organizer

Event Organizers create and manage events, use AI to generate itineraries and budgets, configure ticket tiers, monitor sales, assign staff, and coordinate logistics.

| ID | User Story | Priority | Sprint | Status | Acceptance Criteria |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `US-ORG-01` | **As an Event Organizer**, I want to create an event with multiple ticket tiers and custom capacities, so that I can sell tickets according to pricing categories. | M | S2 | Backlog | 1. Form validates title, description, category, dates, venue/online URL, and banner image.<br>2. Can add multiple tiers (e.g., Early Bird, VIP, General) with distinct prices and quantities.<br>3. Sum of tier capacities cannot exceed total venue capacity.<br>4. Saves in `draft` mode or submits for approval as `pending_approval`. |
| `US-ORG-02` | **As an Event Organizer**, I want to use AI to generate a detailed schedule and budget estimate based on event theme and expected crowd, so that I save hours of planning time. | M | S4 | Backlog | 1. Input form takes event category, target audience, duration, and estimated budget.<br>2. FastAPI returns structured JSON with session schedule, speaker slots, and itemized cost breakdown.<br>3. Organizer can edit items inline and click "Apply to Event" to populate event agenda and budget records. |
| `US-ORG-03` | **As an Event Organizer**, I want to view live ticket sales, remaining capacity, and check-in numbers in real-time, so that I can monitor event turnout on event day. | M | S5 | Backlog | 1. Live dashboard displays total tickets sold, revenue in INR, and current check-in count.<br>2. Real-time updates pushed via Socket.IO without manual browser refresh.<br>3. Percentage progress bar shows capacity utilization and warning when >= 90%. |
| `US-ORG-04` | **As an Event Organizer**, I want to assign event staff members and create operational task checklists, so that on-ground logistics run smoothly. | H | S3 | Backlog | 1. Can invite staff members by email with role `staff`.<br>2. Can create tasks with title, description, assignee, priority, and deadline.<br>3. Task board allows filtering tasks by `pending`, `in_progress`, and `completed`.<br>4. Staff receives in-app notification when a new task is assigned. |
| `US-ORG-05` | **As an Event Organizer**, I want to cancel an event and trigger automatic full refunds, so that attendees are compensated without manual back-and-forth. | H | S3 | Backlog | 1. Organizer clicks "Cancel Event" with mandatory cancellation explanation.<br>2. Event status updates to `cancelled`.<br>3. System dispatches batch Razorpay refund calls for all associated `paid` payments.<br>4. All issued tickets update to `cancelled` and notification emails are queued. |

---

## 3. Role: Attendee

Attendees discover public events, purchase tickets securely via Razorpay, access QR tickets offline, receive real-time schedule notifications, and submit reviews.

| ID | User Story | Priority | Sprint | Status | Acceptance Criteria |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `US-ATT-01` | **As an Attendee**, I want to search and filter upcoming events by location, date, price, and category, so that I can find events that match my interests. | M | S2 | Backlog | 1. Search bar with instant text matching on title, tags, and organizer.<br>2. Filter options: Free vs Paid, Date range, Category (Tech, Music, Workshop, Sports).<br>3. Only events with status `published` and future start date are displayed.<br>4. Event card displays cover image, dates, starting price, and venue city. |
| `US-ATT-02` | **As an Attendee**, I want to purchase tickets securely using Razorpay (UPI, Cards, NetBanking), so that my payment is protected and quick. | M | S3 | Backlog | 1. Selects desired ticket tier and quantity (max 5 tickets per order).<br>2. Modal opens Razorpay checkout with accurate order amount in INR.<br>3. On successful payment, user is redirected to confirmation screen within 2 seconds.<br>4. If payment fails or is cancelled, capacity hold is immediately released and clear error is shown. |
| `US-ATT-03` | **As an Attendee**, I want to access my QR code ticket offline on my mobile device, so that I can check in even if there is poor cellular connectivity at the venue. | M | S3 | Backlog | 1. "My Tickets" section displays high-contrast dynamic QR code for each ticket.<br>2. Includes event name, attendee name, seat tier, unique ticket code, and validity status.<br>3. Provides "Download PDF Ticket" button containing embedded QR code and venue details.<br>4. Local caching (PWA/localStorage) ensures QR displays without internet access. |
| `US-ATT-04` | **As an Attendee**, I want to receive real-time notifications about schedule changes or venue shifts, so that I am never caught unprepared. | H | S5 | Backlog | 1. Socket.IO client delivers toast alerts when organizer updates event time or venue.<br>2. In-app notification bell shows badge counter and unread list.<br>3. Notification record saved in `notifications` collection with link to event. |
| `US-ATT-05` | **As an Attendee**, I want to rate the event and write feedback after attending, so that future attendees and organizers have authentic reviews. | O | S5 | Backlog | 1. Feedback form unlocks only for attendees whose tickets have status `checked_in`.<br>2. 1 to 5 star rating system for Content, Organization, and Venue.<br>3. Optional text review (max 500 characters) with foul-language filtering.<br>4. Reviews appear on the public event page and update the organizer's average rating. |

---

## 4. Role: Event Staff

Event Staff work on-ground at venue gates to scan and validate attendee QR codes, monitor check-in capacity limits, and complete assigned operational tasks.

| ID | User Story | Priority | Sprint | Status | Acceptance Criteria |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `US-STF-01` | **As Event Staff**, I want to scan attendee QR tickets using my phone's camera, so that I can quickly verify validity and grant entry within 1 second. | M | S3 | Backlog | 1. Web camera QR scanner (HTML5 QR Scanner) activates directly in browser.<br>2. Decodes QR token and sends verification request to `/api/v1/tickets/check-in`.<br>3. Screen turns Green with attendee name and tier if `valid`.<br>4. Updates ticket status to `checked_in` with timestamp and staff ID. |
| `US-STF-02` | **As Event Staff**, I want the scanner to reject previously scanned tickets loudly and visually, so that duplicate entries and fraudulent re-entry are prevented. | M | S3 | Backlog | 1. Scanning a ticket with status `checked_in` flashes Red alert screen.<br>2. Audio beep alerts staff of duplicate entry.<br>3. Shows the exact timestamp of first check-in and staff member who scanned it.<br>4. No entry allowed; counter is not incremented. |
| `US-STF-03` | **As Event Staff**, I want to manually look up an attendee by email or ticket code if their phone screen is cracked, so that valid ticket holders are not turned away. | H | S3 | Backlog | 1. Staff dashboard includes manual ticket search bar by 8-character ticket code or email.<br>2. Shows ticket details, photo ID requirement, and current validity status.<br>3. "Manual Check-in" button with confirmation prompt requiring staff override reason. |
| `US-STF-04` | **As Event Staff**, I want to see a live counter of checked-in attendees versus venue capacity, so that my gate team can prevent room overcrowding. | H | S5 | Backlog | 1. Persistent top counter displays `Checked In: X / Total Capacity: Y`.<br>2. Background turns amber when check-in reaches 90% and red at 100%.<br>3. Real-time updates delivered over Socket.IO room `event_<id>_staff`. |
| `US-STF-05` | **As Event Staff**, I want to view my assigned duty tasks and mark them completed, so that the organizer knows setup tasks are done. | H | S4 | Backlog | 1. Staff dashboard lists tasks filtered by current user ID (`assignedTo`).<br>2. Tap checkbox to toggle task status between `pending` and `completed`.<br>3. Allows adding a quick status note (e.g., "Registration desk badges ready"). |
