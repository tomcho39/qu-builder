"use client";

import { useState, useTransition } from "react";
import { submitPlay, type Answer } from "@/lib/actions/play";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TestWithDetails } from "@/lib/db/types";

type Props = { test: TestWithDetails };

export function PlayFlow({ test }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const questions = test.questions;
  const total = questions.length;
  const current = questions[currentIdx];
  const progress = ((currentIdx) / total) * 100;
  const isLast = currentIdx === total - 1;

  function handleSelect(optionId: string) {
    if (isPending) return;
    setSelectedOptionId(optionId);

    // 300ms 딜레이 후 다음 질문으로 자동 이동
    setTimeout(() => {
      const newAnswers: Answer[] = [
        ...answers,
        { question_id: current.id, option_id: optionId },
      ];

      if (isLast) {
        // 마지막 질문 → 제출
        startTransition(async () => {
          try {
            const { playId } = await submitPlay(test.id, newAnswers);
            router.push(`/t/${test.slug}/result?id=${playId}`);
          } catch (e) {
            console.error(e);
          }
        });
      } else {
        setAnswers(newAnswers);
        setCurrentIdx((i) => i + 1);
        setSelectedOptionId(null);
      }
    }, 300);
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* 진행 바 */}
      <div className="w-full h-1.5 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* 진행 상황 */}
          <p className="text-center text-sm text-muted-foreground">
            {currentIdx + 1} / {total}
          </p>

          {/* 질문 */}
          <h2 className="text-2xl font-semibold text-center leading-snug">
            {current.text}
          </h2>

          {/* 질문 이미지 */}
          {current.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.image_url}
              alt=""
              className="w-full rounded-xl object-cover aspect-video"
            />
          )}

          {/* 선택지 */}
          <div className="space-y-3">
            {current.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  disabled={isPending || selectedOptionId !== null}
                  className={cn(
                    "w-full rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-200",
                    "hover:border-primary hover:bg-accent",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground scale-[0.98]"
                      : "border-border bg-card",
                    (isPending || selectedOptionId !== null) &&
                      !isSelected &&
                      "opacity-50 cursor-not-allowed",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* 로딩 상태 */}
          {isPending && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              결과 계산 중…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
