import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">qu-builder</h1>
          <p className="text-sm text-muted-foreground">
            이메일로 로그인 링크를 받으세요
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {error === "auth" ? "인증에 실패했습니다. 링크가 만료됐거나 이미 사용된 링크입니다." : error}
          </div>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
