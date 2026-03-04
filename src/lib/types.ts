export const USER_ROLES = ['admin', 'manager', 'user'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
}

export const PROJECT_STATUSES = ['Open', 'Closed', 'Hold'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const SHAREABLE_VALUES = ['OK', 'NG'] as const;
export type ShareableValue = typeof SHAREABLE_VALUES[number];

export const MEMBER_PROCESSES = ['案件検索中', '提案中', '面談調整中', '面談済', '内定', '参画中', '終了'] as const;
export type MemberProcess = typeof MEMBER_PROCESSES[number];

export const MATCHING_STATUSES = ['候補', '提案中', '面談調整中', '面談済', '内定', '参画決定', '見送り'] as const;
export type MatchingStatus = typeof MATCHING_STATUSES[number];

export interface Project {
  id: string;
  status: ProjectStatus;
  shareable: ShareableValue;
  share_note: string;
  added_date: string;
  source: string;
  project_name_original: string;
  project_name_rewrite: string;
  client_price: string;
  purchase_price: string;
  purchase_price_num: string;
  required_experience_years: string;
  role: string;
  location: string;
  work_style: string;
  client_price_min: string;
  client_price_max: string;
  purchase_price_min: string;
  purchase_price_max: string;
  work_style_category: string;
  work_style_office_days: string;
  work_style_initial_onsite: string;
  work_style_transition_onsite: string;
  work_style_note: string;
  period: string;
  headcount: string;
  required_skills: string;
  preferred_skills: string;
  required_skill_tags: string;
  preferred_skill_tags: string;
  industry_tags: string;
  description_original: string;
  description_rewrite: string;
  age_limit: string;
  nationality: string;
  english: string;
  commercial_flow: string;
  interview_count: string;
}

export interface Member {
  id: string;
  process: MemberProcess;
  affiliation: string;
  full_name: string;
  initial: string;
  contract_employee: string;
  desired_price: string;
  desired_price_num: string;
  contact: string;
  desired_position: string;
  skill_sheet_url: string;
  proposal_text: string;
  sales_comment: string;
  skills_summary: string;
  skill_tags: string;
  industry_tags: string;
  experience_years: string;
  experience_summary: string;
  nearest_station: string;
  available_date: string;
  work_preference: string;
  shareable: string;
  share_note: string;
  desired_price_min: string;
  desired_price_max: string;
  work_style_category: string;
  work_style_office_days: string;
  work_style_initial_onsite: string;
  work_style_transition_onsite: string;
  work_style_note: string;
}

export const WORK_STYLE_CATEGORIES = ['フルリモート', 'リモート併用', 'オンサイト'] as const;
export type WorkStyleCategoryValue = typeof WORK_STYLE_CATEGORIES[number];

export interface Matching {
  id: string;
  project_id: string;
  member_id: string;
  status: MatchingStatus;
  note: string;
  proposed_date: string;
  interview_date: string;
  primary_assignee: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  target_table: string;
  target_id: string;
  target_name: string;
  detail: string;
  timestamp: string;
  user_id: string;
  user_name: string;
}

export interface Note {
  id: string;
  target_table: string;
  target_id: string;
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  matching_id: string;
  content: string;
  done: boolean;
  due_date: string;
  sort_order: number;
  progress_status: string;
  progress_note: string;
  assignee: string;
}

export const TASK_PROGRESS_STATUSES = ['未着手', '対応中', '完了'] as const;

// ---- General Task Management (Asana-like) ----

export const GENERAL_TASK_STATUSES = ['未着手', '対応中', '待ち', '完了'] as const;
export type GeneralTaskStatus = typeof GENERAL_TASK_STATUSES[number];

export const TASK_PRIORITIES = ['高', '中', '低', 'なし'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const TAG_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const;
export type TagColor = typeof TAG_COLORS[number];

export interface TaskSection {
  id: string;
  name: string;
  sort_order: number;
  collapsed: boolean;
}

export interface TaskTag {
  id: string;
  name: string;
  color: TagColor;
}

export interface GeneralTask {
  id: string;
  title: string;
  description: string;
  status: GeneralTaskStatus;
  priority: TaskPriority;
  assignee: string;
  due_date: string;
  sort_order: number;
  completed_at: number | null;
  section_id: string | null;
  parent_id: string | null;
  linked_project_id: string | null;
  linked_member_id: string | null;
  linked_matching_id: string | null;
  tags: TaskTag[];
  children?: GeneralTask[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: number;
}

export type PageName = 'dashboard' | 'projects' | 'members' | 'matching' | 'progress' | 'tasks';

// --- Required Fields Config ---
// 一覧で「未入力あり」バッジを表示するための必須項目定義。
// TODO: 現在は仮設定。運用しながら必要な項目を追加・変更すること。
//   追加例: { key: 'location', label: '勤務地' }
//   ここを変更するだけで一覧の表示に自動反映される（他ファイルの修正不要）。
export interface RequiredFieldDef<T> {
  key: keyof T;
  label: string;
}

export const PROJECT_REQUIRED_FIELDS: RequiredFieldDef<Project>[] = [
  { key: 'project_name_original', label: '案件名' },
  { key: 'role', label: '募集職種' },
  // { key: 'location', label: '勤務地' },
  // { key: 'purchase_price', label: '仕入単価' },
  // { key: 'work_style', label: '働き方' },
  // { key: 'required_skill_tags', label: '必須スキルタグ' },
];

export const MEMBER_REQUIRED_FIELDS: RequiredFieldDef<Member>[] = [
  { key: 'full_name', label: '要員名' },
  { key: 'affiliation', label: '所属先' },
  // { key: 'desired_price', label: '希望単価' },
  // { key: 'skill_tags', label: 'スキルタグ' },
  // { key: 'available_date', label: '稼働可能日' },
  // { key: 'nearest_station', label: '最寄駅' },
];
