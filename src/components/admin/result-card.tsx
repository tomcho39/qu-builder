"use client";

import { useState, useTransition } from "react";
import { updateResult, deleteResult } from "@/lib/actions/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { Result, ScoringType } from "@/lib/db/types";

type Props = {
  result: Result;
  testId: string;
  scoringType: ScoringType;
};

export function ResultCard({ result, testId, scoringType }: Props) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(result.title);
  const [description, setDescription] = useState(result.description ?? "");
  const [minScore, setMinScore] = useState(
    result.min_score !== null ? String(result.min_score) : "",
  );
  const [maxScore, setMaxScore] = useState(
    result.max_score !== null ? String(result.max_score) : "",
  );
  const [typeTag, setTypeTag] = useState(result.type_tag ?? "");

  function handleUpdate() {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    if (scoringType === "sum") {
      fd.set("min_score", minScore);
      fd.set("max_score", maxScore);
    } else {
      fd.set("type_tag", typeTag);
    }
    startTransition(() => updateResult(result.id, testId, fd));
  }

  function handleDelete() {
    if (!confirm("이 결과를 삭제할까요?")) return;
    startTransition(() => deleteResult(result.id, testId));
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdate}
          className="font-medium h-8 max-w-xs"
          placeholder="결과 제목"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">설명</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleUpdate}
          className="h-8 text-sm"
          placeholder="결과 설명 (선택)"
        />
      </div>

      {scoringType === "sum" ? (
        <div className="flex items-center gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">최소 점수</Label>
            <Input
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              onBlur={handleUpdate}
              type="number"
              className="h-8 w-24 text-sm"
              placeholder="0"
            />
          </div>
          <span className="mt-5 text-muted-foreground text-sm">~</span>
          <div className="space-y-1.5">
            <Label className="text-xs">최대 점수</Label>
            <Input
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              onBlur={handleUpdate}
              type="number"
              className="h-8 w-24 text-sm"
              placeholder="100"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">유형 태그</Label>
          <Input
            value={typeTag}
            onChange={(e) => setTypeTag(e.target.value)}
            onBlur={handleUpdate}
            className="h-8 w-32 text-sm"
            placeholder="A, B, C …"
          />
          <p className="text-xs text-muted-foreground">
            선택지의 type_weights 키와 일치해야 합니다.
          </p>
        </div>
      )}
    </div>
  );
}
