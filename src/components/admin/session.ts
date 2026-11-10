import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { admin } from "@/content/admin";

/**
 * DEMO "authentication": a flag in localStorage, checked on the client. There is
 * no server, no secret and no real protection: anyone can read the credentials
 * on the login page. Replace with real auth before using this for anything.
 */
const KEY = "velor:admin-session";

export const isSignedIn = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const checkDemoCredentials = (email: string, password: string) =>
  email.trim().toLowerCase() === admin.login.demoEmail && password === admin.login.demoPassword;

export const signIn = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
};

export const signOut = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

/** Admin UI preferences (sidebar) and the incoming-order simulator switch. */
export const useAdminUi = create<{ collapsed: boolean | null; simulating: boolean }>()(
  persist((): { collapsed: boolean | null; simulating: boolean } => ({ collapsed: null, simulating: true }), {
    name: "velor:admin-ui",
    storage: createJSONStorage(() => localStorage),
  }),
);
