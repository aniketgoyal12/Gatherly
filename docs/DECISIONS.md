# Architecture Decision Records (ADR): Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Senior Engineering Lead & System Architect  
> **Format:** Lightweight ADR Log (Context, Decision, Consequences)

---

## Decision Summary Table

| ID | Date | Decision | Status | Decided By | Core Reason |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `ADR-001` | 2026-11-16 | Adopt MERN Stack for Core Platform | Accepted | Team Consensus | Rapid prototyping, rich ecosystem, and unified JavaScript/TypeScript. |
| `ADR-002` | 2026-11-16 | Separate Python FastAPI Microservice for AI/ML | Accepted | AI/ML & Backend Leads | Direct access to Python ML/LLM ecosystem without blocking Node.js event loop. |
| `ADR-003` | 2026-11-16 | Use Razorpay Test Mode with Server Signature Verification | Accepted | Integrations Lead | Standardized Indian payment gateway, rich test credentials, and UPI support. |
| `ADR-004` | 2026-11-16 | Stateless JWT Authentication with HTTP-Only Cookies | Accepted | Backend Lead | Protection against XSS token theft while enabling scalable horizontal auth. |
| `ADR-005` | 2026-11-16 | Atomic MongoDB Updates (`$inc`) to Prevent Overselling | Accepted | Database & Backend Leads | Eliminates concurrency race conditions on final seat reservations without heavy locks. |
| `ADR-006` | 2026-11-16 | Webhook Idempotency via Unique Event ID & Database Logging | Accepted | Integrations Lead | Prevents duplicate ticket issuance and double captures during network retries. |
| `ADR-007` | 2026-11-16 | QR Code Tokens Stored Hashed (`SHA-256`) | Accepted | Integrations & QA Leads | Mitigates database breach risk by preventing attackers from forging gate check-ins. |
| `ADR-008` | 2026-11-16 | Socket.IO for Real-Time Notification & Check-in Streams | Accepted | Backend Lead | Bi-directional, event-driven communication with fallback support for mobile browsers. |

---

## Detailed Records

### ADR-001: MERN Stack for Core Application
- **Context:** The college major project requires building a full-stack platform supporting rich dashboards, responsive mobile scanning, and scalable REST APIs within a 12-week timeline.
- **Decision:** Build client with React 18 (Vite, TypeScript, Tailwind CSS) and server with Node.js 18+ (Express 5, Mongoose ODM, MongoDB Atlas).
- **Consequences:**
  - *Pros:* High code reuse between frontend and backend; massive open-source library support; fast onboarding for all 6 team members.
  - *Cons:* Heavy reliance on single-threaded event loop for Node; CPU-bound tasks must be offloaded to external services.

---

### ADR-002: Separate Python FastAPI Microservice for AI/ML
- **Context:** Event schedule generation, automated budget calculations, and turnout predictions require Python ML libraries (`scikit-learn`, `numpy`, `pandas`) and LangChain/LLM integrations. Node.js lacks native mature equivalents.
- **Decision:** Spin up an independent FastAPI microservice running on port 8000, communicating with Express backend via internal REST HTTP calls.
- **Consequences:**
  - *Pros:* Native asynchronous performance (`asyncio`), auto-generated Swagger OpenAPI docs, clean separation of concerns.
  - *Cons:* Requires managing two runtime environments (Node + Python venv); network latency between Node and FastAPI (mitigated by local network communication and caching in `aiPlans`).

---

### ADR-003: Razorpay in Test Mode for Payment Processing
- **Context:** The application handles paid event tickets with Indian currency (INR) and payment methods (UPI, Cards, NetBanking).
- **Decision:** Integrate Razorpay Standard Checkout in Test Mode. The backend creates orders via Razorpay REST API, the client collects payments using the Razorpay JS SDK modal, and confirmation is handled via both client-side signature verification and server-to-server webhook ingestion.
- **Consequences:**
  - *Pros:* Generates realistic test payments without financial liability; robust webhook events (`payment.captured`, `refund.processed`).
  - *Cons:* Requires a public callback URL (using `ngrok` or `localtunnel` in local development).

---

