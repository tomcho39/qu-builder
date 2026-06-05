import Link from "next/link";

export default function Home() {
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
          <Link
            href="/admin/tests"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            관리자로 이동
          </Link>
          <Link
            href="/t/demo"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            데모 테스트 보기
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          MVP 셋업 중 — 다음 단계: Supabase 키 입력 후 마이그레이션 실행
        </p>
      </div>
    </main>
  );
}
