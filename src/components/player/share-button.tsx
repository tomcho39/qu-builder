"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";

type Props = { testTitle: string; testSlug: string };

export function ShareButton({ testTitle, testSlug }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/t/${testSlug}`;

    // Web Share API 지원 시 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({ title: testTitle, url });
        return;
      } catch {
        // 취소 등 — 클립보드 복사로 폴백
      }
    }

    // 클립보드 복사
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      onClick={handleShare}
      className="rounded-full gap-2"
      size="lg"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          링크 복사됨!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          친구에게 공유하기
        </>
      )}
    </Button>
  );
}
