# API Contract & Endpoint Specification: Gatherly

> **Last updated:** 2026-11-23  
> **Owner:** Backend Lead & API Architect  
> **Base URL:** `http://localhost:5000/api/v1` (Production: `https://api.gatherly.app/api/v1`)  
> **AI Service Base URL:** `http://localhost:8000/ai/v1` (Proxied internally via Express)  
> **Status Options:** `Planned` | `In Progress` | `Done`

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
| `POST` | `/auth/register` | Public | `{ name, email, password, phone?, role?: "organizer" \| "attendee" }` | `{ user: { id, name, email, phone, role, accountStatus }, accessToken }` | `201`, `400`, `409` | Done |
| `POST` | `/auth/login` | Public | `{ email, password }` | `{ user: { id, name, email, role, phone, mustChangePassword }, accessToken, redirectDashboard }` | `200`, `400`, `401`, `403` | Done |
| `POST` | `/auth/logout` | Authenticated | None | `{ message: "Logged out successfully" }` | `200`, `401` | Done |
| `POST` | `/auth/refresh-token` | Public (Cookie) | `{ refreshToken }` (or via cookie) | `{ accessToken: "new_jwt_string" }` | `200`, `401`, `403` | Done |
| `GET` | `/auth/me` | Authenticated | None | `{ user: { id, name, email, role, phone, interests } }` | `200`, `401` | Done |
| `PUT` | `/auth/profile` | Authenticated | `{ name?, phone?, interests? }` | `{ user: { updatedProfile } }` | `200`, `400`, `401` | Done |
| `POST` | `/auth/verify-email` | Public | `{ token }` | `{ email, isEmailVerified: true }` | `200`, `400` | Done |
| `POST` | `/auth/forgot-password`| Public | `{ email }` | `{ message: "Reset token generated" }` | `200`, `400` | Done |
| `POST` | `/auth/reset-password` | Public | `{ resetToken, newPassword }` | `{ message: "Password reset successful" }` | `200`, `400`, `404` | Done |
| `POST` | `/auth/change-password`| Authenticated | `{ currentPassword, newPassword }` | `{ message: "Password updated successfully" }` | `200`, `401` | Done |

---

## 3. Events Module (`/api/v1/events`)

Event status state machine: `draft` -> `pending_approval` -> `published` / `rejected` -> `completed` / `cancelled`.

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/events` | Public | Query: `?page=1&limit=10&search=&q=&category=&status=published` | `{ events: [ ... ], pagination: { total, pages, page } }` | `200` | Done |
| `GET` | `/events/:id` | Public | None | `{ event: { id, title, description, venueId, organizerId, status, ticketPrice } }` | `200`, `404` | Done |
| `POST` | `/events` | Organizer, Admin | `{ title, description, category, startDate, endDate, venueId?, capacity, ticketPrice? }` | `{ event: { id, status: "draft" } }` | `201`, `400`, `403` | Done |
| `PUT` | `/events/:id` | Organizer (Owner), Admin | `{ title?, description?, startDate?, endDate?, capacity?, ticketPrice? }` | `{ event: { updatedEvent } }` (Only draft/rejected) | `200`, `400`, `403`, `404` | Done |
| `PATCH`| `/events/:id/submit` | Organizer (Owner) | None | `{ event: { id, status: "pending_approval" } }` | `200`, `400`, `403` | Done |
| `PATCH`| `/events/:id/approval`| Super Admin | `{ action: "approve" \| "reject", rejectionReason? }` | `{ event: { id, status: "published" \| "rejected" } }` | `200`, `400`, `403` | Done |
| `PATCH`| `/events/:id/cancel` | Organizer, Admin | None | `{ event: { id, status: "cancelled" }, affectedAttendees }` | `200`, `403`, `404` | Done |
| `PATCH`| `/events/:id/complete`| Organizer, Admin | None | `{ event: { id, status: "completed" } }` | `200`, `403`, `404` | Done |
| `PATCH`| `/events/:id/banner` | Organizer, Admin | Multipart file: `banner` | `{ event, upload: { bannerUrl, publicId } }` | `200`, `400`, `403` | Done |
| `GET` | `/events/:eventId/budget` | Organizer, Admin | None | `{ budget, totalActualSpent, remainingBudget }` | `200`, `403` | Done |
| `POST` | `/events/:eventId/budget` | Organizer, Admin | `{ totalBudget, expenseCategories? }` | `{ budget }` | `200`, `400`, `403` | Done |
| `POST` | `/events/:eventId/budget/expenses` | Organizer, Admin | `{ title, amount, category? }` | `{ budget, totalActualSpent, exceedsThreshold }` | `200`, `400`, `403` | Done |
| `GET` | `/events/:eventId/staff` | Organizer, Admin | None | `{ staff: [ { assignmentId, gate, user } ] }` | `200`, `403` | Done |
| `POST` | `/events/:eventId/staff` | Organizer, Admin | `{ email, gate? }` | `{ assignment, temporaryPassword? }` | `201`, `400`, `403` | Done |
| `DELETE`| `/events/:eventId/staff/:staffId` | Organizer, Admin | None | `{ message: "Staff removed" }` | `200`, `403`, `404` | Done |
| `GET` | `/events/:eventId/analytics` | Organizer (Owner), Admin | None | `{ eventId, totalRegistrations, checkedInAttendance, noShowPercentage, financials }` | `200`, `403`, `404` | Done |

---

## 4. Registrations & Tickets Module (`/api/v1/registrations`, `/api/v1/tickets`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/registrations/reserve` | Attendee | `{ eventId, ticketType?: "free" \| "standard" \| "vip" }` | `{ registrationId, orderId?, amount?, ticket? }` | `200`, `201`, `400`, `409` | Done |
| `POST` | `/waitlist` | Attendee | `{ eventId }` | `{ waitlist: { position, status: "waiting" } }` | `200`, `201`, `404` | Done |
| `GET` | `/registrations/my` | Attendee | None | `{ registrations: [ { id, eventId, bookingStatus } ] }` | `200`, `401` | Done |
| `PATCH`| `/registrations/:id/cancel` | Attendee, Admin | `{ reason? }` | `{ registration: { bookingStatus: "cancelled" }, payment }` | `200`, `400`, `403` | Done |
| `GET` | `/registrations` | Organizer, Admin | Query: `?eventId=&status=&ticketType=` | `{ registrations: [ ... ] }` | `200`, `403` | Done |
| `GET` | `/tickets/my-tickets` | Attendee | None | `{ tickets: [ { id, registrationId, signedTicketToken, ticketStatus } ] }` | `200`, `401` | Done |
| `POST` | `/tickets/check-in` | Staff, Organizer, Admin | `{ qrToken, eventId }` | `{ valid: true, ticket: { id, ticketStatus: "checked_in" }, liveTotalCheckedIn }` | `200`, `400`, `403`, `404`, `409` | Done |
| `GET` | `/tickets/staff/assigned-events` | Staff | None | `{ events: [ { id, title, startDate, assignedGate } ] }` | `200`, `403` | Done |

