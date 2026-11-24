# Database Architecture & Schema Specification: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Database Engineer & Data Architect  
> **Database Engine:** MongoDB 7.0 (Mongoose ODM)  
> **Total Collections:** 17  
> **Status Options:** `Planned` \| `In Progress` \| `Done`

---

## 1. Entity-Relationship Overview

```text
              ┌───────────────┐
              │     users     │◄─────────────────────────────────────┐
              └───────┬───────┘                                      │
                      │ 1:N                                          │
                      ▼                                              │
              ┌───────────────┐        1:1        ┌───────────────┐  │
              │    events     ├──────────────────►│    venues     │  │
              └───┬───┬───┬───┘                   └───────────────┘  │
                  │   │   │                                          │
       ┌──────────┘   │   └──────────┐                               │
       │ 1:N          │ 1:N          │ 1:N                           │
       ▼              ▼              ▼                               │
┌──────────────┐┌──────────────┐┌──────────────┐                     │
│registrations ││   budgets    ││   aiPlans    │                     │
└───┬──────────┘└──────────────┘└──────────────┘                     │
    │ 1:1                                                            │
    ▼                                                                │
┌──────────────┐ 1:N  ┌──────────────┐                               │
│   payments   │◄────►│   tickets    │───────────────────────────────┤
└──────────────┘      └──────────────┘ (scannedBy -> staff user)     │
                                                                     │
Additional Event Sub-entities:                                       │
- eventStaff (N:M users <-> events) ─────────────────────────────────┘
- eventVendors (N:M vendors <-> events)
- sponsors, tasks, waitlists, feedback, notifications, auditLogs
```

---

## 2. Detailed Collection Schemas (All 17 Collections)

### 2.1 `users`
Stores credentials, roles, and profiles for Super Admins, Organizers, Attendees, and Staff.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto (ObjectId) | Primary key |
| `name` | `String` | Yes | - | Full user display name |
| `email` | `String` | Yes | - | Unique login email (lowercase, trimmed) |
| `passwordHash` | `String` | Yes | - | Bcrypt hashed string (salt rounds: 12) |
| `role` | `String` | Yes | `attendee` \| `organizer` \| `admin` \| `staff` | Role-based permission tier |
| `phone` | `String` | No | null | Contact number for SMS / WhatsApp updates |
| `avatarUrl` | `String` | No | null | Cloudinary image URL |
| `isActive` | `Boolean` | Yes | `true` | Ban / suspension status |
| `refreshTokenHash`| `String` | No | null | SHA-256 hash of active JWT refresh token |
| `createdAt` | `Date` | Yes | `Date.now` | Account creation timestamp |
| `updatedAt` | `Date` | Yes | `Date.now` | Last update timestamp |

- **Indexes:** `{ email: 1 }` (Unique), `{ role: 1 }`
- **Relationships:** Referenced by `events.organizerId`, `tickets.userId`, `tasks.assignedTo`, `auditLogs.userId`.
- **Status:** In Progress

---

### 2.2 `events`
Central event record with pricing tiers, scheduling, capacity, and lifecycle status.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto (ObjectId) | Primary key |
| `title` | `String` | Yes | - | Event title (indexed for text search) |
| `slug` | `String` | Yes | - | URL-friendly unique slug |
| `description` | `String` | Yes | - | Full markdown description of event |
| `category` | `String` | Yes | `tech` \| `music` \| `sports` \| `academic` \| `social` | Event category classification |
| `organizerId` | `ObjectId` | Yes | Ref: `users` | Foreign key to event organizer |
| `venueId` | `ObjectId` | No | Ref: `venues` | Foreign key to physical venue (or null if virtual) |
| `isVirtual` | `Boolean` | Yes | `false` | Virtual webinar vs in-person event |
| `virtualMeetingUrl`| `String`| No | null | Protected streaming / Zoom / Meet URL |
| `bannerUrl` | `String` | Yes | - | Primary promotional banner image |
| `startDate` | `Date` | Yes | - | Event start datetime |
| `endDate` | `Date` | Yes | - | Event end datetime |
| `status` | `String` | Yes | `draft` \| `pending_approval` \| `published` \| `rejected` \| `completed` \| `cancelled` | Event lifecycle state machine |
| `rejectionReason` | `String` | No | null | Required note if status is `rejected` |
| `totalCapacity` | `Number` | Yes | - | Maximum total allowed attendees |
| `remainingCapacity`| `Number`| Yes | - | Available seats; updated atomically |
| `ticketTiers` | `Array` | Yes | `[]` | Subdocuments: `[ { tierId, name, price, capacity, remaining, maxPerUser } ]` |
| `tags` | `[String]` | No | `[]` | Search and AI discovery tags |
| `createdAt` | `Date` | Yes | `Date.now` | Creation timestamp |
| `updatedAt` | `Date` | Yes | `Date.now` | Modification timestamp |

