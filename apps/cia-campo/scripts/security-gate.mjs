import fs from 'node:fs/promises';

const file = process.argv[2] || 'audit.json';
const raw = await fs.readFile(file, 'utf8');
const report = JSON.parse(raw);
if (
  report.error ||
  !report.vulnerabilities ||
  typeof report.vulnerabilities !== 'object' ||
  Array.isArray(report.vulnerabilities)
) {
  throw new Error('Invalid npm audit report; refusing to pass the security gate.');
}

const ALLOWED_ADVISORIES = new Set([
  'GHSA-86w9-cpqp-85rv',
  'GHSA-mrhx-c7xc-m3w5'
]);

const REVIEW_DEADLINE = new Date('2026-11-15T00:00:00Z');

function advisoryIdsFor(packageName, seen = new Set()) {
  if (seen.has(packageName)) return new Set();
  seen.add(packageName);

  const vuln = report.vulnerabilities?.[packageName];
  const ids = new Set();
  if (!vuln) return ids;

  for (const via of vuln.via ?? []) {
    if (typeof via === 'string') {
      for (const id of advisoryIdsFor(via, seen)) ids.add(id);
      continue;
    }

    // npm propagates the maximum severity to parent packages. A low advisory
    // must not become high merely because the same parent also depends on an
    // independently accepted high advisory.
    if (!['high', 'critical'].includes(via.severity ?? vuln.severity)) continue;

    const haystack = [via.url, via.title, via.name].filter(Boolean).join(' ');
    const matches = haystack.match(/GHSA-[a-z0-9-]+/gi) ?? [];
    if (!matches.length) ids.add('UNIDENTIFIED_HIGH_OR_CRITICAL_ADVISORY');
    for (const match of matches) ids.add(match);
  }

  return ids;
}

const blocked = [];
const accepted = [];

for (const [packageName, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  if (!['high', 'critical'].includes(vuln.severity)) continue;

  const ids = advisoryIdsFor(packageName);
  const knownOnly =
    ids.size > 0 && [...ids].every((id) => ALLOWED_ADVISORIES.has(id));

  if (knownOnly && new Date() < REVIEW_DEADLINE) {
    accepted.push({
      packageName,
      severity: vuln.severity,
      advisories: [...ids]
    });
  } else {
    blocked.push({
      packageName,
      severity: vuln.severity,
      advisories: [...ids]
    });
  }
}

if (accepted.length) {
  console.warn(
    'Accepted temporary upstream build-tool advisories:',
    JSON.stringify(accepted, null, 2)
  );
  console.warn('Mandatory review deadline:', REVIEW_DEADLINE.toISOString());
}

if (blocked.length) {
  console.error('Security gate blocked by high/critical vulnerabilities:');
  console.error(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

console.log('Security gate passed: no unapproved high/critical advisories.');
