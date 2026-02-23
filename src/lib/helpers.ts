import { MemberProcess, MatchingStatus } from './types';

export function truncate(str: string | undefined | null, len: number): string {
  if (!str) return '-';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
