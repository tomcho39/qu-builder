import { getPublishedTest } from "@/lib/actions/play";
import { PlayFlow } from "@/components/player/play-flow";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "테스트 진행 중" };

export default async function TestPlayPage({ params }: Props) {
  const { slug } = await params;

  let test;
  try {
    test = await getPublishedTest(slug);
  } catch {
    notFound();
  }

  if (test.questions.length === 0) {
    notFound();
  }

  return <PlayFlow test={test} />;
}
