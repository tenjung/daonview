'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText } from 'lucide-react';

const ITEMS = [
  { href: '/contact', label: '1:1 문의하기', icon: MessageSquare },
  { href: '/contact/my', label: '나의 문의 확인', icon: FileText },
];

export default function ContactSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h2 className="px-2 pb-3 text-sm font-black text-slate-900">고객센터</h2>
        <nav className="space-y-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
