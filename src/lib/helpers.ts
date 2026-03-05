import { MemberProcess, MatchingStatus, RequiredFieldDef } from './types';

export function truncate(str: string | undefined | null, len: number): string {
  if (!str) return '-';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** 日付文字列を「YYYY年MM月DD日」形式に変換。パース不能ならそのまま返す */
export function formatDateStr(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD 等をパース
  const m = dateStr.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) return `${m[1]}年${m[2].padStart(2, '0')}月${m[3].padStart(2, '0')}日`;
  return dateStr;
}

/** 期間（開始日～終了日）をフォーマット。構造化データ優先、なければ旧テキスト */
export function formatPeriodRange(start: string | null | undefined, end: string | null | undefined, fallback?: string): string {
  if (start) {
    const s = formatDateStr(start);
    if (end) return `${s}～${formatDateStr(end)}`;
    return `${s}～`;
  }
  return fallback || '-';
}

/** 稼働可能日をフォーマット（即日可チェック対応） */
export function formatAvailableDate(available_immediately: boolean | string | null | undefined, available_date: string | null | undefined): string {
  if (available_immediately === true || available_immediately === 'true' || available_immediately === '1') return '即日';
  return formatDateStr(available_date);
}

export function formatDateForFile(date: Date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

export function getProcessBadgeClass(process: MemberProcess): string {
  const map: Record<string, string> = {
    '案件検索中': 'badge-searching',
    '提案中': 'badge-proposed',
    '面談調整中': 'badge-interviewing',
    '面談済': 'badge-interviewed',
    '内定': 'badge-offered',
    '参画中': 'badge-active',
    '終了': 'badge-closed',
  };
  return map[process] || 'badge-open';
}

export function getMatchingBadgeClass(status: MatchingStatus): string {
  const map: Record<string, string> = {
    '候補': 'badge-candidate',
    '提案中': 'badge-proposed',
    '面談調整中': 'badge-interviewing',
    '面談済': 'badge-interviewed',
    '内定': 'badge-offered',
    '参画決定': 'badge-decided',
    '見送り': 'badge-rejected',
  };
  return map[status] || 'badge-open';
}

export function parseTags(str: string | undefined | null): string[] {
  if (!str) return [];
  return str.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return formatDateTime(new Date());
}

const ACTION_ICONS: Record<string, string> = {
  '案件追加': '📋', '案件更新': '✏️', '案件削除': '🗑️',
  '要員追加': '👤', '要員更新': '✏️', '要員削除': '🗑️',
  'マッチング登録': '🤝', 'マッチング更新': '🔄', 'マッチング削除': '🗑️',
  '一括更新': '⚡', 'ステータス変更': '🔄', 'インポート': '📥', 'エクスポート': '📤',
};

export function getActionIcon(action: string): string {
  return ACTION_ICONS[action] || '📝';
}

export function getTaskDueStatus(dueDate: string): { className: string; label: string } {
  if (!dueDate) return { className: '', label: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  if (isNaN(due.getTime())) return { className: '', label: '' };
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { className: 'task-overdue', label: `${Math.abs(diffDays)}日超過` };
  if (diffDays === 0) return { className: 'task-due-today', label: '今日' };
  if (diffDays <= 3) return { className: 'task-due-soon', label: `${diffDays}日後` };
  return { className: 'task-due-normal', label: `${due.getMonth() + 1}/${due.getDate()}` };
}

export function getDefaultTasksForStatus(status: MatchingStatus): string[] {
  const map: Record<string, string[]> = {
    '候補': ['スキルシート確認', '単価・条件の確認'],
    '提案中': ['スキルシート送付', '先方確認待ち'],
    '面談調整中': ['候補者の面談希望日を回収', '案件元からの面談候補日を回収', '面談日程の確定連絡'],
    '面談済': ['面談結果の確認', '候補者へのフィードバック'],
    '内定': ['契約条件の確認', '参画日確定', '契約書の締結'],
    '参画決定': ['参画準備の確認', '初日の段取り確認'],
    '見送り': ['見送り理由の記録', '候補者への連絡'],
  };
  return map[status] || [];
}

// 単価テキストから範囲(min/max)を解析する
export interface PriceRange {
  min: number;  // 万円単位。不明時は0
  max: number;  // 万円単位。不明時は0（上限なし）
}

export function parsePriceRange(text: string | undefined | null): PriceRange {
  if (!text) return { min: 0, max: 0 };
  // ゴミデータ除外
  if (text.startsWith('■') || text.includes('：')) return { min: 0, max: 0 };
  // 全角チルダ→半角、全角数字→半角
  const normalized = text
    .replace(/〜/g, '～')
    .replace(/~/g, '～')
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  // 数値を抽出（小数点含む）
  const nums = normalized.match(/[\d.]+/g)?.map(Number).filter(n => n > 0) || [];
  if (nums.length === 0) return { min: 0, max: 0 };
  if (nums.length === 1) {
    const n = nums[0];
    // "～80万円" パターン（先頭がチルダ）
    if (/^[～\s]*[\d]/.test(normalized.trim())) {
      const beforeNum = normalized.substring(0, normalized.indexOf(String(n)));
      if (beforeNum.includes('～')) return { min: 0, max: n };
    }
    // "110万円～" パターン（末尾がチルダ）
    if (/[\d].*万円?[～]/.test(normalized) || normalized.trim().endsWith('～')) {
      return { min: n, max: 0 };
    }
    return { min: n, max: n };
  }
  // 2つ以上の数値 → min～max
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

// 単価範囲をフォーマットして表示用文字列に変換
export function formatPriceRange(range: PriceRange): string {
  if (range.min === 0 && range.max === 0) return '';
  if (range.min === 0) return `～${range.max}万`;
  if (range.max === 0) return `${range.min}万～`;
  if (range.min === range.max) return `${range.min}万`;
  return `${range.min}～${range.max}万`;
}

// 構造化された単価（min/max）を表示用テキストに変換
export function formatStructuredPrice(min: string | number | null | undefined, max: string | number | null | undefined): string {
  const minNum = typeof min === 'string' ? parseInt(min) || 0 : (min || 0);
  const maxNum = typeof max === 'string' ? parseInt(max) || 0 : (max || 0);
  if (minNum === 0 && maxNum === 0) return '';
  if (minNum === 0) return `～${maxNum}万円`;
  if (maxNum === 0) return `${minNum}万円～`;
  if (minNum === maxNum) return `${minNum}万円`;
  return `${minNum}～${maxNum}万円`;
}

// 構造化単価を PriceRange に変換（フォールバック付き）
export function getStructuredPriceRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  fallbackText?: string | null
): PriceRange {
  const minNum = typeof min === 'string' ? parseInt(min) || 0 : (min || 0);
  const maxNum = typeof max === 'string' ? parseInt(max) || 0 : (max || 0);
  if (minNum > 0 || maxNum > 0) return { min: minNum, max: maxNum };
  // フォールバック: 旧テキストからパース
  return parsePriceRange(fallbackText);
}

// 働き方テキストを構造化して解析する
export interface WorkStyleDetail {
  category: 'remote' | 'hybrid' | 'onsite' | 'flexible' | 'unknown';
  categoryLabel: string;
  officeDays: number | null;    // 週あたりの出社日数（判明時）
  officeDaysText: string;       // "週2～3日出社" 等
  initialOnsite: boolean;       // 参画初期の出社対応可能か
  transitionOnsite: boolean;    // 過渡期の出社対応可能か
  notes: string[];              // その他の特記事項
}

export function parseWorkStyleDetail(text: string | undefined | null): WorkStyleDetail {
  const result: WorkStyleDetail = {
    category: 'unknown',
    categoryLabel: '不明',
    officeDays: null,
    officeDaysText: '',
    initialOnsite: false,
    transitionOnsite: false,
    notes: [],
  };
  if (!text) return result;
  const t = text.trim();
  if (t.startsWith('■') || t.includes('万円') || /確認中/.test(t)) return result;

  // カテゴリ判定
  if (/フルリモ|基本リモート|完全リモート|原則リモート/.test(t)) {
    result.category = 'remote';
    result.categoryLabel = 'フルリモート';
  } else if (/リモート併用|リモート可|リモ併用/.test(t)) {
    result.category = 'hybrid';
    result.categoryLabel = 'リモート併用';
  } else if (/オンサイト|常駐|フル出社|出社必須/.test(t)) {
    result.category = 'onsite';
    result.categoryLabel = 'オンサイト';
  } else if (/応相談|柔軟|対応可能/.test(t)) {
    result.category = 'flexible';
    result.categoryLabel = '柔軟';
  } else if (/出社/.test(t) && /リモート/.test(t)) {
    result.category = 'hybrid';
    result.categoryLabel = 'リモート併用';
  } else if (/出社/.test(t)) {
    result.category = 'onsite';
    result.categoryLabel = 'オンサイト';
  } else if (/リモート/.test(t)) {
    result.category = 'hybrid';
    result.categoryLabel = 'リモート併用';
  }

  // 出社日数の抽出
  const daysMatch = t.match(/週\s*(\d)[～~〜\-]?(\d)?[日]?.*?出社/);
  if (daysMatch) {
    const minDays = parseInt(daysMatch[1]);
    const maxDays = daysMatch[2] ? parseInt(daysMatch[2]) : minDays;
    result.officeDays = maxDays;
    result.officeDaysText = minDays === maxDays ? `週${minDays}日出社` : `週${minDays}～${maxDays}日出社`;
  }

  // 初期オンサイト判定（バッジで表示するため notes には追加しない）
  if (/初期.*オンサイト|初期.*出社|過渡期.*出社|参画.*オンサイト/.test(t)) {
    result.initialOnsite = true;
  }

  // 特記事項の抽出
  const noteMatch = t.match(/※(.+)/);
  if (noteMatch) {
    const note = noteMatch[1].trim();
    // initialOnsite バッジで既にカバーされている内容はスキップ
    const coveredByOnsite = result.initialOnsite && /初期|オンサイト|出社/.test(note);
    if (!coveredByOnsite && !result.notes.some(n => note.includes(n) || n.includes(note))) {
      result.notes.push(note);
    }
  }

  // PC受け取り等
  if (/PC受け取り/.test(t)) {
    result.notes.push('PC受取出社あり');
  }

  return result;
}

// 構造化された働き方データから WorkStyleDetail を生成（フォールバック付き）
export function getStructuredWorkStyle(
  category: string | undefined | null,
  officeDays: string | undefined | null,
  initialOnsite: string | boolean | undefined | null,
  note: string | undefined | null,
  fallbackText?: string | undefined | null,
  transitionOnsite?: string | boolean | undefined | null
): WorkStyleDetail {
  if (category) {
    const catMap: Record<string, WorkStyleDetail['category']> = {
      'フルリモート': 'remote',
      'リモート併用': 'hybrid',
      'オンサイト': 'onsite',
    };
    return {
      category: catMap[category] || 'unknown',
      categoryLabel: category,
      officeDays: officeDays ? parseInt(String(officeDays)) || null : null,
      officeDaysText: officeDays ? `週${officeDays}日出社` : '',
      initialOnsite: initialOnsite === 'true' || initialOnsite === true,
      transitionOnsite: transitionOnsite === 'true' || transitionOnsite === true,
      notes: note ? [note] : [],
    };
  }
  // フォールバック: 旧テキストをパース
  return parseWorkStyleDetail(fallbackText);
}

// 働き方カテゴリのフィルタ用ラベル（構造化カテゴリの日本語値と一致）
export const WORK_STYLE_FILTER_OPTIONS = [
  { value: 'フルリモート', label: 'フルリモート' },
  { value: 'リモート併用', label: 'リモート併用' },
  { value: 'オンサイト', label: 'オンサイト' },
] as const;

export function getMissingFields<T>(
  entity: T,
  requiredFields: RequiredFieldDef<T>[]
): string[] {
  return requiredFields
    .filter(f => {
      const val = entity[f.key as keyof T];
      return val === undefined || val === null || val === '';
    })
    .map(f => f.label);
}
