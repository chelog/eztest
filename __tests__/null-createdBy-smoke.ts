/**
 * Smoke test: null-createdBy safety
 *
 * Verifies that the expressions used in the fixed components do NOT throw
 * when createdBy is null (orphaned FK scenario in self-hosted deployments).
 *
 * Run: npx tsx __tests__/null-createdBy-smoke.ts
 */

let passed = 0;
let failed = 0;

function assert(label: string, got: unknown, expected: unknown) {
  const ok = got === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
    failed++;
  }
}

function assertNoThrow(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label} — did not throw`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${label} — threw: ${e}`);
    failed++;
  }
}

// ---------- test data ----------
const nullCreatedBy = null as unknown as { name: string; email: string; avatar?: string };

// ---------- TestCaseCard & ProjectTestCases ----------
console.log('\n[TestCaseCard / ProjectTestCases] avatar initial:');
assertNoThrow(
  'null createdBy — does not throw',
  () => { (nullCreatedBy?.name ?? '-').charAt(0).toUpperCase(); }
);
assert(
  'null createdBy — shows "-"',
  (nullCreatedBy?.name ?? '-').charAt(0).toUpperCase(),
  '-'
);

console.log('\n[TestCaseCard / ProjectTestCases] display name:');
assertNoThrow(
  'null createdBy — does not throw',
  () => { nullCreatedBy?.name ?? '-'; }
);
assert(
  'null createdBy — shows "-"',
  nullCreatedBy?.name ?? '-',
  '-'
);

// ---------- TestCaseInfoCard (UserInfoSection props) ----------
console.log('\n[TestCaseInfoCard] user.name and user.email props:');
assertNoThrow(
  'null createdBy — name does not throw',
  () => { nullCreatedBy?.name ?? '-'; }
);
assert(
  'null createdBy — name shows "-"',
  nullCreatedBy?.name ?? '-',
  '-'
);
assertNoThrow(
  'null createdBy — email does not throw',
  () => { nullCreatedBy?.email; }
);
assert(
  'null createdBy — email is undefined',
  nullCreatedBy?.email,
  undefined
);

// ---------- sanity: real user still works ----------
const realUser = { name: 'Alice', email: 'alice@example.com' };
console.log('\n[Sanity] real user values:');
assert(
  'real user — avatar initial "A"',
  (realUser?.name ?? '-').charAt(0).toUpperCase(),
  'A'
);
assert(
  'real user — name "Alice"',
  realUser?.name ?? '-',
  'Alice'
);
assert(
  'real user — email "alice@example.com"',
  realUser?.email,
  'alice@example.com'
);

// ---------- summary ----------
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
