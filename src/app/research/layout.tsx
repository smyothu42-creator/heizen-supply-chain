import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
