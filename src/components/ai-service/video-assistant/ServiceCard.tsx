import { ArrowRight, Film, Wand2 } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  isActive?: boolean;
  badgeLabel?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ title, description, isActive = false, badgeLabel, isSelected = false, onClick }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isActive}
      className={`w-full rounded-[2rem] border p-6 text-left transition-all ${
        isActive
          ? isSelected
            ? 'border-primary bg-primary/[0.03] shadow-[0_12px_32px_rgba(235,2,112,0.12)] hover:-translate-y-1'
            : 'border-primary/20 bg-white shadow-[0_12px_32px_rgba(235,2,112,0.08)] hover:-translate-y-1'
          : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
          {isActive ? <Film size={24} /> : <Wand2 size={24} />}
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-white text-slate-500 border border-slate-200'}`}>
          {isActive ? badgeLabel || '서비스' : '준비중'}
        </span>
      </div>
      <h2 className="mt-5 text-2xl font-black text-text-main">{title}</h2>
      <p className={`mt-3 text-sm leading-relaxed ${isActive ? 'text-text-secondary' : 'text-slate-400'}`}>{description}</p>
      <div className={`mt-5 inline-flex items-center text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
        {isActive ? '서비스 열기' : '곧 추가'}
        <ArrowRight size={16} className="ml-1.5" />
      </div>
    </button>
  );
}
