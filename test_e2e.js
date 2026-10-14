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
  console.log('=== Step 1: Health Check & Platform Statistics ===');
  const statsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('Platform Stats:', statsRes.data);

  console.log('\n=== Step 2: Publishing Authentic Project Proof ===');
  const projectPayload = {
    profile: {
      username: 'alexhenderson',
      full_name: 'Alex Henderson',
      role: 'Lead Distributed Systems Engineer',
      github_url: 'https://github.com/xenover09',
      bio: 'Building resilient, low-latency ingestion pipelines with verified receipts.'
    },
    project: {
      title: 'High-Throughput Webhook Processing Pipeline',
      summary: 'Zero-downtime event ingestion engine sustaining 5,000 requests/sec with durable replay.',
      problem: 'The legacy webhook receiver suffered a 12% payload drop rate during flash-sale traffic spikes due to synchronous HTTP blocking and unbuffered database writes.',
      result: 'Maintained 99.99% delivery reliability across 2.4M webhooks on a single $5/month virtual machine, reducing 99th percentile response latency from 820ms to 45ms.',
      client_name: 'Sarah Chen',
      client_email: 'sarah@finflow.co',
      request_confirmation: true
    },
    decisions: [
      {
        decision: 'Selected SQLite with WAL mode over a MongoDB replica set',
        rejected_alternative: 'MongoDB Replica Set',
        reason: 'Avoided distributed network latency; required strict ACID transactions for payment reconciliation with minimal operational overhead.'
      }
    ],
    artefacts: [
      {
        title: 'Durable buffer transaction worker implementation',
        type: 'commit',
        url_or_hash: '9e4a1f8b2c',
        artefact_date: '2026-10-12',
        notes: 'Passed all 48 concurrent load and fault injection tests.'
      },
      {
        title: 'Staging benchmark report & latency log',
        type: 'benchmark',
        url_or_hash: 'https://github.com/xenover09/proof-of-work-portfolio/releases/tag/v1.0.0-bench',
        artefact_date: '2026-10-13',
        notes: 'Sustained 5,200 requests/second at p99 42ms.'
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
  console.log('Confirmation URL:', createRes.data.confirmUrl);
  console.log('Confirmation Token:', createRes.data.project.client_confirm_token);

  const token = createRes.data.project.client_confirm_token;
  const projectId = createRes.data.project.id;

  console.log('\n=== Step 3: Client Fetches Verification Portal Details ===');
  const detailsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/confirm/${token}`,
    method: 'GET'
  });
  console.log('Details Status:', detailsRes.status);
  console.log('Project Under Review:', detailsRes.data.project.title);
  console.log('Status Prior to Confirmation:', detailsRes.data.project.client_confirm_status);

  console.log('\n=== Step 4: Client Submits Confirmation ===');
  const confirmRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/confirm/${token}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    decision: 'confirmed',
    client_name: 'Sarah Chen, VP of Engineering at FinFlow Corp',
    client_feedback: 'Alex completely eliminated our webhook payload drop rate. Delivered ahead of deadline with rigorous benchmark evidence and clean documentation.'
  });
  console.log('Client Submission Status:', confirmRes.status);
  console.log('Confirmation Output:', confirmRes.data);

  console.log('\n=== Step 5: Validating Portfolio Status Update ===');
  const portfolioRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/portfolio/alexhenderson`,
    method: 'GET'
  });
  const updatedProject = portfolioRes.data.projects.find(p => p.id === projectId);
  console.log('Updated Status:', updatedProject.client_confirm_status);
  console.log('Confirmed Timestamp:', updatedProject.client_confirmed_at);
  console.log('Authenticated Client Feedback:', updatedProject.client_feedback);

  console.log('\n=== Step 6: Validating Platform Metrics ===');
  const finalStatsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
  console.log('Final Metrics:', finalStatsRes.data.stats);

  if (updatedProject.client_confirm_status === 'confirmed') {
    console.log('\n>>> SUCCESS: ALL TESTS PASSED IN PROFESSIONAL ENGLISH! <<<');
  } else {
    console.error('\n>>> ERROR: Confirmation verification failed! <<<');
    process.exit(1);
  }
}

runTest().catch(console.error);
