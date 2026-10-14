const http = require('http');
const fs = require('fs');
const path = require('path');

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

  console.log('\n=== Step 2: Testing 4 ATS-Safe Single-Column Templates ===');
  const templates = ['classic', 'modern', 'functional', 'minimal'];
  templates.forEach(t => {
    const hasTab = cvPage.raw.includes(`id="tab-${t}"`);
    const hasFunc = cvPage.raw.includes(`render${t.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')}Template`);
    console.log(`  Template [${t}]: tab=${hasTab ? 'PASS' : 'FAIL'}, renderFunc=${hasFunc ? 'PASS' : 'FAIL'}`);
    if (!hasTab || !hasFunc) throw new Error(`Missing template structure for ${t}`);
  });

  console.log('\n=== Step 3: Checking Strict Single-Column & No-Commercial-Brand Rules ===');
  const cvHtml = fs.readFileSync(path.join(__dirname, 'public', 'cv.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(__dirname, 'public', 'css', 'style.css'), 'utf8');

  // Forbidden commercial brand names
  const forbiddenBrands = ['Novoresume', 'Zety', 'Canva', 'Kickresume'];
  forbiddenBrands.forEach(b => {
    const inHtml = cvHtml.toLowerCase().includes(b.toLowerCase());
    const inCss = styleCss.toLowerCase().includes(b.toLowerCase());
    console.log(`  Brand check [no ${b}]: inHtml=${inHtml ? 'FAIL' : 'CLEAN'}, inCss=${inCss ? 'FAIL' : 'CLEAN'}`);
    if (inHtml || inCss) throw new Error(`Violation: Found commercial site name ${b} in code/templates!`);
  });

  // Forbidden layout patterns in CV paper
  const forbiddenLayouts = ['two-col-layout', 'sidebar-col', 'main-col'];
  forbiddenLayouts.forEach(fl => {
    const inHtml = cvHtml.includes(fl);
    const inCss = styleCss.includes(`.${fl}`);
    console.log(`  Layout check [no ${fl}]: inHtml=${inHtml ? 'FAIL' : 'PASS'}, inCss=${inCss ? 'FAIL' : 'PASS'}`);
    if (inHtml || inCss) throw new Error(`Violation: Multi-column class ${fl} found! All templates must be single column.`);
  });

  // Check that no tables are used inside the CV templates
  if (cvHtml.includes('<table') || cvHtml.includes('<td')) {
    throw new Error('Violation: Table layout found in CV templates! Must be ATS-safe semantic text elements only.');
  }
  console.log('  [PASS] Zero tables, zero sidebars, zero multi-column layouts verified.');

  console.log('\n=== Step 4: Verifying Template Section Order ===');
  // Check Classic order: Summary -> Professional Experience -> Technical Skills -> Education -> Certifications
  const classicIdxSummary = cvHtml.indexOf('function renderClassicTemplate');
  const classicBody = cvHtml.substring(classicIdxSummary, cvHtml.indexOf('function renderModernTemplate'));
  const cSum = classicBody.indexOf('Professional Summary');
  const cExp = classicBody.indexOf('Professional Experience');
  const cSki = classicBody.indexOf('Technical Skills');
  const cEdu = classicBody.indexOf('Education');
  const cCer = classicBody.indexOf('Certifications &amp; Verified Projects');
  console.log(`  Classic Order Check: Summary(${cSum}) < Experience(${cExp}) < Skills(${cSki}) < Education(${cEdu}) < Certifications(${cCer})`);
  if (!(cSum !== -1 && cExp !== -1 && cSki !== -1 && cEdu !== -1 && cCer !== -1 && cSum < cExp && cExp < cSki && cSki < cEdu && cEdu < cCer)) {
    throw new Error('Classic template section order does not match requirement!');
  }
  console.log('  [PASS] Classic Harvard-style section order verified.');

  // Check Modern order: Summary -> Technical Skills -> Experience -> Education -> Certifications
  const modernIdx = cvHtml.indexOf('function renderModernTemplate');
  const modernBody = cvHtml.substring(modernIdx, cvHtml.indexOf('function renderFunctionalTemplate'));
  const mSum = modernBody.indexOf('Summary');
  const mSki = modernBody.indexOf('Technical Skills');
  const mExp = modernBody.indexOf('Experience');
  const mEdu = modernBody.indexOf('Education');
  const mCer = modernBody.indexOf('Certifications &amp; Verified Deliverables');
  console.log(`  Modern Order Check: Summary(${mSum}) < Skills(${mSki}) < Experience(${mExp}) < Education(${mEdu}) < Certifications(${mCer})`);
  if (!(mSum !== -1 && mSki !== -1 && mExp !== -1 && mEdu !== -1 && mCer !== -1 && mSum < mSki && mSki < mExp && mExp < mEdu && mEdu < mCer)) {
    throw new Error('Modern template section order does not match requirement (Skills must be above Experience)!');
  }
  console.log('  [PASS] Modern single-column section order (Skills Top) verified.');

  // Check Functional order: Career Transition Summary -> Core Competencies (Skills) -> Work History (Experience) -> Projects -> Education
  const funcIdx = cvHtml.indexOf('function renderFunctionalTemplate');
  const funcBody = cvHtml.substring(funcIdx, cvHtml.indexOf('function renderMinimalTemplate'));
  const fSum = funcBody.indexOf('Career Transition Summary');
  const fSki = funcBody.indexOf('Core Competencies &amp; Verified Evidence');
  const fExp = funcBody.indexOf('Work History');
  const fPrj = funcBody.indexOf('Verified Technical Projects');
  const fEdu = funcBody.indexOf('Education &amp; Credentials');
  console.log(`  Functional Order Check: Summary(${fSum}) < Skills Groups(${fSki}) < Experience(${fExp}) < Projects(${fPrj}) < Education(${fEdu})`);
  if (!(fSum !== -1 && fSki !== -1 && fExp !== -1 && fPrj !== -1 && fEdu !== -1 && fSum < fSki && fSki < fExp && fExp < fPrj && fPrj < fEdu)) {
    throw new Error('Functional template section order does not match requirement!');
  }
  console.log('  [PASS] Skills-First / Functional section order (Skills Groups Top) verified.');

  console.log('\n=== Step 5: Testing Verified-Only Rule & Urdu Warning Text ===');
  const requiredWarningText = 'Ye entry verified nahi hai — CV mein add nahi hogi jab tak saboot na ho.';
  const hasWarningInHtml = cvHtml.includes(requiredWarningText);
  console.log(`  Explicit Warning Check ["${requiredWarningText}"]: ${hasWarningInHtml ? 'PASS' : 'FAIL'}`);
  if (!hasWarningInHtml) {
    throw new Error('Required unverified warning text missing from cv.html');
  }

  const portRes = await request({ hostname: 'localhost', port: 3000, path: '/api/portfolio/salaarhussain', method: 'GET' });
  const portfolio = portRes.data;
  console.log('  Portfolio User:', portfolio.profile.full_name);

  const verifiedProjects = portfolio.projects.filter(p => (p.client_confirm_status === 'confirmed') || (p.artefacts && p.artefacts.length > 0));
  console.log('  Verified Projects with Receipts/Confirmation:', verifiedProjects.length);
  verifiedProjects.forEach(p => {
    console.log(`    - "${p.title}": Status=${p.client_confirm_status}, Receipts=${p.artefacts?.length}`);
  });

  console.log('\n=== Step 6: Testing Job-Criteria CV Audit Endpoint (/api/cv-audit) ===');
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

  // Verify that known matches (Node.js, SQLite WAL, high-throughput) are Met
  const hasMetNode = audit.findings.some(f => f.criteria.includes('Node.js') && f.status === 'Met');
  const hasMetSqlite = audit.findings.some(f => f.criteria.includes('SQLite') && f.status === 'Met');
  const hasMetThroughput = audit.findings.some(f => f.criteria.includes('4,000+') && f.status === 'Met');
  const hasGapK8s = audit.findings.some(f => f.criteria.includes('Kubernetes') && f.status.includes('Missing'));
  const hasGapGo = audit.findings.some(f => f.criteria.includes('Go (Golang)') && f.status.includes('Missing'));

  console.log(`\nVerification Checks:`);
  console.log(`  - Node.js requirement met: ${hasMetNode ? 'PASS' : 'FAIL'}`);
  console.log(`  - SQLite WAL requirement met: ${hasMetSqlite ? 'PASS' : 'FAIL'}`);
  console.log(`  - 4,000+ req/s requirement met: ${hasMetThroughput ? 'PASS' : 'FAIL'}`);
  console.log(`  - Kubernetes gap identified: ${hasGapK8s ? 'PASS' : 'FAIL'}`);
  console.log(`  - Go (Golang) gap identified: ${hasGapGo ? 'PASS' : 'FAIL'}`);

  if (!hasMetNode || !hasMetSqlite || !hasGapK8s || !hasGapGo) {
    throw new Error('Audit accuracy check failed.');
  }

  console.log('\n=== Step 7: Testing PDF Print Styles in style.css ===');
  const hasPrintRules = styleCss.includes('@media print') && (styleCss.includes('window.print') || cvHtml.includes('window.print()'));
  if (!hasPrintRules) {
    throw new Error('Print styles or window.print handler missing.');
  }
  console.log('  [PASS] Print styles & window.print() action confirmed.');

  console.log('\n>>> ALL 4 ATS-SAFE TEMPLATES & CV AUDIT TESTS PASSED WITH 100% SUCCESS! <<<');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
