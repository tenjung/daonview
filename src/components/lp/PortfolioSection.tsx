import { PortfolioItem } from '@/types/landingPage';
import { CheckCircle2 } from 'lucide-react';

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
  colorScheme: { primary: string; secondary: string };
}

export function PortfolioSection({ portfolio, colorScheme }: PortfolioSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-16 tracking-tight">
          <span 
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${colorScheme.primary}, ${colorScheme.secondary})`,
            }}
          >
            주요 성과
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {portfolio.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
            >
              {/* 이미지 영역 (향후 실제 이미지로 대체 가능) */}
              <div 
                className="h-48 flex items-center justify-center text-white font-bold text-xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500" />
                <div className="relative z-10">{item.imageKeyword || '이미지'}</div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-text-main group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                <p className="text-text-secondary/80 mb-6 leading-relaxed">
                  {item.description}
                </p>

                {item.result && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                    <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm font-semibold text-green-800">
                      {item.result}
                    </div>
                  </div>
                )}
              </div>

              {/* 호버 효과 */}
              <div 
                className="absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700 -z-10"
                style={{
                  background: `linear-gradient(to right, ${colorScheme.primary}20, ${colorScheme.secondary}20)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
