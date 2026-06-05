import { headers } from "next/headers";
import { getOrgWithTests } from "@/lib/actions/org";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 서브도메인 접근 시: 해당 org의 공개 테스트 목록 표시
async function OrgLanding({ orgSlug }: { orgSlug: string }) {
  const data = await getOrgWithTests(orgSlug);

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div className="space-y-3">
          <p className="text-muted-foreground">존재하지 않는 페이지입니다.</p>
        </div>
      </main>
    );
  }

  const { org, tests } = data;

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">테스트를 선택하세요</p>
        </div>

        {tests.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            공개된 테스트가 없습니다.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tests.map((test) => (
              <Link
                key={test.id}
                href={`/t/${test.slug}`}
                className="rounded-xl border bg-card p-5 hover:border-primary hover:shadow-sm transition-all space-y-2"
              >
                {test.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={test.cover_image_url}
                    alt={test.title}
                    className="w-full rounded-lg object-cover aspect-video"
                  />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{test.title}</p>
                  {test.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {test.scoring_type === "sum" ? "점수합산형" : "유형카운팅형"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// 메인 도메인 접근 시: 마케팅 랜딩 페이지
function MarketingLanding() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-500">qu-builder</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            고객사가 직접 만드는
            <br />
            인터랙티브 테스트 플랫폼
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            질문·이미지·결과를 직접 구성하고 공유 링크 하나로 배포하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href="/admin/tests">관리자로 이동</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default async function Home() {
  const headersList = await headers();
  const orgSlug = headersList.get("x-org-slug");

  if (orgSlug) {
    return <OrgLanding orgSlug={orgSlug} />;
  }

  return <MarketingLanding />;
}