- **Indexes:** `{ slug: 1 }` (Unique), `{ status: 1, startDate: 1 }`, `{ organizerId: 1 }`, `{ title: "text", description: "text", tags: "text" }`
- **Relationships:** `organizerId` -> `users._id`, `venueId` -> `venues._id`.
- **Status:** In Progress

---

### 2.3 `venues`
Physical locations and seating capacity metadata.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `name` | `String` | Yes | - | Venue name (e.g., "Grand Hall A") |
| `address` | `String` | Yes | - | Street address |
| `city` | `String` | Yes | - | City name |
| `state` | `String` | Yes | - | State / Province |
| `postalCode` | `String` | Yes | - | Postal PIN code |
| `country` | `String` | Yes | `"India"` | Country name |
| `coordinates` | `Object` | No | `{ type: "Point", coordinates: [lng, lat] }` | GeoJSON point for map integration |
| `maxCapacity` | `Number` | Yes | - | Fire-code venue maximum capacity |
| `contactPerson`| `String` | No | null | Venue manager contact name |
| `contactPhone` | `String` | No | null | Contact telephone |
| `amenities` | `[String]` | No | `[]` | e.g., `["WiFi", "Projector", "Parking", "AC"]` |

- **Indexes:** `{ city: 1 }`, `{ coordinates: "2dsphere" }`
- **Relationships:** Referenced by `events.venueId`.
- **Status:** Planned

---

### 2.4 `registrations`
User bookings linking an attendee, selected ticket tier, and pricing hold.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Event reference |
| `userId` | `ObjectId` | Yes | Ref: `users` | Attendee reference |
| `tierId` | `String` | Yes | - | Subdocument ID of selected ticket tier |
| `quantity` | `Number` | Yes | `1` | Number of tickets reserved (max: 5) |
| `unitPrice` | `Number` | Yes | - | Price per ticket at time of booking |
| `totalAmount` | `Number` | Yes | - | Total order value in INR |
| `reservationStatus`| `String`| Yes | `reserved` \| `confirmed` \| `expired` \| `cancelled` | Status of temporary inventory lock |
| `expiresAt` | `Date` | Yes | `now + 10 mins` | TTL expiration for payment window |
| `createdAt` | `Date` | Yes | `Date.now` | Creation timestamp |

- **Indexes:** `{ eventId: 1, userId: 1 }`, `{ expiresAt: 1 }` (TTL index when `reserved`)
- **Relationships:** `eventId` -> `events._id`, `userId` -> `users._id`.
- **Status:** Planned

---

### 2.5 `tickets`
Individual admission tickets with QR verification tokens and check-in audit state.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `registrationId`| `ObjectId`| Yes | Ref: `registrations`| Associated reservation |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Associated event |
| `userId` | `ObjectId` | Yes | Ref: `users` | Ticket holder user ID |
| `ticketCode` | `String` | Yes | - | Human-readable unique code (e.g., `GATH-8X2K9`) |
| `qrTokenHash` | `String` | Yes | - | `SHA-256` hash of signed QR payload |
| `status` | `String` | Yes | `valid` \| `checked_in` \| `cancelled` \| `refunded` \| `expired` | Current ticket validity |
| `checkedInAt` | `Date` | No | null | Exact gate check-in timestamp |
| `checkedInBy` | `ObjectId` | No | Ref: `users` | Staff member who verified the ticket |
| `issuedAt` | `Date` | Yes | `Date.now` | Issuance timestamp |

