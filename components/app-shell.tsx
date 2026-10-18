"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import Sidebar from "./sidebar";
import Header from "./header";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (session === null && !isLogin) router.replace("/login");
  }, [session, isLogin, router]);

  if (isLogin) {
    return <main className="min-h-screen p-4 sm:p-6">{children}</main>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}