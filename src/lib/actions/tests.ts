"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrg } from "@/lib/actions/org";
import { revalidatePath } from "next/cache";
import type { ScoringType, TestWithDetails } from "@/lib/db/types";

// ─── 테스트 ────────────────────────────────────────────────────────────────

export async function getTests() {
  const supabase = await createClient();
  const org = await getOrCreateOrg();

  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTestWithDetails(
  testId: string,
): Promise<TestWithDetails> {
  const supabase = await createClient();

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError || !test) throw new Error("테스트를 찾을 수 없습니다.");

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", testId)
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
    .eq("test_id", testId)
    .order("created_at");

  const questionsWithOptions = (questions ?? []).map((q) => ({
    ...q,
    options: (options ?? []).filter((o) => o.question_id === q.id),
  }));

  return {
    ...test,
    questions: questionsWithOptions,
    results: results ?? [],
  } as TestWithDetails;
}

export async function createTest(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const org = await getOrCreateOrg();

  const title = String(formData.get("title") || "새 테스트");
  const slug =
    title
      .replace(/[^a-z0-9가-힣]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 50) +
    "-" +
    Date.now().toString(36);

  const { data, error } = await supabase
    .from("tests")
    .insert({
      org_id: org.id,
      slug,
      title,
      scoring_type: "sum" as ScoringType,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tests");
  return data;
}

export async function updateTest(testId: string, formData: FormData) {
  "use server";
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const title = formData.get("title");
  const description = formData.get("description");
  const scoring_type = formData.get("scoring_type");
  const is_published = formData.get("is_published");

  if (title !== null) updates.title = String(title);
  if (description !== null) updates.description = String(description) || null;
  if (scoring_type !== null) updates.scoring_type = String(scoring_type);
  if (is_published !== null) updates.is_published = is_published === "true";

  const { error } = await supabase
    .from("tests")
    .update(updates)
    .eq("id", testId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tests/${testId}/edit`);
  revalidatePath("/admin/tests");
}

export async function deleteTest(testId: string) {
  "use server";
  const supabase = await createClient();

  const { error } = await supabase.from("tests").delete().eq("id", testId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tests");
}

// ─── 질문 ────────────────────────────────────────────────────────────────

export async function addQuestion(testId: string) {
  "use server";
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("questions")
    .select("order_index")
    .eq("test_id", testId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const order_index = (last?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("questions")
    .insert({ test_id: testId, order_index, text: "새 질문" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
  return data;
}

export async function updateQuestion(
  questionId: string,
  testId: string,
  formData: FormData,
) {
  "use server";
  const supabase = await createClient();

  const text = formData.get("text");
  const updates: Record<string, unknown> = {};
  if (text !== null) updates.text = String(text);

  const { error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", questionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}

export async function deleteQuestion(questionId: string, testId: string) {
  "use server";
  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}

// ─── 옵션 ────────────────────────────────────────────────────────────────

export async function addOption(questionId: string, testId: string) {
  "use server";
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("options")
    .select("order_index")
    .eq("question_id", questionId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const order_index = (last?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("options")
    .insert({ question_id: questionId, order_index, label: "새 선택지" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
  return data;
}

export async function updateOption(
  optionId: string,
  testId: string,
  formData: FormData,
) {
  "use server";
  const supabase = await createClient();

  const label = formData.get("label");
  const score = formData.get("score");
  const type_weights_raw = formData.get("type_weights");

  const updates: Record<string, unknown> = {};
  if (label !== null) updates.label = String(label);
  if (score !== null) updates.score = Number(score) || 0;
  if (type_weights_raw !== null) {
    try {
      updates.type_weights = JSON.parse(String(type_weights_raw));
    } catch {
      updates.type_weights = {};
    }
  }

  const { error } = await supabase
    .from("options")
    .update(updates)
    .eq("id", optionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}

export async function deleteOption(optionId: string, testId: string) {
  "use server";
  const supabase = await createClient();

  const { error } = await supabase
    .from("options")
    .delete()
    .eq("id", optionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}

// ─── 결과 ────────────────────────────────────────────────────────────────

export async function addResult(testId: string) {
  "use server";
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("results")
    .insert({ test_id: testId, title: "새 결과" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
  return data;
}

export async function updateResult(
  resultId: string,
  testId: string,
  formData: FormData,
) {
  "use server";
  const supabase = await createClient();

  const title = formData.get("title");
  const description = formData.get("description");
  const min_score = formData.get("min_score");
  const max_score = formData.get("max_score");
  const type_tag = formData.get("type_tag");

  const updates: Record<string, unknown> = {};
  if (title !== null) updates.title = String(title);
  if (description !== null) updates.description = String(description) || null;
  if (min_score !== null)
    updates.min_score =
      String(min_score) === "" ? null : Number(min_score);
  if (max_score !== null)
    updates.max_score =
      String(max_score) === "" ? null : Number(max_score);
  if (type_tag !== null) updates.type_tag = String(type_tag) || null;

  const { error } = await supabase
    .from("results")
    .update(updates)
    .eq("id", resultId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}

export async function deleteResult(resultId: string, testId: string) {
  "use server";
  const supabase = await createClient();

  const { error } = await supabase
    .from("results")
    .delete()
    .eq("id", resultId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}/edit`);
}
