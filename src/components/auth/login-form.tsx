"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Props = {
  next?: string;
};

export function LoginForm({ next }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=${next ?? "/admin/tests"}`
        : `/auth/callback?next=${next ?? "/admin/tests"}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <p className="font-medium">메일을 확인해주세요 📬</p>
        <p className="text-sm text-muted-foreground">
          <strong>{email}</strong>로 로그인 링크를 보냈습니다.
          <br />
          링크를 클릭하면 자동으로 로그인됩니다.
        </p>
        <button
          className="text-xs text-muted-foreground underline underline-offset-2 mt-2"
          onClick={() => setStatus("idle")}
        >
          다른 이메일로 시도
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {status === "loading" ? "전송 중..." : "로그인 링크 받기"}
      </Button>
    </form>
  );
}
