"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USER, login, signup, useSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already logged in? Go to the dashboard.
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = mode === "login" ? login(email, password) : signup(shopName, email, password);
    if (!result.ok) setError(result.error);
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ProfitLens AI</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "login" ? "Log in to your account." : "Create an account for your shop."}
        </p>
      </div>

      <div className="flex rounded-lg border border-zinc-200 p-1 text-sm font-medium dark:border-zinc-800">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              mode === m ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "text-zinc-500"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Shop name</label>
            <input
              className={inputClass}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Willow & Oak Home"
              required
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <p className="font-medium">Test account</p>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Email: {DEMO_USER.email}
          <br />
          Password: {DEMO_USER.password}
        </p>
        <button
          type="button"
          onClick={() => {
            switchMode("login");
            setEmail(DEMO_USER.email);
            setPassword(DEMO_USER.password);
          }}
          className="mt-3 text-sm font-medium underline"
        >
          Fill in test account
        </button>
      </div>
    </div>
  );
}