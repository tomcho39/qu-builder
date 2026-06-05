import { getPublishedTest } from "@/lib/actions/play";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const test = await getPublishedTest(slug);
    return {
      title: test.title,
      description: test.description ?? undefined,
      openGraph: {
        title: test.title,
        description: test.description ?? undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "테스트" };
  }
}

export default async function TestStartPage({ params }: Props) {
  const { slug } = await params;

  let test;
  try {
    test = await getPublishedTest(slug);
  } catch {
    notFound();
  }

  const questionCount = test.questions.length;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* 커버 이미지 */}
        {test.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={test.cover_image_url}
            alt={test.title}
            className="w-full rounded-2xl object-cover aspect-video"
          />
        )}

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
          {test.description && (
            <p className="text-muted-foreground leading-relaxed">
              {test.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            총 {questionCount}문항
          </p>
        </div>

        <Button asChild size="lg" className="w-full rounded-full text-base h-12">
          <Link href={`/t/${slug}/play`}>테스트 시작하기</Link>
        </Button>
      </div>
    </main>
  );
}
