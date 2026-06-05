# qu-builder

고객사(B2B)가 직접 인터랙티브 테스트(심리테스트 등)를 만들어 공유 링크로 배포하는 멀티테넌트 SaaS.

## 스택

- Next.js 16 (App Router, React 19)
- Tailwind CSS v4
- Supabase (Postgres + Auth + Storage)
- Vercel 배포 예정

## 무료 티어 한도 (MVP)

| 서비스 | 한도 | 비고 |
| --- | --- | --- |
| Vercel Hobby | 100GB 대역폭/월 | 상업적 사용은 Pro($20) 필요 |
| Supabase Free | DB 500MB, Storage 1GB, MAU 50k | 1주 비활성 시 일시정지 |
| Cloudflare Free | 이미지 CDN 무제한 대역폭 | 배포 직전 연동 |

## 셋업

```bash
# 1. 의존성 (이미 설치됨)
npm install

# 2. 환경 변수
cp .env.local.example .env.local
# Supabase 프로젝트 생성 후 URL/anon key/service role key 입력

# 3. DB 마이그레이션
# Supabase 대시보드 → SQL Editor → supabase/migrations/0001_init.sql 실행

# 4. 개발 서버
npm run dev
```

## 폴더 구조

```
src/
  app/
    (marketing)/        # 공개 마케팅 페이지 (현재 /)
    (player)/t/[slug]/  # 공개 플레이어 (시작/진행/결과)
    (admin)/admin/      # 관리자 (테스트 빌더, 설정)
  lib/
    supabase/           # 브라우저/서버 클라이언트
    db/                 # Supabase 생성 타입 (예정)
  components/           # UI 컴포넌트 (예정)
supabase/
  migrations/           # SQL 마이그레이션
```

## DB 스키마 요약

- `orgs` — 고객사
- `org_members` — 멤버십 (owner/admin/editor)
- `tests` — 테스트 (점수합산형 `sum` / 유형카운팅형 `type_count`)
- `questions` — 질문
- `options` — 옵션 (`score` 또는 `type_weights JSONB`)
- `results` — 결과 (점수 범위 또는 `type_tag`)
- `plays` — 플레이 로그

모든 테이블 RLS 활성화, `is_org_member()` 함수로 org 단위 격리.

## 다음 단계

- [ ] Supabase 프로젝트 생성 및 마이그레이션 적용
- [ ] shadcn/ui 도입 (Tailwind v4 호환 확인)
- [ ] 매직링크 Auth UI
- [ ] 테스트 빌더 (질문/옵션/결과 CRUD)
- [ ] 플레이어 흐름 (질문 → 점수 계산 → 결과 매칭)
- [ ] OG 이미지 동적 생성
