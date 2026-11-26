import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

// 실제 selectionKakaoServer.ts를 가짜 DB·가짜 솔라피로 실행한다. 네트워크·DB·.env 사용 없음.
const ENV = {
  SOLAPI_API_KEY: 'k', SOLAPI_API_SECRET: 's', SOLAPI_SENDER_PHONE: '0212345678',
  SOLAPI_KAKAO_CHANNEL_ID: 'PF', SOLAPI_TEMPLATE_INFLUENCER_SELECTED: 'TP',
};
const TEMPLATE_VARIABLES = ['인플루언서명', '캠페인명', '제공내역', '진행가이드', '주의사항', '캠페인ID'];
const TEMPLATE = { content: '안녕하세요, #{인플루언서명}님.\n[#{캠페인명}]\n#{제공내역}\n#{진행가이드}\n#{주의사항}', buttons: [{ buttonName: '캠페인 확인하기', linkMo: 'https://daonview.com/campaigns/#{캠페인ID}#guide' }] };

function fixture({ application = {}, phone = '010-1234-5678', actorPhone = '010-9999-8888', duplicate = false, sendError = null, campaign = {}, hold = null } = {}) {
  const state = { inserted: [], updates: [], sent: [] };
  const appRow = { id: 1, status: 'SELECTED', campaign_id: 7, user_id: 'u1', assigned_option_label: '옵션A', ...application };
  const rows = {
    applications: () => appRow,
    profiles: (filters) => filters.id === 'admin' ? { phone_number: actorPhone } : { phone_number: phone, name: '홍길동', nickname: null, email: 'a@example.com' },
    campaigns: () => ({ id: 7, title: '캠페인', experience_details: '제공품', product_name: null, end_date: '2026-11-30',
      campaign_options: { step1Data: { productUrl: 'https://smartstore.naver.com/shop/products/1' },
        step2Data: { reviewMissionContent: '가이드'.repeat(200), purchaseNotes: '' } }, ...campaign }),
    selection_email_holds: () => hold,
  };
  const db = {
    from(table) {
      const filters = {};
      const q = {
        select() { return q; }, eq(col, val) { filters[col] = val; return q; }, is() { return q; },
        maybeSingle: async () => ({ data: rows[table]?.(filters) ?? null, error: null }),
        insert(row) { state.inserted.push(row); return { select: () => ({ single: async () => duplicate
          ? { data: null, error: { code: '23505' } } : { data: { id: 99 }, error: null } }) }; },
        update(row) { state.updates.push(row); return { eq: () => ({ eq: async () => ({ error: null }) }) }; },
      };
      return q;
    },
  };
  class SolapiMessageService {
    async sendOne(message) { state.sent.push(message); if (sendError) throw sendError; return { messageId: 'M1' }; }
    async getKakaoAlimtalkTemplate() { return TEMPLATE; }
  }
  const mod = load('src/lib/selectionKakaoServer.ts', {
    'server-only': {}, solapi: { SolapiMessageService },
    '@/lib/supabase/admin': { createAdminClient: () => db },
  }, { ...process, env: { ...process.env, ...ENV } });
  const hashFor = async () => {
    const context = await mod.loadSelectionMessageContext(1, 7);
    return mod.selectionKakaoHash({ templateId: 'TP', phone: context.phone, variables: mod.buildContextKakaoVariables(context) });
  };
  return { mod, state, hashFor };
}
const params = { applicationId: 1, campaignId: 7, actorId: 'admin', target: 'RECIPIENT' };
const messageLength = (v) => 130 + TEMPLATE_VARIABLES.filter((k) => k !== '캠페인ID').reduce((n, k) => n + v[k].length, 0);

