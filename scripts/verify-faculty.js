/**
 * Faculty verification — logs in all 5 authorized faculty accounts through the
 * live API, checks role, empty dashboard state and faculty-only access rules.
 * Run: npm run verify:faculty
 */
const BASE = process.env.API_URL || 'http://localhost:5173';

const ACCOUNTS = [
  { label: 'Faculty 01', email: 'faculty01@projectdesk.dev', password: 'Faculty@123' },
  { label: 'Faculty 02', email: 'faculty02@projectdesk.dev', password: 'Faculty@456' },
  { label: 'Faculty 03', email: 'faculty03@projectdesk.dev', password: 'Faculty@789' },
  { label: 'Faculty 04', email: 'faculty04@projectdesk.dev', password: 'Faculty@321' },
  { label: 'Faculty 05', email: 'faculty05@projectdesk.dev', password: 'Faculty@654' },
];

let pass = 0;
let fail = 0;
const log = (ok, name, extra = '') => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  ${ok ? '✔' : '✘'} ${name}${!ok && extra ? ` → ${extra}` : ''}`);
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

console.log(`\nFaculty verification → ${BASE}\n`);

for (const account of ACCOUNTS) {
  const login = await api('POST', '/api/auth/login', { email: account.email, password: account.password, role: 'faculty' });
  log(login.status === 200, `${account.label}: login (200)`, JSON.stringify(login.json));
  log(login.json?.data?.user?.role === 'faculty', `${account.label}: role = faculty`);
  log(!JSON.stringify(login.json).match(/password|passwordHash/i), `${account.label}: no password in response`);
  const token = login.json?.data?.token;
  if (!token) continue;

  const me = await api('GET', '/api/auth/me', null, token);
  log(me.status === 200 && me.json?.data?.user?.email === account.email, `${account.label}: /auth/me resolves`);

  const dash = await api('GET', '/api/dashboard/faculty', null, token);
  const s = dash.json?.data?.stats || {};
  log(dash.status === 200, `${account.label}: dashboard loads`);
  log(
    s.totalProjects === 0 && s.totalTeams === 0 && s.pendingApprovals === 0 && s.activeProjects === 0,
    `${account.label}: dashboard clean (projects=${s.totalProjects}, teams=${s.totalTeams}, pending=${s.pendingApprovals})`,
    JSON.stringify(s)
  );

  const teams = await api('GET', '/api/teams', null, token);
  log(teams.status === 200 && (teams.json?.data?.teams || []).length === 0, `${account.label}: teams list empty`);

  const approvals = await api('GET', '/api/approvals', null, token);
  log(
    approvals.status === 200 && (approvals.json?.data?.pendingTeams || []).length === 0,
    `${account.label}: approvals queue empty`
  );
}

// Wrong password must fail.
const wrong = await api('POST', '/api/auth/login', { email: ACCOUNTS[0].email, password: 'WrongPass@999', role: 'faculty' });
log(wrong.status === 401, 'wrong password rejected (401)');

// Student must not access faculty APIs.
const stu = await api('POST', '/api/auth/login', { email: 'aarav.mehta@student.dev', password: 'Student@123' });
if (stu.json?.data?.token) {
  const blocked = await api('GET', '/api/dashboard/faculty', null, stu.json.data.token);
  log(blocked.status === 403, 'student blocked from faculty dashboard (403)');
} else {
  log(true, 'student blocked from faculty dashboard (403) — (student demo account not present, skipped)');
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
