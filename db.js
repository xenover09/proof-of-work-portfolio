const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const matcher = require('./matcher.js');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'portfolio.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      bio TEXT,
      role TEXT,
      email TEXT,
      github_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      summary TEXT,
      problem TEXT NOT NULL,
      result TEXT NOT NULL,
      client_name TEXT,
      client_email TEXT,
      client_confirm_token TEXT UNIQUE,
      client_confirm_status TEXT NOT NULL DEFAULT 'unrequested', -- unrequested, pending, confirmed, disputed
      client_confirmed_at TEXT,
      client_feedback TEXT,
      is_sample INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      rejected_alternative TEXT NOT NULL,
      reason TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS artefacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- commit, pr, draft, staging, screenshot, document, benchmark
      url_or_hash TEXT NOT NULL,
      artefact_date TEXT NOT NULL,
      notes TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_projects_profile ON projects(profile_id);
    CREATE INDEX IF NOT EXISTS idx_projects_token ON projects(client_confirm_token);
    CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
    CREATE INDEX IF NOT EXISTS idx_artefacts_project ON artefacts(project_id);
  `);

  const projectMigrations = [
    'ALTER TABLE projects ADD COLUMN is_sample INTEGER DEFAULT 0',
    'ALTER TABLE projects ADD COLUMN defensible_number TEXT',
    'ALTER TABLE projects ADD COLUMN my_role_attribution TEXT',
    'ALTER TABLE projects ADD COLUMN ai_disclosure TEXT',
    'ALTER TABLE projects ADD COLUMN is_nda INTEGER DEFAULT 0',
    'ALTER TABLE projects ADD COLUMN live_url TEXT',
    'ALTER TABLE projects ADD COLUMN repo_url TEXT',
    'ALTER TABLE projects ADD COLUMN readme_url TEXT'
  ];

  const profileMigrations = [
    'ALTER TABLE profiles ADD COLUMN location TEXT',
    'ALTER TABLE profiles ADD COLUMN about TEXT',
    'ALTER TABLE profiles ADD COLUMN experience TEXT',
    'ALTER TABLE profiles ADD COLUMN open_source TEXT',
    'ALTER TABLE profiles ADD COLUMN writing_talks TEXT',
    'ALTER TABLE profiles ADD COLUMN skills TEXT',
    'ALTER TABLE profiles ADD COLUMN resume_url TEXT',
    'ALTER TABLE profiles ADD COLUMN contact_email TEXT'
  ];

  [...projectMigrations, ...profileMigrations].forEach(migration => {
    try {
      db.exec(migration);
    } catch (e) {
      // Column already exists
    }
  });
}

initDb();

function getProfileByUsername(username) {
  return db.prepare('SELECT * FROM profiles WHERE username = ? COLLATE NOCASE').get(username);
}

function getProfileById(id) {
  return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
}

function createOrUpdateProfile({
  username,
  full_name,
  bio = '',
  role = '',
  email = '',
  github_url = '',
  location = '',
  about = '',
  experience = '',
  open_source = '',
  writing_talks = '',
  skills = '',
  resume_url = '',
  contact_email = ''
}) {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const existing = getProfileByUsername(cleanUsername);
  
  if (existing) {
    db.prepare(`
      UPDATE profiles 
      SET full_name = ?, bio = ?, role = ?, email = ?, github_url = ?,
          location = COALESCE(NULLIF(?, ''), location),
          about = COALESCE(NULLIF(?, ''), about),
          experience = COALESCE(NULLIF(?, ''), experience),
          open_source = COALESCE(NULLIF(?, ''), open_source),
          writing_talks = COALESCE(NULLIF(?, ''), writing_talks),
          skills = COALESCE(NULLIF(?, ''), skills),
          resume_url = COALESCE(NULLIF(?, ''), resume_url),
          contact_email = COALESCE(NULLIF(?, ''), contact_email)
      WHERE id = ?
    `).run(
      full_name, bio, role, email, github_url,
      location, about, experience, open_source, writing_talks, skills, resume_url, contact_email,
      existing.id
    );
    return getProfileById(existing.id);
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  db.prepare(`
    INSERT INTO profiles (
      id, username, full_name, bio, role, email, github_url,
      location, about, experience, open_source, writing_talks, skills, resume_url, contact_email, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, cleanUsername, full_name, bio, role, email, github_url,
    location, about, experience, open_source, writing_talks, skills, resume_url, contact_email, created_at
  );

  return getProfileById(id);
}

