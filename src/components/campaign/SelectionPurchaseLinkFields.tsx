'use client';

import { useEffect, useState } from 'react';
import { normalizePurchaseLinkUrl, type SelectionLinkAssignment } from '@/lib/purchaseLink';

export interface SelectionLinkDraft {
  optionLabel: string;
  included: boolean;
  linkId: string;
  url: string;
}

interface Candidate {
  id: number;
  purchaseLinkUrl: string;
  usageCount: number;
}

export function getSelectionLinkAssignments(drafts: SelectionLinkDraft[]): SelectionLinkAssignment[] | null {
  const included = drafts.filter((draft) => draft.included);
  if (!included.length || included.some((draft) => !draft.linkId && !normalizePurchaseLinkUrl(draft.url))) {
    return null;
  }
  return included.map(({ optionLabel, linkId, url }) => linkId
    ? { optionLabel, manualLinkId: Number(linkId) }
    : { optionLabel, manualPurchaseLinkUrl: normalizePurchaseLinkUrl(url) });
}

interface Props {
  campaignId: number;
  draft: SelectionLinkDraft;
  optional: boolean;
  disabled: boolean;
  onChange: (draft: SelectionLinkDraft) => void;
}

export function SelectionPurchaseLinkFields({ campaignId, draft, optional, disabled, onChange }: Props) {
  const [result, setResult] = useState<{ candidates: Candidate[]; failed?: boolean } | null>(null);
  const { optionLabel } = draft;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/applications/link-candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId, optionLabel }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error('Link candidates unavailable');
        if (!controller.signal.aborted) {
          const candidates: Candidate[] = Array.isArray(payload.candidates) ? payload.candidates : [];
          setResult({ candidates: candidates.filter(({ purchaseLinkUrl }) => normalizePurchaseLinkUrl(purchaseLinkUrl)) });
        }
      } catch {
        if (!controller.signal.aborted) setResult({ candidates: [], failed: true });
      }
    }
    void load();
    return () => controller.abort();
  }, [campaignId, optionLabel]);

  const invalidUrl = Boolean(draft.url.trim()) && !normalizePurchaseLinkUrl(draft.url);
  const fieldClass = 'mt-1 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm';
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2 rounded-lg border border-gray-200 p-3">
      <legend className="max-w-full break-words px-1 text-sm font-semibold">{optionLabel}</legend>
      {optional && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.included} onChange={(event) => onChange({ ...draft, included: event.target.checked })} />
          이 옵션 확정
        </label>
      )}
      {draft.included && (
        <>
          <label className="block text-sm">
            등록 링크 선택
            <select
              className={fieldClass}
              value={draft.linkId}
              disabled={!result?.candidates.length}
              onChange={(event) => onChange({ ...draft, linkId: event.target.value, url: '' })}
            >
              <option value="">{!result ? '링크를 불러오는 중…' : result.candidates.length ? '등록 링크를 선택하세요' : '선택할 수 있는 등록 링크 없음'}</option>
              {result?.candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  #{candidate.id} · {candidate.purchaseLinkUrl}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            구매링크 직접 입력
            <input
              type="url"
              className={fieldClass}
              placeholder="https://"
              value={draft.url}
              aria-invalid={invalidUrl}
              onChange={(event) => onChange({ ...draft, url: event.target.value, linkId: '' })}
            />
          </label>
          {invalidUrl ? (
            <p className="text-xs text-rose-700">올바른 http 또는 https 주소를 입력해 주세요.</p>
          ) : !draft.linkId && !draft.url.trim() && (
            <p className="text-xs text-gray-600">
              {result?.failed ? '등록 링크를 불러오지 못했습니다. URL을 직접 입력할 수 있습니다.' : '등록 링크를 선택하거나 URL을 직접 입력해 주세요.'}
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
