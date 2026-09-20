"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  home: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  recipes:
    '<path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15h11"/>',
  plan: '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/>',
  list: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"/>',
  prep: '<path d="M4 10h16v4.5A5.5 5.5 0 0 1 14.5 20h-5A5.5 5.5 0 0 1 4 14.5z"/><path d="M2 10h2M20 10h2M9.5 7c0-1.2 1-1.6 1-3M14 7c0-1.2 1-1.6 1-3"/>',
} as const;

const TABS: { key: keyof typeof ICONS; href: string; label: string }[] = [
  { key: "home", href: "/", label: "This week" },
  { key: "recipes", href: "/recipes", label: "Recipes" },
  { key: "prep", href: "/prep", label: "Prep" },
  { key: "plan", href: "/insights", label: "Insights" },
];

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

export default function Tabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }} aria-label="Main">
      {TABS.map((t) => {
        const on = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`tab ${on ? "on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <Icon name={t.key} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
