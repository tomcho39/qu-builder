"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Props = {
  next?: string;
};

export function LoginForm({ next }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: 이메일로 6자리 코드 발송
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    // emailRedirectTo를 생략하면 매직링크 대신 6자리 코드 발송
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("idle");
      setStep("code");
    }
  }

  // Step 2: 6자리 코드 검증 → 세션 설정 → 이동
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setStatus("error");
      setErrorMsg(
        error.message === "Token has expired or is invalid"
          ? "코드가 올바르지 않거나 만료됐습니다. 다시 시도해주세요."
          : error.message,
      );
    } else {
      // 전체 새로고침으로 서버 세션 동기화
      window.location.href = next ?? "/admin/tests";
    }
  }

  function handleBack() {
    setStep("email");
    setCode("");
    setStatus("idle");
    setErrorMsg("");
  }

  // ── Step 2: 코드 입력 ──
  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="rounded-lg border bg-card px-4 py-3 text-sm text-center text-muted-foreground">
          <strong>{email}</strong>으로<br />6자리 인증 코드를 보냈습니다
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">인증 코드</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            disabled={status === "loading"}
            autoFocus
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>
        {status === "error" && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading" || code.length !== 6}
        >
          {status === "loading" ? "확인 중..." : "로그인"}
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline underline-offset-2"
          onClick={handleBack}
        >
          이메일 다시 입력
        </button>
      </form>
    );
  }

  // ── Step 1: 이메일 입력 ──
  return (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "전송 중..." : "인증 코드 받기"}
      </Button>
    </form>
  );
}