- **Indexes:** `{ ticketCode: 1 }` (Unique), `{ qrTokenHash: 1 }` (Unique), `{ eventId: 1, status: 1 }`, `{ userId: 1 }`
- **Relationships:** `eventId` -> `events`, `userId` -> `users`, `checkedInBy` -> `users`.
- **Status:** Planned

---

### 2.6 `payments`
Razorpay order, payment capture, signature verification, and refund records.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `registrationId`| `ObjectId`| Yes | Ref: `registrations`| Linked reservation |
| `userId` | `ObjectId` | Yes | Ref: `users` | Buyer reference |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Linked event |
| `razorpayOrderId`| `String`| Yes | - | Order ID from Razorpay API (`order_xxx`) |
| `razorpayPaymentId`|`String`| No | null | Payment ID from Razorpay (`pay_xxx`) |
| `razorpaySignature`|`String`| No | null | HMAC SHA-256 signature from client checkout |
| `amount` | `Number` | Yes | - | Total amount in paise (e.g. 50000 = ₹500) |
| `currency` | `String` | Yes | `"INR"` | Currency ISO code |
| `status` | `String` | Yes | `created` \| `pending` \| `paid` \| `failed` \| `refund_pending` \| `refunded` \| `partially_refunded` | Payment status lifecycle |
| `failureReason`| `String` | No | null | Gateway error description if failed |
| `refundId` | `String` | No | null | Razorpay refund identifier (`rfnd_xxx`) |
| `webhookEvents`| `[String]` | Yes | `[]` | List of processed webhook event IDs (idempotency) |
| `createdAt` | `Date` | Yes | `Date.now` | Creation timestamp |
| `updatedAt` | `Date` | Yes | `Date.now` | Modification timestamp |

- **Indexes:** `{ razorpayOrderId: 1 }` (Unique), `{ razorpayPaymentId: 1 }` (Sparse, Unique), `{ registrationId: 1 }`, `{ status: 1 }`
- **Relationships:** `registrationId` -> `registrations`, `userId` -> `users`, `eventId` -> `events`.
- **Status:** Planned

---

### 2.7 `budgets`
Financial planning and itemized expense ledger for event organizers.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Associated event |
| `totalAllocated`| `Number` | Yes | `0` | Total approved budget in INR |
| `totalSpent` | `Number` | Yes | `0` | Running sum of actual paid line items |
| `items` | `Array` | Yes | `[]` | Subdocuments: `[ { itemId, category, plannedCost, actualCost, paid, vendorId } ]` |
| `source` | `String` | Yes | `manual` \| `ai_generated` | Origin of the budget estimate |
| `updatedAt` | `Date` | Yes | `Date.now` | Last update timestamp |

- **Indexes:** `{ eventId: 1 }` (Unique)
- **Relationships:** `eventId` -> `events._id`, `items.vendorId` -> `vendors._id`.
- **Status:** Planned

---

### 2.8 `vendors`
Directory of external suppliers (Catering, Audio-Visual, Venue, Photography, Security).

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `name` | `String` | Yes | - | Business or trade name |
| `category` | `String` | Yes | `catering` \| `av_lighting` \| `security` \| `decoration` \| `photography` | Vendor service category |
| `contactPerson`| `String` | Yes | - | Primary liaison name |
| `email` | `String` | Yes | - | Contact email |
| `phone` | `String` | Yes | - | Direct telephone number |
| `city` | `String` | Yes | - | Operating city |
| `pricingTier` | `String` | Yes | `budget` \| `standard` \| `premium` | Cost indicator for AI recommendations |
| `rating` | `Number` | No | `4.5` | Historical feedback score (1.0 – 5.0) |
| `isVerified` | `Boolean` | Yes | `false` | Admin verification flag |

- **Indexes:** `{ category: 1, city: 1 }`, `{ email: 1 }` (Unique)
- **Status:** Planned

---

### 2.9 `sponsors`
Commercial partners backing an event with financial or in-kind sponsorships.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Associated event |
| `name` | `String` | Yes | - | Company or brand name |
| `logoUrl` | `String` | Yes | - | High-res logo image URL |
| `tier` | `String` | Yes | `title` \| `platinum` \| `gold` \| `silver` \| `media` | Sponsorship package tier |
| `contributionAmount`|`Number`| No | `0` | Monetary sponsorship in INR |
| `websiteUrl` | `String` | No | null | Brand destination URL |

