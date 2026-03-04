'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaTable, FaColumns, FaTimes, FaChevronDown, FaChevronRight,
  FaRegCalendarAlt,
} from 'react-icons/fa';
import { Project, Member, Matching, Task, User, TASK_PROGRESS_STATUSES, MATCHING_STATUSES } from '../lib/types';
import { truncate, parseTags, getMatchingBadgeClass, getDefaultTasksForStatus, getTaskDueStatus, getStructuredPriceRange, formatPriceRange, formatStructuredPrice } from '../lib/helpers';

interface Props {
  projects: Project[];
  members: Member[];
  matchings: Matching[];
  tasks: Task[];
  users: User[];
  onQuickStatusUpdate: (id: string, status: string) => void;
  onEditMatching: (mt: Matching) => void;
  onDeleteMatching: (id: string) => void;
  onBulkDeleteMatchings: (ids: string[]) => void;
  onUpdateMatchingField: (id: string, data: Partial<Matching>) => Promise<void>;
  onShowProject: (id: string) => void;
  onShowMember: (id: string) => void;
  onAddTask: (matchingId: string, content: string, dueDate?: string) => Promise<Task>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onBulkAddTasks: (matchingId: string, contents: string[]) => Promise<Task[]>;
}

/* -------- TaskChecklist sub-component -------- */
function TaskChecklist({
  matchingId, status, tasks, onAdd, onUpdate, onDelete, onBulkAdd,
}: {
  matchingId: string;
  status: string;
  tasks: Task[];
  onAdd: (matchingId: string, content: string, dueDate?: string) => Promise<Task>;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkAdd: (matchingId: string, contents: string[]) => Promise<Task[]>;
}) {
  const [newContent, setNewContent] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingDueId, setEditingDueId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
  const [editingAssigneeText, setEditingAssigneeText] = useState('');

  // (suggestable logic removed — defaults are auto-populated on status change)

  const handleAdd = async () => {
    const text = newContent.trim();
    if (!text) return;
    try {
      await onAdd(matchingId, text, newDueDate || undefined);
      setNewContent('');
      setNewDueDate('');
    } catch (e) {
      console.error('タスク追加に失敗しました:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  // handleSuggest removed — defaults auto-populated

  const handleDueDateChange = async (taskId: string, newDate: string) => {
    try {
      await onUpdate(taskId, { due_date: newDate });
    } catch (e) {
      console.error('期日更新に失敗しました:', e);
    }
    setEditingDueId(null);
  };

  const handleProgressStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await onUpdate(taskId, { progress_status: newStatus });
    } catch (e) {
      console.error('進捗ステータス更新に失敗しました:', e);
    }
  };

  const startNoteEdit = (task: Task) => {
    setEditingNoteId(task.id);
    setEditingNoteText(task.progress_note || '');
    // Set cursor to end of text on next render
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-task-id="${task.id}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 0);
  };

  const handleNoteSave = async (taskId: string) => {
    try {
      await onUpdate(taskId, { progress_note: editingNoteText });
    } catch (e) {
      console.error('進捗メモ更新に失敗しました:', e);
    }
    setEditingNoteId(null);
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNoteSave(taskId);
    } else if (e.key === 'Escape') {
      setEditingNoteId(null);
    }
  };

  const handleAssigneeSave = async (taskId: string) => {
    try {
      await onUpdate(taskId, { assignee: editingAssigneeText });
    } catch (e) {
      console.error('担当者更新に失敗しました:', e);
    }
    setEditingAssigneeId(null);
  };

  const getProgressSelectClass = (status: string) => {
    if (status === '完了') return 'status-done';
    if (status === '対応中') return 'status-doing';
    return 'status-todo';
  };

  return (
    <div className="task-checklist">
      {tasks.map(task => {
        const dueStatus = getTaskDueStatus(task.due_date);
        const isDone = task.progress_status === '完了';
        return (
          <div key={task.id} className={`task-item${isDone ? ' task-item-done' : ''}`}>
              <select
                className={`task-progress-select ${getProgressSelectClass(task.progress_status)}`}
                value={task.progress_status}
                onChange={e => handleProgressStatusChange(task.id, e.target.value)}
              >
                {TASK_PROGRESS_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <span className={`task-item-content${isDone ? ' done' : ''}`}>
                {task.content}
              </span>

              {/* Assignee */}
              {editingAssigneeId === task.id ? (
                <input
                  className="task-assignee-input"
                  type="text"
                  value={editingAssigneeText}
                  onChange={e => setEditingAssigneeText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAssigneeSave(task.id); }
                    if (e.key === 'Escape') setEditingAssigneeId(null);
                  }}
                  onBlur={() => handleAssigneeSave(task.id)}
                  autoFocus
                  placeholder="担当者名"
                  maxLength={20}
                />
              ) : (
                <span
                  className={`task-assignee-badge${task.assignee ? ' has-assignee' : ''}`}
                  onClick={() => { setEditingAssigneeId(task.id); setEditingAssigneeText(task.assignee || ''); }}
                  title="担当者を設定"
                >
                  {task.assignee || '担当者'}
                </span>
              )}

              {/* Memo box (inline) */}
              {editingNoteId === task.id ? (
                <textarea
                  className="task-note-box"
                  data-task-id={task.id}
                  value={editingNoteText}
                  onChange={e => setEditingNoteText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleNoteSave(task.id);
                    } else if (e.key === 'Escape') {
                      setEditingNoteId(null);
                    }
                  }}
                  onBlur={() => handleNoteSave(task.id)}
                  autoFocus
                  placeholder="メモを入力..."
                  rows={2}
                />
              ) : (
                <div
                  className={`task-note-box task-note-display${task.progress_note ? '' : ' empty'}`}
                  onClick={() => startNoteEdit(task)}
                >
                  {task.progress_note || 'メモを入力...'}
                </div>
              )}

              {/* Due date */}
              {editingDueId === task.id ? (
                <input
                  type="date"
                  className="task-due-input"
                  defaultValue={task.due_date || ''}
                  ref={el => {
                    if (el) {
                      el.focus();
                      setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50);
                    }
                  }}
                  onChange={e => handleDueDateChange(task.id, e.target.value)}
                  onBlur={() => setEditingDueId(null)}
                />
              ) : (
                <span
                  className={`task-due-badge ${dueStatus.className}`}
                  onClick={() => setEditingDueId(task.id)}
                  title={task.due_date ? `期日: ${task.due_date}` : '期日を設定'}
                >
                  {dueStatus.label ? (
                    dueStatus.label
                  ) : (
                    <FaRegCalendarAlt className="task-due-icon" />
                  )}
                </span>
              )}

              <button
                className="task-item-delete"
                onClick={() => onDelete(task.id)}
                title="削除"
              >
                <FaTimes />
              </button>
            </div>
        );
      })}

      {/* Inline add */}
      <div className="task-add-form">
        <input
          className="task-add-input"
          type="text"
          placeholder="タスクを追加... (Enter)"
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="date"
          className="task-due-input"
          value={newDueDate}
          onChange={e => setNewDueDate(e.target.value)}
          title="期日"
        />
      </div>

      {/* Default tasks are auto-populated on status change */}
    </div>
  );
}

