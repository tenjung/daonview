import { StatItem } from '@/types/landingPage';
import { 
  Users, Eye, Briefcase, Target, Heart, TrendingUp, 
  Award, Star, MessageCircle, LucideIcon 
} from 'lucide-react';

interface StatsSectionProps {
  stats: StatItem[];
  colorScheme: { primary: string; secondary: string };
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  eye: Eye,
  briefcase: Briefcase,
  target: Target,
  heart: Heart,
  'trending-up': TrendingUp,
  award: Award,
  star: Star,
  'message-circle': MessageCircle,
};

export function StatsSection({ stats, colorScheme }: StatsSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = iconMap[stat.icon] || Star;
            
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-100"
              >
                {/* 아이콘 배경 */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:rotate-6 transition-all duration-500"
                  style={{ backgroundColor: `${colorScheme.primary}15` }}
                >
                  <Icon size={32} style={{ color: colorScheme.primary }} />
                </div>

                {/* 숫자 */}
                <div 
                  className="text-5xl font-black mb-3 bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${colorScheme.primary}, ${colorScheme.secondary})`,
                  }}
                >
                  {stat.value}
                </div>

                {/* 레이블 */}
                <div className="text-lg font-semibold text-text-secondary">
                  {stat.label}
                </div>

                {/* 호버 효과 */}
                <div 
                  className="absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700 -z-10"
                  style={{
                    background: `linear-gradient(to right, ${colorScheme.primary}20, ${colorScheme.secondary}20)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
