import { getTestWithDetails } from "@/lib/actions/tests";
import { TestEditor } from "@/components/admin/test-editor";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const test = await getTestWithDetails(id);
    return { title: `${test.title} 편집` };
  } catch {
    return { title: "테스트 편집" };
  }
}

export default async function TestEditorPage({ params }: Props) {
  const { id } = await params;

  let test;
  try {
    test = await getTestWithDetails(id);
  } catch {
    notFound();
  }

  return <TestEditor test={test} />;
}
