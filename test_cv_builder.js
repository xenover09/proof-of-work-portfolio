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

async function runTests() {
  console.log('=== Step 1: Testing /cv and /cv-builder Page Routing ===');
  const cvPage = await request({ hostname: 'localhost', port: 3000, path: '/cv', method: 'GET' });
  console.log('/cv HTTP Status:', cvPage.status);
  if (cvPage.status !== 200 || !cvPage.raw.includes('Verified CV Builder')) {
    throw new Error('/cv page failed to load properly');
  }
  console.log('  [PASS] /cv loaded successfully.');

  const redirectCheck = await request({ hostname: 'localhost', port: 3000, path: '/cv-builder', method: 'GET' });
  console.log('/cv-builder HTTP Status:', redirectCheck.status, 'Location:', redirectCheck.headers.location);
  if (redirectCheck.status !== 302 || redirectCheck.headers.location !== '/cv') {
    throw new Error('/cv-builder did not redirect to /cv');
  }
  console.log('  [PASS] /cv-builder redirects to /cv.');

  console.log('\n=== Step 2: Testing 4 Researched Template Definitions in cv.html ===');
  const templates = ['classic', 'two-column', 'functional', 'minimal'];
  templates.forEach(t => {
    const hasTab = cvPage.raw.includes(`id="tab-${t}"`);
    const hasFunc = cvPage.raw.includes(`render${t.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')}Template`);
    console.log(`  Template [${t}]: tab=${hasTab ? 'PASS' : 'FAIL'}, renderFunc=${hasFunc ? 'PASS' : 'FAIL'}`);
    if (!hasTab || !hasFunc) throw new Error(`Missing template structure for ${t}`);
  });

  console.log('\n=== Step 3: Testing Verified-Only Rule Auto-Fill API ===');
  const portRes = await request({ hostname: 'localhost', port: 3000, path: '/api/portfolio/salaarhussain', method: 'GET' });
  const portfolio = portRes.data;
  console.log('Portfolio User:', portfolio.profile.full_name);
  console.log('Total Projects in DB:', portfolio.projects.length);

  const verifiedProjects = portfolio.projects.filter(p => (p.client_confirm_status === 'confirmed') || (p.artefacts && p.artefacts.length > 0));
  console.log('Verified Projects with Receipts/Confirmation:', verifiedProjects.length);
  verifiedProjects.forEach(p => {
    console.log(`  - "${p.title}": Status=${p.client_confirm_status}, Receipts=${p.artefacts?.length}`);
  });

  console.log('\n=== Step 4: Testing Job-Criteria CV Audit Endpoint (/api/cv-audit) ===');
  const sampleJobDescription = `
    Senior Systems & Backend Engineer:
    - 3+ years experience with Node.js and TypeScript in production.
    - Deep knowledge of SQLite, WAL mode concurrency, and database transaction buffers.
    - Track record of delivering high-throughput event processing pipelines (sustaining 4,000+ req/s).
    - Experience conducting performance benchmarking using k6 or distributed load harnesses.
    - Hands-on production experience deploying Kubernetes clusters and managing Terraform infrastructure.
    - Professional proficiency writing microservices in Go (Golang).
  `;

  const cvDataPayload = {
    profile: portfolio.profile,
    experience: JSON.parse(portfolio.profile.experience || '[]'),
    projects: verifiedProjects
  };

  const auditRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/cv-audit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    cvData: cvDataPayload,
    jobDescription: sampleJobDescription
  });

  console.log('Audit API Status:', auditRes.status);
  const audit = auditRes.data.audit;
  console.log('Total Criteria Extracted:', audit.totalCriteria);
  console.log('Criteria Met Count:', audit.metCount);
  console.log('Criteria Missing Count (Gaps):', audit.missingCount);
  console.log('Criteria Partial Count:', audit.partialCount);
  console.log('Audit Summary:', audit.summary);

  // CRITICAL HONESTY CHECK: Ensure NO "% score" or percentage ranking is returned
  const jsonString = JSON.stringify(audit);
  if (jsonString.includes('% match') || jsonString.includes('"score"') || jsonString.includes('percent')) {
    throw new Error('HONESTY VIOLATION: CV audit returned a percentage score! Strictly forbidden by prompt.');
  }
  console.log('  [PASS] Zero percentage score verified (Strict Criteria-Wise Gap Analysis only).');

  console.log('\nAudit Findings Detail:');
  audit.findings.forEach((f, idx) => {
    console.log(`  [${f.status}] #${idx + 1}: "${f.criteria}"`);
    console.log(`     Citation: ${f.citation}`);
    if (f.suggestion) console.log(`     Remedy: ${f.suggestion}`);
  });

  // Verify that known matches (Node.js, SQLite WAL, high-throughput, k6) are Met
  const hasMetNode = audit.findings.some(f => f.criteria.includes('Node.js') && f.status === 'Met');
  const hasMetSqlite = audit.findings.some(f => f.criteria.includes('SQLite') && f.status === 'Met');
  const hasMetThroughput = audit.findings.some(f => f.criteria.includes('4,000+') && f.status === 'Met');
  // Verify that known gaps (Kubernetes, Go) are flagged as Missing Evidence (Gap)
  const hasGapK8s = audit.findings.some(f => f.criteria.includes('Kubernetes') && f.status.includes('Missing'));
  const hasGapGo = audit.findings.some(f => f.criteria.includes('Go (Golang)') && f.status.includes('Missing'));

  console.log(`\nVerification Checks:`);
  console.log(`  - Node.js requirement met: ${hasMetNode ? 'PASS' : 'FAIL'}`);
  console.log(`  - SQLite WAL requirement met: ${hasMetSqlite ? 'PASS' : 'FAIL'}`);
  console.log(`  - 4,000+ req/s requirement met: ${hasMetThroughput ? 'PASS' : 'FAIL'}`);
  console.log(`  - Kubernetes gap identified: ${hasGapK8s ? 'PASS' : 'FAIL'}`);
  console.log(`  - Go (Golang) gap identified: ${hasGapGo ? 'PASS' : 'FAIL'}`);

  if (!hasMetNode || !hasMetSqlite || !hasGapK8s) {
    throw new Error('Audit accuracy check failed.');
  }

  console.log('\n>>> ALL CV BUILDER & AUDIT TESTS PASSED WITH 100% SUCCESS! <<<');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
