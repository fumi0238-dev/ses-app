'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, Member, Matching, ActivityLog, Note, Task } from './types';
import { getCurrentTimestamp } from './helpers';

interface StoreContextType {
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

  addMember: (data: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addMatching: (data: Omit<Matching, 'id'>) => Promise<Matching>;
  updateMatching: (id: string, data: Partial<Matching>) => Promise<void>;
  deleteMatching: (id: string) => Promise<void>;

  addTask: (matchingId: string, content: string, dueDate?: string) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkAddTasks: (matchingId: string, contents: string[]) => Promise<Task[]>;

  addNote: (targetTable: string, targetId: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  logActivity: (action: string, targetTable: string, targetId: string, targetName: string, detail: string) => Promise<void>;

  importRecords: (table: 'projects' | 'members', records: Record<string, string>[], mode: 'append' | 'replace') => Promise<number>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [proj, mem, match, logs, nt, tk] = await Promise.all([
          fetch('/api/projects').then(r => { if (!r.ok) throw new Error('projects'); return r.json(); }),
          fetch('/api/members').then(r => { if (!r.ok) throw new Error('members'); return r.json(); }),
          fetch('/api/matchings').then(r => { if (!r.ok) throw new Error('matchings'); return r.json(); }),
          fetch('/api/activity-logs').then(r => { if (!r.ok) throw new Error('activity-logs'); return r.json(); }),
          fetch('/api/notes').then(r => { if (!r.ok) throw new Error('notes'); return r.json(); }),
          fetch('/api/tasks').then(r => { if (!r.ok) throw new Error('tasks'); return r.json(); }),
        ]);
        setProjects(proj);
        setMembers(mem);
        setMatchings(match);
        setActivityLogs(logs);
        setNotes(nt);
        setTasks(tk);
      } catch (e) {
        console.error('Failed to load initial data:', e);
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
      body: JSON.stringify({ action, target_table: targetTable, target_id: targetId, target_name: targetName, detail, timestamp: getCurrentTimestamp() }),
    });
    if (!res.ok) throw new Error('Failed to log activity');
    const record: ActivityLog = await res.json();
    setActivityLogs(prev => [record, ...prev].slice(0, 100));
  }, []);

  // Import
  const importRecords = useCallback(async (table: 'projects' | 'members', records: Record<string, string>[], mode: 'append' | 'replace'): Promise<number> => {
    if (mode === 'replace') {
      if (table === 'projects') {
        const current = await fetch('/api/projects').then(r => r.json()) as Project[];
        await Promise.all(current.map(p => fetch(`/api/projects/${p.id}`, { method: 'DELETE' })));
      } else {
        const current = await fetch('/api/members').then(r => r.json()) as Member[];
        await Promise.all(current.map(m => fetch(`/api/members/${m.id}`, { method: 'DELETE' })));
      }
    }

    const url = table === 'projects' ? '/api/projects' : '/api/members';
    const created = await Promise.all(
      records.map(r =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r),
        }).then(res => res.json())
      )
    );

    if (table === 'projects') {
      if (mode === 'replace') {
        setProjects(created as Project[]);
      } else {
        setProjects(prev => [...prev, ...(created as Project[])]);
      }
    } else {
      if (mode === 'replace') {
        setMembers(created as Member[]);
      } else {
        setMembers(prev => [...prev, ...(created as Member[])]);
      }
    }

    return records.length;
  }, []);

  return (
    <StoreContext.Provider value={{
      projects, members, matchings, activityLogs, notes, tasks,
      addProject, updateProject, deleteProject, bulkUpdateProjects,
      addMember, updateMember, deleteMember,
      addMatching, updateMatching, deleteMatching,
      addTask, updateTask, deleteTask, bulkAddTasks,
      addNote, deleteNote,
      logActivity,
      importRecords,
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
