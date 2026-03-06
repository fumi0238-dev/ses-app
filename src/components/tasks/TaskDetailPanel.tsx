'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { GeneralTask, GeneralTaskStatus, TaskPriority, TaskComment, TaskTag, TaskSection, GENERAL_TASK_STATUSES, TASK_PRIORITIES, TAG_COLORS, TagColor } from '@/lib/types';
import { formatDate } from '@/lib/helpers';

interface Props {
  task: GeneralTask;
  sections: TaskSection[];
  allTags: TaskTag[];
  onUpdate: (id: string, data: Partial<GeneralTask> & { tag_ids?: string[] }) => Promise<GeneralTask>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onAddSubtask: (data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onUpdateSubtask: (id: string, data: Partial<GeneralTask>) => Promise<GeneralTask>;
  onDeleteSubtask: (id: string) => Promise<void>;
  fetchComments: (taskId: string) => Promise<TaskComment[]>;
  onAddComment: (taskId: string, content: string) => Promise<TaskComment>;
  onDeleteComment: (id: string) => Promise<void>;
  onAddTag: (name: string, color: string) => Promise<TaskTag>;
}

export default function TaskDetailPanel({
  task, sections, allTags, onUpdate, onDelete, onClose,
  onAddSubtask, onUpdateSubtask, onDeleteSubtask,
  fetchComments, onAddComment, onDeleteComment, onAddTag,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('gray');
  const tagRef = useRef<HTMLDivElement>(null);
  const [prevTaskId, setPrevTaskId] = useState(task.id);

  // Sync local state when task changes
  if (prevTaskId !== task.id) {
    setPrevTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
  }

  useEffect(() => {
    fetchComments(task.id).then(setComments).catch(console.error);
  }, [task.id, fetchComments]);

  // Close tag picker on outside click
  useEffect(() => {
    if (!showTagPicker) return;
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setShowTagPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTagPicker]);

  const saveTitle = () => { if (title !== task.title) onUpdate(task.id, { title }); };
  const saveDesc = () => { if (description !== task.description) onUpdate(task.id, { description }); };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const c = await onAddComment(task.id, newComment.trim());
    setComments(prev => [...prev, c]);
    setNewComment('');
  };

  const handleDeleteComment = async (id: string) => {
    await onDeleteComment(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await onAddSubtask({ title: newSubtask.trim(), parent_id: task.id, section_id: task.section_id });
    setNewSubtask('');
  };

  const toggleTag = (tagId: string) => {
    const currentIds = task.tags.map(t => t.id);
    const newIds = currentIds.includes(tagId) ? currentIds.filter(id => id !== tagId) : [...currentIds, tagId];
    onUpdate(task.id, { tag_ids: newIds });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tag = await onAddTag(newTagName.trim(), newTagColor);
    onUpdate(task.id, { tag_ids: [...task.tags.map(t => t.id), tag.id] });
    setNewTagName('');
    setNewTagColor('gray');
  };

  const subtasks = task.children || [];

  return (
    <>
      <div className="task-detail-backdrop" onClick={onClose} />
      <div className="task-detail-overlay">
        <div className="task-detail-header">
          <h3>タスク詳細</h3>
          <button className="btn-icon" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="task-detail-body">
          {/* Title */}
          <input
            className="td-title-input"
            style={{ width: '100%', marginBottom: 16 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            placeholder="タスク名"
          />

          {/* Complete toggle */}
          <div className="td-field">
            <span className="td-field-label">ステータス</span>
            <div className="td-field-value">
              <select value={task.status} onChange={e => onUpdate(task.id, { status: e.target.value as GeneralTaskStatus })}>
                {GENERAL_TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="td-field">
            <span className="td-field-label">担当者</span>
            <div className="td-field-value">
              <input
                value={task.assignee}
                onChange={e => onUpdate(task.id, { assignee: e.target.value })}
                placeholder="担当者名"
              />
            </div>
          </div>

          {/* Due date */}
          <div className="td-field">
            <span className="td-field-label">期日</span>
            <div className="td-field-value">
              <input
                type="date"
                value={task.due_date}
                onChange={e => onUpdate(task.id, { due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="td-field">
            <span className="td-field-label">優先度</span>
            <div className="td-field-value">
              <select value={task.priority} onChange={e => onUpdate(task.id, { priority: e.target.value as TaskPriority })}>
                {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Section */}
          <div className="td-field">
            <span className="td-field-label">セクション</span>
            <div className="td-field-value">
              <select
                value={task.section_id ?? ''}
                onChange={e => onUpdate(task.id, { section_id: e.target.value || null })}
              >
                <option value="">なし</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="td-field">
            <span className="td-field-label">タグ</span>
            <div className="td-field-value">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {task.tags.map(tag => (
                  <span key={tag.id} className={`gtask-tag gtask-tag-${tag.color}`}>
                    {tag.name}
                    <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => toggleTag(tag.id)}>&times;</span>
                  </span>
                ))}
                <div className="tag-picker" ref={tagRef}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowTagPicker(!showTagPicker)}
                  >
                    <FaPlus style={{ fontSize: 9 }} /> タグ
                  </button>
                  {showTagPicker && (
                    <div className="tag-picker-dropdown">
                      {allTags.map(tag => (
                        <div key={tag.id} className="tag-picker-item" onClick={() => toggleTag(tag.id)}>
                          <input type="checkbox" readOnly checked={task.tags.some(t => t.id === tag.id)} />
                          <span className={`gtask-tag gtask-tag-${tag.color}`}>{tag.name}</span>
                        </div>
                      ))}
                      <div className="tag-picker-new">
                        <input
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          placeholder="新規タグ"
                          onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                        />
                        <select value={newTagColor} onChange={e => setNewTagColor(e.target.value as TagColor)}>
                          {TAG_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button className="btn btn-sm btn-primary" onClick={handleCreateTag}>追加</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="td-section-label">説明</div>
          <textarea
            rows={3}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveDesc}
            placeholder="メモや詳細を入力..."
          />

          {/* Subtasks */}
          <div className="td-section-label">サブタスク ({subtasks.filter(s => s.status === '完了').length}/{subtasks.length})</div>
          <div className="td-subtask-list">
            {subtasks.map(sub => (
              <div key={sub.id} className={`td-subtask-item${sub.status === '完了' ? ' done' : ''}`}>
                <div
                  className={`gtask-checkbox${sub.status === '完了' ? ' checked' : ''}`}
                  onClick={() => onUpdateSubtask(sub.id, { status: sub.status === '完了' ? '未着手' : '完了' })}
                >
                  {sub.status === '完了' && <FaCheck />}
                </div>
                <span className="td-subtask-text">{sub.title}</span>
                <button className="td-subtask-del" onClick={() => onDeleteSubtask(sub.id)}><FaTimes /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                placeholder="サブタスクを追加..."
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
              />
              <button className="btn btn-sm btn-secondary" onClick={handleAddSubtask}><FaPlus /></button>
            </div>
          </div>

          {/* Comments */}
          <div className="td-section-label">コメント ({comments.length})</div>
          <div className="td-comment-list">
            {comments.map(c => (
              <div key={c.id} className="td-comment-item">
                <div className="td-comment-header">
                  <span className="td-comment-author">{c.user_name || '不明'}</span>
                  <span className="td-comment-time">{formatDate(new Date(Number(c.created_at)))}</span>
                  <button className="td-subtask-del td-comment-del" onClick={() => handleDeleteComment(c.id)}><FaTimes /></button>
                </div>
                <div className="td-comment-content">{c.content}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="コメントを追加..."
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddComment}>送信</button>
            </div>
          </div>
        </div>

        <div className="task-detail-footer">
          <button className="btn btn-sm btn-danger" onClick={() => { if (confirm('このタスクを削除しますか？')) { onDelete(task.id); onClose(); } }}>
            <FaTrash style={{ marginRight: 4 }} /> 削除
          </button>
        </div>
      </div>
    </>
  );
}
