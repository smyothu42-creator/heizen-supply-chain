import type { Metadata } from "next";
import { AccountView } from "@/components/workspace/AccountView";

export const metadata: Metadata = { title: "Account — Heizen Discovery Tool" };

export default function AccountPage() {
  return <AccountView />;
}
