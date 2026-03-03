'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FaSearch, FaList, FaThLarge } from 'react-icons/fa';
import { useStore } from '@/lib/store';
import { GeneralTask, GENERAL_TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';
import TaskListView from './TaskListView';
import TaskBoardView from './TaskBoardView';
import TaskDetailPanel from './TaskDetailPanel';

type ViewMode = 'list' | 'board';

export default function TasksPage() {
  const store = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Collect all unique assignees for filter
  const assignees = useMemo(() => {
    const set = new Set<string>();
    store.generalTasks.forEach(t => { if (t.assignee) set.add(t.assignee); });
    return Array.from(set).sort();
  }, [store.generalTasks]);

  // Filter tasks (root level only; children are nested)
  const filteredTasks = useMemo(() => {
    return store.generalTasks.filter(t => {
      if (t.parent_id) return true; // Keep subtasks (they render with parent)
      const q = searchText.toLowerCase();
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      return true;
    });
  }, [store.generalTasks, searchText, filterStatus, filterPriority, filterAssignee]);

  // Find selected task (may be root or child)
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    const root = store.generalTasks.find(t => t.id === selectedTaskId);
    if (root) return root;
    // Check children
    for (const t of store.generalTasks) {
      const child = t.children?.find(c => c.id === selectedTaskId);
      if (child) return child;
    }
    return null;
  }, [selectedTaskId, store.generalTasks]);

  // For detail panel: find the root task with its children
  const selectedRootTask = useMemo(() => {
    if (!selectedTask) return null;
    if (!selectedTask.parent_id) {
      // It's a root task: enrich with children from store
      const children = store.generalTasks
        .filter(t => t.parent_id === selectedTask.id)
        .concat(selectedTask.children?.filter(c => !store.generalTasks.some(t => t.id === c.id)) || []);
      return { ...selectedTask, children };
    }
    // It's a subtask: find and return the parent
    const parent = store.generalTasks.find(t => t.id === selectedTask.parent_id);
    return parent ?? selectedTask;
  }, [selectedTask, store.generalTasks]);

  const handleToggleComplete = useCallback((id: string, currentStatus: string) => {
    store.updateGeneralTask(id, { status: currentStatus === '完了' ? '未着手' : '完了' });
  }, [store]);

  const handleUpdateStatus = useCallback((id: string, status: string) => {
    store.updateGeneralTask(id, { status });
  }, [store]);

  const handleAddTask = useCallback(async (data: Partial<GeneralTask>) => {
    return store.addGeneralTask(data);
  }, [store]);

  const totalTasks = store.generalTasks.filter(t => !t.parent_id).length;
  const completedTasks = store.generalTasks.filter(t => !t.parent_id && t.status === '完了').length;

  return (
    <div className="tasks-page">
      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="search-box" style={{ flex: '0 1 280px' }}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="タスクを検索..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <div className="tasks-filter-pills">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全ステータス</option>
            {GENERAL_TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">全優先度</option>
            {TASK_PRIORITIES.filter(p => p !== 'なし').map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {assignees.length > 0 && (
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="">全担当者</option>
              {assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {completedTasks}/{totalTasks} 完了
          </span>
          <div className="tasks-view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              <FaList style={{ marginRight: 4 }} /> リスト
            </button>
            <button className={viewMode === 'board' ? 'active' : ''} onClick={() => setViewMode('board')}>
              <FaThLarge style={{ marginRight: 4 }} /> ボード
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TaskListView
            tasks={filteredTasks}
            sections={store.taskSections}
            allAssignees={assignees}
            onSelectTask={setSelectedTaskId}
            selectedTaskId={selectedTaskId}
            onToggleComplete={handleToggleComplete}
            onAddTask={handleAddTask}
            onUpdateTask={store.updateGeneralTask}
            onDeleteTask={store.deleteGeneralTask}
            onUpdateSection={(id, data) => store.updateTaskSection(id, data)}
            onDeleteSection={id => store.deleteTaskSection(id)}
            onAddSection={name => store.addTaskSection(name)}
          />
        </div>
      ) : (
        <TaskBoardView
          tasks={filteredTasks}
          onSelectTask={setSelectedTaskId}
          onUpdateStatus={handleUpdateStatus}
          onAddTask={handleAddTask}
        />
      )}

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="gtask-empty">
          <p style={{ fontSize: 16, marginBottom: 8 }}>まだタスクがありません</p>
          <p>「+ タスクを追加」をクリックして最初のタスクを作成しましょう</p>
        </div>
      )}

      {/* Side Panel */}
      {selectedRootTask && (
        <TaskDetailPanel
          task={selectedRootTask}
          sections={store.taskSections}
          allTags={store.taskTags}
          onUpdate={store.updateGeneralTask}
          onDelete={store.deleteGeneralTask}
          onClose={() => setSelectedTaskId(null)}
          onAddSubtask={store.addGeneralTask}
          onUpdateSubtask={store.updateGeneralTask}
          onDeleteSubtask={store.deleteGeneralTask}
          fetchComments={store.fetchTaskComments}
          onAddComment={store.addTaskComment}
          onDeleteComment={store.deleteTaskComment}
          onAddTag={store.addTaskTag}
        />
      )}
    </div>
  );
}
