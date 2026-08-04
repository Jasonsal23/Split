"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/plan", label: "Plan" },
  { href: "/progress", label: "Progress" },
  { href: "/coach", label: "Coach" },
  { href: "/settings", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <nav
      className="shrink-0 border-t border-zinc-800 bg-zinc-950"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto flex max-w-lg px-2">
        {activeIndex !== -1 && (
          <div
            className="absolute inset-y-1 w-1/5 rounded-md bg-zinc-900 transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative z-10 flex min-h-[44px] flex-1 items-center justify-center text-xs font-medium transition-colors ${
              i === activeIndex ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
