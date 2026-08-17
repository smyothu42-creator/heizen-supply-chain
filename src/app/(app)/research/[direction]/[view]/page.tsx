import { notFound } from "next/navigation";
import { directions, isDirectionSlug, isViewMode } from "@/lib/directions";
import { CompanyBrief, CompanyFull } from "@/components/directions/Company";
import { ContextBrief, ContextFull } from "@/components/directions/Context";
import { TimingBrief, TimingFull } from "@/components/directions/Timing";
import { TechBrief, TechFull } from "@/components/directions/Tech";
import { LeaksBrief, LeaksFull } from "@/components/directions/Leaks";
import { MoneyBrief, MoneyFull } from "@/components/directions/Money";
import { SpendBrief, SpendFull } from "@/components/directions/Spend";
import { BuildBrief, BuildFull } from "@/components/directions/Build";
import { SolvedBrief, SolvedFull } from "@/components/directions/Account";
import { StakeholderBrief, StakeholderFull } from "@/components/directions/Stakeholder";
import { VendorsBrief, VendorsFull } from "@/components/directions/Vendors";

export function generateStaticParams() {
  return directions.flatMap((d) =>
    ["brief", "full"].map((view) => ({ direction: d.slug, view })),
  );
}

/* One entry per direction, in the order the tab row shows them. Risk and All
   are still out of this map rather than left routable and unreachable: a URL
   that renders a screen no control can reach is a screen nobody maintains.
   Their components are untouched in `components/directions/`; restoring one is
   an entry here and an entry in `lib/directions.ts`. */
const VIEWS = {
  company: { brief: CompanyBrief, full: CompanyFull },
  context: { brief: ContextBrief, full: ContextFull },
  initiatives: { brief: TimingBrief, full: TimingFull },
  leaks: { brief: LeaksBrief, full: LeaksFull },
  tech: { brief: TechBrief, full: TechFull },
  vendors: { brief: VendorsBrief, full: VendorsFull },
  money: { brief: MoneyBrief, full: MoneyFull },
  spend: { brief: SpendBrief, full: SpendFull },
  build: { brief: BuildBrief, full: BuildFull },
  solved: { brief: SolvedBrief, full: SolvedFull },
  stakeholder: { brief: StakeholderBrief, full: StakeholderFull },
} as const;

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ direction: string; view: string }>;
}) {
  const { direction, view } = await params;
  if (!isDirectionSlug(direction) || !isViewMode(view)) notFound();

  const View = VIEWS[direction][view];
  return <View />;
}
