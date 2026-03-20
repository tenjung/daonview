'use client';

import { HeroSection as HeroSectionType } from '@/types/landingPage';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  hero: HeroSectionType;
  colorScheme: { primary: string; secondary: string };
  googleFormUrl?: string;
}

export function HeroSection({ hero, colorScheme, googleFormUrl }: HeroSectionProps) {
  return (
    <section 
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colorScheme.primary}15 0%, ${colorScheme.secondary}15 100%)`,
      }}
    >
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: `${colorScheme.primary}20` }}
        />
        <div 
          className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[100px] animate-bounce-slow"
          style={{ backgroundColor: `${colorScheme.secondary}20` }}
        />
      </div>

      <div className="container relative z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span 
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${colorScheme.primary}, ${colorScheme.secondary})`,
            }}
          >
            {hero.headline}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-text-secondary/80 mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-300">
          {hero.subheadline}
        </p>

        {googleFormUrl ? (
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: colorScheme.primary }}
          >
            {hero.cta || '구글폼 이동'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </a>
        ) : (
          <button
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: colorScheme.primary }}
          >
            {hero.cta}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
