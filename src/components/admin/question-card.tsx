"use client";

import { useState, useTransition } from "react";
import {
  updateQuestion,
  deleteQuestion,
  addOption,
  updateOption,
  deleteOption,
} from "@/lib/actions/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { QuestionWithOptions, ScoringType } from "@/lib/db/types";

type Props = {
  question: QuestionWithOptions;
  index: number;
  testId: string;
  scoringType: ScoringType;
};

export function QuestionCard({ question, index, testId, scoringType }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState(question.text);

  function handleUpdateQuestion() {
    const fd = new FormData();
    fd.set("text", text);
    startTransition(() => updateQuestion(question.id, testId, fd));
  }

  function handleDelete() {
    if (!confirm("이 질문과 모든 선택지를 삭제할까요?")) return;
    startTransition(() => deleteQuestion(question.id, testId));
  }

  function handleAddOption() {
    startTransition(() => addOption(question.id, testId));
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* 질문 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
          Q{index + 1}
        </span>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleUpdateQuestion}
          className="flex-1 h-8 text-sm"
          placeholder="질문 내용을 입력하세요"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 선택지 */}
      {open && (
        <div className="border-t px-4 py-3 space-y-2">
          {question.options.length === 0 ? (
            <p className="text-xs text-muted-foreground">선택지가 없습니다.</p>
          ) : (
            question.options.map((opt, oi) => (
              <OptionRow
                key={opt.id}
                option={opt}
                index={oi}
                testId={testId}
                scoringType={scoringType}
              />
            ))
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={handleAddOption}
            disabled={isPending}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            선택지 추가
          </Button>
        </div>
      )}
    </div>
  );
}

type OptionRowProps = {
  option: { id: string; label: string; score: number; type_weights: Record<string, number> };
  index: number;
  testId: string;
  scoringType: ScoringType;
};

function OptionRow({ option, index, testId, scoringType }: OptionRowProps) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(option.label);
  const [score, setScore] = useState(String(option.score));
  const [typeWeights, setTypeWeights] = useState(
    Object.entries(option.type_weights)
      .map(([k, v]) => `${k}:${v}`)
      .join(", "),
  );

  function handleUpdate() {
    const fd = new FormData();
    fd.set("label", label);
    if (scoringType === "sum") {
      fd.set("score", score);
    } else {
      // "A:1, B:0" → { A: 1, B: 0 }
      const weights: Record<string, number> = {};
      typeWeights.split(",").forEach((part) => {
        const [k, v] = part.trim().split(":");
        if (k && v !== undefined) weights[k.trim()] = Number(v.trim()) || 0;
      });
      fd.set("type_weights", JSON.stringify(weights));
    }
    startTransition(() => updateOption(option.id, testId, fd));
  }

  function handleDelete() {
    startTransition(() => deleteOption(option.id, testId));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">
        {index + 1}
      </span>
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleUpdate}
        className="flex-1 h-7 text-sm"
        placeholder="선택지 텍스트"
      />
      {scoringType === "sum" ? (
        <Input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          onBlur={handleUpdate}
          className="w-16 h-7 text-sm text-center"
          placeholder="점수"
          type="number"
        />
      ) : (
        <Input
          value={typeWeights}
          onChange={(e) => setTypeWeights(e.target.value)}
          onBlur={handleUpdate}
          className="w-28 h-7 text-xs"
          placeholder="A:1, B:0"
          title="유형:점수 형식으로 입력 (예: A:1, B:0)"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
