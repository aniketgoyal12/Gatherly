# Environment Configuration & Local Setup Guide: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Backend & DevOps Lead  
> **Security Rule:** **NEVER commit real keys or secrets to Git.** All `.env` files are ignored via `.gitignore`.

---

## 1. Environment Variables Reference

### 1.1 Backend Service (`backend/.env` / `server/.env`)

| Variable Name | Placeholder / Sample Value | Required | Purpose |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | `development` | Yes | App runtime mode (`development` / `production` / `test`) |
| `PORT` | `5000` | Yes | HTTP port for Express server |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster0.mongodb.net/gatherly?retryWrites=true&w=majority` | Yes | MongoDB Atlas or local connection URI |
| `JWT_ACCESS_SECRET` | `your_super_secret_access_jwt_key_32_chars_min` | Yes | Secret used to sign 15-minute access tokens |
| `JWT_REFRESH_SECRET`| `your_super_secret_refresh_jwt_key_64_chars_min` | Yes | Secret used to sign 7-day refresh tokens |
| `CLIENT_URL` | `http://localhost:5173` | Yes | Whitelisted frontend origin for CORS & cookies |
| `RAZORPAY_KEY_ID` | `rzp_test_placeholderKeyId123` | Yes | Razorpay Test Mode Key ID |
| `RAZORPAY_KEY_SECRET` | `placeholderRazorpaySecretKey456` | Yes | Razorpay Test Mode Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `placeholderWebhookSecret789` | Yes | Secret to verify HMAC SHA-256 webhook signatures |
| `AI_SERVICE_URL` | `http://localhost:8000` | Yes | Base URL of local Python FastAPI microservice |
| `AI_SERVICE_SECRET`| `internal_microservice_shared_secret_token` | Yes | Bearer token for inter-service communication |
| `QR_HMAC_SECRET` | `secret_for_signing_qr_code_payloads_32_chars` | Yes | Cryptographic salt used for hashing ticket tokens |

---

### 1.2 AI Microservice (`ai-service/.env`)

| Variable Name | Placeholder / Sample Value | Required | Purpose |
| :--- | :--- | :---: | :--- |
| `ENVIRONMENT` | `development` | Yes | Environment (`development` / `production`) |
| `PORT` | `8000` | Yes | Uvicorn server port |
| `GEMINI_API_KEY` | `AIzaSyPlaceholderGeminiApiKey12345` | Yes | Google Gemini API key for itinerary & budget generation |
| `GROQ_API_KEY` | `gsk_placeholderGroqApiKey67890` | No | Optional high-speed LLM fallback (Llama-3-70b) |
| `INTERNAL_API_SECRET` | `internal_microservice_shared_secret_token` | Yes | Must match `AI_SERVICE_SECRET` in backend |

---

### 1.3 Client Application (`frontend/.env` / `client/.env`)

| Variable Name | Placeholder / Sample Value | Required | Purpose |
| :--- | :--- | :---: | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Yes | Base URL for REST API calls |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Yes | WebSocket endpoint for real-time notifications |
| `VITE_RAZORPAY_KEY_ID`| `rzp_test_placeholderKeyId123` | Yes | Public Razorpay Test Key for checkout modal |

---

## 2. Step-by-Step Developer Onboarding

### 2.1 Node.js & Backend Setup
1. Verify Node.js version:
   ```bash
   node -v   # Should output v18.x or v20.x
   npm -v
   ```
2. In the `backend` directory, create your local `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

### 2.2 MongoDB Atlas Free Tier Setup
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox cluster** in your nearest region.
3. Under **Database Access**, create a user `gatherly_dev` with password (store securely).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) for local dev.
5. Click **Connect** -> **Drivers (Node.js)** and copy connection string.
6. Paste into `backend/.env` under `MONGO_URI`.

### 2.3 Razorpay Test Mode Setup
1. Sign up for free at [Razorpay](https://razorpay.com).
2. Ensure top-right toggle is set to **Test Mode**.
3. Navigate to **Account & Settings** -> **API Keys** -> **Generate Key**.
4. Copy `Key Id` and `Key Secret` into both `backend/.env` and `frontend/.env`.
5. For webhooks during local testing:
   - Install `ngrok` (`npm install -g ngrok` or download binary).
   - Run `ngrok http 5000`.
   - Copy the forwarding HTTPS URL (e.g. `https://abc.ngrok-free.app`).
   - In Razorpay Dashboard -> **Webhooks**, add webhook: `https://abc.ngrok-free.app/api/v1/payments/webhook`.
   - Select events: `payment.captured`, `payment.failed`, `refund.processed`.
   - Set secret and paste into `RAZORPAY_WEBHOOK_SECRET`.

### 2.4 AI Service (Python FastAPI) Setup
1. Verify Python 3.10 or 3.11:
   ```bash
   python --version
   ```
2. Navigate to `ai-service`:
   ```bash
   cd ai-service
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows PowerShell: `.\venv\Scripts\Activate.ps1`
   - Linux/Mac / Git Bash: `source venv/bin/activate`
4. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Get a free Google Gemini API key at [Google AI Studio](https://aistudio.google.com/) and paste into `ai-service/.env`.
6. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Visit `http://localhost:8000/docs` to test interactive Swagger documentation.
