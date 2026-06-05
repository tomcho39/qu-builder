export type ScoringType = "sum" | "type_count";
export type OrgRole = "owner" | "admin" | "editor";

export type Org = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type OrgMember = {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
};

export type Test = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  scoring_type: ScoringType;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  test_id: string;
  order_index: number;
  text: string;
  image_url: string | null;
};

export type Option = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
  score: number;
  type_weights: Record<string, number>;
};

export type Result = {
  id: string;
  test_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  min_score: number | null;
  max_score: number | null;
  type_tag: string | null;
};

export type QuestionWithOptions = Question & { options: Option[] };
export type TestWithDetails = Test & {
  questions: QuestionWithOptions[];
  results: Result[];
};
