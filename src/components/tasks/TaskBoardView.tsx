'use client';

import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { GeneralTask, GENERAL_TASK_STATUSES } from '@/lib/types';
import { getTaskDueStatus } from '@/lib/helpers';

interface Props {
  tasks: GeneralTask[];
  onSelectTask: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAddTask: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
}

function getDueBadge(dueDate: string) {
  if (!dueDate) return null;
  const status = getTaskDueStatus(dueDate);
  const classMap: Record<string, string> = {
    'task-overdue': 'overdue', 'task-due-today': 'today',
    'task-due-soon': 'soon', 'task-due-normal': 'normal',
  };
  return <span className={`gtask-due ${classMap[status.className] || 'normal'}`}>{status.label}</span>;
}

export default function TaskBoardView({ tasks, onSelectTask, onUpdateStatus, onAddTask }: Props) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const rootTasks = tasks.filter(t => !t.parent_id);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragTaskId) onUpdateStatus(dragTaskId, status);
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const handleAdd = async (status: string) => {
    if (!newTitle.trim()) return;
    await onAddTask({ title: newTitle.trim(), status });
    setNewTitle('');
    setAddingCol(null);
  };

  return (
    <div className="gtask-board">
      {GENERAL_TASK_STATUSES.map(status => {
        const colTasks = rootTasks.filter(t => t.status === status);
        return (
          <div
            key={status}
            className={`gtask-board-col${dragOverCol === status ? ' drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, status)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, status)}
          >
            <div className="gtask-board-col-header">
              <span>{status}</span>
              <span className="gtask-board-col-count">{colTasks.length}</span>
            </div>

            {colTasks.map(task => (
              <div
                key={task.id}
                className={`gtask-board-card${dragTaskId === task.id ? ' dragging' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, task.id)}
                onClick={() => onSelectTask(task.id)}
              >
                <div className="gtask-board-card-title">{task.title || '(無題)'}</div>
                <div className="gtask-board-card-meta">
                  {task.priority !== 'なし' && (
                    <span className={`priority-badge p-${task.priority === '高' ? 'high' : task.priority === '中' ? 'medium' : 'low'}`}>
                      {task.priority}
                    </span>
                  )}
                  {task.tags.map(tag => (
                    <span key={tag.id} className={`gtask-tag gtask-tag-${tag.color}`}>{tag.name}</span>
                  ))}
                  {task.assignee && <span className="gtask-assignee">{task.assignee}</span>}
                  {getDueBadge(task.due_date)}
                  {(task.children?.length ?? 0) > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {task.children!.filter(c => c.status === '完了').length}/{task.children!.length}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Add task inline */}
            {addingCol === status ? (
              <div style={{ padding: '6px 0' }}>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(status); if (e.key === 'Escape') { setAddingCol(null); setNewTitle(''); } }}
                  onBlur={() => { if (!newTitle.trim()) { setAddingCol(null); setNewTitle(''); } }}
                  placeholder="タスク名を入力"
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="gtask-add-row" onClick={() => { setAddingCol(status); setNewTitle(''); }}>
                <FaPlus style={{ fontSize: 11 }} />
                <span>タスクを追加</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
