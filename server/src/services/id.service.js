/**
 * ID/code generation services. Codes are ALWAYS generated on the backend and
 * checked against MongoDB for uniqueness before use; unique DB indexes are the
 * final safety net.
 */
import { Project } from '../models/Project.js';
import { Team } from '../models/Team.js';
import { newProjectId, newTeamCode } from '../utils/generateCode.js';

export async function generateUniqueProjectId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = newProjectId();
    const exists = await Project.exists({ projectId: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Unable to generate a unique Project ID');
}

export async function generateUniqueTeamCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = newTeamCode();
    const exists = await Team.exists({ teamCode: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Unable to generate a unique Team Code');
}
