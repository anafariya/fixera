'use client';

import React from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/lib/cms/toc';

interface Props {
  items: TocItem[];
}

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (typeof history.replaceState === 'function') {
    history.replaceState(null, '', `#${id}`);
  } else if (typeof history.pushState === 'function') {
    history.pushState(null, '', `#${id}`);
  }
}

function LinkList({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              smoothScrollTo(item.id);
            }}
            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors leading-snug"
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function ServiceTableOfContents({ items }: Props) {
  if (!items || items.length < 2) return null;

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900">
              <List className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">On this page</h3>
            </div>
            <LinkList items={items} />
          </div>
        </div>
      </aside>

      <details className="lg:hidden mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900">
          <List className="w-4 h-4" />
          On this page
          <span className="ml-auto text-xs font-normal text-gray-500">{items.length} sections</span>
        </summary>
        <div className="px-4 pb-4 pt-1">
          <LinkList items={items} />
        </div>
      </details>
    </>
  );
}
