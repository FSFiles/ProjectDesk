/**
 * ProjectDesk API integration tests.
 * Runs against a live server on API_URL (default http://localhost:5000)
 * and the database named in that server's MONGO_URI (test database isolated
 * with a `pdtest_` prefix per run).
 *
 * Usage: npm test        (inside server/, with the API running)
 */
const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_NAME = process.env.DB_NAME || 'projectdesk';

let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    results.push(`  ✔ ${name}`);
  } else {
    failed += 1;
    results.push(`  ✘ ${name} ${extra}`);
  }
}

async function api(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, body: json };
}

async function main() {
  console.log(`\nProjectDesk API tests → ${API_URL}\n`);
  const t0 = Date.now();

  // ---------- Setup: unique users for this run ----------
  const run = Date.now().toString(36).slice(-5).toUpperCase();
  const email = (role, n) => `test_${run}_${role}${n}@pdtest.dev`;

  // TEST 0: health
  const health = await api('GET', '/health');
  check('health endpoint responds', health.status === 200 && health.body?.success === true);

  // ---------- Auth ----------
  const reg = await api('POST', '/auth/register', {
    body: { firstName: 'Test', lastName: 'Student', email: email('s', 1), password: 'Passw0rd1' },
  });
  check('student registers (201)', reg.status === 201 && reg.body?.data?.token, JSON.stringify(reg.body));

  const reg2 = await api('POST', '/auth/register', {
    body: { firstName: 'Dup', lastName: 'Email', email: email('s', 1), password: 'Passw0rd1' },
  });
  check('duplicate email rejected (409)', reg2.status === 409);

  const regBad = await api('POST', '/auth/register', {
    body: { firstName: '', lastName: 'X', email: 'not-an-email', password: 'short' },
  });
  check('invalid registration rejected (400)', regBad.status === 400 && Array.isArray(regBad.body?.details));

  const facReg = await api('POST', '/auth/login', {
    body: { email: 'faculty01@projectdesk.dev', password: 'Faculty@123', role: 'faculty' },
  });
  check('faculty logs in', facReg.status === 200 && facReg.body?.data?.user?.role === 'faculty', JSON.stringify(facReg.body));

  const s1 = reg.body.data;
  const s2 = (
    await api('POST', '/auth/register', {
      body: { firstName: 'Second', lastName: 'Student', email: email('s', 2), password: 'Passw0rd1' },
    })
  ).body.data;
  const s3 = (
    await api('POST', '/auth/register', {
      body: { firstName: 'Third', lastName: 'Student', email: email('s', 3), password: 'Passw0rd1' },
    })
  ).body.data;
  const s4 = (
    await api('POST', '/auth/register', {
      body: { firstName: 'Fourth', lastName: 'Student', email: email('s', 4), password: 'Passw0rd1' },
    })
  ).body.data;
  const s5 = (
    await api('POST', '/auth/register', {
      body: { firstName: 'Fifth', lastName: 'Student', email: email('s', 5), password: 'Passw0rd1' },
    })
  ).body.data;

  const wrongPortal = await api('POST', '/auth/login', {
    body: { email: s1.user.email, password: 'Passw0rd1', role: 'faculty' },
  });
  check('student cannot login via faculty portal (403)', wrongPortal.status === 403);

  const badLogin = await api('POST', '/auth/login', {
    body: { email: s1.user.email, password: 'WrongPass1' },
  });
  check('wrong password rejected (401)', badLogin.status === 401);

  // ---------- Role protection ----------
  const studentCreatesProject = await api('POST', '/projects', { token: s1.token, body: { projectName: 'X' } });
  check('student cannot create project (403)', studentCreatesProject.status === 403);
  const studentStatsForbidden = await api('GET', '/dashboard/faculty', { token: s1.token });
  check('student blocked from faculty dashboard (403)', studentStatsForbidden.status === 403);

  // ---------- Faculty project creation ----------
  const projRes = await api('POST', '/projects', {
    token: facReg.body.data.token,
    body: {
      projectName: `Test Project ${run}`,
      maxTeamMembers: 4,
      endDate: new Date(Date.now() + 30 * 864e5).toISOString(),
      instructions: 'Test instructions',
      titles: ['Alpha Title', 'Beta Title', 'Gamma Title', 'Delta Title'],
    },
  });
  check('faculty creates project (201)', projRes.status === 201, JSON.stringify(projRes.body));
  const projectId = projRes.body?.data?.project?.projectId;
  const projectDbId = projRes.body?.data?.project?._id;
  check('Project ID matches PD-PRJ-XXXXXXXX format', /^PD-PRJ-[A-Z2-9]{8}$/.test(projectId || ''));

  const dupTitles = await api('POST', '/projects', {
    token: facReg.body.data.token,
    body: {
      projectName: `Dup ${run}`,
      maxTeamMembers: 4,
      endDate: new Date(Date.now() + 30 * 864e5).toISOString(),
      titles: ['Same Title', 'Same Title'],
    },
  });
  check('duplicate titles rejected (400)', dupTitles.status === 400);

  const noTitles = await api('POST', '/projects', {
    token: facReg.body.data.token,
    body: {
      projectName: `NoTitles ${run}`,
      maxTeamMembers: 4,
      endDate: new Date(Date.now() + 30 * 864e5).toISOString(),
      titles: [],
    },
  });
  check('empty titles rejected (400)', noTitles.status === 400);

  // Project ID uniqueness format check (generate several through creation)
  const projRes2 = await api('POST', '/projects', {
    token: facReg.body.data.token,
    body: {
      projectName: `Second Project ${run}`,
      maxTeamMembers: 3,
      endDate: new Date(Date.now() + 20 * 864e5).toISOString(),
      titles: ['Epsilon Title'],
    },
  });
  check(
    'two projects get distinct Project IDs',
    projRes2.status === 201 && projRes2.body.data.project.projectId !== projectId
  );

  // ---------- Student project access ----------
  const access = await api('GET', `/projects/access/${projectId}`, { token: s1.token });
  check('student accesses valid Project ID (200)', access.status === 200 && access.body.data.project.projectId === projectId);
  check('access returns available titles', access.body.data.titles.length === 4);

  const invalid = await api('GET', '/projects/access/PD-PRJ-ZZZ99999', { token: s1.token });
  check('invalid Project ID → clean 404', invalid.status === 404 && typeof invalid.body.message === 'string');

  const malformed = await api('GET', '/projects/access/hello-world', { token: s1.token });
  check('malformed Project ID → clean 400', malformed.status === 400);

  const facultyTriesStudentRoute = await api('GET', `/projects/access/${projectId}`, { token: facReg.body.data.token });
  check('faculty blocked from student access route (403)', facultyTriesStudentRoute.status === 403);

  // ---------- Team creation + title allocation ----------
  const teamRes = await api('POST', '/teams', {
    token: s1.token,
    body: {
      projectId: projectDbId,
      teamName: 'Team Alpha',
      problemStatement: 'A problem statement that is definitely long enough for validation rules.',
      proposedSolution: 'A proposed solution that is also long enough for the validation rules.',
      projectTitleId: access.body.data.titles.find((t) => t.title === 'Alpha Title')._id,
    },
  });
  check('team created (201)', teamRes.status === 201, JSON.stringify(teamRes.body));
  const teamCode = teamRes.body?.data?.team?.teamCode;
  check('Team Code matches PD-TEAM-XXXXXX format', /^PD-TEAM-[A-Z2-9]{6}$/.test(teamCode || ''));
  check('leader is a LEADER member', teamRes.body?.data?.team?.members?.[0]?.role === 'LEADER');

  const secondLeader = await api('POST', '/teams', {
    token: s2.token,
    body: {
      projectId: projectDbId,
      teamName: 'Team Beta',
      problemStatement: 'Another problem statement long enough to pass validation checks.',
      proposedSolution: 'Another proposed solution long enough to pass validation checks.',
      projectTitleId: access.body.data.titles.find((t) => t.title === 'Alpha Title')._id,
    },
  });
  check('assigned title cannot be re-selected (409)', secondLeader.status === 409);

  const betaRes = await api('POST', '/teams', {
    token: s2.token,
    body: {
      projectId: projectDbId,
      teamName: 'Team Beta',
      problemStatement: 'Another problem statement long enough to pass validation checks.',
      proposedSolution: 'Another proposed solution long enough to pass validation checks.',
      projectTitleId: access.body.data.titles.find((t) => t.title === 'Beta Title')._id,
    },
  });
  check('second team takes another title (201)', betaRes.status === 201);
  const betaCode = betaRes.body?.data?.team?.teamCode;

  const dupMembership = await api('POST', '/teams/join', { token: s1.token, body: { teamCode: betaCode } });
  check('leader cannot join another team in same project (409)', dupMembership.status === 409);

  // ---------- Concurrent title allocation (TEST 6) ----------
  const gammaTitleId = access.body.data.titles.find((t) => t.title === 'Gamma Title')._id;
  const [c1, c2, c3] = await Promise.all([
    api('POST', '/teams', {
      token: s3.token,
      body: {
        projectId: projectDbId,
        teamName: 'Team Gamma',
        problemStatement: 'Concurrent problem statement long enough for validation.',
        proposedSolution: 'Concurrent proposed solution long enough for validation.',
        projectTitleId: gammaTitleId,
      },
    }),
    api('POST', '/teams', {
      token: s4.token,
      body: {
        projectId: projectDbId,
        teamName: 'Team Delta',
        problemStatement: 'Concurrent problem statement long enough for validation.',
        proposedSolution: 'Concurrent proposed solution long enough for validation.',
        projectTitleId: gammaTitleId,
      },
    }),
    api('POST', '/teams', {
      token: s5.token,
      body: {
        projectId: projectDbId,
        teamName: 'Team Epsilon',
        problemStatement: 'Concurrent problem statement long enough for validation.',
        proposedSolution: 'Concurrent proposed solution long enough for validation.',
        projectTitleId: gammaTitleId,
      },
    }),
  ]);
  const successes = [c1, c2, c3].filter((r) => r.status === 201);
  const conflicts = [c1, c2, c3].filter((r) => r.status === 409);
  check('exactly one concurrent team creation succeeds', successes.length === 1, `got ${successes.length} successes`);
  check('concurrent losers get 409 conflict', conflicts.length === 2, `got ${conflicts.length} conflicts`);

  // ---------- Team capacity (TEST 7) ----------
  const join2 = await api('POST', '/teams/join', { token: s2.token, body: { teamCode } });
  check('capacity enforced: joins blocked for leader of other team', join2.status === 409);

  // Fill Team Alpha to capacity (max 4; leader + 3 joins).
  const joiners = [];
  for (let i = 6; i <= 8; i += 1) {
    const r = await api('POST', '/auth/register', {
      body: { firstName: 'Join', lastName: `Er${i}`, email: email('s', i), password: 'Passw0rd1' },
    });
    joiners.push(r.body.data);
  }
  for (const j of joiners) {
    const r = await api('POST', '/teams/join', { token: j.token, body: { teamCode } });
    check(`student joins team (${j.user.firstName})`, r.status === 200, JSON.stringify(r.body));
  }
  const overFlow = await api('POST', '/auth/register', {
    body: { firstName: 'Over', lastName: 'Flow', email: email('s', 9), password: 'Passw0rd1' },
  });
  const fullTry = await api('POST', '/teams/join', { token: overFlow.body.data.token, body: { teamCode } });
  check('5th student rejected when team is full (409)', fullTry.status === 409, JSON.stringify(fullTry.body));

  // ---------- Team lookup ----------
  const byCode = await api('GET', `/teams/${teamCode}`, { token: joiners[0].token });
  check('team lookup by code works for member', byCode.status === 200 && byCode.body.data.team.teamCode === teamCode);

  const byCodeOutsider = await api('GET', `/teams/${betaCode}`, { token: joiners[0].token });
  check('outsider cannot view another team (403)', byCodeOutsider.status === 403);

  const myTeam = await api('GET', '/teams/mine', { token: joiners[0].token });
  check('my-team returns the joined team', myTeam.status === 200 && myTeam.body.data.team?.teamCode === teamCode);

  // ---------- Faculty review (TEST 9) ----------
  const facultyToken = facReg.body.data.token; // faculty01
  const approvalsList = await api('GET', '/approvals', { token: facultyToken });
  check('faculty sees pending approvals', approvalsList.status === 200 && approvalsList.body.data.pendingTeams.length >= 2);

  const teamsList = await api('GET', '/teams', { token: facultyToken });
  const alphaTeamId = teamsList.body.data.teams.find((t) => t.teamCode === teamCode)?._id;
  const betaTeamId = teamsList.body.data.teams.find((t) => t.teamCode === betaCode)?._id;
  const gammaTeam = teamsList.body.data.teams.find((t) => t.status === 'PENDING' && t.teamCode !== teamCode && t.teamCode !== betaCode);

  const studentReviews = await api('PATCH', `/teams/${alphaTeamId}/approval`, {
    token: s1.token,
    body: { action: 'APPROVED' },
  });
  check('student cannot review teams (403)', studentReviews.status === 403);

  const changesNoRemarks = await api('PATCH', `/teams/${alphaTeamId}/approval`, {
    token: facultyToken,
    body: { action: 'CHANGES_REQUESTED' },
  });
  check('request-changes requires remarks (400)', changesNoRemarks.status === 400);

  const requestChanges = await api('PATCH', `/teams/${alphaTeamId}/approval`, {
    token: facultyToken,
    body: { action: 'CHANGES_REQUESTED', remarks: 'Please expand the evaluation section.' },
  });
  check('faculty requests changes (200)', requestChanges.status === 200 && requestChanges.body.data.team.status === 'CHANGES_REQUESTED');

  const approve = await api('PATCH', `/teams/${alphaTeamId}/approval`, {
    token: facultyToken,
    body: { action: 'APPROVED', remarks: 'Solid proposal.' },
  });
  check('faculty approves team (200)', approve.status === 200 && approve.body.data.team.status === 'APPROVED');

  const reject = await api('PATCH', `/teams/${betaTeamId}/approval`, {
    token: facultyToken,
    body: { action: 'REJECTED', remarks: 'Scope too broad.' },
  });
  check('faculty rejects team (200)', reject.status === 200 && reject.body.data.team.status === 'REJECTED');

  // Rejected team's title returns to AVAILABLE
  const titlesAfterReject = await api('GET', `/projects/access/${projectId}`, { token: joiners[0].token });
  const betaTitle = titlesAfterReject.body.data.titles.find((t) => t.title === 'Beta Title');
  check('rejected team releases its title', betaTitle?.status === 'AVAILABLE');

  // Student sees updated status
  const statusAfter = await api('GET', '/dashboard/student', { token: s1.token });
  check(
    'student dashboard reflects approval status',
    statusAfter.status === 200 && statusAfter.body.data.teams.some((t) => t.status === 'APPROVED')
  );

  // ---------- Session expiry (TEST 11) ----------
  const expired = await api('GET', '/auth/me', {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWYwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDEwfQ.invalidsignature000',
  });
  check('invalid/expired token → 401', expired.status === 401 && /session|log in/i.test(expired.body.message || ''));

  const garbage = await api('GET', '/teams/mine', { token: 'not.a.token' });
  check('garbage token → 401', garbage.status === 401);

  // ---------- Malformed ids ----------
  const badId = await api('GET', '/teams/notanid/detail', { token: s1.token });
  check('malformed team id handled', [400, 404].includes(badId.status));

  // ---------- Team deletion (leader, own team only) ----------
  const noTeamDelete = await api('DELETE', '/teams/507f1f77bcf86cd799439011', { token: s3.token });
  check('deleting a non-existent team → 404', noTeamDelete.status === 404);

  const malformedTeamDelete = await api('DELETE', '/teams/notanid', { token: s3.token });
  check('malformed team id delete → 400', malformedTeamDelete.status === 400);

  const facultyDeletesTeam = await api('DELETE', `/teams/${alphaTeamId}`, { token: facultyToken });
  check('faculty cannot delete a team (403)', facultyDeletesTeam.status === 403);

  const nonLeaderDeletesTeam = await api('DELETE', `/teams/${betaTeamId}`, { token: joiners[0].token });
  check('non-leader member cannot delete a team (403)', nonLeaderDeletesTeam.status === 403);

  const approvedTeamDelete = await api('DELETE', `/teams/${alphaTeamId}`, { token: s1.token });
  check('leader cannot delete an APPROVED team (409)', approvedTeamDelete.status === 409, JSON.stringify(approvedTeamDelete.body));

  // The concurrent-creation winner has a nondeterministic leader — take it from the responses.
  const gammaWinner = [c1, c2, c3].find((r) => r.status === 201)?.body?.data?.team;
  const gammaTeamId = gammaWinner?._id;
  const gammaLeaderId = String(gammaWinner?.teamLeaderId || '');
  const allStudents = [s1, s2, s3, s4, s5];
  const gammaLeader = allStudents.find((s) => String(s.user.id || s.user._id) === gammaLeaderId);
  const outsider = allStudents.find((s) => String(s.user.id || s.user._id) !== gammaLeaderId);

  const outsiderDeletesTeam = await api('DELETE', `/teams/${gammaTeamId}`, { token: outsider.token });
  check('student cannot delete another student\u2019s team (403)', outsiderDeletesTeam.status === 403);

  const leaderDelete = await api('DELETE', `/teams/${gammaTeamId}`, { token: gammaLeader.token });
  check('leader deletes own PENDING team (200)', leaderDelete.status === 200 && leaderDelete.body.data.deleted === true, JSON.stringify(leaderDelete.body));

  const gammaTitleAfter = await api('GET', `/projects/access/${projectId}`, { token: joiners[0].token });
  const gammaTitleRow = gammaTitleAfter.body.data.titles.find((t) => t.title === 'Gamma Title');
  check('deleted team releases its project title', gammaTitleRow?.status === 'AVAILABLE' && gammaTitleRow?.assignedTeamId === null);

  const leaderTeamAfter = await api('GET', '/teams/mine', { token: gammaLeader.token });
  check('deleted team disappears from leader\u2019s my-team', leaderTeamAfter.status === 200 && leaderTeamAfter.body.data.team === null);

  // Membership cleanup proven end-to-end: the ex-leader can re-create a team on the freed title.
  const recreate = await api('POST', '/teams', {
    token: gammaLeader.token,
    body: {
      projectId: projectDbId,
      teamName: 'Team Recreated',
      problemStatement: 'A recreated problem statement long enough for validation rules.',
      proposedSolution: 'A recreated proposed solution long enough for validation rules.',
      projectTitleId: gammaTitleId,
    },
  });
  check('ex-leader can re-create a team after deletion (201)', recreate.status === 201, JSON.stringify(recreate.body));
  const recreatedTeamId = recreate.body?.data?.team?._id;
  const reDelete = await api('DELETE', `/teams/${recreatedTeamId}`, { token: gammaLeader.token });
  check('re-created team deletes cleanly (200)', reDelete.status === 200 && reDelete.body.data.deleted === true);

  // ---------- Project deletion (owner faculty only) ----------
  const studentDeletesProject = await api('DELETE', `/projects/${projectDbId}`, { token: s1.token });
  check('student cannot delete a project (403)', studentDeletesProject.status === 403);

  const fac02Login = await api('POST', '/auth/login', {
    body: { email: 'faculty02@projectdesk.dev', password: 'Faculty@456', role: 'faculty' },
  });
  check('second faculty logs in', fac02Login.status === 200 && fac02Login.body.data.user.role === 'faculty');
  const otherFacultyDeletesProject = await api('DELETE', `/projects/${projectDbId}`, { token: fac02Login.body.data.token });
  check('faculty cannot delete another faculty\u2019s project (403)', otherFacultyDeletesProject.status === 403);

  const missingProjectDelete = await api('DELETE', '/projects/507f1f77bcf86cd799439011', { token: facultyToken });
  check('deleting a non-existent project → 404', missingProjectDelete.status === 404);

  const malformedProjectDelete = await api('DELETE', '/projects/notanid', { token: facultyToken });
  check('malformed project id delete → 404 (not found)', malformedProjectDelete.status === 404);

  // Delete the empty second project first.
  const secondProjectDbId = projRes2.body?.data?.project?._id;
  const emptyDelete = await api('DELETE', `/projects/${secondProjectDbId}`, { token: facultyToken });
  check('faculty deletes own empty project (200)', emptyDelete.status === 200 && emptyDelete.body.data.deleted === true, JSON.stringify(emptyDelete.body));
  const secondProjectGone = await api('GET', `/projects/${secondProjectDbId}`, { token: facultyToken });
  check('deleted project no longer fetchable (404)', secondProjectGone.status === 404);

  // Cascade: the main project still has Team Alpha (APPROVED, 4 members) + Team Beta (REJECTED).
  const cascadeDelete = await api('DELETE', `/projects/${projectDbId}`, { token: facultyToken });
  check(
    'faculty deletes project with teams (cascade)',
    cascadeDelete.status === 200 && cascadeDelete.body.data.deleted === true && cascadeDelete.body.data.teamsRemoved === 2,
    JSON.stringify(cascadeDelete.body)
  );

  const projectGone = await api('GET', `/projects/${projectDbId}`, { token: facultyToken });
  check('cascade: project removed (404)', projectGone.status === 404);

  const alphaGone = await api('GET', `/teams/${teamCode}`, { token: joiners[0].token });
  check('cascade: project teams removed (404)', alphaGone.status === 404);

  const joinerTeamAfter = await api('GET', '/teams/mine', { token: joiners[0].token });
  check('cascade: memberships removed', joinerTeamAfter.status === 200 && joinerTeamAfter.body.data.team === null);

  const s1TeamAfter = await api('GET', '/teams/mine', { token: s1.token });
  check('cascade: leader membership removed', s1TeamAfter.status === 200 && s1TeamAfter.body.data.team === null);

  // ---------- Profile photo (Profile Settings) ----------
  // Ownership is implicit: the photo attaches to the JWT user; no user id is ever sent.
  const PNG_1PX_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const pngBytes = Uint8Array.from(atob(PNG_1PX_B64), (c) => c.charCodeAt(0));
  const photoForm = (bytes, type, name) => {
    const fd = new FormData();
    fd.append('photo', new Blob([bytes], { type }), name);
    return fd;
  };

  // Start clean — removal is idempotent, so this also clears any leftover photo.
  const photoPreClean = await api('DELETE', '/profile/photo', { token: facultyToken });
  check('photo removal with no photo is an idempotent no-op (200)', photoPreClean.status === 200 && !photoPreClean.body.data.user.profileImage?.url);

  const photoNoFile = await api('POST', '/profile/photo', { token: facultyToken, form: new FormData() });
  check('photo upload with no file \u2192 400', photoNoFile.status === 400, JSON.stringify(photoNoFile.body));

  const photoBadType = await api('POST', '/profile/photo', { token: facultyToken, form: photoForm(new Uint8Array([1, 2, 3]), 'text/plain', 'notes.txt') });
  check('photo upload with unsupported type \u2192 400', photoBadType.status === 400, JSON.stringify(photoBadType.body));

  const photoOversize = await api('POST', '/profile/photo', { token: facultyToken, form: photoForm(new ArrayBuffer(5 * 1024 * 1024 + 10), 'image/png', 'big.png') });
  check('photo upload over 5 MB \u2192 400', photoOversize.status === 400, JSON.stringify(photoOversize.body));

  const photoUpload = await api('POST', '/profile/photo', { token: facultyToken, form: photoForm(pngBytes, 'image/png', 'faculty01.png') });
  check('valid PNG photo upload \u2192 200 with stored url', photoUpload.status === 200 && !!photoUpload.body.data.user.profileImage?.url, JSON.stringify(photoUpload.body));

  const meAfterPhoto = await api('GET', '/auth/me', { token: facultyToken });
  check('uploaded photo persists in /auth/me', meAfterPhoto.status === 200 && !!meAfterPhoto.body.data.user.profileImage?.url);

  const photoFileRes = await fetch(photoUpload.body.data.user.profileImage.url);
  check('stored photo file is served over HTTP', photoFileRes.status === 200 && (photoFileRes.headers.get('content-type') || '').includes('image/'));

  // Isolation: another account must neither see nor affect this photo.
  const fac02Me = await api('GET', '/auth/me', { token: fac02Login.body.data.token });
  check('faculty02 does not see faculty01\u2019s photo', fac02Me.status === 200 && !fac02Me.body.data.user.profileImage?.url);

  const photoRemove = await api('DELETE', '/profile/photo', { token: facultyToken });
  check('photo removal clears the stored reference (200)', photoRemove.status === 200 && !photoRemove.body.data.user.profileImage?.url);

  const s1PhotoUpload = await api('POST', '/profile/photo', { token: s1.token, form: photoForm(pngBytes, 'image/png', 'student.png') });
  check('student can upload their own photo (200)', s1PhotoUpload.status === 200 && !!s1PhotoUpload.body.data.user.profileImage?.url, JSON.stringify(s1PhotoUpload.body));

  const s1PhotoRemove = await api('DELETE', '/profile/photo', { token: s1.token });
  check('student can remove their own photo (200)', s1PhotoRemove.status === 200 && !s1PhotoRemove.body.data.user.profileImage?.url);

  // ---------- Summary ----------
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
