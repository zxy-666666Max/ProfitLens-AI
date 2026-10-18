"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navLinks } from "./sidebar";
import { logout, useSession } from "@/lib/auth";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const current = navLinks.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
  );

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="font-semibold">{current?.label ?? "ProfitLens AI"}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{session?.shopName}</span>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="text-sm font-medium text-zinc-600 hover:text-red-600 dark:text-zinc-400"
          >
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}