test('승인 템플릿 변수와 정확히 일치하고 SMS 대체발송을 끈다, 보낸 문구·지문을 기록한다', async () => {
  const { mod, state, hashFor } = fixture();
  const expectedHash = await hashFor();
  const result = await mod.sendSelectionKakao({ ...params, expectedHash });
  assert.equal(result.status, 'SENT');
  const sent = state.sent[0];
  assert.equal(sent.to, '01012345678');
  assert.equal(sent.kakaoOptions.templateId, 'TP');
  assert.equal(sent.kakaoOptions.disableSms, true);
  assert.deepEqual(Object.keys(sent.kakaoOptions.variables).sort(), [...TEMPLATE_VARIABLES].sort());
  const v = sent.kakaoOptions.variables;
  assert.equal(v['제공내역'], '제공품\n확정 옵션: 옵션A\n구매 링크: https://smartstore.naver.com/shop/products/1');
  assert.match(v['진행가이드'], /^가이드.*\n\n체험 마감기한: 2026\. 11\. 30\.$/s);
  assert.equal(v['주의사항'], '별도 주의사항 없음');
  assert.ok(messageLength(v) <= 1000);
  const row = state.inserted[0];
  assert.equal(row.recipient_phone, '01012345678');
  assert.equal(row.hold_id, null, '보류 없이 발송 가능');
  assert.equal(row.content_hash, expectedHash);
  assert.ok(row.message_text.startsWith('안녕하세요, 홍길동님.'), '승인 템플릿 원문으로 보낸 문구 저장');
  assert.deepEqual([state.updates[0].status, state.updates[0].message_id], ['SENT', 'M1']);
});

test('열린 메일 반송 보류가 있으면 그 보류에 연결한다', async () => {
  const { mod, state, hashFor } = fixture({ hold: { id: 'h1' } });
  await mod.sendSelectionKakao({ ...params, expectedHash: await hashFor() });
  assert.equal(state.inserted[0].hold_id, 'h1');
});

test('미리보기 이후 내용이 바뀌면(지문 불일치) 기록·발송 없이 거부한다', async () => {
  const { mod, state } = fixture();
  await assert.rejects(mod.sendSelectionKakao({ ...params, expectedHash: 'a'.repeat(64) }), (e) => e.status === 409);
  assert.equal(state.sent.length + state.inserted.length, 0);
});

test('내 번호 테스트 발송은 관리자 번호로 같은 내용을 보내고 기록하지 않는다', async () => {
  const { mod, state, hashFor } = fixture();
  const result = await mod.sendSelectionKakao({ ...params, target: 'SELF', expectedHash: await hashFor() });
  assert.equal(result.status, 'TEST_SENT');
  assert.equal(state.sent[0].to, '01099998888');
  assert.equal(state.inserted.length, 0);
  const noPhone = fixture({ actorPhone: '' });
  await assert.rejects(noPhone.mod.sendSelectionKakao({ ...params, target: 'SELF', expectedHash: await noPhone.hashFor() }), (e) => e.status === 422);
});

test('이미 발송한 신청은 솔라피를 호출하지 않는다', async () => {
  const { mod, state, hashFor } = fixture({ duplicate: true });
  await assert.rejects(mod.sendSelectionKakao({ ...params, expectedHash: await hashFor() }), (e) => e.status === 409);
  assert.equal(state.sent.length, 0);
});

test('선정 아님·다른 캠페인·번호 없음은 발송 전에 거부한다', async () => {
  for (const [opts, status] of [
    [{ application: { status: 'REJECTED' } }, 409],
    [{ application: { campaign_id: 8 } }, 404],
    [{ phone: '' }, 422],
  ]) {
    const { mod, state } = fixture(opts);
    await assert.rejects(mod.sendSelectionKakao({ ...params, expectedHash: 'a'.repeat(64) }), (e) => e.status === status);
    assert.equal(state.sent.length + state.inserted.length, 0);
  }
});

