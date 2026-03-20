import { Sparkles } from 'lucide-react';

interface SeoAdviceSectionProps {
  advice: string;
}

export default function SeoAdviceSection({ advice }: SeoAdviceSectionProps) {
  if (!advice) return null;

  // 간단한 마크다운 파싱 (볼드, 리스트, 줄바꿈)
  const formatText = (text: string) => {
    // 1. 볼드 처리 (**text**)
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. 줄바꿈 처리 (\n)
    html = html.replace(/\n\n/g, '</p><p class="mt-2 mb-2">');
    html = html.replace(/\n/g, '<br />');

    // 3. 리스트 아이템 처리 (- item)
    html = html.replace(/- (.*?)<br \/>/g, '<li class="ml-4 list-disc">$1</li>');

    return `<p>${html}</p>`;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-xl font-bold text-indigo-900">AI SEO 코칭 & 종합 피드백</h3>
      </div>
      <div 
        className="text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatText(advice) }}
      />
    </div>
  );
}
