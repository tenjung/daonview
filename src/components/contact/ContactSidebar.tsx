'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText } from 'lucide-react';
import { CONTACT_LINKS, type SidebarLink } from '@/constants/navigation';

const ICON_MAP = {
  MessageSquare,
  FileText,
} satisfies Record<string, typeof MessageSquare>;

function getContactIcon(icon?: string) {
  if (!icon || !(icon in ICON_MAP)) return null;

  return ICON_MAP[icon as keyof typeof ICON_MAP];
}

export default function ContactSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h2 className="px-2 pb-3 text-sm font-black text-slate-900">고객센터</h2>
        <nav className="space-y-1">
          {CONTACT_LINKS.map((item: SidebarLink) => {
            const Icon = getContactIcon(item.icon);
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
                {Icon ? <Icon size={16} /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
