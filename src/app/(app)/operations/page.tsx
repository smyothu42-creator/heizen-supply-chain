import { CanvasView } from "@/components/surfaces/CanvasView";

export const metadata = { title: "Operations — Heizen Discovery Tool" };

/**
 * *Canvas* is the internal name and stays that way in the repo — `CanvasView`,
 * `lib/canvas.ts`, `CanvasNode`. It named the drawing surface rather than what
 * is drawn on it, which is fine for a component and useless as a tab: a
 * consultant reading six tabs wants to know what is behind each one, and five
 * of the six already say so. Same split as Meridian / Heizen Discovery Tool.
 */
export default function OperationsPage() {
  return <CanvasView />;
}