- **Indexes:** `{ eventId: 1, tier: 1 }`
- **Relationships:** `eventId` -> `events._id`.
- **Status:** Planned

---

### 2.10 `tasks`
Operational work items assigned to event staff members.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Target event |
| `title` | `String` | Yes | - | Actionable task title |
| `description` | `String` | No | null | Step-by-step instructions |
| `assignedTo` | `ObjectId` | No | Ref: `users` | Staff member assignee |
| `priority` | `String` | Yes | `low` \| `medium` \| `high` \| `critical` | Urgency level |
| `status` | `String` | Yes | `pending` \| `in_progress` \| `completed` \| `blocked` | Task execution state |
| `deadline` | `Date` | No | null | Target completion timestamp |
| `completedAt` | `Date` | No | null | Actual completion timestamp |

- **Indexes:** `{ eventId: 1, status: 1 }`, `{ assignedTo: 1 }`
- **Relationships:** `eventId` -> `events._id`, `assignedTo` -> `users._id`.
- **Status:** Planned

---

### 2.11 `notifications`
In-app and real-time alerts dispatched to users via Socket.IO.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `userId` | `ObjectId` | Yes | Ref: `users` | Recipient user |
| `title` | `String` | Yes | - | Notification headline |
| `body` | `String` | Yes | - | Alert message |
| `type` | `String` | Yes | `system` \| `event_update` \| `ticket_confirmed` \| `task_assigned` | Category tag |
| `linkUrl` | `String` | No | null | Click-through route |
| `isRead` | `Boolean` | Yes | `false` | Read receipt |
| `createdAt` | `Date` | Yes | `Date.now` | Creation timestamp |

- **Indexes:** `{ userId: 1, isRead: 1 }`, `{ createdAt: 1 }` (TTL index: 30 days)
- **Relationships:** `userId` -> `users._id`.
- **Status:** Planned

---

### 2.12 `feedback`
Post-event ratings, reviews, and satisfaction scores submitted by checked-in attendees.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Target event |
| `userId` | `ObjectId` | Yes | Ref: `users` | Attendee reviewer |
| `rating` | `Number` | Yes | 1 to 5 | Overall star rating |
| `categoryRatings`| `Object`| No | `{ content: 5, venue: 4, organization: 5 }` | Granular sub-scores |
| `comment` | `String` | No | null | Written qualitative review |
| `sentimentScore`| `Number`| No | null | AI analyzed polarity (-1.0 to +1.0) |
| `createdAt` | `Date` | Yes | `Date.now` | Submission timestamp |

- **Indexes:** `{ eventId: 1, userId: 1 }` (Unique: one review per user per event)
- **Relationships:** `eventId` -> `events._id`, `userId` -> `users._id`.
- **Status:** Planned

---

### 2.13 `aiPlans`
Cached AI generation artifacts (blueprints, schedules, budgets) produced by FastAPI.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | No | Ref: `events` | Associated event (if applied) |
| `organizerId` | `ObjectId` | Yes | Ref: `users` | Requesting organizer |
| `promptInputs` | `Object` | Yes | - | Stored input parameters (topic, attendees, budget) |
| `generatedSchedule`| `Array` | No | `[]` | Structured time-slot agenda JSON |
| `generatedBudget` | `Object` | No | `{}` | Cost breakdown categories |
| `isApplied` | `Boolean` | Yes | `false` | Whether organizer committed plan to event |
| `modelUsed` | `String` | Yes | `"gemini-1.5-flash"` \| `"llama-3-8b"` | LLM backbone name |
| `createdAt` | `Date` | Yes | `Date.now` | Generation timestamp |

- **Indexes:** `{ organizerId: 1 }`, `{ eventId: 1 }`
- **Relationships:** `organizerId` -> `users`, `eventId` -> `events`.
- **Status:** In Progress

---

