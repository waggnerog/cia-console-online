import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const gate = path.join(directory, 'security-gate.mjs');
const fixtures = path.resolve(directory, '..', '.security-gate-fixtures');
fs.mkdirSync(fixtures, { recursive: true });

function run(report, date = '2026-11-01T00:00:00Z') {
  const file = path.join(fixtures, randomUUID() + '.json');
  fs.writeFileSync(file, JSON.stringify(report));
  try {
    const wrapper = [
      'const RealDate = Date;',
      'const clock = ' + JSON.stringify(date) + ';',
      'globalThis.Date = class extends RealDate {',
      'constructor(...args) { super(...(args.length ? args : [clock])); }',
      'static now() { return new RealDate(clock).getTime(); }',
      '};',
      'process.argv = [process.execPath, ' + JSON.stringify(gate) + ', ' + JSON.stringify(file) + '];',
      'await import(' + JSON.stringify(pathToFileURL(gate).href) + ');'
    ].join('\n');
    return spawnSync(process.execPath, ['--input-type=module', '--eval', wrapper], {
      encoding: 'utf8'
    });
  } finally {
    fs.unlinkSync(file);
  }
}

function advisory(severity, id) {
  return { severity, url: 'https://github.com/advisories/' + id };
}

function knownHighWithLowDependency() {
  return {
    vulnerabilities: {
      zod: { severity: 'high', via: [advisory('high', 'GHSA-mrhx-c7xc-m3w5')] },
      deepmerge: { severity: 'low', via: [advisory('low', 'GHSA-gcqx-w48m-w2h4')] },
      '@expo/cli': { severity: 'high', via: ['zod', 'deepmerge'] },
      expo: { severity: 'high', via: ['@expo/cli'] }
    }
  };
}

test('an unrelated low advisory does not invalidate an accepted transitive high advisory', () => {
  const result = run(knownHighWithLowDependency());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Security gate passed/);
});

for (const severity of ['high', 'critical']) {
  test('an unapproved ' + severity + ' advisory blocks through parent packages', () => {
    const report = knownHighWithLowDependency();
    report.vulnerabilities.newDependency = {
      severity,
      via: [advisory(severity, 'GHSA-xxxx-yyyy-zzzz')]
    };
    report.vulnerabilities['@expo/cli'].via.push('newDependency');
    const result = run(report);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /GHSA-xxxx-yyyy-zzzz/);
  });
}

test('an unidentified high advisory cannot hide beside an accepted advisory', () => {
  const report = knownHighWithLowDependency();
  report.vulnerabilities.zod.via.push({
    severity: 'high',
    title: 'Unclassified security issue without a GHSA identifier'
  });
  const result = run(report);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /UNIDENTIFIED_HIGH_OR_CRITICAL_ADVISORY/);
});

test('accepted upstream advisories block after the mandatory review deadline', () => {
  assert.equal(run(knownHighWithLowDependency(), '2026-11-16T00:00:00Z').status, 1);
});

test('an audit failure or missing vulnerability report fails closed', () => {
  assert.equal(run({ error: { code: 'ECONNRESET' } }).status, 1);
  assert.equal(run({ metadata: { vulnerabilities: { high: 0 } } }).status, 1);
});

test('a valid report with no vulnerabilities passes', () => {
  const result = run({ vulnerabilities: {} });
  assert.equal(result.status, 0, result.stderr);
});
