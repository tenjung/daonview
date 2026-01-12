/**
 * AI 특유의 딱딱한 문투를 자연스러운 블로거 말투로 변환합니다.
 */
export function removeAIPatterns(text: string): string {
  const patterns = [
    { regex: /에 대해 알아보겠습니다/g, replace: '에 대해 소개해 드릴게요' },
    { regex: /~라고 할 수 있습니다/g, replace: '~인 것 같아요' },
    { regex: /하는 것이 중요합니다/g, replace: '하면 정말 좋아요' },
    { regex: /참고하시기 바랍니다/g, replace: '참고해 보세요' },
    { regex: /생각됩니다/g, replace: '생각해요' },
    { regex: /구성되어 있습니다/g, replace: '구성되어 있더라고요' },
    { regex: /제공하고 있습니다/g, replace: '제공하고 있어요' },
    { regex: /필수적입니다/g, replace: '꼭 필요해요' },
    { regex: /알 수 있습니다/g, replace: '느껴지더라고요' },
    { regex: /~기 때문입니다/g, replace: '~기 때문이에요' }
  ];

  let processed = text;
  patterns.forEach(p => {
    processed = processed.replace(p.regex, p.replace);
  });

  return processed;
}
