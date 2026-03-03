'use client';

import React, { useState } from 'react';
import { FaCheck, FaPlus, FaChevronDown, FaChevronRight, FaPen, FaTrash, FaRegCalendarAlt } from 'react-icons/fa';
import { GeneralTask, TaskSection, GENERAL_TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';
import { getTaskDueStatus } from '@/lib/helpers';

interface Props {
  tasks: GeneralTask[];
  sections: TaskSection[];
  allAssignees: string[];
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  onToggleComplete: (id: string, currentStatus: string) => void;
  onAddTask: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onUpdateTask: (id: string, data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateSection: (id: string, data: Partial<TaskSection>) => void;
  onDeleteSection: (id: string) => void;
  onAddSection: (name: string) => void;
}


function getPriorityCheckClass(priority: string) {
  if (priority === '高') return ' priority-high';
  if (priority === '中') return ' priority-medium';
  if (priority === '低') return ' priority-low';
  return '';
}

function SubtaskRow({ sub, depth, onToggle, onSelectParent, onUpdate, onDelete, onAddChild, allAssignees }: {
  sub: GeneralTask;
  depth: number; // 1=subtask, 2=grandchild
  onToggle: () => void;
  onSelectParent: () => void;
  onUpdate: (id: string, data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onDelete: (id: string) => Promise<void>;
  onAddChild: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
  allAssignees: string[];
}) {
  const isComplete = sub.status === '完了';
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(sub.title);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingDue, setEditingDue] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(sub.description);
  const [expanded, setExpanded] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState('');
  const dueStatus = sub.due_date ? getTaskDueStatus(sub.due_date) : { label: '', className: '' };

  const canHaveChildren = depth < 2; // サブタスク(depth=1)のみ孫タスク追加可能
  const children = sub.children || [];
  const hasChildren = children.length > 0;
  const doneChildren = children.filter(c => c.status === '完了').length;
  const depthClass = depth === 1 ? 'subtask' : 'grandchild';

  const saveTitle = () => {
    if (titleVal.trim() && titleVal !== sub.title) onUpdate(sub.id, { title: titleVal.trim() });
    setEditingTitle(false);
  };

  const handleAddChild = async () => {
    if (!newChildTitle.trim()) return;
    await onAddChild({ title: newChildTitle.trim(), parent_id: sub.id, section_id: sub.section_id });
    setNewChildTitle('');
    setAddingChild(false);
  };

  return (
    <>
      <div className={`gtask-row ${depthClass}${isComplete ? ' completed' : ''}`}>
        {/* Expand toggle — only for subtasks that can have children */}
        {canHaveChildren ? (
          <div
            className="gtask-row-expand"
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ visibility: (hasChildren || expanded) ? 'visible' : 'hidden' }}
          >
            {expanded ? <FaChevronDown style={{ fontSize: 10 }} /> : <FaChevronRight style={{ fontSize: 10 }} />}
          </div>
        ) : (
          <div className="gtask-row-expand" style={{ visibility: 'hidden' }} />
        )}
        <div
          className={`gtask-checkbox${isComplete ? ' checked' : ''}`}
          onClick={e => { e.stopPropagation(); onToggle(); }}
        >
          {isComplete && <FaCheck style={{ fontSize: 10 }} />}
        </div>
        <div className="gtask-col-title" onClick={onSelectParent}>
          {editingTitle ? (
            <input
              className="gtask-inline-edit"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="gtask-title" onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); setTitleVal(sub.title); }}>
              {sub.title || '(無題)'}
            </span>
          )}
          {hasChildren && (
            <span className="gtask-subtask-count">{doneChildren}/{children.length}</span>
          )}
        </div>

        {/* Add child button — only for subtasks */}
        <div className="gtask-col-addsub" onClick={e => e.stopPropagation()}>
          {canHaveChildren && (
            <button
              className="gtask-action-btn"
              onClick={() => { setExpanded(true); setAddingChild(true); }}
              title="孫タスクを追加"
            >
              <FaPlus />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="gtask-col-status" onClick={e => e.stopPropagation()}>
          <select
            className={`task-progress-select ${sub.status === '未着手' ? 'status-todo' : sub.status === '対応中' ? 'status-doing' : sub.status === '待ち' ? 'status-waiting' : 'status-done'}`}
            value={sub.status}
            onChange={e => onUpdate(sub.id, { status: e.target.value })}
          >
            {GENERAL_TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Assignee */}
        <div className="gtask-col-assignee" onClick={e => e.stopPropagation()}>
          {editingAssignee ? (
            <select
              className="task-assignee-input"
              value={sub.assignee}
              onChange={e => { onUpdate(sub.id, { assignee: e.target.value }); setEditingAssignee(false); }}
              onBlur={() => setEditingAssignee(false)}
              autoFocus
            >
              <option value="">-</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          ) : (
            <span
              className={`task-assignee-badge${sub.assignee ? ' has-assignee' : ''}`}
              onClick={() => setEditingAssignee(true)}
              title="担当者を設定"
            >
              {sub.assignee || '担当者'}
            </span>
          )}
        </div>

        {/* Due date */}
        <div className="gtask-col-due" onClick={e => e.stopPropagation()}>
          {editingDue ? (
            <input
              type="date"
              className="task-due-input"
              defaultValue={sub.due_date || ''}
              ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
              onChange={e => { onUpdate(sub.id, { due_date: e.target.value }); setEditingDue(false); }}
              onBlur={() => setEditingDue(false)}
            />
          ) : (
            <span
              className={`task-due-badge ${dueStatus.className}`}
              onClick={() => setEditingDue(true)}
              title={sub.due_date ? `期日: ${sub.due_date}` : '期日を設定'}
            >
              {dueStatus.label ? dueStatus.label : <FaRegCalendarAlt className="task-due-icon" />}
            </span>
          )}
        </div>

        {/* Priority */}
        <div className="gtask-col-priority" onClick={e => e.stopPropagation()}>
          <select
            className={`task-progress-select ${sub.priority === '高' ? 'priority-high' : sub.priority === '中' ? 'priority-medium' : sub.priority === '低' ? 'priority-low' : 'priority-none'}`}
            value={sub.priority}
            onChange={e => onUpdate(sub.id, { priority: e.target.value })}
          >
            {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="gtask-col-desc" onClick={e => e.stopPropagation()}>
          {editingDesc ? (
            <textarea
              className="task-note-box"
              value={descVal}
              onChange={e => setDescVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (descVal !== sub.description) onUpdate(sub.id, { description: descVal }); setEditingDesc(false); }
                if (e.key === 'Escape') { setDescVal(sub.description); setEditingDesc(false); }
              }}
              onBlur={() => { if (descVal !== sub.description) onUpdate(sub.id, { description: descVal }); setEditingDesc(false); }}
              placeholder="メモを入力..."
              rows={2}
              autoFocus
            />
          ) : (
            <div
              className={`task-note-box task-note-display${sub.description ? '' : ' empty'}`}
              onClick={() => { setDescVal(sub.description); setEditingDesc(true); }}
            >
              {sub.description || 'メモを入力...'}
            </div>
          )}
        </div>

        <div className="gtask-col-actions">
          <button
            className="btn btn-sm btn-danger"
            onClick={e => { e.stopPropagation(); if (confirm('このタスクを削除しますか？')) onDelete(sub.id); }}
            title="削除"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Expanded grandchildren */}
      {canHaveChildren && expanded && (
        <>
          {children.map(gc => (
            <SubtaskRow
              key={gc.id}
              sub={gc}
              depth={depth + 1}
              onToggle={() => onUpdate(gc.id, { status: gc.status === '完了' ? '未着手' : '完了' })}
              onSelectParent={onSelectParent}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              allAssignees={allAssignees}
            />
          ))}
          {addingChild ? (
            <div className={`gtask-row ${depth === 1 ? 'grandchild' : 'subtask'}`}>
              <div className="gtask-row-expand" style={{ visibility: 'hidden' }} />
              <FaPlus style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }} />
              <div className="gtask-col-title" style={{ flex: 1 }}>
                <input
                  className="gtask-inline-edit"
                  value={newChildTitle}
                  onChange={e => setNewChildTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddChild(); if (e.key === 'Escape') { setAddingChild(false); setNewChildTitle(''); } }}
                  onBlur={() => { if (!newChildTitle.trim()) { setAddingChild(false); setNewChildTitle(''); } }}
                  placeholder="孫タスクを入力してEnter"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className={`gtask-row ${depth === 1 ? 'grandchild' : 'subtask'} gtask-add-sub`} onClick={() => setAddingChild(true)}>
              <div className="gtask-row-expand" style={{ visibility: 'hidden' }} />
              <FaPlus style={{ fontSize: 11 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>孫タスクを追加</span>
            </div>
          )}
        </>
      )}
    </>
  );
}

