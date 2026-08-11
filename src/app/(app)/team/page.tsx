import type { Metadata } from "next";
import { TeamView } from "@/components/workspace/TeamView";

export const metadata: Metadata = { title: "Team — Heizen Discovery Tool" };

export default function TeamPage() {
  return <TeamView />;
}
