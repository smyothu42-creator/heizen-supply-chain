import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Every product surface shares one shell, one detail panel, one tab bar. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
