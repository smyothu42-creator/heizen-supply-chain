import type { Metadata } from "next";
import { SettingsView } from "@/components/workspace/SettingsView";

export const metadata: Metadata = { title: "Settings — Heizen Discovery Tool" };

export default function SettingsPage() {
  return <SettingsView />;
}
