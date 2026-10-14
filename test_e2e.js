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
  console.log('--- 1. Testing Landing Page & Stats ---');
  const statsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('Stats Response:', statsRes.data);

  console.log('\n--- 2. Creating Real Test Project ---');
  const projectPayload = {
    profile: {
      username: 'salaarhussain',
      full_name: 'Salaar Hussain',
      role: 'Backend & Systems Engineer',
      github_url: 'https://github.com/xenover09',
      bio: 'Building reliable, high-throughput systems with verifiable proof.'
    },
    project: {
      title: 'High-Throughput Webhook Processing Pipeline',
      summary: 'Zero-downtime event queuing engine handling 5k webhook deliveries per second.',
      problem: 'Existing webhook receiver dropped 12% of payloads during traffic spikes due to synchronous HTTP blocking and unbuffered DB writes.',
      result: 'Payload delivery success reached 99.99%, latency reduced from 820ms to 45ms, processed 2.4M webhooks on single $5/mo VM.',
      client_name: 'Sarah Chen',
      client_email: 'sarah@finflow.co',
      request_confirmation: true
    },
    decisions: [
      {
        decision: 'Chose SQLite in WAL mode with fast bulk inserts over MongoDB',
        rejected_alternative: 'MongoDB Document Cluster',
        reason: 'Required strict ACID transactions for payment reconciliation with zero external ops overhead.'
      }
    ],
    artefacts: [
      {
        title: 'Core WAL transaction buffer commit',
        type: 'commit',
        url_or_hash: '9e4a1f8b2c',
        artefact_date: '2026-10-12',
        notes: 'Passed 48 unit and concurrent load tests.'
      },
      {
        title: 'Staging benchmark report & latency log',
        type: 'benchmark',
        url_or_hash: 'https://github.com/xenover09/proof-of-work-portfolio/releases/tag/v1.0.0-bench',
        artefact_date: '2026-10-13',
        notes: 'Sustained 5,200 req/sec at p99 42ms.'
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
  console.log('Confirm URL:', createRes.data.confirmUrl);
  console.log('Confirm Token:', createRes.data.project.client_confirm_token);

  const token = createRes.data.project.client_confirm_token;
  const projectId = createRes.data.project.id;

  console.log('\n--- 3. Testing Client Confirmation Details Fetch ---');
  const detailsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/confirm/${token}`,
    method: 'GET'
  });
  console.log('Confirm Details Status:', detailsRes.status);
  console.log('Project Under Review:', detailsRes.data.project.title);
  console.log('Client Status Before:', detailsRes.data.project.client_confirm_status);

  console.log('\n--- 4. Client Taps "Yes, Confirmed" ---');
  const confirmRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/confirm/${token}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    decision: 'confirmed',
    client_name: 'Sarah Chen, VP of Engineering at FinFlow',
    client_feedback: 'Salaar completely eliminated our webhook drop rate. Delivered ahead of deadline with thorough benchmark logs.'
  });
  console.log('Client Submit Status:', confirmRes.status);
  console.log('Confirmation Result:', confirmRes.data);

  console.log('\n--- 5. Verifying Portfolio Updated Status ---');
  const portfolioRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/portfolio/salaarhussain`,
    method: 'GET'
  });
  const updatedProject = portfolioRes.data.projects.find(p => p.id === projectId);
  console.log('Portfolio Project Status:', updatedProject.client_confirm_status);
  console.log('Confirmed At:', updatedProject.client_confirmed_at);
  console.log('Client Feedback Recorded:', updatedProject.client_feedback);

  console.log('\n--- 6. Verifying Updated Platform Stats ---');
  const finalStatsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('Final Platform Stats:', finalStatsRes.data.stats);

  if (updatedProject.client_confirm_status === 'confirmed') {
    console.log('\n>>> SUCCESS: END-TO-END VERIFICATION TEST PASSED! <<<');
  } else {
    console.error('\n>>> FAILED: Confirmation status did not update! <<<');
    process.exit(1);
  }
}

runTest().catch(console.error);
