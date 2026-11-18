// Render the actual shared TSX table with fixture data; no network or database access.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = process.cwd();
const noop = () => null;
const mocks = {
  '@/lib/supabase/client': { supabase: {} },
  '@/lib/alimtalk': { sendShippingStartedAlimtalk: async () => ({success:true}) },
  '@/components/ConfirmDialog': { __esModule: true, default: noop },
  './InfluencerReviewModal': { __esModule: true, default: noop },
  './ReputationDetailModal': { __esModule: true, default: noop },
  './CancellationModal': { __esModule: true, default: noop },
};
const cache = new Map();
function loadTsx(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = {exports:{}}; cache.set(filename,loadedModule);
  const source = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire = id => {
    if (Object.hasOwn(mocks,id)) return mocks[id];
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? path.join(root,'src',id.slice(2)) : path.resolve(path.dirname(filename),id);
      const resolved = [base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(file=>fs.existsSync(file));
      if (!resolved) throw new Error(`Missing fixture dependency ${id}`);
      return loadTsx(resolved);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`,{filename})(localRequire,loadedModule,loadedModule.exports);
  return loadedModule.exports;
}
const Table = loadTsx(path.join(root,'src/components/admin/ApplicationsTableClient.tsx')).default;
const hold = {id:'00000000-0000-4000-8000-000000000001',applicationId:1,recipient:'inactive@example.com',reason:'MAILBOX_INACTIVE',occurredAt:'2026-11-18T08:17:45Z',smtpStatus:'5.2.1'};
const props = {
  campaignId:'44',campaignTitle:'반송 분류 미리보기',campaignType:'DELIVERY',recruitCount:20,
  initialApplications: [
    {id:1,user_id:'fixture-1',campaign_id:44,status:'APPROVED',created_at:'2026-11-01T00:00:00Z',user:{id:'fixture-1',nickname:'반송된 신청자',email:'inactive@example.com',phone_number:'01000000000'}},
    {id:2,user_id:'fixture-2',campaign_id:44,status:'SELECTED',created_at:'2026-11-01T00:00:00Z',user:{id:'fixture-2',nickname:'정상 신청자',email:'normal@example.com',phone_number:'01000000000'}},
  ],initialEmailHolds:[hold],
};
test('shared administrator/advertiser table renders separate hold tab and preserves actions', () => {
  for (const canResolveEmailHolds of [true,false]) {
    const html = renderToStaticMarkup(React.createElement(Table,{...props,canResolveEmailHolds}));
    const text = html.replace(/<[^>]+>/g,'').replace(/\s+/g,' ');
    assert.match(text,/보류됨 1/);
    assert.match(text,/승인됨 1/);
    assert.match(text,/메일함 비활성/);
    assert.match(text,/inactive@example.com/);
    assert.match(text,/재발송/);
    assert.equal(text.includes('보류 해제'),canResolveEmailHolds);
    assert.ok(html.includes('overflow-x-auto'));
    const previewIndex = process.argv.indexOf('--preview-dir');
    if (previewIndex !== -1) {
      const directory = process.argv[previewIndex+1]; fs.mkdirSync(directory,{recursive:true});
      const css = fs.readdirSync('.next/static/chunks').filter(file=>file.endsWith('.css')).map(file=>fs.readFileSync(path.join('.next/static/chunks',file),'utf8')).join('\n');
      fs.writeFileSync(path.join(directory,canResolveEmailHolds?'admin.html':'advertiser.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body style="margin:0;padding:16px;background:#fafafa">${html}</body></html>`);
    }
  }
});
