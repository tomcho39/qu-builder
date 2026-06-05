"use server";

import { createClient } from "@/lib/supabase/server";
import type { TestWithDetails, Result } from "@/lib/db/types";

/** 공개된 테스트를 slug로 조회 (플레이어용, 인증 불필요)
 *  orgSlug가 있으면 해당 org 소속 테스트만 반환 (서브도메인 격리) */
export async function getPublishedTest(
  slug: string,
  orgSlug?: string,
): Promise<TestWithDetails> {
  const supabase = await createClient();

  let query = supabase
    .from("tests")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true);

  if (orgSlug) {
    const { data: org } = await supabase
      .from("orgs")
      .select("id")
      .eq("slug", orgSlug)
      .single();
    if (!org) throw new Error("테스트를 찾을 수 없습니다.");
    query = query.eq("org_id", org.id);
  }

  const { data: test, error } = await query.single();

  if (error || !test) throw new Error("테스트를 찾을 수 없습니다.");

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", test.id)
    .order("order_index");

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: options } =
    questionIds.length > 0
      ? await supabase
          .from("options")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index")
      : { data: [] };

  const { data: results } = await supabase
    .from("results")
    .select("*")
    .eq("test_id", test.id);

  return {
    ...test,
    questions: (questions ?? []).map((q) => ({
      ...q,
      options: (options ?? []).filter((o) => o.question_id === q.id),
    })),
    results: results ?? [],
  } as TestWithDetails;
}

export type Answer = { question_id: string; option_id: string };

/** 플레이 제출 → 결과 계산 → play 저장 → result 반환 */
export async function submitPlay(
  testId: string,
  answers: Answer[],
): Promise<{ result: Result; playId: string }> {
  const supabase = await createClient();

  // 선택된 옵션 조회
  const optionIds = answers.map((a) => a.option_id);
  const { data: options } = await supabase
    .from("options")
    .select("id, score, type_weights")
    .in("id", optionIds);

  const { data: test } = await supabase
    .from("tests")
    .select("scoring_type")
    .eq("id", testId)
    .single();

  const { data: results } = await supabase
    .from("results")
    .select("*")
    .eq("test_id", testId);

  if (!options || !test || !results?.length) {
    throw new Error("데이터 조회 실패");
  }

  let matchedResult: Result | null = null;

  if (test.scoring_type === "sum") {
    // 점수 합산
    const totalScore = options.reduce((sum, o) => sum + (o.score ?? 0), 0);
    matchedResult =
      (results as Result[]).find(
        (r) =>
          r.min_score !== null &&
          r.max_score !== null &&
          totalScore >= r.min_score &&
          totalScore <= r.max_score,
      ) ?? (results[0] as Result);
  } else {
    // 유형 카운팅 — type_weights 합산 후 최대값 유형 선택
    const typeCounts: Record<string, number> = {};
    options.forEach((o) => {
      const weights = (o.type_weights as Record<string, number>) ?? {};
      Object.entries(weights).forEach(([k, v]) => {
        typeCounts[k] = (typeCounts[k] ?? 0) + v;
      });
    });
    const winType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    matchedResult =
      (results as Result[]).find((r) => r.type_tag === winType) ??
      (results[0] as Result);
  }

  // play 저장
  const answersJson = answers.reduce<Record<string, string>>((acc, a) => {
    acc[a.question_id] = a.option_id;
    return acc;
  }, {});

  const { data: play, error: playError } = await supabase
    .from("plays")
    .insert({
      test_id: testId,
      result_id: matchedResult?.id ?? null,
      answers: answersJson,
    })
    .select("id")
    .single();

  if (playError) console.error("play 저장 오류:", playError.message);

  return { result: matchedResult!, playId: play?.id ?? "" };
}

/** play_id로 결과 조회 (결과 페이지용) */
export async function getPlayResult(
  playId: string,
): Promise<{ result: Result; testTitle: string; testSlug: string }> {
  const supabase = await createClient();

  const { data: play, error } = await supabase
    .from("plays")
    .select("result_id, test_id")
    .eq("id", playId)
    .single();

  if (error || !play) throw new Error("결과를 찾을 수 없습니다.");

  const { data: result } = await supabase
    .from("results")
    .select("*")
    .eq("id", play.result_id)
    .single();

  const { data: test } = await supabase
    .from("tests")
    .select("title, slug")
    .eq("id", play.test_id)
    .single();

  if (!result || !test) throw new Error("결과 데이터 없음");

  return { result: result as Result, testTitle: test.title, testSlug: test.slug };
}