---

## 5. Payments Module (`/api/v1/payments`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/payments/create-order` | Attendee | `{ registrationId }` | `{ orderId, amount, currency: "INR", keyId }` | `200`, `403`, `404` | Done |
| `POST` | `/payments/verify` | Attendee | `{ registrationId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` | `{ paymentStatus: "paid", ticket: { id, rawQrToken, ticketStatus } }` | `200`, `400`, `404` | Done |
| `POST` | `/payments/webhook` | Public (Razorpay HMAC) | Gateway webhook event body | `{ status: "ok", received: true }` | `200`, `400` | Done |
| `POST` | `/payments/refund` | Attendee, Admin | `{ registrationId, reason? }` | `{ paymentStatus: "refund_pending", refundAmount }` | `200`, `400`, `403` | Done |

---

## 6. AI Microservice Module (`/api/v1/ai`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/ai/event-plan` | Organizer, Admin | `{ eventType, targetAudience, budget, venuePreference, goals }` | `{ plan: { schedule, budgetEstimate, taskChecklist } }` | `200`, `400`, `503` | Done |
| `POST` | `/ai/generate-plan` | Organizer, Admin | Alias for `/ai/event-plan` | Same as above | `200`, `400`, `503` | Done |
| `POST` | `/ai/approve-plan` | Organizer, Admin | `{ planId, modifications? }` | `{ approvedPlan }` | `200`, `400` | Done |
| `POST` | `/ai/predict-turnout` | Organizer, Admin | `{ eventCategory, capacity, ticketPrice, leadTimeDays }` | `{ predictedTurnout, turnoutRate, confidenceScore }` | `200`, `400` | Done |

---

## 7. Admin Governance Module (`/api/v1/admin`)

| Method | Endpoint | Role Allowed | Request Body | Response Data Summary | Status Codes | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/admin/users` | Super Admin | Query: `?role=&status=&page=` | `{ users: [ { id, name, email, role, accountStatus, phone } ] }` | `200`, `403` | Done |
| `PATCH`| `/admin/users/:id/status` | Super Admin | `{ status: "active" \| "suspended" }` | `{ user: { id, accountStatus } }` | `200`, `400`, `403` | Done |
| `GET` | `/admin/pending-events` | Super Admin | None | `{ pendingEvents: [ ... ] }` | `200`, `403` | Done |
| `GET` | `/admin/audit-logs` | Super Admin | Query: `?page=1&limit=20` | `{ auditLogs: [ ... ] }` | `200`, `403` | Done |
| `GET` | `/admin/analytics/event/:eventId` | Organizer, Super Admin | None | Alias for `/events/:eventId/analytics` | `200`, `403` | Done |