function createProject({
  profile_id,
  title,
  summary = '',
  problem,
  result,
  defensible_number = '',
  my_role_attribution = '',
  ai_disclosure = '',
  is_nda = 0,
  live_url = '',
  repo_url = '',
  readme_url = '',
  client_name = '',
  client_email = '',
  request_confirmation = false,
  is_sample = 0,
  decisions = [],
  artefacts = []
}) {
  const id = crypto.randomUUID();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 8);
  const created_at = new Date().toISOString();
  
  let confirm_token = null;
  let confirm_status = 'unrequested';

  if (request_confirmation || client_name || client_email) {
    confirm_token = crypto.randomUUID();
    confirm_status = 'pending';
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, profile_id, title, slug, summary, problem, result,
      defensible_number, my_role_attribution, ai_disclosure, is_nda, live_url, repo_url, readme_url,
      client_name, client_email, client_confirm_token, client_confirm_status, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDecision = db.prepare(`
    INSERT INTO decisions (id, project_id, decision, rejected_alternative, reason, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertArtefact = db.prepare(`
    INSERT INTO artefacts (id, project_id, title, type, url_or_hash, artefact_date, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertProject.run(
      id, profile_id, title, slug, summary, problem, result,
      defensible_number, my_role_attribution, ai_disclosure, is_nda ? 1 : 0, live_url, repo_url, readme_url,
      client_name, client_email, confirm_token, confirm_status, is_sample ? 1 : 0, created_at
    );

    decisions.forEach((d, idx) => {
      if (d.decision && d.rejected_alternative) {
        insertDecision.run(
          crypto.randomUUID(),
          id,
          d.decision.trim(),
          d.rejected_alternative.trim(),
          (d.reason || '').trim(),
          idx
        );
      }
    });

    artefacts.forEach((a, idx) => {
      if (a.title && a.url_or_hash) {
        insertArtefact.run(
          crypto.randomUUID(),
          id,
          a.title.trim(),
          a.type || 'commit',
          a.url_or_hash.trim(),
          a.artefact_date || new Date().toISOString().split('T')[0],
          (a.notes || '').trim(),
          idx
        );
      }
    });
  });

  transaction();
  return getProjectById(id);
}

function getProjectById(id) {
  const project = db.prepare(`
    SELECT p.*, prof.username, prof.full_name as author_name, prof.role as author_role, prof.github_url as author_github
    FROM projects p
    JOIN profiles prof ON p.profile_id = prof.id
    WHERE p.id = ? OR p.slug = ?
  `).get(id, id);

  if (!project) return null;

  const decisions = db.prepare(`
    SELECT * FROM decisions WHERE project_id = ? ORDER BY sort_order ASC
  `).all(project.id);

  const artefacts = db.prepare(`
    SELECT * FROM artefacts WHERE project_id = ? ORDER BY sort_order ASC, artefact_date DESC
  `).all(project.id);

  // Compute Claim-Evidence matching
  const evidenceAnalysis = matcher.matchClaimEvidence({
    ...project,
    decisions,
    artefacts
  });

  return {
    ...project,
    decisions,
    artefacts,
    evidenceAnalysis
  };
}

function getProjectsByProfileId(profileId) {
  const projects = db.prepare(`
    SELECT * FROM projects WHERE profile_id = ? ORDER BY created_at DESC
  `).all(profileId);

  return projects.map(p => {
    const decisions = db.prepare('SELECT * FROM decisions WHERE project_id = ? ORDER BY sort_order ASC').all(p.id);
    const artefacts = db.prepare('SELECT * FROM artefacts WHERE project_id = ? ORDER BY sort_order ASC').all(p.id);
    const evidenceAnalysis = matcher.matchClaimEvidence({
      ...p,
      decisions,
      artefacts
    });
    return { ...p, decisions, artefacts, evidenceAnalysis };
  });
}

