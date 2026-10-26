/**
 * Free ProjectDesk-owned dev ports before starting the dev stack.
 *
 * ONLY kills listeners on 5000/5173/5174 whose owning process command line
 * clearly belongs to this project (server entry, Vite for client/, npm dev
 * scripts inside this folder). Unrelated applications are never touched —
 * if a port is held by something else, we report it and move on.
 *
 * Usage: node scripts/freeports.js
 */
// @ts-check
// eslint-disable-next-line
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..').toLowerCase();

const PORTS = [5000, 5173, 5174];

const isOurs = (cmdline = '') => {
  const c = cmdline.toLowerCase();
  if (!c) return false;
  const inProject = c.includes('f:\\space\\hackathon\\build_ai\\project') || c.includes('/f/space/hackathon/build_ai/project');
  const looksLikeOurs =
    c.includes('src/server.js') ||
    c.includes('vite.js') ||
    c.includes('vite') && c.includes('client') ||
    c.includes('concurrently') ||
    c.includes('npm run dev') ||
    c.includes('npm run server') ||
    c.includes('npm run client');
  return inProject && looksLikeOurs;
};

function getListeners(port) {
  try {
    const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const pids = new Set();
    for (const line of out.split('\n')) {
      const cols = line.trim().split(/\s+/);
      const local = cols[1] || '';
      // Match the exact port (avoid matching 50000 etc.)
      if (local.endsWith(`:${port}`)) {
        const pid = Number(cols[4]);
        if (pid && pid !== 0) pids.add(pid);
      }
    }
    return [...pids];
  } catch {
    return []; // findstr exits non-zero when nothing matches
  }
}

function getCommandLine(pid) {
  try {
    return execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
  } catch {
    return '';
  }
}

let freed = 0;
for (const port of PORTS) {
  const pids = getListeners(port);
  for (const pid of pids) {
    const cmdline = getCommandLine(pid);
    if (isOurs(cmdline)) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[freeports] freed :${port} (killed stale ProjectDesk process ${pid})`);
        freed += 1;
      } catch {
        console.warn(`[freeports] could not kill PID ${pid} on :${port} — continuing`);
      }
    } else {
      console.warn(
        `[freeports] :${port} is held by an unrelated process (PID ${pid}) — leaving it alone. ` +
          `If this is intentional, stop that process manually or set PORT in .env.`
      );
    }
  }
}

if (freed === 0) console.log('[freeports] no stale ProjectDesk dev processes found');
