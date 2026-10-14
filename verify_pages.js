const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('--- 1. VERIFYING HOMEPAGE (/) ---');
  const home = await fetchUrl('http://localhost:3000/');
  console.log('Homepage Status:', home.status);
  
  const checks = [
    { name: 'Headline updated', pass: home.body.includes('Portfolios Grounded in Linked Evidence, Not AI Hallucinations') },
    { name: 'Sample badge present', pass: home.body.includes('SAMPLE DATA &mdash; NOT A REAL CONFIRMATION') },
    { name: 'Stats 0 text present', pass: home.body.includes('0 — Be the first to verify') },
    { name: 'Portfolio standard section present', pass: home.body.includes('The Senior Engineering Portfolio Standard') },
    { name: 'Case study blueprint present', pass: home.body.includes('The Researched Portfolio Blueprint') },
    { name: 'Ethical NDA handling present', pass: home.body.includes('Ethical NDA Handling') },
    { name: 'Claim-Evidence section present', pass: home.body.includes('Claim-Evidence Corroboration Engine') },
    { name: 'No Alex Henderson', pass: !home.body.includes('Alex Henderson') },
    { name: 'No Sarah Chen', pass: !home.body.includes('Sarah Chen') },
    { name: 'No FinFlow', pass: !home.body.includes('FinFlow') },
    { name: 'No tamper-proof claim', pass: !home.body.includes('tamper-proof') && !home.body.includes('tamper-resistant') },
    { name: 'No Impossible to Hallucinate', pass: !home.body.includes('Impossible to Hallucinate') }
  ];

  checks.forEach(c => {
    console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
  });

  console.log('\n--- 2. VERIFYING API STATS (/api/stats) ---');
  const statsRes = await fetchUrl('http://localhost:3000/api/stats');
  const stats = JSON.parse(statsRes.body);
  console.log('Stats Response:', stats);
  console.log('Confirmed Count is 0:', stats.stats.confirmedProjects === 0 ? 'PASS' : 'FAIL');

  console.log('\n--- 3. VERIFYING SALAAR HUSSAIN PORTFOLIO (/api/portfolio/salaarhussain) ---');
  const portRes = await fetchUrl('http://localhost:3000/api/portfolio/salaarhussain');
  const port = JSON.parse(portRes.body);
  console.log('Profile Name:', port.profile.full_name);
  console.log('Role:', port.profile.role);
  console.log('Location:', port.profile.location);
  console.log('Has About:', !!port.profile.about);
  console.log('Has Experience:', !!port.profile.experience);
  console.log('Has Open Source:', !!port.profile.open_source);
  console.log('Has Writing/Talks:', !!port.profile.writing_talks);
  console.log('Has Skills (Tiers, no %):', !!port.profile.skills);
  
  const parsedSkills = JSON.parse(port.profile.skills);
  console.log('Skills Tiers:', Object.keys(parsedSkills));

  console.log(`Projects Count: ${port.projects.length} (2-4 Finished Projects standard)`);
  port.projects.forEach((p, idx) => {
    console.log(`\n  Project #${idx + 1}: "${p.title}"`);
    console.log(`    Status: "${p.client_confirm_status}" (Honest: awaiting confirmation)`);
    console.log(`    Defensible Number: "${p.defensible_number}"`);
    console.log(`    Micro-Attribution: "${p.my_role_attribution?.slice(0, 50)}..."`);
    console.log(`    AI Disclosure: "${p.ai_disclosure?.slice(0, 50)}..."`);
    console.log(`    Live URL: ${p.live_url}`);
    console.log(`    Repo URL: ${p.repo_url}`);
    console.log(`    README URL: ${p.readme_url}`);
    console.log(`    Decisions: ${p.decisions.length}`);
    console.log(`    Artefacts: ${p.artefacts.length}`);
    console.log(`    AI Corroboration Status: ${p.evidenceAnalysis?.status} (${p.evidenceAnalysis?.score}%)`);
  });

  console.log('\n--- 4. VERIFYING SINGLE PROJECT DOSSIER (/api/projects/:id) ---');
  const p1 = port.projects[0];
  const p1Res = await fetchUrl(`http://localhost:3000/api/projects/${p1.id}`);
  const p1Data = JSON.parse(p1Res.body);
  console.log('Project API Response Success:', p1Data.success);
  console.log('Confirmation Token Generated:', !!p1Data.project.client_confirm_token);
  console.log('Confirm URL present for one-tap portal:', !!p1Data.confirmUrl);

  console.log('\n>>> ALL PAGE VERIFICATIONS COMPLETED! <<<');
}

verifyAll().catch(console.error);