function TaskRow({ task, onSelect, selected, onToggle, onUpdate, onDelete, onAddSubtask, allAssignees }: {
  task: GeneralTask; onSelect: () => void; selected: boolean;
  onToggle: () => void;
  onUpdate: (id: string, data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
  allAssignees: string[];
}) {
  const isComplete = task.status === '完了';
  const subtasks = task.children || [];
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(task.description);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingDue, setEditingDue] = useState(false);
  const dueStatus = task.due_date ? getTaskDueStatus(task.due_date) : { label: '', className: '' };

  const saveTitle = () => {
    if (titleVal.trim() && titleVal !== task.title) onUpdate(task.id, { title: titleVal.trim() });
    setEditingTitle(false);
  };

  const handleAddSub = async () => {
    if (!newSubTitle.trim()) return;
    await onAddSubtask({ title: newSubTitle.trim(), parent_id: task.id, section_id: task.section_id });
    setNewSubTitle('');
    setAddingSubtask(false);
  };

  const hasChildren = subtasks.length > 0;
  const doneChildren = subtasks.filter(s => s.status === '完了').length;

  return (
    <>
      <div className={`gtask-row${isComplete ? ' completed' : ''}${selected ? ' selected' : ''}`}>
        {/* Expand toggle */}
        <div
          className="gtask-row-expand"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{ visibility: (hasChildren || expanded) ? 'visible' : 'hidden' }}
        >
          {expanded ? <FaChevronDown style={{ fontSize: 10 }} /> : <FaChevronRight style={{ fontSize: 10 }} />}
        </div>

        {/* Checkbox */}
        <div
          className={`gtask-checkbox${isComplete ? ' checked' : ''}${getPriorityCheckClass(task.priority)}`}
          onClick={e => { e.stopPropagation(); onToggle(); }}
        >
          {isComplete && <FaCheck style={{ fontSize: 10 }} />}
        </div>

        {/* Title + tags + subtask count */}
        <div className="gtask-col-title" onClick={onSelect}>
          {editingTitle ? (
            <input
              className="gtask-inline-edit"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="gtask-title" onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); setTitleVal(task.title); }}>
              {task.title || '(無題)'}
            </span>
          )}
          {task.tags.map(tag => (
            <span key={tag.id} className={`gtask-tag gtask-tag-${tag.color}`}>{tag.name}</span>
          ))}
          {hasChildren && (
            <span className="gtask-subtask-count">{doneChildren}/{subtasks.length}</span>
          )}
        </div>

        {/* Add subtask button — before status */}
        <div className="gtask-col-addsub" onClick={e => e.stopPropagation()}>
          <button
            className="gtask-action-btn"
            onClick={() => { setExpanded(true); setAddingSubtask(true); }}
            title="サブタスクを追加"
          >
            <FaPlus />
          </button>
        </div>

        {/* Status — reuse task-progress-select from Progress.tsx */}
        <div className="gtask-col-status" onClick={e => e.stopPropagation()}>
          <select
            className={`task-progress-select ${task.status === '未着手' ? 'status-todo' : task.status === '対応中' ? 'status-doing' : task.status === '待ち' ? 'status-waiting' : 'status-done'}`}
            value={task.status}
            onChange={e => onUpdate(task.id, { status: e.target.value })}
          >
            {GENERAL_TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Assignee — reuse task-assignee-badge from Progress.tsx */}
        <div className="gtask-col-assignee" onClick={e => e.stopPropagation()}>
          {editingAssignee ? (
            <select
              className="task-assignee-input"
              value={task.assignee}
              onChange={e => { onUpdate(task.id, { assignee: e.target.value }); setEditingAssignee(false); }}
              onBlur={() => setEditingAssignee(false)}
              autoFocus
            >
              <option value="">-</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          ) : (
            <span
              className={`task-assignee-badge${task.assignee ? ' has-assignee' : ''}`}
              onClick={() => setEditingAssignee(true)}
              title="担当者を設定"
            >
              {task.assignee || '担当者'}
            </span>
          )}
        </div>

        {/* Due date — reuse task-due-badge from Progress.tsx */}
        <div className="gtask-col-due" onClick={e => e.stopPropagation()}>
          {editingDue ? (
            <input
              type="date"
              className="task-due-input"
              defaultValue={task.due_date || ''}
              ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
              onChange={e => { onUpdate(task.id, { due_date: e.target.value }); setEditingDue(false); }}
              onBlur={() => setEditingDue(false)}
            />
          ) : (
            <span
              className={`task-due-badge ${dueStatus.className}`}
              onClick={() => setEditingDue(true)}
              title={task.due_date ? `期日: ${task.due_date}` : '期日を設定'}
            >
              {dueStatus.label ? dueStatus.label : <FaRegCalendarAlt className="task-due-icon" />}
            </span>
          )}
        </div>

        {/* Priority — reuse task-progress-select style */}
        <div className="gtask-col-priority" onClick={e => e.stopPropagation()}>
          <select
            className={`task-progress-select ${task.priority === '高' ? 'priority-high' : task.priority === '中' ? 'priority-medium' : task.priority === '低' ? 'priority-low' : 'priority-none'}`}
            value={task.priority}
            onChange={e => onUpdate(task.id, { priority: e.target.value })}
          >
            {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Description — reuse task-note-box from Progress.tsx */}
        <div className="gtask-col-desc" onClick={e => e.stopPropagation()}>
          {editingDesc ? (
            <textarea
              className="task-note-box"
              value={descVal}
              onChange={e => setDescVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (descVal !== task.description) onUpdate(task.id, { description: descVal }); setEditingDesc(false); }
                if (e.key === 'Escape') { setDescVal(task.description); setEditingDesc(false); }
              }}
              onBlur={() => { if (descVal !== task.description) onUpdate(task.id, { description: descVal }); setEditingDesc(false); }}
              placeholder="メモを入力..."
              rows={2}
              autoFocus
            />
          ) : (
            <div
              className={`task-note-box task-note-display${task.description ? '' : ' empty'}`}
              onClick={() => { setDescVal(task.description); setEditingDesc(true); }}
            >
              {task.description || 'メモを入力...'}
            </div>
          )}
        </div>

        {/* Actions — delete only (add subtask moved before status) */}
        <div className="gtask-col-actions" onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { if (confirm('このタスクを削除しますか？')) onDelete(task.id); }}
            title="削除"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Expanded subtasks */}
      {expanded && (
        <>
          {subtasks.map(sub => (
            <SubtaskRow
              key={sub.id}
              sub={sub}
              depth={1}
              onToggle={() => onUpdate(sub.id, { status: sub.status === '完了' ? '未着手' : '完了' })}
              onSelectParent={onSelect}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddSubtask}
              allAssignees={allAssignees}
            />
          ))}

          {/* Inline add subtask */}
          {addingSubtask ? (
            <div className="gtask-row subtask">
              <div className="gtask-row-expand" style={{ visibility: 'hidden' }} />
              <FaPlus style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }} />
              <div className="gtask-col-title" style={{ flex: 1 }}>
                <input
                  className="gtask-inline-edit"
                  value={newSubTitle}
                  onChange={e => setNewSubTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') { setAddingSubtask(false); setNewSubTitle(''); } }}
                  onBlur={() => { if (!newSubTitle.trim()) { setAddingSubtask(false); setNewSubTitle(''); } }}
                  placeholder="サブタスクを入力してEnter"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="gtask-row subtask gtask-add-sub" onClick={() => setAddingSubtask(true)}>
              <div className="gtask-row-expand" style={{ visibility: 'hidden' }} />
              <FaPlus style={{ fontSize: 11 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>サブタスクを追加</span>
            </div>
          )}
        </>
      )}
    </>
  );
}

