# API Contract & Endpoint Specification: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Backend Lead & API Architect  
> **Base URL:** `http://localhost:5000/api/v1` (Production: `https://api.gatherly.app/api/v1`)  
> **AI Service Base URL:** `http://localhost:8000/ai/v1` (Proxied internally via Express)  
> **Status Options:** `Planned` \| `In Progress` \| `Done`

---

## 1. Global Standards & Conventions

### 1.1 Envelope Response Format
All REST endpoints return a uniform JSON envelope structure:

#### Success Response (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "6738914b7e8d6928e1000001",
    "title": "Gatherly Tech Summit 2026"
  },
  "error": null
}
```

#### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Error`):
```json
{
  "success": false,
  "message": "Capacity reached for this ticket tier",
  "data": null,
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "details": [
      {
        "field": "ticketTierId",
        "issue": "No tickets remaining for tier VIP"
      }
    ]
  }
}
```

### 1.2 Authentication Header
Requests requiring authentication must provide the Bearer token in the `Authorization` header OR send the `accessToken` via secure HTTP-only cookie:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 2. Auth Module (`/api/v1/auth`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/register` | Public | `{ name, email, password, role?: "organizer" \| "attendee" }` | `{ user: { id, name, email, role }, token }` | `201`, `400`, `409` | In Progress |
| `POST` | `/auth/login` | Public | `{ email, password }` | `{ user: { id, name, email, role }, token }` | `200`, `400`, `401` | In Progress |
| `POST` | `/auth/logout` | Authenticated | `{}` | `{ message: "Logged out successfully" }` | `200`, `401` | Planned |
| `POST` | `/auth/refresh-token` | Public (Cookie) | `{ refreshToken }` (or via cookie) | `{ token: "new_jwt_string" }` | `200`, `401`, `403` | Planned |
| `GET` | `/auth/me` | Authenticated | None | `{ user: { id, name, email, role, phone, avatar } }` | `200`, `401` | In Progress |
| `PUT` | `/auth/profile` | Authenticated | `{ name?, phone?, bio?, avatarUrl? }` | `{ user: { updatedProfile } }` | `200`, `400`, `401` | Planned |

---

## 3. Events Module (`/api/v1/events`)

Event status values: `draft`, `pending_approval`, `published`, `rejected`, `completed`, `cancelled`.

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/events` | Public | Query: `?page=1&limit=10&search=&category=&status=published` | `{ events: [ ... ], pagination: { total, pages, current } }` | `200` | In Progress |
| `GET` | `/events/:id` | Public | None | `{ event: { id, title, description, venue, tiers, organizer, status } }` | `200`, `404` | In Progress |
| `POST` | `/events` | Organizer, Admin | `{ title, description, category, startDate, endDate, venueId, tiers: [ { name, price, capacity } ] }` | `{ event: { id, status: "draft" \| "pending_approval" } }` | `201`, `400`, `403` | In Progress |
| `PUT` | `/events/:id` | Organizer (Owner), Admin | `{ title?, description?, startDate?, endDate?, tiers? }` | `{ event: { updatedEvent } }` | `200`, `400`, `403`, `404` | Planned |
| `PATCH` | `/events/:id/status` | Admin | `{ status: "published" \| "rejected", reason?: string }` | `{ event: { id, status, moderationReason } }` | `200`, `400`, `403` | Planned |
| `DELETE`| `/events/:id` | Organizer (Owner), Admin | None (Soft delete / cancel) | `{ message: "Event cancelled successfully" }` | `200`, `403`, `404` | Planned |
| `GET` | `/events/organizer/my-events` | Organizer | Query: `?status=&page=` | `{ events: [ ... ], totalCount }` | `200`, `401` | Planned |

---

## 4. Registrations & Tickets Module (`/api/v1/registrations`, `/api/v1/tickets`)

Ticket status values: `valid`, `checked_in`, `cancelled`, `refunded`, `expired`.

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/registrations/reserve` | Attendee | `{ eventId, tierId, quantity }` | `{ registrationId, expiresAt, totalAmount, currency: "INR" }` | `201`, `400`, `409` | Planned |
| `GET` | `/registrations/my` | Attendee | None | `{ registrations: [ { id, event, status, paymentStatus } ] }` | `200`, `401` | Planned |
| `GET` | `/tickets/my-tickets` | Attendee | Query: `?status=valid` | `{ tickets: [ { id, ticketCode, event, qrData, status } ] }` | `200`, `401` | Planned |
| `GET` | `/tickets/:id/qr` | Attendee, Staff | None | `{ qrCodeImageUrl, tokenString, expiresAt }` | `200`, `403`, `404` | Planned |
| `POST` | `/tickets/check-in` | Staff, Organizer, Admin | `{ qrToken: "jwt_qr_payload" }` | `{ success: true, ticket: { id, attendeeName, tier, checkedInAt } }` | `200`, `400`, `409` | Planned |
| `POST` | `/tickets/manual-checkin` | Staff, Organizer, Admin | `{ ticketCode: "GT-9281A", reason: "Cracked screen" }` | `{ ticket: { id, status: "checked_in" }, staffNotes }` | `200`, `400`, `404` | Planned |

---

## 5. Payments Module (`/api/v1/payments`)

Payment status values: `created`, `pending`, `paid`, `failed`, `refund_pending`, `refunded`, `partially_refunded`.

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/payments/create-order` | Attendee | `{ registrationId }` | `{ orderId: "order_123", amount: 150000, currency: "INR", key: "rzp_test_xxx" }` | `200`, `400`, `404` | Planned |
| `POST` | `/payments/verify` | Attendee | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ paymentStatus: "paid", tickets: [ { id, ticketCode } ] }` | `200`, `400` | Planned |
| `POST` | `/payments/webhook` | Public (Razorpay Signature) | Razorpay Webhook Payload (`payment.captured`, `payment.failed`, etc.) | `{ received: true }` | `200`, `400` | Planned |
| `POST` | `/payments/:id/refund` | Organizer, Admin | `{ amount?: number, reason: string }` | `{ refundId: "rfnd_123", status: "refunded", amount }` | `200`, `400`, `403` | Planned |
| `GET` | `/payments/event/:eventId` | Organizer, Admin | Query: `?status=&page=` | `{ payments: [ ... ], grossRevenue, refundTotal }` | `200`, `403` | Planned |

---

## 6. AI Microservice Module (`/api/v1/ai` -> `FastAPI /ai/v1`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/ai/generate-schedule` | Organizer, Admin | `{ title, description, category, durationDays, dailyStartTime, dailyEndTime }` | `{ schedule: [ { day: 1, slots: [ { time, title, speaker, room } ] } ] }` | `200`, `400`, `503` | In Progress |
| `POST` | `/ai/estimate-budget` | Organizer, Admin | `{ attendeeCount, eventCategory, venueType, tierPricing }` | `{ estimatedTotal, breakdown: { venue, catering, av, marketing, contingency } }` | `200`, `400`, `503` | In Progress |
| `POST` | `/ai/generate-tasks` | Organizer, Admin | `{ eventType, targetDate, scale: "small" \| "medium" \| "large" }` | `{ taskChecklist: [ { title, category, daysBeforeEvent, priority } ] }` | `200`, `400` | Planned |
| `POST` | `/ai/predict-turnout` | Organizer, Admin | `{ eventCategory, ticketPrice, leadDays, historicalRSVP, venueCapacity }` | `{ predictedAttendance: 450, expectedTurnoutRate: 0.85, confidence: 0.91 }` | `200`, `400` | Planned |

