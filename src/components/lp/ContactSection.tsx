import { ContactInfo } from '@/types/landingPage';
import { Mail, Instagram, Globe, Phone, ExternalLink } from 'lucide-react';

interface ContactSectionProps {
  contact: ContactInfo;
  colorScheme: { primary: string; secondary: string };
  googleFormUrl?: string;
}

export function ContactSection({ contact, colorScheme, googleFormUrl }: ContactSectionProps) {
  const contactItems = [
    { icon: Mail, label: '이메일', value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
    { icon: Instagram, label: 'Instagram', value: contact.instagram, href: contact.instagram },
    { icon: Globe, label: '블로그', value: contact.blog, href: contact.blog },
    { icon: Phone, label: '전화', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : null },
  ].filter(item => item.value);

  return (
    <section className="py-20 bg-white">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            <span 
              className="bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${colorScheme.primary}, ${colorScheme.secondary})`,
              }}
            >
              함께 하고 싶으신가요?
            </span>
          </h2>

          <p className="text-xl text-text-secondary/80 mb-12">
            언제든지 편하게 연락주세요. 빠르게 답변드리겠습니다.
          </p>

          {/* 연락처 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <a
                  key={index}
                  href={item.href || '#'}
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colorScheme.primary}15` }}
                  >
                    <Icon size={24} style={{ color: colorScheme.primary }} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-text-secondary/60 mb-1">
                      {item.label}
                    </div>
                    <div className="text-base font-bold text-text-main group-hover:text-primary transition-colors">
                      {item.value}
                    </div>
                  </div>

                  {item.href && (
                    <ExternalLink 
                      size={18} 
                      className="text-text-secondary/40 group-hover:text-primary transition-colors"
                    />
                  )}
                </a>
              );
            })}
          </div>

          {googleFormUrl && (
            <div className="mb-12">
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-black text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: colorScheme.primary }}
              >
                구글폼 이동
              </a>
            </div>
          )}

          {/* 다온뷰 워터마크 */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-text-secondary/60">
              이 페이지는{' '}
              <a 
                href="https://daonview.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold hover:text-primary transition-colors"
                style={{ color: colorScheme.primary }}
              >
                다온뷰 AI 랜딩페이지 빌더
              </a>
              로 제작되었습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
