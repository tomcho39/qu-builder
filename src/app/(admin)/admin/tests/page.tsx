import { getTests, createTest } from "@/lib/actions/tests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "테스트 관리" };

export default async function AdminTestsPage() {
  const tests = await getTests();

  return (
    <main className="flex flex-1 flex-col px-8 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">테스트 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tests.length}개의 테스트
            </p>
          </div>
          <form action={createTest}>
            <input type="hidden" name="title" value="새 테스트" />
            <Button type="submit" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              새 테스트
            </Button>
          </form>
        </div>

        {/* 목록 */}
        {tests.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
            <p className="text-sm">아직 테스트가 없습니다.</p>
            <p className="text-xs mt-1">위 버튼을 눌러 첫 테스트를 만들어보세요.</p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{test.title}</span>
                    <Badge variant={test.is_published ? "default" : "secondary"}>
                      {test.is_published ? "공개" : "비공개"}
                    </Badge>
                    <Badge variant="outline">
                      {test.scoring_type === "sum" ? "점수합산" : "유형카운팅"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    /t/{test.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/t/${test.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/admin/tests/${test.id}/edit`}>편집</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
