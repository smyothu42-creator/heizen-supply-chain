import type { Metadata } from "next";
import { AtlasView } from "@/components/surfaces/AtlasView";

export const metadata: Metadata = { title: "Atlas — Heizen Discovery Tool" };

export default function AtlasPage() {
  return <AtlasView />;
}
