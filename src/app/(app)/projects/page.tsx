import type { Metadata } from "next";
import { ProjectsView } from "@/components/workspace/ProjectsView";

export const metadata: Metadata = { title: "Projects — Heizen Discovery Tool" };

export default function ProjectsPage() {
  return <ProjectsView />;
}
