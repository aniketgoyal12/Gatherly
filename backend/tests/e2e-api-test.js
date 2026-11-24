/**
 * Gatherly Backend — 1-Click End-to-End API Test Runner
 * Runs all 35+ core API workflows sequentially across all 9 modules with automatic token & ID chaining.
 *
 * Usage:
 *   1. Ensure MongoDB is running & seeded (`npm run seed`)
 *   2. Start backend server (`npm run dev:server`)
 *   3. Run: `npm run test:api`
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const state = {
  organizerToken: '',
  adminToken: '',
  attendeeToken: '',
  staffToken: '',
  venueId: '',
  eventId: '',
  registrationId: '',
  qrToken: '',
  taskId: '',
  targetUserId: '',
  notificationId: '',
  aiPlanId: '',
};

let passed = 0;
let failed = 0;
const failures = [];

async function apiRequest(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ms = Date.now() - start;

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, json, ms };
}

async function runStep(name, fn) {
  try {
    const info = await fn();
    passed++;
    console.log(`${C.green}  ✅ PASS${C.reset} ${name} ${C.dim}${info ? `(${info})` : ''}${C.reset}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`${C.red}  ❌ FAIL${C.reset} ${name}`);
    console.log(`${C.red}          ↳ ${err.message}${C.reset}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function section(title) {
  console.log(`\n${C.cyan}${C.bold}━━━ ${title} ━━━${C.reset}`);
}

async function main() {
  console.log(`${C.bold}${C.cyan}\n🚀 Gatherly Backend — Complete 9-Phase E2E API Test Suite${C.reset}`);
  console.log(`${C.dim}Target: ${BASE_URL}${C.reset}`);

  // Quick connectivity check
  try {
    await fetch(`${BASE_URL}/health`);
  } catch (err) {
    console.log(`\n${C.red}${C.bold}❌ Cannot connect to backend at ${BASE_URL}${C.reset}`);
    console.log(`${C.yellow}Start the backend first in another terminal:${C.reset}`);
    console.log(`   npm run dev:server\n`);
    process.exit(1);
  }

  // PHASE 0: Health Check
  section('Phase 0: System Health & Gateway Status');
  await runStep('0.1 GET /health returns 200 OK', async () => {
    const { status, json, ms } = await apiRequest('GET', '/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json?.success === true, 'Expected success: true');
    return `${ms}ms`;
  });

  // PHASE 1: Auth (All 4 Seeded Roles)
  section('Phase 1: Authentication (4 Seeded Roles)');
  const rolesToLogin = [
    { key: 'organizerToken', label: '1.1 Login Organizer', email: 'organizer@gatherly.com' },
    { key: 'adminToken', label: '1.2 Login Super Admin', email: 'admin@gatherly.com' },
    { key: 'attendeeToken', label: '1.3 Login Attendee', email: 'attendee@gatherly.com' },
    { key: 'staffToken', label: '1.4 Login Staff', email: 'staff@gatherly.com' },
  ];

  for (const r of rolesToLogin) {
    await runStep(`${r.label} (${r.email})`, async () => {
      const { status, json, ms } = await apiRequest('POST', '/auth/login', {
        body: { email: r.email, password: 'Password@123' },
      });
      assert(
        status === 200,
        `Expected 200, got ${status} — ${json?.message || 'Did you run `npm run seed`?'}`
      );
      const token = json?.data?.accessToken;
      assert(typeof token === 'string' && token.length > 10, 'Missing accessToken');
      state[r.key] = token;
      return `${ms}ms`;
    });
  }

  await runStep('1.5 GET /auth/me verifies Organizer JWT', async () => {
    const { status, json, ms } = await apiRequest('GET', '/auth/me', {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json?.data?.user?.role === 'organizer', `Expected role organizer, got ${json?.data?.user?.role}`);
    return `${ms}ms`;
  });

  await runStep('1.6 POST /auth/forgot-password handles reset request', async () => {
    const { status, json, ms } = await apiRequest('POST', '/auth/forgot-password', {
      body: { email: 'attendee@gatherly.com' },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    assert(json?.success === true, 'Expected success: true');
    return `${ms}ms`;
  });

  // PHASE 2: AI Event Blueprint Studio
  section('Phase 2: AI Event Blueprint Studio (Workflow 1)');
  await runStep('2.1 POST /ai/generate-plan drafts comprehensive blueprint', async () => {
    const { status, json, ms } = await apiRequest('POST', '/ai/generate-plan', {
      token: state.organizerToken,
      body: {
        eventType: 'hackathon',
        targetAudience: 'developers',
        attendees: 300,
        budget: 200000,
        duration: '2 days',
        location: 'Main Auditorium',
        goals: 'Build prototype web and AI products',
      },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    assert(json?.data?.generatedPlan?.checklist?.length > 0, 'Missing generated checklist');
    return `${ms}ms`;
  });

  await runStep('2.2 POST /ai/approve-plan saves approved plan to database', async () => {
    const { status, json, ms } = await apiRequest('POST', '/ai/approve-plan', {
      token: state.organizerToken,
      body: {
        planType: 'comprehensive_event_blueprint',
        inputs: { eventType: 'hackathon', attendees: 300, budget: 200000 },
        generatedPlan: {
          checklist: ['Finalize venue agreement', 'Setup high-speed Wi-Fi network', 'Coordinate catering'],
          budgetSplit: { venue: 80000, catering: 60000, avAndTech: 40000, contingency: 20000 },
        },
        applyBudget: true,
      },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    state.aiPlanId = json?.data?.aiPlan?._id;
    return `${ms}ms`;
  });

  await runStep('2.3 POST /ai/predict-turnout returns ML attendance forecast', async () => {
    const { status, json, ms } = await apiRequest('POST', '/ai/predict-turnout', {
      token: state.organizerToken,
      body: { eventId: state.eventId || 'temp-preview-id' },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    assert(typeof json?.data?.predictedTurnoutRate === 'number', 'Expected numeric turnout rate');
    return `${ms}ms`;
  });

  // PHASE 3: Venue & Event Creation
  section('Phase 3: Venue & Event Lifecycle (Organizer)');
  await runStep('3.1 GET /venues lists available venues', async () => {
    const { status, json, ms } = await apiRequest('GET', '/venues');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.venues), 'Expected venues array');
    return `${ms}ms`;
  });

  await runStep('3.2 POST /venues creates Venue', async () => {
    const { status, json, ms } = await apiRequest('POST', '/venues', {
      token: state.organizerToken,
      body: {
        name: `E2E Test Auditorium ${Date.now()}`,
        address: 'Block C, Innovation Campus',
        capacity: 300,
        facilities: ['Projector', 'High-Speed WiFi', 'AC'],
      },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    state.venueId = json?.data?.venue?._id;
    assert(state.venueId, 'Missing venue._id');
    return `${ms}ms`;
  });

  await runStep('3.3 POST /events creates Event in draft state', async () => {
    const { status, json, ms } = await apiRequest('POST', '/events', {
      token: state.organizerToken,
      body: {
        title: `Gatherly E2E Summit ${Date.now()}`,
        description: 'Automated 1-click end-to-end API testing summit covering all core backend flows.',
        category: 'Technology',
        venueId: state.venueId,
        startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 8).toISOString(),
        capacity: 150,
        ticketPrice: 0,
      },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    assert(json?.data?.event?.status === 'draft', `Expected status draft, got ${json?.data?.event?.status}`);
    state.eventId = json?.data?.event?._id;
    assert(state.eventId, 'Missing event._id');
    return `${ms}ms`;
  });

  await runStep('3.4 PATCH /events/:id/submit moves Event to pending_approval', async () => {
    const { status, json, ms } = await apiRequest('PATCH', `/events/${state.eventId}/submit`, {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    assert(
      json?.data?.event?.status === 'pending_approval',
      `Expected pending_approval, got ${json?.data?.event?.status}`
    );
    return `${ms}ms`;
  });

  // PHASE 4: Admin RBAC & Governance
  section('Phase 4: Super Admin Governance & RBAC Security');
  await runStep('4.1 [RBAC] Attendee blocked from /admin/pending-events (403)', async () => {
    const { status, ms } = await apiRequest('GET', '/admin/pending-events', {
      token: state.attendeeToken,
    });
    assert(status === 403, `Expected 403 Forbidden, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('4.2 GET /admin/pending-events returns queue for Super Admin', async () => {
    const { status, ms } = await apiRequest('GET', '/admin/pending-events', {
      token: state.adminToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('4.3 PATCH /events/:id/review approves & publishes Event', async () => {
    const { status, json, ms } = await apiRequest('PATCH', `/events/${state.eventId}/review`, {
      token: state.adminToken,
      body: { action: 'approve' },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    assert(json?.data?.event?.status === 'published', `Expected published, got ${json?.data?.event?.status}`);
    return `${ms}ms`;
  });

  await runStep('4.4 GET /admin/users returns platform user directory', async () => {
    const { status, json, ms } = await apiRequest('GET', '/admin/users', {
      token: state.adminToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.users), 'Expected users array');
    const nonAdmin = json?.data?.users?.find((u) => u.role !== 'super_admin');
    if (nonAdmin) state.targetUserId = nonAdmin._id;
    return `${ms}ms`;
  });

  if (state.targetUserId) {
    await runStep('4.5 PATCH /admin/users/:id/status suspends user account', async () => {
      const { status, json, ms } = await apiRequest('PATCH', `/admin/users/${state.targetUserId}/status`, {
        token: state.adminToken,
        body: { accountStatus: 'suspended' },
      });
      assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
      assert(json?.data?.user?.accountStatus === 'suspended', 'Expected accountStatus suspended');
      return `${ms}ms`;
    });

    await runStep('4.6 PATCH /admin/users/:id/status reactivates user account', async () => {
      const { status, json, ms } = await apiRequest('PATCH', `/admin/users/${state.targetUserId}/status`, {
        token: state.adminToken,
        body: { accountStatus: 'active' },
      });
      assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
      assert(json?.data?.user?.accountStatus === 'active', 'Expected accountStatus active');
      return `${ms}ms`;
    });
  }

  // PHASE 5: Attendee Discovery & Booking
  section('Phase 5: Attendee Discovery & Ticket Booking');
  await runStep('5.1 GET /events?category=Technology public discovery works', async () => {
    const { status, json, ms } = await apiRequest('GET', '/events?category=Technology');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.events), 'Expected events array');
    return `${ms}ms`;
  });

  await runStep('5.2 GET /events/:id returns full event details', async () => {
    const { status, json, ms } = await apiRequest('GET', `/events/${state.eventId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json?.data?.event?._id === state.eventId, 'Expected matching event ID');
    return `${ms}ms`;
  });

  await runStep('5.3 POST /registrations/reserve issues free ticket + rawQrToken', async () => {
    const { status, json, ms } = await apiRequest('POST', '/registrations/reserve', {
      token: state.attendeeToken,
      body: { eventId: state.eventId, ticketType: 'free' },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    state.registrationId = json?.data?.registration?._id;
    state.qrToken = json?.data?.ticket?.rawQrToken;
    assert(state.qrToken, 'Missing rawQrToken in response');
    return `${ms}ms`;
  });

  await runStep('5.4 [Security] Duplicate booking blocked with 409 Conflict', async () => {
    const { status, ms } = await apiRequest('POST', '/registrations/reserve', {
      token: state.attendeeToken,
      body: { eventId: state.eventId, ticketType: 'free' },
    });
    assert(status === 409, `Expected 409 Conflict, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('5.5 GET /tickets/my-tickets returns attendee tickets', async () => {
    const { status, ms } = await apiRequest('GET', '/tickets/my-tickets', {
      token: state.attendeeToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('5.6 GET /registrations/my returns attendee registrations', async () => {
    const { status, ms } = await apiRequest('GET', '/registrations/my', {
      token: state.attendeeToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  // PHASE 6: QR Check-In & Anti-Fraud
  section('Phase 6: Gate QR Check-In & Anti-Fraud Tests');
  await runStep('6.1 GET /tickets/staff/assigned-events checks staff schedule', async () => {
    const { status, json, ms } = await apiRequest('GET', '/tickets/staff/assigned-events', {
      token: state.staffToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.events), 'Expected events array');
    return `${ms}ms`;
  });

  await runStep('6.2 POST /tickets/check-in accepts valid QR on 1st scan', async () => {
    const { status, json, ms } = await apiRequest('POST', '/tickets/check-in', {
      token: state.organizerToken,
      body: { qrToken: state.qrToken, eventId: state.eventId },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('6.3 [Anti-Fraud] Duplicate QR re-scan rejected (400/409)', async () => {
    const { status, ms } = await apiRequest('POST', '/tickets/check-in', {
      token: state.organizerToken,
      body: { qrToken: state.qrToken, eventId: state.eventId },
    });
    assert([400, 409].includes(status), `Expected 400 or 409, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('6.4 [Anti-Fraud] Fake/tampered QR token rejected (400/404)', async () => {
    const { status, ms } = await apiRequest('POST', '/tickets/check-in', {
      token: state.organizerToken,
      body: { qrToken: 'FAKE_TAMPERED_TOKEN_99999', eventId: state.eventId },
    });
    assert([400, 404].includes(status), `Expected 400 or 404, got ${status}`);
    return `${ms}ms`;
  });

  // PHASE 7: Budget, Tasks & Operations
  section('Phase 7: Organizer Budget, Tasks & Operations');
  await runStep('7.1 GET /events/:eventId/budget returns budget overview', async () => {
    const { status, ms } = await apiRequest('GET', `/events/${state.eventId}/budget`, {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('7.2 POST /events/budget configures event budget', async () => {
    const { status, json, ms } = await apiRequest('POST', '/events/budget', {
      token: state.organizerToken,
      body: {
        eventId: state.eventId,
        totalBudget: 180000,
        expenseCategories: [
          { category: 'venue', allocatedAmount: 70000 },
          { category: 'catering', allocatedAmount: 50000 },
          { category: 'avAndTech', allocatedAmount: 40000 },
          { category: 'contingency', allocatedAmount: 20000 },
        ],
      },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('7.3 POST /events/budget/expense logs actual expense', async () => {
    const { status, json, ms } = await apiRequest('POST', '/events/budget/expense', {
      token: state.organizerToken,
      body: {
        eventId: state.eventId,
        title: 'Stage Lighting & Mic Setup',
        amount: 35000,
        category: 'avAndTech',
      },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('7.4 POST /tasks creates event task', async () => {
    const { status, json, ms } = await apiRequest('POST', '/tasks', {
      token: state.organizerToken,
      body: {
        eventId: state.eventId,
        title: 'Print QR Standees for Gate A',
        priority: 'high',
      },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    state.taskId = json?.data?.task?._id;
    assert(state.taskId, 'Missing task._id');
    return `${ms}ms`;
  });

  await runStep('7.5 PATCH /tasks/:id/status marks task completed', async () => {
    const { status, json, ms } = await apiRequest('PATCH', `/tasks/${state.taskId}/status`, {
      token: state.organizerToken,
      body: { status: 'completed' },
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('7.6 GET /registrations returns event roster for organizer', async () => {
    const { status, json, ms } = await apiRequest('GET', `/registrations?eventId=${state.eventId}`, {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.registrations), 'Expected registrations array');
    return `${ms}ms`;
  });

  await runStep('7.7 GET /admin/analytics/event/:eventId returns analytics', async () => {
    const { status, json, ms } = await apiRequest('GET', `/admin/analytics/event/${state.eventId}`, {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  // PHASE 8: Feedback, Notifications & Audit Logs
  section('Phase 8: Completion, Feedback, Notifications & Audit Logs');
  await runStep('8.1 PATCH /events/:id/complete marks event completed', async () => {
    const { status, json, ms } = await apiRequest('PATCH', `/events/${state.eventId}/complete`, {
      token: state.organizerToken,
    });
    assert(status === 200, `Expected 200, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('8.2 POST /feedback submits attendee rating & review', async () => {
    const { status, json, ms } = await apiRequest('POST', '/feedback', {
      token: state.attendeeToken,
      body: {
        eventId: state.eventId,
        rating: 5,
        review: 'Super smooth QR check-in and well-organized summit!',
      },
    });
    assert(status === 201, `Expected 201, got ${status} — ${json?.message}`);
    return `${ms}ms`;
  });

  await runStep('8.3 GET /feedback/event/:eventId retrieves event review stream', async () => {
    const { status, json, ms } = await apiRequest('GET', `/feedback/event/${state.eventId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json?.data?.reviews), 'Expected reviews array');
    return `${ms}ms`;
  });

  await runStep('8.4 GET /notifications fetches attendee notifications', async () => {
    const { status, json, ms } = await apiRequest('GET', '/notifications', {
      token: state.attendeeToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    if (json?.data?.notifications?.length > 0) {
      state.notificationId = json.data.notifications[0]._id;
    }
    return `${ms}ms`;
  });

  await runStep('8.5 PATCH /notifications/read-all marks all notifications read', async () => {
    const { status, json, ms } = await apiRequest('PATCH', '/notifications/read-all', {
      token: state.attendeeToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  await runStep('8.6 GET /admin/audit-logs fetches security audit trail', async () => {
    const { status, ms } = await apiRequest('GET', '/admin/audit-logs', {
      token: state.adminToken,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    return `${ms}ms`;
  });

  // FINAL SUMMARY
  const total = passed + failed;
  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  if (failed === 0) {
    console.log(`${C.green}${C.bold}🎉 ALL ${passed}/${total} API TESTS PASSED (100% GREEN)!${C.reset}`);
  } else {
    console.log(`${C.red}${C.bold}⚠️  ${passed}/${total} PASSED, ${failed} FAILED${C.reset}`);
    for (const f of failures) {
      console.log(`   - ${f.name}: ${f.error}`);
    }
  }
  console.log(`${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

main();
