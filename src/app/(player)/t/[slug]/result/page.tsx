import { getPlayResult } from "@/lib/actions/play";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/player/share-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await searchParams;
  if (!id) return { title: "결과" };

  try {
    const { result, testTitle } = await getPlayResult(id);
    return {
      title: `${result.title} — ${testTitle}`,
      description: result.description ?? undefined,
      openGraph: {
        title: `${result.title} — ${testTitle}`,
        description: result.description ?? undefined,
        images: result.image_url ? [result.image_url] : [],
      },
    };
  } catch {
    return { title: "결과" };
  }
}

export default async function TestResultPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { id } = await searchParams;

  if (!id) {
    // play_id 없으면 시작 페이지로
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center space-y-4">
        <div className="space-y-3">
          <p className="text-muted-foreground">결과를 찾을 수 없습니다.</p>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}`}>다시 시작하기</Link>
          </Button>
        </div>
      </main>
    );
  }

  let data;
  try {
    data = await getPlayResult(id);
  } catch {
    notFound();
  }

  const { result, testTitle, testSlug } = data;
  const shareUrl =
    typeof window === "undefined"
      ? `https://example.com/t/${testSlug}`
      : `${window.location.origin}/t/${testSlug}`;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* 결과 이미지 */}
        {result.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full rounded-2xl object-cover aspect-video"
          />
        )}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{testTitle}</p>
          <h1 className="text-3xl font-bold tracking-tight">{result.title}</h1>
          {result.description && (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {result.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <ShareButton testTitle={testTitle} testSlug={testSlug} />
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/t/${testSlug}`}>다시 테스트하기</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
