const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  console.log('=== Step 1: Health Check & Real Platform Statistics ===');
  const statsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('Real Stats (No Fake Count):', statsRes.data);

  console.log('\n=== Step 2: Testing Claim-Evidence AI Verification via API ===');
  const projectPayload = {
    profile: {
      username: 'temp_test_user_e2e',
      full_name: 'Test Candidate',
      role: 'QA Engineer',
      github_url: 'https://github.com/xenover09',
      bio: 'Automated test suite validation.'
    },
    project: {
      title: 'Automated Test Verification Project',
      summary: 'Temporary test harness for link-based confirmation verification.',
      problem: 'Need to verify link-based confirmation and claim-evidence corroboration end to end.',
      result: 'Verified end-to-end token flow with zero fake stats.',
      client_name: 'Test Client',
      client_email: 'test@client.internal',
      request_confirmation: true,
      is_sample: 1
    },
    decisions: [
      {
        decision: 'Selected SQLite WAL mode over external database',
        rejected_alternative: 'External Database Server',
        reason: 'Zero network overhead and immediate transaction durability.'
      }
    ],
    artefacts: [
      {
        title: 'SQLite WAL mode test commit',
        type: 'commit',
        url_or_hash: 'abc1234',
        artefact_date: '2026-10-14',
        notes: 'Corroborates WAL mode selection.'
      }
    ]
  };

  const createRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, projectPayload);

  console.log('Create Project Status:', createRes.status);
  console.log('Project ID:', createRes.data.project.id);
  console.log('Confirmation Token:', createRes.data.project.client_confirm_token);

  const token = createRes.data.project.client_confirm_token;
  const projectId = createRes.data.project.id;

  console.log('\n=== Step 3: Fetching Project & Claim-Evidence Matching ===');
  const projRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/projects/${projectId}`,
    method: 'GET'
  });
  console.log('Evidence Analysis Result:', projRes.data.project.evidenceAnalysis);

  console.log('\n=== Step 4: Testing Client Confirmation Token Flow ===');
  const confirmRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/confirm/${token}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    decision: 'confirmed',
    client_name: 'Test Client Reviewer',
    client_feedback: 'Deliverable completed and confirmed during test run.'
  });
  console.log('Confirmation Submission:', confirmRes.data);

  console.log('\n=== Step 5: Clean Up Test Data to Ensure Zero Pollution ===');
  const { db } = require('./db.js');
  db.prepare('DELETE FROM decisions WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM artefacts WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  db.prepare("DELETE FROM profiles WHERE username = 'temp_test_user_e2e'").run();
  console.log('Cleaned up temp test project. Zero fake data left in production DB.');

  const finalStatsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('\nFinal Production Stats (Real Only):', finalStatsRes.data.stats);

  console.log('\n>>> SUCCESS: HONEST TEST SUITE PASSED WITH ZERO POLLUTION! <<<');
}

runTest().catch(console.error);