/* -------- Main ProgressPage -------- */
export default function ProgressPage({
  projects, members, matchings, tasks, users,
  onQuickStatusUpdate, onEditMatching, onDeleteMatching, onBulkDeleteMatchings, onUpdateMatchingField, onShowProject, onShowMember,
  onAddTask, onUpdateTask, onDeleteTask, onBulkAddTasks,
}: Props) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [expandedKanban, setExpandedKanban] = useState<Set<string>>(new Set());
  const [expandedTable, setExpandedTable] = useState<Set<string>>(new Set());

  // Inline date editing for proposed_date / interview_date
  const [editingDateCell, setEditingDateCell] = useState<{ id: string; field: 'proposed_date' | 'interview_date' } | null>(null);
  // Inline memo editing
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoText, setEditingMemoText] = useState('');
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // D&D for kanban
  const [draggedMatchingId, setDraggedMatchingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Auto-populate default tasks for matchings that have no tasks yet
  const autoPopulatedRef = useRef(new Set<string>());
  useEffect(() => {
    matchings.forEach(mt => {
      if (autoPopulatedRef.current.has(mt.id)) return;
      const mtTasks = tasks.filter(t => t.matching_id === mt.id);
      if (mtTasks.length > 0) {
        // Tasks already exist — mark so manual deletion won't re-trigger auto-populate
        autoPopulatedRef.current.add(mt.id);
        return;
      }
      const defaults = getDefaultTasksForStatus(mt.status);
      if (defaults.length > 0) {
        autoPopulatedRef.current.add(mt.id);
        onBulkAddTasks(mt.id, defaults).catch(() => {
          autoPopulatedRef.current.delete(mt.id);
        });
      }
    });
  }, [matchings, tasks, onBulkAddTasks]);

  // Enrich matchings with project/member data and computed fields
  const enrichedMatchings = useMemo(() => {
    return matchings.map(mt => {
      const project = projects.find(p => p.id === mt.project_id);
      const member = members.find(m => m.id === mt.member_id);

      // Price diff (構造化データ優先、フォールバック付き)
      const projPriceRange = project
        ? getStructuredPriceRange(project.purchase_price_min, project.purchase_price_max, project.purchase_price)
        : { min: 0, max: 0 };
      const memPriceRange = member
        ? getStructuredPriceRange(member.desired_price_min, member.desired_price_max, member.desired_price)
        : { min: 0, max: 0 };
      const projHasPrice = projPriceRange.min > 0 || projPriceRange.max > 0;
      const memHasPrice = memPriceRange.min > 0 || memPriceRange.max > 0;
      const priceDiff = projHasPrice && memHasPrice
        ? (projPriceRange.max || projPriceRange.min) - (memPriceRange.min || memPriceRange.max)
        : null;
      const priceLabel = projHasPrice && memHasPrice
        ? `${formatPriceRange(projPriceRange)} ↔ ${formatPriceRange(memPriceRange)}`
        : null;

      // Skill match
      const reqTags = parseTags(project?.required_skill_tags);
      const memberTags = parseTags(member?.skill_tags);
      const matchedSkills = reqTags.filter(rt => memberTags.includes(rt));
      const skillMatchRate = reqTags.length > 0
        ? Math.round(matchedSkills.length / reqTags.length * 100)
        : null;

      // Tasks for this matching
      const matchingTasks = tasks.filter(t => t.matching_id === mt.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      return { matching: mt, project, member, priceDiff, priceLabel, matchedSkills, skillMatchRate, matchingTasks };
    });
  }, [matchings, projects, members, tasks]);

  // Filter
  const filtered = useMemo(() => {
    let list = enrichedMatchings;
    if (statusFilter) {
      list = list.filter(item => item.matching.status === statusFilter);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(item => {
        const pName = (item.project?.project_name_rewrite || item.project?.project_name_original || '').toLowerCase();
        const mName = (item.member?.full_name || item.member?.initial || '').toLowerCase();
        return pName.includes(q) || mName.includes(q);
      });
    }
    return list;
  }, [enrichedMatchings, statusFilter, searchText]);

  // Kanban grouping
  const kanbanColumns = useMemo(() => {
    return MATCHING_STATUSES.map(status => ({
      status,
      items: filtered.filter(item => item.matching.status === status),
    }));
  }, [filtered]);

  const toggleKanbanExpand = useCallback((id: string) => {
    setExpandedKanban(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleTableExpand = useCallback((id: string) => {
    setExpandedTable(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Count overdue tasks (not completed, past due date)
  const getOverdueCount = useCallback((matchingTasks: Task[]) => {
    return matchingTasks.filter(t => {
      if (t.progress_status === '完了') return false;
      const status = getTaskDueStatus(t.due_date);
      return status.className === 'task-overdue';
    }).length;
  }, []);

  const renderPriceDiff = (diff: number | null, label?: string | null) => {
    if (diff === null) return <span className="progress-price-diff neutral">-</span>;
    const cls = diff >= 0 ? 'positive' : 'negative';
    return <span className={`progress-price-diff ${cls}`} title={label || undefined}>{diff >= 0 ? '+' : ''}{diff}万</span>;
  };

  const renderSkillMatch = (rate: number | null, skills: string[]) => {
    if (rate === null) return '-';
    const color = rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warning)' : 'var(--danger)';
    return (
      <div className="progress-skill-match">
        <span style={{ fontSize: 11, fontWeight: 700, color, marginRight: 4 }}>{rate}%</span>
        {skills.slice(0, 3).map((s, i) => (
          <span key={i} className="skill-tag" style={{ fontSize: 10 }}>{s}</span>
        ))}
      </div>
    );
  };

  const renderTaskProgress = (matchingTasks: Task[], matchingId: string, isKanban: boolean) => {
    const done = matchingTasks.filter(t => t.progress_status === '完了').length;
    const total = matchingTasks.length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    const isExpanded = isKanban ? expandedKanban.has(matchingId) : expandedTable.has(matchingId);
    const overdueCount = getOverdueCount(matchingTasks);

    return (
      <div
        className={`task-header${overdueCount > 0 ? ' has-overdue' : ''}`}
        onClick={() => isKanban ? toggleKanbanExpand(matchingId) : toggleTableExpand(matchingId)}
        title={overdueCount > 0 ? `${overdueCount}件の期限超過タスク` : undefined}
      >
        {isExpanded ? <FaChevronDown style={{ fontSize: 10, color: 'var(--text-secondary)' }} /> : <FaChevronRight style={{ fontSize: 10, color: 'var(--text-secondary)' }} />}
        <span className="task-header-label">タスク</span>
        <div className="task-progress-mini">
          <div className="task-progress-bar">
            <div className="task-progress-fill" style={{ width: `${pct}%`, background: overdueCount > 0 ? 'var(--danger)' : undefined }} />
          </div>
          <span className="task-progress-text">{done}/{total}</span>
        </div>
      </div>
    );
  };

  // Compute whether all tasks are expanded for the toggle button
  const expandedSet = viewMode === 'table' ? expandedTable : expandedKanban;
  const allFilteredIds = filtered.map(item => item.matching.id);
  const allTasksExpanded = allFilteredIds.length > 0 && allFilteredIds.every(id => expandedSet.has(id));

  const handleToggleAllTasks = () => {
    const setter = viewMode === 'table' ? setExpandedTable : setExpandedKanban;
    setter(allTasksExpanded ? new Set() : new Set(allFilteredIds));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map(item => item.matching.id)) : new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件のマッチングを削除しますか？この操作は取り消せません。`)) return;
    onBulkDeleteMatchings([...selectedIds]);
    setSelectedIds(new Set());
  };

  return (
    <div className="page">
      {/* Filter bar */}
      <div className="page-actions">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="案件名・要員名で検索..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">ステータス: すべて</option>
            {MATCHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <FaTable /> テーブル
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'kanban' ? ' active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <FaColumns /> カンバン
          </button>
        </div>
        <button
          className="btn btn-secondary btn-sm task-expand-all-btn"
          onClick={handleToggleAllTasks}
          title={allTasksExpanded ? 'すべてのタスクを折りたたむ' : 'すべてのタスクを展開'}
        >
          {allTasksExpanded ? <><FaChevronRight style={{ fontSize: 10 }} /> 全折りたたみ</> : <><FaChevronDown style={{ fontSize: 10 }} /> 全展開</>}
        </button>
      </div>

      {/* 件数表示 */}
      <div className="count-bar">
        <span className="count-bar-label">
          {filtered.length === enrichedMatchings.length
            ? <>{enrichedMatchings.length}件</>
            : <>{filtered.length}<span className="count-bar-total"> / {enrichedMatchings.length}</span>件</>
          }
        </span>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {MATCHING_STATUSES.map(s => {
          const count = filtered.filter(item => item.matching.status === s).length;
          return (
            <span
              key={s}
              className={`badge ${getMatchingBadgeClass(s)}`}
              style={{ fontSize: 12, padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            >
              {s}: {count}
            </span>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-count">{selectedIds.size}件選択中</span>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}><FaTrash /> 削除</button>
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}><FaTimes /> 解除</button>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="th-check">
                  <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filtered.length} onChange={e => toggleAll(e.target.checked)} />
                </th>
                <th>ステータス</th>
                <th>案件名</th>
                <th>職種</th>
                <th>勤務地</th>
                <th>仕入単価</th>
                <th>要員名</th>
                <th>希望単価</th>
                <th>単価差</th>
                <th>スキル一致</th>
                <th>担当者</th>
                <th>提案日</th>
                <th>面談日</th>
                <th>タスク</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>該当するマッチングがありません</td></tr>
              ) : filtered.map(({ matching: mt, project, member, priceDiff, priceLabel, matchedSkills, skillMatchRate, matchingTasks }) => (
                <React.Fragment key={mt.id}>
                  <tr>
                    <td className="th-check">
                      <input type="checkbox" checked={selectedIds.has(mt.id)} onChange={() => toggleSelect(mt.id)} />
                    </td>
                    <td>
                      <select
                        className="inline-status-select"
                        value={mt.status}
                        onChange={e => onQuickStatusUpdate(mt.id, e.target.value)}
                      >
                        {MATCHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <span
                        style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => project && onShowProject(project.id)}
                      >
                        {truncate(project ? (project.project_name_rewrite || project.project_name_original) : '-', 25)}
                      </span>
                    </td>
                    <td>{truncate(project?.role, 15)}</td>
                    <td>{truncate(project?.location, 10)}</td>
                    <td>{formatStructuredPrice(project?.purchase_price_min, project?.purchase_price_max) || project?.purchase_price || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => member && onShowMember(member.id)}
                      >
                        {member ? (member.full_name || member.initial) : '-'}
                      </span>
                    </td>
                    <td>{formatStructuredPrice(member?.desired_price_min, member?.desired_price_max) || member?.desired_price || '-'}</td>
                    <td>{renderPriceDiff(priceDiff, priceLabel)}</td>
                    <td>{renderSkillMatch(skillMatchRate, matchedSkills)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <select
                        className="inline-status-select"
                        value={mt.primary_assignee || ''}
                        onChange={e => onUpdateMatchingField(mt.id, { primary_assignee: e.target.value })}
                        style={{ minWidth: 80, fontSize: 12 }}
                      >
                        <option value="">未設定</option>
                        {users.map(u => <option key={u.id} value={u.display_name}>{u.display_name}</option>)}
                      </select>
                    </td>
                    <td>
                      {editingDateCell?.id === mt.id && editingDateCell?.field === 'proposed_date' ? (
                        <input
                          type="date"
                          className="inline-date-input"
                          defaultValue={(mt.proposed_date || '').replace(/\//g, '-')}
                          ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
                          onChange={e => { onUpdateMatchingField(mt.id, { proposed_date: e.target.value }); setEditingDateCell(null); }}
                          onBlur={() => setEditingDateCell(null)}
                        />
                      ) : (
                        <span
                          className={`inline-date-badge${mt.proposed_date ? '' : ' empty'}`}
                          onClick={() => setEditingDateCell({ id: mt.id, field: 'proposed_date' })}
                          title="クリックで日付選択"
                        >
                          {mt.proposed_date || <FaRegCalendarAlt style={{ opacity: 0.4, fontSize: 12 }} />}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingDateCell?.id === mt.id && editingDateCell?.field === 'interview_date' ? (
                        <input
                          type="date"
                          className="inline-date-input"
                          defaultValue={(mt.interview_date || '').replace(/\//g, '-')}
                          ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
                          onChange={e => { onUpdateMatchingField(mt.id, { interview_date: e.target.value }); setEditingDateCell(null); }}
                          onBlur={() => setEditingDateCell(null)}
                        />
                      ) : (
                        <span
                          className={`inline-date-badge${mt.interview_date ? '' : ' empty'}`}
                          onClick={() => setEditingDateCell({ id: mt.id, field: 'interview_date' })}
                          title="クリックで日付選択"
                        >
                          {mt.interview_date || <FaRegCalendarAlt style={{ opacity: 0.4, fontSize: 12 }} />}
                        </span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const oc = getOverdueCount(matchingTasks);
                        return (
                          <button
                            className={`task-badge-btn${oc > 0 ? ' has-overdue' : ''}`}
                            onClick={() => toggleTableExpand(mt.id)}
                            title={oc > 0 ? `${oc}件の期限超過タスク` : undefined}
                          >
                            <span className="task-badge-done">{matchingTasks.filter(t => t.progress_status === '完了').length}</span>
                            <span className="task-badge-total">/ {matchingTasks.length}</span>
                            {expandedTable.has(mt.id)
                              ? <FaChevronDown style={{ fontSize: 9, color: 'var(--text-secondary)' }} />
                              : <FaChevronRight style={{ fontSize: 9, color: 'var(--text-secondary)' }} />
                            }
                          </button>
                        );
                      })()}
                    </td>
                    <td style={{ minWidth: 120 }}>
                      {editingMemoId === mt.id ? (
                        <textarea
                          className="inline-memo-box"
                          value={editingMemoText}
                          onChange={e => setEditingMemoText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onUpdateMatchingField(mt.id, { note: editingMemoText });
                              setEditingMemoId(null);
                            }
                            if (e.key === 'Escape') setEditingMemoId(null);
                          }}
                          onBlur={() => { onUpdateMatchingField(mt.id, { note: editingMemoText }); setEditingMemoId(null); }}
                          autoFocus
                          rows={2}
                          placeholder="メモを入力..."
                        />
                      ) : (
                        <div
                          className={`inline-memo-box inline-memo-display${mt.note ? '' : ' empty'}`}
                          onClick={() => { setEditingMemoId(mt.id); setEditingMemoText(mt.note || ''); }}
                        >
                          {mt.note || 'メモ...'}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-secondary" style={{ marginRight: 4 }} onClick={() => onEditMatching(mt)}><FaEdit /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => onDeleteMatching(mt.id)}><FaTrash /></button>
                    </td>
                  </tr>
                  {expandedTable.has(mt.id) && (
                    <tr className="task-expand-row">
                      <td colSpan={16}>
                        <div className="task-expand-content">
                          <div className="task-expand-header">
                            <span>ネクストアクション</span>
                            <span>{matchingTasks.filter(t => t.progress_status === '完了').length}/{matchingTasks.length} 完了</span>
                          </div>
                          <TaskChecklist
                            matchingId={mt.id}
                            status={mt.status}
                            tasks={matchingTasks}
                            onAdd={onAddTask}
                            onUpdate={onUpdateTask}
                            onDelete={onDeleteTask}
                            onBulkAdd={onBulkAddTasks}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="kanban-board">
          {kanbanColumns.map(({ status, items }) => (
            <div
              key={status}
              className={`kanban-column${dragOverStatus === status ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(status); }}
              onDragLeave={e => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setDragOverStatus(null); }}
              onDrop={e => {
                e.preventDefault();
                const matchingId = e.dataTransfer.getData('text/plain');
                if (matchingId) {
                  const current = matchings.find(m => m.id === matchingId);
                  if (current && current.status !== status) {
                    onQuickStatusUpdate(matchingId, status);
                  }
                }
                setDraggedMatchingId(null);
                setDragOverStatus(null);
              }}
            >
              <div className="kanban-column-header">
                <span className={`badge ${getMatchingBadgeClass(status)}`}>{status}</span>
                <span className="kanban-count">{items.length}</span>
              </div>
              <div className="kanban-column-body">
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {dragOverStatus === status ? 'ここにドロップ' : 'なし'}
                  </div>
                ) : items.map(({ matching: mt, project, member, priceDiff, priceLabel, matchedSkills, skillMatchRate, matchingTasks }) => (
                  <div
                    key={mt.id}
                    className={`kanban-card${draggedMatchingId === mt.id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={e => {
                      setDraggedMatchingId(mt.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', mt.id);
                    }}
                    onDragEnd={() => { setDraggedMatchingId(null); setDragOverStatus(null); }}
                  >
                    <div
                      className="kanban-card-project"
                      onClick={() => project && onShowProject(project.id)}
                    >
                      {truncate(project ? (project.project_name_rewrite || project.project_name_original) : '-', 25)}
                    </div>
                    <div
                      className="kanban-card-member"
                      onClick={() => member && onShowMember(member.id)}
                    >
                      {member ? (member.full_name || member.initial) : '-'}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <select
                        className="inline-status-select"
                        value={mt.primary_assignee || ''}
                        onChange={e => onUpdateMatchingField(mt.id, { primary_assignee: e.target.value })}
                        style={{ width: '100%', fontSize: 11 }}
                      >
                        <option value="">担当者: 未設定</option>
                        {users.map(u => <option key={u.id} value={u.display_name}>{u.display_name}</option>)}
                      </select>
                    </div>
                    <div className="kanban-card-meta">
                      <div className="kanban-card-meta-row">
                        <span>仕入: {formatStructuredPrice(project?.purchase_price_min, project?.purchase_price_max) || project?.purchase_price || '-'}</span>
                        <span>希望: {formatStructuredPrice(member?.desired_price_min, member?.desired_price_max) || member?.desired_price || '-'}</span>
                      </div>
                      {priceDiff !== null && (
                        <div className="kanban-card-meta-row">
                          {renderPriceDiff(priceDiff, priceLabel)}
                        </div>
                      )}
                      {mt.proposed_date && <span>提案: {mt.proposed_date}</span>}
                      {mt.interview_date && <span>面談: {mt.interview_date}</span>}
                    </div>
                    {matchedSkills.length > 0 && (
                      <div className="kanban-card-tags">
                        {matchedSkills.slice(0, 4).map((s, i) => (
                          <span key={i} className="skill-tag" style={{ fontSize: 10 }}>{s}</span>
                        ))}
                        {skillMatchRate !== null && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: skillMatchRate >= 70 ? 'var(--success)' : skillMatchRate >= 40 ? 'var(--warning)' : 'var(--danger)',
                          }}>
                            {skillMatchRate}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Task progress header */}
                    {renderTaskProgress(matchingTasks, mt.id, true)}

                    {/* Expanded task checklist */}
                    {expandedKanban.has(mt.id) && (
                      <TaskChecklist
                        matchingId={mt.id}
                        status={mt.status}
                        tasks={matchingTasks}
                        onAdd={onAddTask}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                        onBulkAdd={onBulkAddTasks}
                      />
                    )}

                    <div className="kanban-card-actions">
                      <select
                        className="inline-status-select"
                        value={mt.status}
                        onChange={e => onQuickStatusUpdate(mt.id, e.target.value)}
                        style={{ flex: 1 }}
                      >
                        {MATCHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="btn btn-sm btn-secondary" onClick={() => onEditMatching(mt)}><FaEdit /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => onDeleteMatching(mt.id)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
