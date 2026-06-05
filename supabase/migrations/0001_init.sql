-- qu-builder 초기 스키마
-- 멀티테넌트: 모든 도메인 테이블은 org_id로 격리

-- 0. 확장
create extension if not exists pgcrypto;

-- 1. 조직 (고객사)
create table orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. 멤버십
create table org_members (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- 3. 테스트
create table tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  cover_image_url text,
  scoring_type text not null check (scoring_type in ('sum','type_count')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);
create index tests_org_id_idx on tests(org_id);
create index tests_published_idx on tests(is_published) where is_published;

-- 4. 질문
create table questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  order_index int not null,
  text text not null,
  image_url text
);
create index questions_test_id_idx on questions(test_id, order_index);

-- 5. 옵션
-- 점수합산형: score 사용
-- 유형카운팅형: type_weights 사용. 예: {"A": 1, "B": 0}
create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  order_index int not null,
  label text not null,
  score int not null default 0,
  type_weights jsonb not null default '{}'::jsonb
);
create index options_question_id_idx on options(question_id, order_index);

-- 6. 결과
-- 점수합산형: min_score ~ max_score 범위로 매칭
-- 유형카운팅형: type_tag로 매칭
create table results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  min_score int,
  max_score int,
  type_tag text
);
create index results_test_id_idx on results(test_id);

-- 7. 플레이 로그
create table plays (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  result_id uuid references results(id) on delete set null,
  answers jsonb,
  created_at timestamptz not null default now()
);
create index plays_test_id_idx on plays(test_id, created_at desc);

-- ============================================================
-- RLS 정책
-- ============================================================
alter table orgs enable row level security;
alter table org_members enable row level security;
alter table tests enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table results enable row level security;
alter table plays enable row level security;

-- 헬퍼: 현재 사용자가 특정 org의 멤버인가
create or replace function is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from org_members
    where org_id = target_org and user_id = auth.uid()
  );
$$;

-- orgs: 자기가 속한 org만 조회
create policy "orgs: members can read"
  on orgs for select
  using (is_org_member(id));

-- org_members: 본인 row 조회 가능
create policy "org_members: self read"
  on org_members for select
  using (user_id = auth.uid() or is_org_member(org_id));

-- tests: 공개된 건 모두 읽기 / 관리자는 자기 org 전체
create policy "tests: public read published"
  on tests for select
  using (is_published or is_org_member(org_id));

create policy "tests: org members write"
  on tests for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

-- questions / options / results: 부모 test 권한 따라감
create policy "questions: read via test"
  on questions for select
  using (
    exists (
      select 1 from tests t
      where t.id = questions.test_id
        and (t.is_published or is_org_member(t.org_id))
    )
  );
create policy "questions: write via test"
  on questions for all
  using (
    exists (select 1 from tests t where t.id = questions.test_id and is_org_member(t.org_id))
  )
  with check (
    exists (select 1 from tests t where t.id = questions.test_id and is_org_member(t.org_id))
  );

create policy "options: read via test"
  on options for select
  using (
    exists (
      select 1 from questions q join tests t on t.id = q.test_id
      where q.id = options.question_id
        and (t.is_published or is_org_member(t.org_id))
    )
  );
create policy "options: write via test"
  on options for all
  using (
    exists (
      select 1 from questions q join tests t on t.id = q.test_id
      where q.id = options.question_id and is_org_member(t.org_id)
    )
  )
  with check (
    exists (
      select 1 from questions q join tests t on t.id = q.test_id
      where q.id = options.question_id and is_org_member(t.org_id)
    )
  );

create policy "results: read via test"
  on results for select
  using (
    exists (
      select 1 from tests t
      where t.id = results.test_id
        and (t.is_published or is_org_member(t.org_id))
    )
  );
create policy "results: write via test"
  on results for all
  using (
    exists (select 1 from tests t where t.id = results.test_id and is_org_member(t.org_id))
  )
  with check (
    exists (select 1 from tests t where t.id = results.test_id and is_org_member(t.org_id))
  );

-- plays: 누구나 INSERT 가능 (익명 플레이), 조회는 org 멤버만
create policy "plays: anyone insert"
  on plays for insert
  with check (true);

create policy "plays: org members read"
  on plays for select
  using (
    exists (select 1 from tests t where t.id = plays.test_id and is_org_member(t.org_id))
  );
