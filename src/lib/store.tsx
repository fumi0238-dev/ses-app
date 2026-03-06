'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, Member, Matching, ActivityLog, Note, Task, GeneralTask, TaskSection, TaskTag, TaskComment, User } from './types';
import { getCurrentTimestamp } from './helpers';
import { useAuth } from './auth-context';

interface StoreContextType {
  loading: boolean;
  users: User[];
  projects: Project[];
  members: Member[];
  matchings: Matching[];
  activityLogs: ActivityLog[];
  notes: Note[];
  tasks: Task[];

  addProject: (data: Omit<Project, 'id'>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  bulkUpdateProjects: (ids: string[], updates: Partial<Project>) => Promise<void>;
  bulkDeleteProjects: (ids: string[]) => Promise<void>;

  addMember: (data: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  bulkDeleteMembers: (ids: string[]) => Promise<void>;

  addMatching: (data: Omit<Matching, 'id'>) => Promise<Matching>;
  updateMatching: (id: string, data: Partial<Matching>) => Promise<void>;
  deleteMatching: (id: string) => Promise<void>;
  bulkDeleteMatchings: (ids: string[]) => Promise<void>;

  addTask: (matchingId: string, content: string, dueDate?: string) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkAddTasks: (matchingId: string, contents: string[]) => Promise<Task[]>;

  addNote: (targetTable: string, targetId: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  logActivity: (action: string, targetTable: string, targetId: string, targetName: string, detail: string) => Promise<void>;

  importRecords: (table: 'projects' | 'members', records: Record<string, string>[], mode: 'append' | 'replace') => Promise<number>;

  // General Tasks (Asana-like)
  generalTasks: GeneralTask[];
  taskSections: TaskSection[];
  taskTags: TaskTag[];
  addGeneralTask: (data: Partial<GeneralTask> & { tag_ids?: string[] }) => Promise<GeneralTask>;
  updateGeneralTask: (id: string, data: Partial<GeneralTask> & { tag_ids?: string[] }) => Promise<GeneralTask>;
  deleteGeneralTask: (id: string) => Promise<void>;
  reorderGeneralTask: (taskId: string, newSectionId: string | null, newSortOrder: number) => Promise<void>;
  addTaskSection: (name: string) => Promise<TaskSection>;
  updateTaskSection: (id: string, data: Partial<TaskSection>) => Promise<void>;
  deleteTaskSection: (id: string) => Promise<void>;
  addTaskTag: (name: string, color: string) => Promise<TaskTag>;
  updateTaskTag: (id: string, data: Partial<TaskTag>) => Promise<void>;
  deleteTaskTag: (id: string) => Promise<void>;
  fetchTaskComments: (taskId: string) => Promise<TaskComment[]>;
  addTaskComment: (taskId: string, content: string) => Promise<TaskComment>;
  deleteTaskComment: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generalTasks, setGeneralTasks] = useState<GeneralTask[]>([]);
  const [taskSections, setTaskSections] = useState<TaskSection[]>([]);
  const [taskTags, setTaskTags] = useState<TaskTag[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          fetch('/api/projects').then(r => { if (!r.ok) throw new Error('projects'); return r.json(); }),
          fetch('/api/members').then(r => { if (!r.ok) throw new Error('members'); return r.json(); }),
          fetch('/api/matchings').then(r => { if (!r.ok) throw new Error('matchings'); return r.json(); }),
          fetch('/api/activity-logs').then(r => { if (!r.ok) throw new Error('activity-logs'); return r.json(); }),
          fetch('/api/notes').then(r => { if (!r.ok) throw new Error('notes'); return r.json(); }),
          fetch('/api/tasks').then(r => { if (!r.ok) throw new Error('tasks'); return r.json(); }),
          fetch('/api/general-tasks').then(r => { if (!r.ok) throw new Error('general-tasks'); return r.json(); }),
          fetch('/api/task-sections').then(r => { if (!r.ok) throw new Error('task-sections'); return r.json(); }),
          fetch('/api/task-tags').then(r => { if (!r.ok) throw new Error('task-tags'); return r.json(); }),
          fetch('/api/users').then(r => { if (!r.ok) throw new Error('users'); return r.json(); }),
        ]);
        // 成功したものだけセット、失敗は個別にログ出力
        const setters = [setProjects, setMembers, setMatchings, setActivityLogs, setNotes, setTasks, setGeneralTasks, setTaskSections, setTaskTags, setUsers];
        const names = ['projects', 'members', 'matchings', 'activity-logs', 'notes', 'tasks', 'general-tasks', 'task-sections', 'task-tags', 'users'];
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            setters[i](result.value);
          } else {
            console.error(`Failed to load ${names[i]}:`, result.reason);
          }
        });
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Projects
  const addProject = useCallback(async (data: Omit<Project, 'id'>): Promise<Project> => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add project');
    const record: Project = await res.json();
    setProjects(prev => [...prev, record]);
    return record;
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<Project>): Promise<void> => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    const record: Project = await res.json();
    setProjects(prev => prev.map(p => p.id === id ? record : p));
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const bulkUpdateProjects = useCallback(async (ids: string[], updates: Partial<Project>): Promise<void> => {
    const res = await fetch('/api/projects/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, updates }),
    });
    if (!res.ok) throw new Error('Failed to bulk update projects');
    setProjects(prev => prev.map(p => ids.includes(p.id) ? { ...p, ...updates } : p));
  }, []);

  const bulkDeleteProjects = useCallback(async (ids: string[]): Promise<void> => {
    const res = await fetch('/api/projects/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete projects');
    setProjects(prev => prev.filter(p => !ids.includes(p.id)));
  }, []);

  // Members
  const addMember = useCallback(async (data: Omit<Member, 'id'>): Promise<Member> => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add member');
    const record: Member = await res.json();
    setMembers(prev => [...prev, record]);
    return record;
  }, []);

  const updateMember = useCallback(async (id: string, data: Partial<Member>): Promise<void> => {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update member');
    const record: Member = await res.json();
    setMembers(prev => prev.map(m => m.id === id ? record : m));
  }, []);

  const deleteMember = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete member');
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const bulkDeleteMembers = useCallback(async (ids: string[]): Promise<void> => {
    const res = await fetch('/api/members/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete members');
    setMembers(prev => prev.filter(m => !ids.includes(m.id)));
  }, []);

  // Matchings
  const addMatching = useCallback(async (data: Omit<Matching, 'id'>): Promise<Matching> => {
    const res = await fetch('/api/matchings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add matching');
    const record: Matching = await res.json();
    setMatchings(prev => [...prev, record]);
    return record;
  }, []);

  const updateMatching = useCallback(async (id: string, data: Partial<Matching>): Promise<void> => {
    const res = await fetch(`/api/matchings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update matching');
    const record: Matching = await res.json();
    setMatchings(prev => prev.map(mt => mt.id === id ? record : mt));
  }, []);

  const deleteMatching = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/matchings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete matching');
    setMatchings(prev => prev.filter(mt => mt.id !== id));
  }, []);

  const bulkDeleteMatchings = useCallback(async (ids: string[]): Promise<void> => {
    const res = await fetch('/api/matchings/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete matchings');
    setMatchings(prev => prev.filter(mt => !ids.includes(mt.id)));
  }, []);

  // Notes
  const addNote = useCallback(async (targetTable: string, targetId: string, content: string): Promise<void> => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_table: targetTable, target_id: targetId, content, timestamp: getCurrentTimestamp() }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    const record: Note = await res.json();
    setNotes(prev => [...prev, record]);
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Tasks
  const addTask = useCallback(async (matchingId: string, content: string, dueDate?: string): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matching_id: matchingId, content, due_date: dueDate || '' }),
    });
    if (!res.ok) throw new Error('Failed to add task');
    const record: Task = await res.json();
    setTasks(prev => [...prev, record]);
    return record;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>): Promise<void> => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const record: Task = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? record : t));
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const bulkAddTasks = useCallback(async (matchingId: string, contents: string[]): Promise<Task[]> => {
    // Start sort_order after existing tasks so new ones appear at the end
    const existingMax = tasks
      .filter(t => t.matching_id === matchingId)
      .reduce((max, t) => Math.max(max, t.sort_order), -1);
    const startOrder = existingMax + 1;

    const res = await fetch('/api/tasks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: contents.map((c, i) => ({ matching_id: matchingId, content: c, sort_order: startOrder + i })),
      }),
    });
    if (!res.ok) throw new Error('Failed to bulk add tasks');
    const created: Task[] = await res.json();
    if (!Array.isArray(created)) return [];
    setTasks(prev => [...prev, ...created]);
    return created;
  }, [tasks]);

  // Activity logs
  const logActivity = useCallback(async (action: string, targetTable: string, targetId: string, targetName: string, detail: string): Promise<void> => {
    const res = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, target_table: targetTable, target_id: targetId, target_name: targetName, detail, timestamp: getCurrentTimestamp(),
        user_id: user?.id ?? '',
        user_name: user?.display_name ?? '',
      }),
    });
    if (!res.ok) throw new Error('Failed to log activity');
    const record: ActivityLog = await res.json();
    setActivityLogs(prev => [record, ...prev].slice(0, 100));
  }, [user]);

  // Import
  const importRecords = useCallback(async (table: 'projects' | 'members', records: Record<string, string>[], mode: 'append' | 'replace'): Promise<number> => {
    const url = table === 'projects' ? '/api/projects' : '/api/members';

    if (mode === 'replace') {
      // まず新しいレコードを作成（失敗したら元データは消さない）
      const created = await Promise.all(
        records.map(r =>
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to create record`);
            return res.json();
          })
        )
      );

      // 新規作成が全て成功したら、古いデータを削除
      if (table === 'projects') {
        const current = await fetch('/api/projects').then(r => r.json()) as Project[];
        const newIds = new Set((created as Project[]).map(c => c.id));
        const toDelete = current.filter(p => !newIds.has(p.id));
        await Promise.all(toDelete.map(p => fetch(`/api/projects/${p.id}`, { method: 'DELETE' })));
        setProjects(created as Project[]);
      } else {
        const current = await fetch('/api/members').then(r => r.json()) as Member[];
        const newIds = new Set((created as Member[]).map(c => c.id));
        const toDelete = current.filter(m => !newIds.has(m.id));
        await Promise.all(toDelete.map(m => fetch(`/api/members/${m.id}`, { method: 'DELETE' })));
        setMembers(created as Member[]);
      }
    } else {
      // append モード
      const created = await Promise.all(
        records.map(r =>
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to create record`);
            return res.json();
          })
        )
      );

      if (table === 'projects') {
        setProjects(prev => [...prev, ...(created as Project[])]);
      } else {
        setMembers(prev => [...prev, ...(created as Member[])]);
      }
    }

    return records.length;
  }, []);

  // ---- General Tasks (Asana-like) ----
  const addGeneralTask = useCallback(async (data: Partial<GeneralTask> & { tag_ids?: string[] }): Promise<GeneralTask> => {
    const res = await fetch('/api/general-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add general task');
    const record: GeneralTask = await res.json();
    if (record.parent_id) {
      // Subtask or grandchild: add to parent's children (up to 2 levels deep)
      setGeneralTasks(prev => prev.map(t => {
        if (t.id === record.parent_id) {
          return { ...t, children: [...(t.children || []), record] };
        }
        // Check grandchild level: parent might be a child of t
        if (t.children?.some(c => c.id === record.parent_id)) {
          return {
            ...t,
            children: t.children.map(c =>
              c.id === record.parent_id ? { ...c, children: [...(c.children || []), record] } : c
            ),
          };
        }
        return t;
      }));
    } else {
      setGeneralTasks(prev => [...prev, record]);
    }
    return record;
  }, []);

  const updateGeneralTask = useCallback(async (id: string, data: Partial<GeneralTask> & { tag_ids?: string[] }): Promise<GeneralTask> => {
    const res = await fetch(`/api/general-tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update general task');
    const record: GeneralTask = await res.json();
    setGeneralTasks(prev => {
      // Update in top-level, as child, or as grandchild (2 levels deep)
      return prev.map(t => {
        if (t.id === id) return { ...record, children: t.children };
        if (t.children?.some(c => c.id === id)) {
          return { ...t, children: t.children.map(c => c.id === id ? { ...record, children: c.children } : c) };
        }
        // Check grandchild level
        if (t.children?.some(c => c.children?.some(gc => gc.id === id))) {
          return {
            ...t,
            children: t.children.map(c =>
              c.children?.some(gc => gc.id === id)
                ? { ...c, children: c.children.map(gc => gc.id === id ? record : gc) }
                : c
            ),
          };
        }
        return t;
      });
    });
    return record;
  }, []);

  const deleteGeneralTask = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/general-tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete general task');
    setGeneralTasks(prev => prev
      .filter(t => t.id !== id)
      .map(t => {
        if (t.children?.some(c => c.id === id)) {
          return { ...t, children: t.children.filter(c => c.id !== id) };
        }
        // Check grandchild level
        if (t.children?.some(c => c.children?.some(gc => gc.id === id))) {
          return {
            ...t,
            children: t.children.map(c =>
              c.children?.some(gc => gc.id === id)
                ? { ...c, children: c.children.filter(gc => gc.id !== id) }
                : c
            ),
          };
        }
        return t;
      })
    );
  }, []);

  const reorderGeneralTask = useCallback(async (taskId: string, newSectionId: string | null, newSortOrder: number): Promise<void> => {
    const res = await fetch('/api/general-tasks/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, new_section_id: newSectionId, new_sort_order: newSortOrder }),
    });
    if (!res.ok) throw new Error('Failed to reorder task');
    setGeneralTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, section_id: newSectionId, sort_order: newSortOrder } : t
    ));
  }, []);

  // ---- Task Sections ----
  const addTaskSection = useCallback(async (name: string): Promise<TaskSection> => {
    const maxOrder = taskSections.reduce((max, s) => Math.max(max, s.sort_order), -1);
    const res = await fetch('/api/task-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sort_order: maxOrder + 1 }),
    });
    if (!res.ok) throw new Error('Failed to add section');
    const record: TaskSection = await res.json();
    setTaskSections(prev => [...prev, record]);
    return record;
  }, [taskSections]);

  const updateTaskSection = useCallback(async (id: string, data: Partial<TaskSection>): Promise<void> => {
    const res = await fetch(`/api/task-sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update section');
    const record: TaskSection = await res.json();
    setTaskSections(prev => prev.map(s => s.id === id ? record : s));
  }, []);

  const deleteTaskSection = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/task-sections/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete section');
    setTaskSections(prev => prev.filter(s => s.id !== id));
    // Tasks in this section become sectionless
    setGeneralTasks(prev => prev.map(t => t.section_id === id ? { ...t, section_id: null } : t));
  }, []);

  // ---- Task Tags ----
  const addTaskTag = useCallback(async (name: string, color: string): Promise<TaskTag> => {
    const res = await fetch('/api/task-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Failed to add tag');
    const record: TaskTag = await res.json();
    setTaskTags(prev => [...prev, record]);
    return record;
  }, []);

  const updateTaskTag = useCallback(async (id: string, data: Partial<TaskTag>): Promise<void> => {
    const res = await fetch(`/api/task-tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update tag');
    const record: TaskTag = await res.json();
    setTaskTags(prev => prev.map(t => t.id === id ? record : t));
  }, []);

  const deleteTaskTag = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/task-tags/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tag');
    setTaskTags(prev => prev.filter(t => t.id !== id));
    // Remove tag from tasks
    setGeneralTasks(prev => prev.map(t => ({
      ...t,
      tags: t.tags.filter(tag => tag.id !== id),
      children: t.children?.map(c => ({ ...c, tags: c.tags.filter(tag => tag.id !== id) })),
    })));
  }, []);

  // ---- Task Comments ----
  const fetchTaskComments = useCallback(async (taskId: string): Promise<TaskComment[]> => {
    const res = await fetch(`/api/task-comments?task_id=${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  }, []);

  const addTaskComment = useCallback(async (taskId: string, content: string): Promise<TaskComment> => {
    const res = await fetch('/api/task-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, content, user_id: user?.id ?? '', user_name: user?.display_name ?? '' }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  }, [user]);

  const deleteTaskComment = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/task-comments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete comment');
  }, []);

  return (
    <StoreContext.Provider value={{
      loading, users, projects, members, matchings, activityLogs, notes, tasks,
      addProject, updateProject, deleteProject, bulkUpdateProjects, bulkDeleteProjects,
      addMember, updateMember, deleteMember, bulkDeleteMembers,
      addMatching, updateMatching, deleteMatching, bulkDeleteMatchings,
      addTask, updateTask, deleteTask, bulkAddTasks,
      addNote, deleteNote,
      logActivity,
      importRecords,
      generalTasks, taskSections, taskTags,
      addGeneralTask, updateGeneralTask, deleteGeneralTask, reorderGeneralTask,
      addTaskSection, updateTaskSection, deleteTaskSection,
      addTaskTag, updateTaskTag, deleteTaskTag,
      fetchTaskComments, addTaskComment, deleteTaskComment,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
