"use client";

import { useState, useTransition } from "react";
import {
  updateTest,
  deleteTest,
  addQuestion,
  addResult,
} from "@/lib/actions/tests";
import { QuestionCard } from "@/components/admin/question-card";
import { ResultCard } from "@/components/admin/result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TestWithDetails } from "@/lib/db/types";

type Props = { test: TestWithDetails };

export function TestEditor({ test }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description ?? "");
  const [scoringType, setScoringType] = useState(test.scoring_type);
  const [isPublished, setIsPublished] = useState(test.is_published);

  function handleSaveMeta() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("description", description);
      fd.set("scoring_type", scoringType);
      fd.set("is_published", String(isPublished));
      await updateTest(test.id, fd);
    });
  }

  function handleDelete() {
    if (!confirm("테스트를 삭제하면 모든 질문·결과도 삭제됩니다. 계속할까요?"))
      return;
    startTransition(async () => {
      await deleteTest(test.id);
      router.push("/admin/tests");
    });
  }

  function handleAddQuestion() {
    startTransition(() => addQuestion(test.id));
  }

  function handleAddResult() {
    startTransition(() => addResult(test.id));
  }

  return (
    <main className="flex flex-1 flex-col px-8 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* 상단 네비 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href="/admin/tests">
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/t/${test.slug}`} target="_blank" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                미리보기
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
          </div>
        </div>

        {/* 기본 정보 */}
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">기본 정보</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveMeta}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveMeta}
                placeholder="테스트 시작 화면에 표시됩니다"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {/* 결과 방식 */}
              <div className="space-y-1.5">
                <Label>결과 방식</Label>
                <div className="flex gap-2">
                  {(["sum", "type_count"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setScoringType(type);
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("scoring_type", type);
                          await updateTest(test.id, fd);
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant={scoringType === type ? "default" : "outline"}
                      >
                        {type === "sum" ? "점수합산형" : "유형카운팅형"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
              {/* 공개 여부 */}
              <div className="space-y-1.5">
                <Label>공개 여부</Label>
                <div className="flex gap-2">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => {
                        setIsPublished(val);
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("is_published", String(val));
                          await updateTest(test.id, fd);
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant={isPublished === val ? "default" : "outline"}
                      >
                        {val ? "공개" : "비공개"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            URL: /t/{test.slug}
          </p>
        </section>

        <Separator />

        {/* 질문 목록 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              질문{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({test.questions.length}개)
              </span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              disabled={isPending}
              className="gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              질문 추가
            </Button>
          </div>

          {test.questions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              질문이 없습니다. 위 버튼으로 추가하세요.
            </div>
          ) : (
            <div className="space-y-3">
              {test.questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  testId={test.id}
                  scoringType={scoringType}
                />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* 결과 목록 */}
        <section className="space-y-4 pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                결과{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  ({test.results.length}개)
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {scoringType === "sum"
                  ? "점수 범위(최소~최대)로 결과를 매칭합니다."
                  : "가장 많이 선택된 유형 태그로 결과를 매칭합니다."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddResult}
              disabled={isPending}
              className="gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              결과 추가
            </Button>
          </div>

          {test.results.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              결과가 없습니다. 위 버튼으로 추가하세요.
            </div>
          ) : (
            <div className="space-y-3">
              {test.results.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  testId={test.id}
                  scoringType={scoringType}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
