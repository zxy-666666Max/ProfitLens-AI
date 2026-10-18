"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
export const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/reports", label: "Reports" },
  { href: "/inventory", label: "Inventory" },
  { href: "/chat", label: "AI Assistant" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:flex">

<div className="bg-white rounded-lg px-0 py-0 mb-5">
       <Image src="/logo.png" alt="ProfitLens AI" width={250} height={250} className="w-full" />

</div>

      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}