test('접수 거부는 FAILED(재시도 허용), 불확실한 오류는 UNKNOWN(재발송 차단)', async () => {
  const rejected = fixture({ sendError: Object.assign(new Error('bad'), { _tag: 'BadRequestError' }) });
  await assert.rejects(rejected.mod.sendSelectionKakao({ ...params, expectedHash: await rejected.hashFor() }), (e) => e.status === 502);
  assert.equal(rejected.state.updates[0].status, 'FAILED');
  const network = fixture({ sendError: Object.assign(new Error('timeout'), { _tag: 'NetworkError' }) });
  await assert.rejects(network.mod.sendSelectionKakao({ ...params, expectedHash: await network.hashFor() }), (e) => e.status === 502);
  assert.equal(network.state.updates[0].status, 'UNKNOWN');
});

test('개별 구매링크 캠페인은 배정된 옵션·링크를 메일과 같은 규칙으로 넣는다', async () => {
  const campaign = { campaign_options: { step1Data: { productUrlIndividual: true }, step2Data: { purchaseNotes: '주의1', reviewMissionContent: '가이드1' } } };
  const links = [{ optionLabel: '빨강', url: 'https://a.example/1' }, { optionLabel: '파랑', url: 'https://a.example/2' }];
  const { mod, state, hashFor } = fixture({ campaign, application: { assigned_purchase_links: links } });
  await mod.sendSelectionKakao({ ...params, expectedHash: await hashFor() });
  const v = state.sent[0].kakaoOptions.variables;
  assert.equal(v['제공내역'], '제공품\n확정 옵션 1: 빨강\n구매 링크 1: https://a.example/1\n확정 옵션 2: 파랑\n구매 링크 2: https://a.example/2');
  assert.equal(v['진행가이드'], '가이드1\n\n체험 마감기한: 2026. 11. 30.');
  assert.equal(v['주의사항'], '주의1');
});

test('개별 구매링크 캠페인인데 배정 링크가 없으면 기록·발송 없이 거부한다', async () => {
  const campaign = { campaign_options: { step1Data: { productUrlIndividual: true } } };
  const { mod, state } = fixture({ campaign });
  await assert.rejects(mod.sendSelectionKakao({ ...params, expectedHash: 'a'.repeat(64) }), (e) => e.status === 422);
  assert.equal(state.sent.length + state.inserted.length, 0);
});

test('긴 링크·주의사항이 있어도 링크는 자르지 않고 전체 1,000자 이내', async () => {
  const longUrl = 'https://smartstore.naver.com/' + 'x'.repeat(250);
  const campaign = { campaign_options: { step1Data: { productUrl: longUrl }, step2Data: { purchaseNotes: '주의'.repeat(300), reviewMissionContent: '가이드'.repeat(300) } } };
  const { mod, state, hashFor } = fixture({ campaign });
  await mod.sendSelectionKakao({ ...params, expectedHash: await hashFor() });
  const v = state.sent[0].kakaoOptions.variables;
  assert.ok(v['제공내역'].includes(longUrl));
  assert.ok(messageLength(v) <= 1000, String(messageLength(v)));
  assert.match(v['진행가이드'], /체험 마감기한/);
});

test('템플릿 원문에 변수를 채워 실제 수신 문구·버튼 링크를 만든다', () => {
  const { mod } = fixture();
  assert.equal(mod.fillTemplate('#{a}님 #{b} #{없음}', { a: '홍', b: '캠' }), '홍님 캠 #{없음}');
  assert.equal(mod.fillTemplate(TEMPLATE.buttons[0].linkMo, { '캠페인ID': '7' }), 'https://daonview.com/campaigns/7#guide');
  const a = mod.selectionKakaoHash({ templateId: 'TP', phone: '010', variables: { x: '1', y: '2' } });
  assert.equal(a, mod.selectionKakaoHash({ templateId: 'TP', phone: '010', variables: { y: '2', x: '1' } }), '키 순서 무관');
  assert.notEqual(a, mod.selectionKakaoHash({ templateId: 'TP', phone: '011', variables: { x: '1', y: '2' } }), '번호 바뀌면 다름');
});
