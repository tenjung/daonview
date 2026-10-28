import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';

// Compile the actual TypeScript modules with explicit fake I/O dependencies.
// No application environment, network, database or Next server is used.
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
function compiled(path, replacements = {}) {
  let code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [source, target] of Object.entries(replacements)) code = code.replaceAll(`'${source}'`, `'${target}'`).replaceAll(`"${source}"`, `"${target}"`);
  return moduleUrl(code);
}
const coreUrl = compiled('src/lib/campaignActions.ts');
const core = await import(coreUrl);
const nextUrl = moduleUrl('export const NextResponse = {json: (body, options) => Response.json(body, options)}');
const cacheUrl = moduleUrl('export const revalidatePath = path => globalThis.__campaignActionTest.paths.push(path); export const revalidateTag = tag => globalThis.__campaignActionTest.tags.push(tag);');
const sessionUrl = moduleUrl('export const createClient = async () => globalThis.__campaignActionTest.session;');
const adminUrl = moduleUrl('export const createAdminClient = () => globalThis.__campaignActionTest.db;');
const serverUrl = compiled('src/lib/campaignActionServer.ts', {
  'server-only': moduleUrl(''), 'next/cache': cacheUrl,
  '@/lib/supabase/server': sessionUrl, '@/lib/supabase/admin': adminUrl,
  '@/lib/campaignActions': coreUrl,
});
const replacements = { 'next/server': nextUrl, '@/lib/campaignActions': coreUrl, '@/lib/campaignActionServer': serverUrl };
const route = await import(compiled('src/app/api/campaigns/bulk-actions/route.ts', replacements));
const closeRoute = await import(compiled('src/app/api/campaigns/[id]/close/route.ts', replacements));
const types = await import(compiled('src/lib/campaignActionTypes.ts'));

function fakeDb() {
  const db = { rows: new Map(), payments: [], notifications: [], reads: [], races: new Set(), fail: new Set() };
  db.from = table => {
    const filters = [];
    let operation = 'read', patch;
    const q = {
      select() { return q; },
      eq(key, value) { filters.push([key, value]); return q; },
      update(value) { operation = 'update'; patch = value; return q; },
      insert(value) { operation = 'insert'; patch = value; return q; },
      async maybeSingle() { return execute(); },
      then(resolve, reject) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    function execute() {
      db.reads.push([table, operation]);
      if (db.fail.has(table + ':' + operation)) return { data: null, error: { message: 'simulated failure' } };
      if (table === 'campaigns') {
        const id = filters.find(([key]) => key === 'id')?.[1];
        const row = db.rows.get(id);
        if (operation === 'update' && db.races.delete(id)) row.status = 'ONGOING';
        if (!row || !filters.every(([key, value]) => row[key] === value)) return { data: null, error: null };
        if (operation === 'update') Object.assign(row, patch);
        return { data: { ...row }, error: null };
      }
      if (table === 'payments') {
        for (const row of db.payments) if (filters.every(([key, value]) => row[key] === value)) Object.assign(row, patch);
      }
      if (table === 'notifications') db.notifications.push(patch);
      return { data: null, error: null };
    }
    return q;
  };
  return db;
}
let db;
function seed(id, status = 'PENDING', created_by = 'advertiser') {
  db.rows.set(id, { id, status, title: `campaign ${id}`, end_date: '2099-01-01', created_by });
}
function request(body) { return new Request('https://example.test/api/campaigns/bulk-actions', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }); }
function setIdentity(userId, role) {
  globalThis.__campaignActionTest.session = {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId, user_metadata: { role: 'ADMIN' } } : null }, error: null }) },
    from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: role ? { role } : null, error: null }) }),
  };
}
beforeEach(() => {
  db = fakeDb();
  globalThis.__campaignActionTest = { db, paths: [], tags: [] };
  setIdentity('admin', 'ADMIN');
});

test('bulk route rejects anonymous, advertiser, missing profile and untrusted metadata', async () => {
  for (const [id, role, status] of [[null, null, 401], ['advertiser', 'ADVERTISER', 403], ['unknown', null, 403]]) {
    setIdentity(id, role);
    assert.equal((await route.POST(request({ action: 'APPROVE', campaignIds: [1] }))).status, status);
  }
  assert.equal(db.reads.length, 0);
});

test('bulk route accepts stored administrator aliases', async () => {
  for (const role of ['admin', 'MASTER', 'SUPER_ADMIN']) {
    setIdentity('admin', role);
    const response = await route.POST(request({ action: 'CLOSE', campaignIds: [999] }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).results[0].httpStatus, 404);
  }
});

test('input validation rejects malformed JSON, action, IDs, duplicates and oversized requests', async () => {
  const invalid = [null, {}, { action: 'DELETE', campaignIds: [1] }, ...[[], [0], [-1], [1.2], ['1'], [1, 1], [Number.MAX_SAFE_INTEGER + 1], Array.from({ length: 101 }, (_, i) => i + 1)].map(campaignIds => ({ action: 'APPROVE', campaignIds }))];
  for (const body of invalid) assert.equal((await route.POST(request(body))).status, 400);
  assert.equal((await route.POST(new Request('https://example.test', { method: 'POST', body: '{' }))).status, 400);
  assert.equal(db.reads.length, 0);
});

