import { useMemo, useSyncExternalStore } from "react";

export interface User {
  shopName: string;
  email: string;
  password: string;
}
export type Session = Omit<User, "password">;
type Result = { ok: true } | { ok: false; error: string };

const USERS_KEY = "profitlens_users";
const SESSION_KEY = "profitlens_session";

// Test account for evaluators
export const DEMO_USER: User = {
  shopName: "Willow & Oak Home",
  email: "demo@profitlens.ai",
  password: "demo1234",
};

function readUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function startSession(user: User) {
  const session: Session = { shopName: user.shopName, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("auth-change"));
}

export function login(email: string, password: string): Result {
  const e = email.trim().toLowerCase();
  const user = [DEMO_USER, ...readUsers()].find((u) => u.email === e && u.password === password);
  if (!user) return { ok: false, error: "Wrong email or password." };
  startSession(user);
  return { ok: true };
}

export function signup(shopName: string, email: string, password: string): Result {
  const e = email.trim().toLowerCase();
  if (!shopName.trim()) return { ok: false, error: "Please enter your shop name." };
  if (!e.includes("@")) return { ok: false, error: "Please enter a valid email." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if ([DEMO_USER, ...readUsers()].some((u) => u.email === e)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const user: User = { shopName: shopName.trim(), email: e, password };
  localStorage.setItem(USERS_KEY, JSON.stringify([...readUsers(), user]));
  startSession(user);
  return { ok: true };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

function subscribe(callback: () => void) {
  window.addEventListener("auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

// undefined = still loading (server render), null = logged out, object = logged in
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => localStorage.getItem(SESSION_KEY),
    () => undefined
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }, [raw]);
}