---

## 7. Vendors, Sponsors & Staff Tasks Module (`/api/v1/*`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/vendors` | Organizer, Admin | Query: `?category=catering&city=Mumbai` | `{ vendors: [ { id, name, category, rating, pricingRange } ] }` | `200` | Planned |
| `POST` | `/vendors` | Admin, Organizer | `{ name, category, contactPerson, email, phone, servicesOffered }` | `{ vendor: { id, name, status: "active" } }` | `201`, `400` | Planned |
| `POST` | `/events/:id/sponsors` | Organizer | `{ name, logoUrl, tier: "platinum" \| "gold" \| "silver", contributionAmount }` | `{ sponsor: { id, name, tier } }` | `201`, `400`, `403` | Planned |
| `GET` | `/tasks/event/:eventId` | Staff, Organizer | Query: `?assignedTo=&status=` | `{ tasks: [ { id, title, assignedTo, priority, status, deadline } ] }` | `200`, `403` | Planned |
| `POST` | `/tasks` | Organizer | `{ eventId, title, description, assignedTo, priority, deadline }` | `{ task: { id, title, status: "pending" } }` | `201`, `400` | Planned |
| `PATCH` | `/tasks/:id/status` | Staff (Assignee), Organizer | `{ status: "in_progress" \| "completed" }` | `{ task: { id, status, completedAt } }` | `200`, `400`, `403` | Planned |

---

## 8. Notifications & Feedback Module (`/api/v1/*`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/notifications` | Authenticated | Query: `?unreadOnly=true` | `{ notifications: [ { id, title, body, read, link, createdAt } ] }` | `200`, `401` | Planned |
| `PATCH` | `/notifications/:id/read` | Authenticated | None | `{ success: true, notificationId }` | `200`, `401` | Planned |
| `POST` | `/feedback` | Attendee (Checked-in) | `{ eventId, rating: 5, categoryRatings: { content: 5, venue: 4 }, comment }` | `{ feedback: { id, createdAt } }` | `201`, `400`, `403` | Planned |
| `GET` | `/feedback/event/:eventId` | Public / Organizer | Query: `?page=1` | `{ feedbackList: [ ... ], averageRating: 4.8 }` | `200` | Planned |
