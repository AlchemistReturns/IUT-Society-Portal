"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManageTabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto text-sm font-medium">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-4 py-3 first:pl-0 ${
              active
                ? "border-[var(--accent-from)] text-[var(--accent-from)]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
