/** 선정 메일과 진행 안내 메일이 공유하는 가이드 요약. */
export function getCampaignGuideContent(raw: unknown) {
  const root = Array.isArray(raw) ? raw[0] : raw;
  const options = root && typeof root === 'object' ? root as Record<string, unknown> : {};
  const step = options.step2Data && typeof options.step2Data === 'object'
    ? options.step2Data as Record<string, unknown> : {};
  const purchaseNotes = String(step.purchaseNotes || '').trim().slice(0, 1000);
  const guideSummary = [step.reviewMissionContent, step.missionGuide]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, purchaseNotes ? Math.max(0, 999 - purchaseNotes.length) : 1000);
  return { purchaseNotes, guideSummary };
}