function SectionGroup({ section, tasks, onSelectTask, selectedTaskId, onToggleComplete, onAddTask, onUpdateTask, onDeleteTask, onUpdateSection, onDeleteSection, allAssignees }: {
  section: TaskSection | null;
  tasks: GeneralTask[];
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  onToggleComplete: (id: string, currentStatus: string) => void;
  onAddTask: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onUpdateTask: (id: string, data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateSection: (id: string, data: Partial<TaskSection>) => void;
  onDeleteSection: (id: string) => void;
  allAssignees: string[];
}) {
  const [collapsed, setCollapsed] = useState(section?.collapsed ?? false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(section?.name ?? '');
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const rootTasks = tasks.filter(t => !t.parent_id);

  const handleSaveName = () => {
    if (section && editName.trim()) {
      onUpdateSection(section.id, { name: editName.trim() });
    }
    setEditing(false);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), -1);
    await onAddTask({ title: newTaskTitle.trim(), section_id: section?.id ?? null, sort_order: maxOrder + 1 });
    setNewTaskTitle('');
    setAddingTask(false);
  };

  return (
    <div>
      {section && (
        <div className="task-section-header" onClick={() => { setCollapsed(!collapsed); onUpdateSection(section.id, { collapsed: !collapsed }); }}>
          <FaChevronDown className={`chevron${collapsed ? ' collapsed' : ''}`} />
          {editing ? (
            <input
              className="section-name-input"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span>{section.name}</span>
          )}
          <span className="task-section-count">{rootTasks.length}</span>
          <div className="task-section-actions">
            <button onClick={e => { e.stopPropagation(); setEditing(true); setEditName(section.name); }} title="名前を編集"><FaPen /></button>
            <button onClick={e => { e.stopPropagation(); if (confirm(`「${section.name}」セクションを削除しますか？\nタスクは削除されません。`)) onDeleteSection(section.id); }} title="削除"><FaTrash /></button>
          </div>
        </div>
      )}

      {!collapsed && (
        <>
          {/* Column header (only for first section or unsectioned) */}
          {rootTasks.length > 0 && (
            <div className="gtask-col-header-row">
              <div className="gtask-row-expand" />
              <div className="gtask-checkbox" style={{ visibility: 'hidden' }} />
              <div className="gtask-col-title"><span>タスク名</span></div>
              <div className="gtask-col-addsub" />
              <div className="gtask-col-status"><span>ステータス</span></div>
              <div className="gtask-col-assignee"><span>担当者</span></div>
              <div className="gtask-col-due"><span>期日</span></div>
              <div className="gtask-col-priority"><span>優先度</span></div>
              <div className="gtask-col-desc"><span>説明</span></div>
              <div className="gtask-col-actions" />
            </div>
          )}

          {rootTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={() => onSelectTask(task.id)}
              selected={selectedTaskId === task.id}
              onToggle={() => onToggleComplete(task.id, task.status)}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onAddSubtask={onAddTask}
              allAssignees={allAssignees}
            />
          ))}

          {/* Inline add */}
          {addingTask ? (
            <div className="gtask-add-row">
              <FaPlus style={{ fontSize: 11, flexShrink: 0 }} />
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); } }}
                onBlur={() => { if (!newTaskTitle.trim()) setAddingTask(false); }}
                placeholder="タスク名を入力してEnter"
                autoFocus
              />
            </div>
          ) : (
            <div className="gtask-add-row" onClick={() => setAddingTask(true)}>
              <FaPlus style={{ fontSize: 11 }} />
              <span>タスクを追加</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TaskListView({
  tasks, sections, allAssignees, onSelectTask, selectedTaskId, onToggleComplete, onAddTask, onUpdateTask, onDeleteTask, onUpdateSection, onDeleteSection, onAddSection,
}: Props) {
  // Group tasks: unsectioned first, then by section
  const unsectioned = tasks.filter(t => !t.section_id && !t.parent_id);
  const sectionIds = sections.map(s => s.id);

  return (
    <div>
      {/* Unsectioned tasks */}
      {(unsectioned.length > 0 || sections.length === 0) && (
        <SectionGroup
          section={null}
          tasks={unsectioned}
          onSelectTask={onSelectTask}
          selectedTaskId={selectedTaskId}
          onToggleComplete={onToggleComplete}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          allAssignees={allAssignees}
        />
      )}

      {/* Sectioned tasks */}
      {sections.map(sec => {
        const sectionTasks = tasks.filter(t => t.section_id === sec.id && !t.parent_id);
        // Include children within section tasks
        const tasksWithChildren = sectionTasks.map(t => ({
          ...t,
          children: tasks.filter(c => c.parent_id === t.id).map(c => ({
            ...c,
            children: tasks.filter(gc => gc.parent_id === c.id),
          })),
        }));
        return (
          <SectionGroup
            key={sec.id}
            section={sec}
            tasks={tasksWithChildren}
            onSelectTask={onSelectTask}
            selectedTaskId={selectedTaskId}
            onToggleComplete={onToggleComplete}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            allAssignees={allAssignees}
          />
        );
      })}

      {/* Orphan tasks in unknown sections */}
      {tasks.filter(t => t.section_id && !sectionIds.includes(t.section_id) && !t.parent_id).length > 0 && (
        <SectionGroup
          section={null}
          tasks={tasks.filter(t => t.section_id && !sectionIds.includes(t.section_id) && !t.parent_id)}
          onSelectTask={onSelectTask}
          selectedTaskId={selectedTaskId}
          onToggleComplete={onToggleComplete}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          allAssignees={allAssignees}
        />
      )}

      <button className="add-section-btn" onClick={() => {
        const name = prompt('セクション名を入力してください');
        if (name?.trim()) onAddSection(name.trim());
      }}>
        <FaPlus /> セクションを追加
      </button>
    </div>
  );
}