### ADR-004: Stateless JWT Authentication with HTTP-Only Cookies
- **Context:** The platform has 4 distinct user roles requiring fast role verification on every API request. Storing access tokens in browser `localStorage` leaves tokens vulnerable to Cross-Site Scripting (XSS).
- **Decision:** Implement dual-token JWT:
  1. Short-lived Access Token (15 min lifespan) transmitted via `Authorization: Bearer` or secure HTTP-only cookie.
  2. Long-lived Refresh Token (7 days lifespan) stored in MongoDB (`users.refreshTokenHash`) and transmitted via secure, same-site HTTP-only cookie to `/api/v1/auth/refresh-token`.
- **Consequences:**
  - *Pros:* Eliminates client-side JavaScript access to tokens; prevents token theft via XSS; revocation possible on server via DB refresh hash.
  - *Cons:* Requires CSRF protection mechanisms and handling token refresh logic on the frontend.

---

### ADR-005: Atomic MongoDB Updates (`$inc`) to Prevent Overselling
- **Context:** When multiple attendees attempt to book the final remaining ticket for a popular event simultaneously, simple read-then-write logic causes race conditions leading to overselling beyond venue capacity.
- **Decision:** Enforce atomic inventory deductions at the database engine level using MongoDB `findOneAndUpdate` with a query filter requiring available inventory:
  ```javascript
  const event = await Event.findOneAndUpdate(
    { 
      _id: eventId, 
      "ticketTiers._id": tierId, 
      "ticketTiers.remaining": { $gte: quantity } 
    },
    { 
      $inc: { 
        "ticketTiers.$.remaining": -quantity,
        remainingCapacity: -quantity 
      } 
    },
    { new: true }
  );
  if (!event) throw new Error("CAPACITY_EXCEEDED");
  ```
- **Consequences:**
  - *Pros:* Lock-free, completely safe under extreme concurrent requests, zero overselling.
  - *Cons:* If payment fails subsequently, the backend must run a compensatory rollback (`$inc` back).

---

### ADR-006: Webhook Idempotency via Unique Event ID & Transaction Logging
- **Context:** Razorpay retries webhook delivery up to 24 hours if the recipient server fails to respond with `200 OK` or if a network hiccup occurs. Duplicate webhooks can cause duplicate tickets to be issued to the attendee.
- **Decision:** Store every incoming Razorpay webhook `event_id` in the `payments.webhookEvents` array. The webhook handler wraps processing in a check:
  ```javascript
  if (payment.webhookEvents.includes(webhookEventId)) {
    return res.status(200).json({ received: true, note: "Duplicate ignored" });
  }
  ```
- **Consequences:**
  - *Pros:* Absolute guarantee against duplicate ticket generation and repeated balance increments.
  - *Cons:* Requires an additional read/write to the `payments` collection per webhook.

---

### ADR-007: QR Code Tokens Stored Hashed (`SHA-256`)
- **Context:** QR codes encode attendee tickets. If an unauthorized actor extracts raw ticket tokens from the database, they could forge QR codes and gain unauthorized event entry.
- **Decision:** The raw QR code payload is a cryptographically signed JWT containing `{ ticketId, eventId, salt }`. In the database `tickets` collection, only the `SHA-256` hash of this token is saved (`qrTokenHash`). When scanned, staff scanner sends the token; the backend hashes it and verifies `hash(input) === ticket.qrTokenHash`.
- **Consequences:**
  - *Pros:* Even if the database is leaked or dumped, attackers cannot regenerate valid gate QR codes.
  - *Cons:* Minor CPU overhead for hashing tokens upon gate verification (~0.1ms).

---

### ADR-008: Socket.IO for Real-Time Notification & Check-in Streams
- **Context:** Event organizers need instant check-in count updates on gate screens, and attendees need immediate notifications if an event schedule shifts.
- **Decision:** Attach Socket.IO to the Express HTTP server, grouping connections into event-specific rooms (e.g. `event_<id>_organizers` and `event_<id>_attendees`).
- **Consequences:**
  - *Pros:* Real-time, bi-directional event communication with automatic WebSocket-to-polling fallback.
  - *Cons:* Sticky sessions required if horizontally scaling behind multiple Node process instances.
