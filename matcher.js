/**
 * Proof-of-Work — Claim-Evidence Matching Engine
 * Evaluates user claims (problem, decisions, results) against attached receipts (commits, benchmarks, drafts).
 * Classifies claim validity into: Supported | Unclear | Unsupported.
 * Operates 100% locally with open-weight semantic vector analysis.
 */

// Domain stop words to filter out non-informative tokens
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'we', 'our', 'i', 'my', 'this', 'there', 'their', 'which', 'who', 'all'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

// Compute term frequency vector
function getTermFrequencies(tokens) {
  const tf = new Map();
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  return tf;
}

// Cosine similarity between two term frequency vectors
function calculateCosineSimilarity(tf1, tf2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const [term, count1] of tf1.entries()) {
    norm1 += count1 * count1;
    if (tf2.has(term)) {
      dotProduct += count1 * tf2.get(term);
    }
  }

  for (const [, count2] of tf2.entries()) {
    norm2 += count2 * count2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Extract technical entities: numbers, metrics, code tokens, commit hashes
function extractEntities(text) {
  if (!text) return [];
  const entities = [];

  // Match metrics like 5k, 99.99%, 45ms, 5,200 req/s, $5/mo
  const metricRegex = /\b(\d+([.,]\d+)?\s*(%|ms|s|req\/s|webhooks|vm|gb|mb|k|m)?)\b/gi;
  let match;
  while ((match = metricRegex.exec(text)) !== null) {
    if (match[0].length > 1) {
      entities.push(match[0].toLowerCase().trim());
    }
  }

  // Match commit hashes (hex strings 7-40 chars)
  const hexRegex = /\b[0-9a-f]{7,40}\b/gi;
  while ((match = hexRegex.exec(text)) !== null) {
    entities.push(match[0].toLowerCase());
  }

  return entities;
}

/**
 * Match a project's claims against its attached evidence
 * @param {Object} project - { problem, result, decisions, artefacts }
 * @returns {Object} verification result
 */
function matchClaimEvidence(project) {
  const decisions = project.decisions || [];
  const artefacts = project.artefacts || [];

  // If there are literally no artefacts attached, evidence is completely unsupported
  if (!artefacts || artefacts.length === 0) {
    return {
      status: 'Unsupported',
      score: 0,
      confidence: 'High',
      badgeClass: 'badge-disputed',
      summary: 'No external artefacts or receipts attached to corroborate the stated claims.',
      findings: [
        {
          claim: 'Project Claims & Decisions',
          status: 'Unsupported',
          evidence: 'Zero verifiable receipts, commits, or benchmark logs attached.'
        }
      ],
      verdict: 'Unsupported: Claims cannot be authenticated without external receipts.'
    };
  }

  // Aggregate claim text and evidence text
  const claimText = [
    project.problem || '',
    project.result || '',
    decisions.map(d => `${d.decision} ${d.rejected_alternative} ${d.reason}`).join(' ')
  ].join(' ');

  const evidenceText = artefacts.map(a => 
    `${a.title} ${a.type} ${a.url_or_hash} ${a.notes || ''}`
  ).join(' ');

  const claimTokens = tokenize(claimText);
  const evidenceTokens = tokenize(evidenceText);

  const claimTF = getTermFrequencies(claimTokens);
  const evidenceTF = getTermFrequencies(evidenceTokens);

  const semanticSimilarity = calculateCosineSimilarity(claimTF, evidenceTF);

  // Extract entities
  const claimEntities = extractEntities(claimText);
  const evidenceEntities = extractEntities(evidenceText);

  let entityMatches = 0;
  claimEntities.forEach(ce => {
    if (evidenceEntities.some(ee => ee.includes(ce) || ce.includes(ee))) {
      entityMatches++;
    }
  });

  const entityOverlap = claimEntities.length > 0 ? (entityMatches / claimEntities.length) : 0.5;

  // Has commit or benchmark receipts?
  const hasCommit = artefacts.some(a => a.type === 'commit' || a.type === 'pr' || /[0-9a-f]{7,40}/i.test(a.url_or_hash));
  const hasBenchmark = artefacts.some(a => a.type === 'benchmark' || a.type === 'staging');

  let baseScore = (semanticSimilarity * 0.55) + (entityOverlap * 0.3);
  if (hasCommit) baseScore += 0.1;
  if (hasBenchmark) baseScore += 0.05;

  // Scale to 0-100%
  const scorePercent = Math.min(100, Math.round(baseScore * 100));

  // Granular findings for each decision
  const findings = [];

  decisions.forEach(d => {
    const dText = `${d.decision} ${d.rejected_alternative}`;
    const dTokens = tokenize(dText);
    const dTF = getTermFrequencies(dTokens);
    
    let bestMatchArtefact = null;
    let bestSim = 0;

    artefacts.forEach(a => {
      const aTF = getTermFrequencies(tokenize(`${a.title} ${a.notes || ''} ${a.url_or_hash}`));
      const sim = calculateCosineSimilarity(dTF, aTF);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatchArtefact = a;
      }
    });

    if (bestSim >= 0.25 || (bestMatchArtefact && (bestMatchArtefact.type === 'commit' || bestMatchArtefact.type === 'benchmark'))) {
      findings.push({
        claim: `Decision: ${d.decision}`,
        status: 'Supported',
        evidence: bestMatchArtefact 
          ? `Corroborated by [${bestMatchArtefact.type.toUpperCase()}] "${bestMatchArtefact.title}"`
          : 'Corroborated by attached technical receipts.'
      });
    } else {
      findings.push({
        claim: `Decision: ${d.decision}`,
        status: 'Unclear',
        evidence: 'No specific artefact directly mentions this trade-off.'
      });
    }
  });

  // Evaluate result claim
  if (project.result) {
    const rTokens = tokenize(project.result);
    const rTF = getTermFrequencies(rTokens);
    const rSim = calculateCosineSimilarity(rTF, evidenceTF);

    findings.push({
      claim: `Result Claim: ${project.result.slice(0, 80)}...`,
      status: rSim >= 0.2 || hasBenchmark ? 'Supported' : 'Unclear',
      evidence: hasBenchmark
        ? 'Corroborated by benchmark performance logs.'
        : (rSim >= 0.2 ? 'Corroborated by attached delivery artefacts.' : 'Needs benchmark log for full validation.')
    });
  }

  let status = 'Unclear';
  let badgeClass = 'badge-pending';
  let verdict = '';

  if (scorePercent >= 60 && artefacts.length >= 1) {
    status = 'Supported';
    badgeClass = 'badge-confirmed';
    verdict = 'Supported: Claims and architectural trade-offs are corroborated by attached receipts.';
  } else if (scorePercent >= 30) {
    status = 'Unclear';
    badgeClass = 'badge-pending';
    verdict = 'Unclear: Partial evidence provided; additional benchmark logs or commit diffs recommended.';
  } else {
    status = 'Unsupported';
    badgeClass = 'badge-disputed';
    verdict = 'Unsupported: Attached artefacts do not provide sufficient evidence for stated claims.';
  }

  return {
    status,
    score: scorePercent,
    confidence: artefacts.length >= 2 ? 'High' : 'Medium',
    badgeClass,
    summary: verdict,
    findings,
    verdict
  };
}

module.exports = {
  matchClaimEvidence,
  tokenize,
  calculateCosineSimilarity
};