test('approval updates only pending payments, creates one notification and invalidates affected paths', async () => {
  seed(1);
  db.payments.push({ campaign_id: 1, status: 'PENDING' }, { campaign_id: 1, status: 'CANCELLED' }, { campaign_id: 2, status: 'PENDING' });
  const response = await route.POST(request({ action: 'APPROVE', campaignIds: [1] }));
  const body = await response.json();
  assert.equal(body.results[0].outcome, 'SUCCESS');
  assert.equal(db.rows.get(1).status, 'RECRUITING');
  assert.deepEqual(db.payments.map(row => row.status), ['PAID', 'CANCELLED', 'PENDING']);
  assert.equal(db.notifications.length, 1);
  assert.equal(db.notifications[0].type, 'CAMPAIGN_APPROVED');
  assert(globalThis.__campaignActionTest.paths.includes('/campaigns/1'));
  assert(globalThis.__campaignActionTest.paths.includes('/c/1'));
  assert(globalThis.__campaignActionTest.paths.includes('/dashboard/admin/campaigns'));
  assert.deepEqual(globalThis.__campaignActionTest.tags, ['home-banner-data']);
  const repeated = await route.POST(request({ action: 'APPROVE', campaignIds: [1] }));
  assert.equal((await repeated.json()).results[0].outcome, 'SKIPPED');
  assert.equal(db.notifications.length, 1);
});

test('mixed failures do not stop later campaigns and wrong-status rows are skipped', async () => {
  seed(1); seed(2, 'COMPLETED'); seed(3);
  const response = await route.POST(request({ action: 'REJECT', campaignIds: [999, 1, 2, 3] }));
  assert.deepEqual((await response.json()).results.map(row => row.outcome), ['FAILED', 'SUCCESS', 'SKIPPED', 'SUCCESS']);
  assert.equal(db.rows.get(1).status, 'REJECTED');
  assert.equal(db.rows.get(3).status, 'REJECTED');
  assert.equal(db.notifications.length, 0);
  assert(!db.reads.some(([table]) => table === 'payments'));
});

test('concurrent state change prevents stale approval and duplicate side effects', async () => {
  seed(1); db.races.add(1);
  const result = await core.applyCampaignAction(db, { userId: 'admin', role: 'ADMIN' }, 'APPROVE', 1);
  assert.equal(result.outcome, 'SKIPPED');
  assert.equal(db.rows.get(1).status, 'ONGOING');
  assert.equal(db.notifications.length, 0);
  assert(!db.reads.some(([table]) => table === 'payments'));
});

test('payment and notification failures return applied state with explicit warnings', async () => {
  seed(1); db.fail.add('payments:update'); db.fail.add('notifications:insert');
  const response = await route.POST(request({ action: 'APPROVE', campaignIds: [1] }));
  const result = (await response.json()).results[0];
  assert.equal(result.outcome, 'WARNING');
  assert.equal(result.campaign.status, 'RECRUITING');
  assert.equal(result.warnings.length, 2);
});

test('query and update errors never report success or invoke side effects', async () => {
  for (const operation of ['read', 'update']) {
    seed(1); db.fail.clear(); db.fail.add('campaigns:' + operation);
    const result = await core.applyCampaignAction(db, { userId: 'admin', role: 'ADMIN' }, 'APPROVE', 1);
    assert.equal(result.outcome, 'FAILED');
    assert.equal(db.rows.get(1).status, 'PENDING');
    assert.equal(db.notifications.length, 0);
  }
});

test('KST closing date preserves expired dates and truncates future dates', () => {
  const now = new Date('2026-10-27T16:00:00Z');
  assert.equal(core.campaignCloseEndDate('2026-10-27', now), '2026-10-27');
  assert.equal(core.campaignCloseEndDate('2027-01-01', now), '2026-10-28');
  assert.equal(core.campaignCloseEndDate(null, now), '2026-10-28');
});

test('legacy close API preserves advertiser ownership and response contract', async () => {
  seed(1, 'RECRUITING'); seed(2, 'ONGOING', 'other');
  setIdentity('advertiser', 'ADVERTISER');
  const close = id => closeRoute.POST(new Request('https://example.test', { method: 'POST' }), { params: Promise.resolve({ id: String(id) }) });
  assert.equal((await close(2)).status, 403);
  const response = await close(1); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.success, true); assert.equal(body.campaign.status, 'COMPLETED');
  assert.equal((await close(1)).status, 409);
  assert.equal((await close('invalid')).status, 400);
  assert.equal(db.rows.get(2).status, 'ONGOING');
});

test('action eligibility normalizes statuses and excludes completed/draft/rejected', () => {
  assert(types.canApplyCampaignAction('APPROVE', 'pending'));
  assert(types.canApplyCampaignAction('CLOSE', 'ongoing'));
  assert(!types.canApplyCampaignAction('REJECT', 'RECRUITING'));
  for (const status of ['COMPLETED', 'DRAFT', 'REJECTED']) for (const action of ['APPROVE', 'REJECT', 'CLOSE']) assert(!types.canApplyCampaignAction(action, status));
});

test('table selects only current page, retains IDs across pages and sorting', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: `campaign ${String(i + 1).padStart(2, '0')}` }));
  let state = { pagination: { pageIndex: 0, pageSize: 10 }, rowSelection: {}, sorting: [], columnFilters: [] };
  const table = createTable({ data: rows, columns: [{ accessorKey: 'title' }], state,
    getRowId: row => String(row.id), enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: updater => { state = { ...state, rowSelection: typeof updater === 'function' ? updater(state.rowSelection) : updater }; table.setOptions(options => ({ ...options, state })); },
  });
  table.toggleAllPageRowsSelected(true);
  assert.deepEqual(Object.keys(state.rowSelection), rows.slice(0, 10).map(row => String(row.id)));
  state = { ...state, pagination: { pageIndex: 1, pageSize: 10 }, sorting: [{ id: 'title', desc: true }] };
  table.setOptions(options => ({ ...options, state }));
  assert.equal(table.getSelectedRowModel().rows.length, 10);
  assert(table.getRow('1').getIsSelected()); assert(!table.getRow('12').getIsSelected());
  table.resetRowSelection(true); assert.deepEqual(state.rowSelection, {});
});
