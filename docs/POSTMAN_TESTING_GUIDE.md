# Postman API Testing Guide — Gatherly Backend

> **Collection File:** [Gatherly_API_Collection.json](../backend/postman/Gatherly_API_Collection.json)  
> **Base URL:** `http://localhost:5000/api/v1`

---

## 1. Testing Kab Karni Hai? (When to Run Tests)

Run this Postman suite at these **3 key moments**:
1. **Before Every Backend Push / PR:** Verify none of the core workflows broke.
2. **After Pulling Latest `main`:** Confirm your local `.env`, MongoDB, and routes work cleanly.
3. **Before College Viva / Demo:** Run **Collection Runner** once to verify all 28 API requests pass (`100% Green`).

---

## 2. Pre-Requisites (Test Start Karne Se Pehle)

1. Ensure `backend/.env` exists with a valid `MONGO_URI` and JWT secrets.
2. Seed the database once with demo accounts (`organizer@gatherly.com`, `admin@gatherly.com`, `attendee@gatherly.com`, `staff@gatherly.com` — password: `Password@123`):
   ```powershell
   npm run seed
   ```
3. Start the backend Express server:
   ```powershell
   npm run dev:server
   ```
   *(Server should print: `Base API endpoint: http://localhost:5000/api/v1`)*

---

## 3. Postman Mein Import & Run Kaise Karein?

### Step 1: Import Collection
1. Open **Postman** desktop app.
2. Click **Import** (top-left) → Select `backend/postman/Gatherly_API_Collection.json`.
3. Collection **"Gatherly Backend API — End-to-End Test Suite"** sidebar mein dikh jayega.

### Step 2: Zero Manual Copy-Paste!
Is collection ke har request ke andar **automated Postman Test Scripts** likhe hain jo automatically:
- Login tokens (`organizerToken`, `adminToken`, `attendeeToken`, `staffToken`) save karte hain.
- Created IDs (`venueId`, `eventId`, `registrationId`, `taskId`) aur generated `qrToken` ko next requests mein auto-inject karte hain.

### Step 3: Run Order (Option A — 1-Click Automated Runner)
1. Collection name pe hover karke **`...` → Run collection** click karein.
2. Delay `200ms` set karein (rate limiter avoid karne ke liye).
3. **Run Gatherly Backend API** button dabayein.
4. Saare **28 API requests & automated assertions** sequential order mein execute honge!

---

## 4. Exact Testing Sequence (Option B — Manual Step-by-Step)

Agar aap manually ek-ek request check karna chahte hain, toh **isi order mein** run karein:

| Phase | Requests to Run | Kya Verify Hota Hai |
| :---: | :--- | :--- |
| **Phase 0** | `0.1 API Gateway Health Check` | Server live hai (`200 OK`) |
| **Phase 1** | `1.1` to `1.5` (Login all 4 roles + `/auth/me`) | JWT tokens generate & auto-save hote hain |
| **Phase 2** | `2.1 Create Venue` → `2.2 Create Event` → `2.3 Submit Event` | Event `draft` → `pending_approval` state transition |
| **Phase 3** | `3.1 Attendee 403 Test` → `3.2 Pending Queue` → `3.3 Approve Event` | RBAC security (`403`) + Admin publishes event (`published`) |
| **Phase 4** | `4.1 Discovery` → `4.2 Reserve Free Ticket` → `4.3 Duplicate 409` → `4.4 My Tickets` | Capacity check, duplicate booking block, SHA-256 QR token issued |
| **Phase 5** | `5.1 Valid QR Scan` → `5.2 Duplicate QR Block` → `5.3 Invalid QR Block` | Single-use QR check-in security verified |
| **Phase 6** | `6.1 Set Budget` → `6.2 Add Expense` → `6.3 Create Task` → `6.4 Complete Task` → `6.5 Analytics` | Financial tracking, Kanban task flow, revenue/turnout analytics |
| **Phase 7** | `7.1 Complete Event` → `7.2 Submit Feedback` → `7.3 Notifications` → `7.4 Audit Logs` | End-of-lifecycle feedback sentiment, notifications & tamper-proof audit trail |

---

## 5. Common Troubleshooting

| Error | Reason | Fix |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:5000` | Backend server band hai | `npm run dev:server` run karein |
| `401 Invalid credentials` on Login | Seed script run nahi kiya | `npm run seed` run karein |
| `429 Too Many Requests` | Rate limiter triggered (rapid clicks) | 1 minute wait karein ya Runner mein `200ms` delay rakhein |
| `409 Already registered` on `4.2` | Same event pe dobara run kiya | Phase 2 (`2.2 Create Event`) se fresh event bana ke run karein |
