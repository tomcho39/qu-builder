"use server";

import { createClient } from "@/lib/supabase/server";
import type { Org, Test } from "@/lib/db/types";

/** 현재 로그인 유저의 org를 가져오거나, 없으면 자동 생성 */
export async function getOrCreateOrg(): Promise<Org> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 기존 org 확인
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, orgs(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membership?.orgs) {
    return membership.orgs as unknown as Org;
  }

  // 없으면 생성 (이메일 기반 slug)
  const emailPrefix = (user.email ?? user.id)
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .slice(0, 30);
  const slug = `${emailPrefix}-${Date.now().toString(36)}`;

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .insert({ slug, name: emailPrefix })
    .select()
    .single();

  if (orgError || !org) throw new Error("org 생성 실패: " + orgError?.message);

  await supabase.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  return org as Org;
}

/** 서브도메인용: slug로 org + 공개 테스트 목록 조회 (인증 불필요) */
export async function getOrgWithTests(
  orgSlug: string,
): Promise<{ org: Org; tests: Test[] } | null> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("orgs")
    .select("*")
    .eq("slug", orgSlug)
    .single();

  if (!org) return null;

  const { data: tests } = await supabase
    .from("tests")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return { org: org as Org, tests: (tests ?? []) as Test[] };
}
