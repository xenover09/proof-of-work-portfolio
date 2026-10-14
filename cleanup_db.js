const { db, getStats } = require('./db.js');

console.log('=== Database Cleanup & Honesty Audit ===');

// 1. Add is_sample column to projects if it does not exist
try {
  db.exec('ALTER TABLE projects ADD COLUMN is_sample INTEGER DEFAULT 0');
  console.log('Added is_sample column to projects table.');
} catch (e) {
  // column already exists
}

// 2. Remove fake persona Alex Henderson and his projects
const alex = db.prepare("SELECT id FROM profiles WHERE username = 'alexhenderson'").get();
if (alex) {
  const alexProjects = db.prepare('SELECT id FROM projects WHERE profile_id = ?').all(alex.id);
  alexProjects.forEach(p => {
    db.prepare('DELETE FROM decisions WHERE project_id = ?').run(p.id);
    db.prepare('DELETE FROM artefacts WHERE project_id = ?').run(p.id);
  });
  db.prepare('DELETE FROM projects WHERE profile_id = ?').run(alex.id);
  db.prepare('DELETE FROM profiles WHERE id = ?').run(alex.id);
  console.log('Deleted fake persona "alexhenderson" and associated projects.');
}

// 3. Reset Salaar Hussain entry to honest "awaiting client confirmation" state
const salaar = db.prepare("SELECT id FROM profiles WHERE username = 'salaarhussain'").get();
if (salaar) {
  db.prepare(`
    UPDATE projects
    SET client_confirm_status = 'pending',
        client_name = NULL,
        client_feedback = NULL,
        client_confirmed_at = NULL,
        is_sample = 0
    WHERE profile_id = ?
  `).run(salaar.id);
  console.log('Reset Salaar Hussain project to honest state: "Awaiting client confirmation". Fake confirmation removed.');
}

console.log('\nUpdated Platform Stats (Real Counts Only):', getStats());
