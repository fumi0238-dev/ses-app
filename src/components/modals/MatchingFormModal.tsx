'use client';

import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Matching, Project, Member, MATCHING_STATUSES, MatchingStatus } from '../../lib/types';

interface MatchingFormData {
  id?: string;
  project_id: string;
  member_id: string;
  status: MatchingStatus;
  proposed_date: string;
  interview_date: string;
  note: string;
}

const DEFAULT_FORM: MatchingFormData = { project_id: '', member_id: '', status: '候補', proposed_date: '', interview_date: '', note: '' };

interface Props {
  initial: MatchingFormData | null;
  projects: Project[];
  members: Member[];
  onClose: () => void;
  onSave: (data: Omit<Matching, 'id'>, id?: string) => void;
}


export default function MatchingFormModal({ initial, projects, members, onClose, onSave }: Props) {
  const [form, setForm] = useState<MatchingFormData>(initial ?? DEFAULT_FORM);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setForm(initial ?? DEFAULT_FORM);
  }

  const projectLabel = projects.find(p => p.id === form.project_id);
  const memberLabel = members.find(m => m.id === form.member_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...data } = form;
    onSave(data as Omit<Matching, 'id'>, id);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>マッチング登録</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>案件</label>
              <input type="text" className="readonly-input" readOnly value={projectLabel ? (projectLabel.project_name_rewrite || projectLabel.project_name_original) : ''} />
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>要員</label>
              <input type="text" className="readonly-input" readOnly value={memberLabel ? (memberLabel.full_name || memberLabel.initial) : ''} />
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>ステータス</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as MatchingStatus }))}>
                {MATCHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>提案日</label>
              <input type="date" value={(form.proposed_date || '').replace(/\//g, '-')} onChange={e => setForm(p => ({ ...p, proposed_date: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>面談日</label>
              <input type="date" value={(form.interview_date || '').replace(/\//g, '-')} onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>メモ</label>
              <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={3} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn btn-primary">登録</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export type { MatchingFormData };