### 2.14 `waitlists`
Queue of attendees waiting for ticket cancellations when an event sells out.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Target event |
| `userId` | `ObjectId` | Yes | Ref: `users` | Interested attendee |
| `tierId` | `String` | Yes | - | Desired tier ID |
| `position` | `Number` | Yes | - | Monotonically increasing queue position |
| `status` | `String` | Yes | `waiting` \| `offered` \| `expired` \| `claimed` | Waitlist queue state |
| `offeredAt` | `Date` | No | null | When seat was made available |
| `offerExpiresAt`| `Date` | No | null | Window (e.g., 2 hours) to purchase |

- **Indexes:** `{ eventId: 1, tierId: 1, position: 1 }`, `{ eventId: 1, userId: 1 }` (Unique)
- **Relationships:** `eventId` -> `events._id`, `userId` -> `users._id`.
- **Status:** Planned

---

### 2.15 `auditLogs`
Immutable security and administrative audit trail.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `userId` | `ObjectId` | No | Ref: `users` | Actor who performed action (null if system/webhook) |
| `action` | `String` | Yes | - | e.g. `USER_BANNED`, `EVENT_APPROVED`, `MANUAL_REFUND` |
| `targetCollection`|`String` | Yes | - | Collection affected (e.g., `events`, `payments`) |
| `targetId` | `ObjectId` | Yes | - | Record ID affected |
| `ipAddress` | `String` | No | null | Client IP address |
| `userAgent` | `String` | No | null | Browser / client identifier |
| `metadata` | `Object` | No | `{}` | Additional state diff or parameters |
| `timestamp` | `Date` | Yes | `Date.now` | Event timestamp |

- **Indexes:** `{ action: 1 }`, `{ targetId: 1 }`, `{ timestamp: -1 }`
- **Status:** Planned

---

### 2.16 `eventStaff`
Many-to-Many junction mapping users to events as operational gate/booth staff.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Target event |
| `userId` | `ObjectId` | Yes | Ref: `users` | Assigned staff user |
| `assignedGate` | `String` | No | `"Main Entrance"` | Check-in gate location |
| `roleDescription`|`String` | No | `"Ticket Scanner"` | Specific role briefing |
| `status` | `String` | Yes | `active` \| `revoked` | Staff authorization state |
| `assignedAt` | `Date` | Yes | `Date.now` | Assignment timestamp |

- **Indexes:** `{ eventId: 1, userId: 1 }` (Unique)
- **Relationships:** `eventId` -> `events._id`, `userId` -> `users._id`.
- **Status:** Planned

---

### 2.17 `eventVendors`
Many-to-Many junction tracking contracted vendors assigned to specific events.

| Field | Type | Required | Default / Enum | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary key |
| `eventId` | `ObjectId` | Yes | Ref: `events` | Target event |
| `vendorId` | `ObjectId` | Yes | Ref: `vendors` | Contracted vendor |
| `contractedAmount`|`Number`| Yes | `0` | Agreed contract cost in INR |
| `contractStatus`| `String` | Yes | `negotiating` \| `signed` \| `delivered` \| `paid` | Service fulfillment state |
| `assignedScope`| `String` | No | null | Specific services agreed |

- **Indexes:** `{ eventId: 1, vendorId: 1 }` (Unique)
- **Relationships:** `eventId` -> `events._id`, `vendorId` -> `vendors._id`.
- **Status:** Planned

---

## 3. Schema Change Log

| Version | Date | Collection | Change Summary | Author | Status |
| :---: | :---: | :--- | :--- | :--- | :---: |
| `v1.0.0` | 2026-11-16 | All 17 Collections | Initial schema design baseline published | Database Lead | Approved |
| `v1.0.1` | 2026-11-16 | `tickets` | Added `qrTokenHash` (`SHA-256`) to store hashed tokens rather than raw JWT | Integrations Lead | Approved |
| `v1.0.2` | 2026-11-16 | `payments` | Added `webhookEvents` string array to enforce idempotency on retried hooks | Backend Lead | Approved |
| `v1.0.3` | 2026-11-16 | `registrations` | Added TTL index on `expiresAt` for automatic cleanup of abandoned holds | Database Lead | Approved |
| `v1.0.4` | 2026-11-23 | `users`, `eventStaff`, `tickets` | Added `phone` to `users`, `gate` to `eventStaff`, `signedTicketToken` HMAC to `tickets`; removed convenience fees from checkout | Architect Lead | Approved |
