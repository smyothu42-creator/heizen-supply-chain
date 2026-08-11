import { notFound } from "next/navigation";
import { directions, isDirectionSlug, isViewMode } from "@/lib/directions";
import { AllBrief, AllFull } from "@/components/directions/All";
import { AboutBrief, AboutFull } from "@/components/directions/About";
import { LeaksBrief, LeaksFull } from "@/components/directions/Leaks";
import { BuildBrief, BuildFull } from "@/components/directions/Build";
import { SolvedBrief, SolvedFull } from "@/components/directions/Account";
import { MoneyBrief, MoneyFull } from "@/components/directions/Money";
import { TechBrief, TechFull } from "@/components/directions/Tech";
import { RiskBrief, RiskFull } from "@/components/directions/Risk";
import { StakeholderBrief, StakeholderFull } from "@/components/directions/Stakeholder";

export function generateStaticParams() {
  return directions.flatMap((d) =>
    ["brief", "full"].map((view) => ({ direction: d.slug, view })),
  );
}

const VIEWS = {
  all: { brief: AllBrief, full: AllFull },
  money: { brief: MoneyBrief, full: MoneyFull },
  tech: { brief: TechBrief, full: TechFull },
  risk: { brief: RiskBrief, full: RiskFull },
  stakeholder: { brief: StakeholderBrief, full: StakeholderFull },
  about: { brief: AboutBrief, full: AboutFull },
  leaks: { brief: LeaksBrief, full: LeaksFull },
  build: { brief: BuildBrief, full: BuildFull },
  solved: { brief: SolvedBrief, full: SolvedFull },
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
