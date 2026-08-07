import { notFound } from "next/navigation";
import { directions, isDirectionSlug, isViewMode } from "@/lib/directions";
import { MoneyBrief, MoneyFull } from "@/components/directions/Money";
import { CallBrief, CallFull } from "@/components/directions/Call";
import { CertaintyBrief, CertaintyFull } from "@/components/directions/Certainty";
import { StakeholderBrief, StakeholderFull } from "@/components/directions/Stakeholder";

export function generateStaticParams() {
  return directions.flatMap((d) =>
    ["brief", "full"].map((view) => ({ direction: d.slug, view })),
  );
}

const VIEWS = {
  money: { brief: MoneyBrief, full: MoneyFull },
  call: { brief: CallBrief, full: CallFull },
  certainty: { brief: CertaintyBrief, full: CertaintyFull },
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
