/**
 * Registration & auth verification against the LIVE dev server.
 * Exercises valid/invalid/duplicate registration, login and /me.
 * Run: node scripts/verify-registration.js
 */
const BASE = process.env.API_URL || 'http://localhost:5173'; // through the Vite proxy, like the real app

const run = Date.now().toString(36).slice(-6);
let pass = 0;
let fail = 0;
const log = (ok, name, extra = '') => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  ${ok ? '✔' : '✘'} ${name}${extra && !ok ? ` → ${extra}` : ''}`);
};

async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch { /* ignore */ }
  return { status: res.status, json };
}

console.log(`\nRegistration verification → ${BASE}\n`);

// 1. Valid student registration
const email = `verify_${run}@pdtest.dev`;
const r1 = await api('POST', '/api/auth/register', {
  firstName: 'Verify',
  lastName: 'Run',
  email,
  password: 'Passw0rd1',
});
log(r1.status === 201 && r1.json?.data?.token && r1.json?.data?.user?.role === 'student', 'valid student registration (201 + token)', JSON.stringify(r1.json));
const token = r1.json?.data?.token;

// 2. Duplicate email
const r2 = await api('POST', '/api/auth/register', {
  firstName: 'Verify', lastName: 'Dup', email, password: 'Passw0rd1',
});
log(r2.status === 409 && /already exists/i.test(r2.json?.message || ''), 'duplicate email → 409 friendly message', JSON.stringify(r2.json));

// 3. Missing fields
const r3 = await api('POST', '/api/auth/register', { firstName: '', lastName: 'X', email: 'bad', password: 'short' });
log(r3.status === 400 && Array.isArray(r3.json?.details) && r3.json.details.length >= 3, 'invalid data → 400 with field details', JSON.stringify(r3.json));

// 4. Weak password
const r4 = await api('POST', '/api/auth/register', {
  firstName: 'Weak', lastName: 'Pw', email: `weak_${run}@pdtest.dev`, password: 'abcdefgh',
});
log(r4.status === 400, 'weak password (no number) → 400', JSON.stringify(r4.json));

// 5. Invalid email format
const r5 = await api('POST', '/api/auth/register', {
  firstName: 'Bad', lastName: 'Email', email: 'not-an-email', password: 'Passw0rd1',
});
log(r5.status === 400, 'invalid email → 400', JSON.stringify(r5.json));

// 6. Login with the created account
const r6 = await api('POST', '/api/auth/login', { email, password: 'Passw0rd1', role: 'student' });
log(r6.status === 200 && r6.json?.data?.token, 'login with created account (200)', JSON.stringify(r6.json));

// 7. Wrong password
const r7 = await api('POST', '/api/auth/login', { email, password: 'WrongPass1' });
log(r7.status === 401 && /invalid email or password/i.test(r7.json?.message || ''), 'wrong password → 401', JSON.stringify(r7.json));

// 8. /api/auth/me with the token
const r8 = await api('GET', '/api/auth/me', null, token);
log(r8.status === 200 && r8.json?.data?.user?.email === email, 'GET /api/auth/me resolves user', JSON.stringify(r8.json));

// 9. /api/auth/me without token
const r9 = await api('GET', '/api/auth/me');
log(r9.status === 401, 'GET /api/auth/me without token → 401', JSON.stringify(r9.json));

// 10. Garbage token
const r10 = await api('GET', '/api/auth/me', null, 'garbage.token.here');
log(r10.status === 401 && /log in/i.test(r10.json?.message || ''), 'garbage token → 401 friendly message', JSON.stringify(r10.json));

// 11. Faculty portal separation (authorized faculty account)
const r11 = await api('POST', '/api/auth/login', { email: 'faculty01@projectdesk.dev', password: 'Faculty@123', role: 'faculty' });
log(r11.status === 200 && r11.json?.data?.user?.role === 'faculty', 'faculty login works', JSON.stringify(r11.json));

// 12. Student cannot login via faculty portal
const r12 = await api('POST', '/api/auth/login', { email, password: 'Passw0rd1', role: 'faculty' });
log(r12.status === 403, 'student blocked from faculty portal → 403', JSON.stringify(r12.json));

// 13. Role protection: student token on faculty API
const r13 = await api('GET', '/api/dashboard/faculty', null, token);
log(r13.status === 403, 'student blocked from faculty dashboard API → 403', JSON.stringify(r13.json));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