function getAllProjects(limit = 20) {
  const projects = db.prepare(`
    SELECT p.*, prof.username, prof.full_name as author_name, prof.role as author_role
    FROM projects p
    JOIN profiles prof ON p.profile_id = prof.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(limit);

  return projects.map(p => {
    const artefacts = db.prepare('SELECT * FROM artefacts WHERE project_id = ?').all(p.id);
    const decisions = db.prepare('SELECT * FROM decisions WHERE project_id = ?').all(p.id);
    const evidenceAnalysis = matcher.matchClaimEvidence({
      ...p,
      decisions,
      artefacts
    });
    return {
      ...p,
      artefactsCount: artefacts.length,
      decisionsCount: decisions.length,
      evidenceAnalysis
    };
  });
}

function getProjectByConfirmToken(token) {
  if (!token) return null;
  const project = db.prepare(`
    SELECT p.*, prof.username, prof.full_name as author_name, prof.role as author_role
    FROM projects p
    JOIN profiles prof ON p.profile_id = prof.id
    WHERE p.client_confirm_token = ?
  `).get(token);

  if (!project) return null;

  const decisions = db.prepare('SELECT * FROM decisions WHERE project_id = ? ORDER BY sort_order ASC').all(project.id);
  const artefacts = db.prepare('SELECT * FROM artefacts WHERE project_id = ? ORDER BY sort_order ASC').all(project.id);
  const evidenceAnalysis = matcher.matchClaimEvidence({
    ...project,
    decisions,
    artefacts
  });

  return {
    ...project,
    decisions,
    artefacts,
    evidenceAnalysis
  };
}

function requestConfirmation(projectId, clientName, clientEmail) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  let token = project.client_confirm_token;
  if (!token) {
    token = crypto.randomUUID();
  }

  db.prepare(`
    UPDATE projects
    SET client_confirm_token = ?,
        client_name = COALESCE(?, client_name),
        client_email = COALESCE(?, client_email),
        client_confirm_status = CASE WHEN client_confirm_status = 'confirmed' THEN 'confirmed' ELSE 'pending' END
    WHERE id = ?
  `).run(token, clientName || null, clientEmail || null, projectId);

  return {
    projectId,
    token,
    confirmUrl: `/confirm/${token}`
  };
}

function updateConfirmStatus(token, decision, clientName, clientFeedback) {
  const project = getProjectByConfirmToken(token);
  if (!project) return { success: false, error: 'Invalid or expired confirmation link' };

  const validStatuses = ['confirmed', 'disputed'];
  const newStatus = validStatuses.includes(decision) ? decision : 'confirmed';
  const confirmedAt = new Date().toISOString();

  db.prepare(`
    UPDATE projects
    SET client_confirm_status = ?,
        client_confirmed_at = ?,
        client_name = COALESCE(NULLIF(?, ''), client_name),
        client_feedback = ?
    WHERE client_confirm_token = ?
  `).run(newStatus, confirmedAt, clientName || null, (clientFeedback || '').trim(), token);

  return {
    success: true,
    status: newStatus,
    projectId: project.id,
    projectSlug: project.slug,
    username: project.username
  };
}

function getStats() {
  // Real counts only: strictly exclude is_sample = 1
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE is_sample = 0').get().count;
  const confirmedProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE is_sample = 0 AND client_confirm_status = 'confirmed'").get().count;
  const totalArtefacts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM artefacts a 
    JOIN projects p ON a.project_id = p.id 
    WHERE p.is_sample = 0
  `).get().count;
  const totalDecisions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM decisions d 
    JOIN projects p ON d.project_id = p.id 
    WHERE p.is_sample = 0
  `).get().count;
  const totalProfiles = db.prepare(`
    SELECT COUNT(DISTINCT prof.id) as count 
    FROM profiles prof 
    JOIN projects p ON p.profile_id = prof.id 
    WHERE p.is_sample = 0
  `).get().count;

  return {
    totalProjects,
    confirmedProjects,
    totalArtefacts,
    totalDecisions,
    totalProfiles
  };
}

module.exports = {
  db,
  initDb,
  getProfileByUsername,
  getProfileById,
  createOrUpdateProfile,
  createProject,
  getProjectById,
  getProjectsByProfileId,
  getAllProjects,
  getProjectByConfirmToken,
  requestConfirmation,
  updateConfirmStatus,
  getStats
};
