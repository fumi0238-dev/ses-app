'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import TagInput from '../TagInput';
import { Member, MEMBER_PROCESSES } from '../../lib/types';

interface Props {
  initial: Partial<Member> | null;
  onClose: () => void;
  onSave: (data: Omit<Member, 'id'>, id?: string) => void;
}

const EMPTY: Omit<Member, 'id'> = {
  process: '案件検索中', affiliation: '', full_name: '', initial: '', contract_employee: '',
  desired_price: '', desired_price_num: '', contact: '', desired_position: '',
  skill_sheet_url: '', proposal_text: '', sales_comment: '', skills_summary: '',
  skill_tags: '', industry_tags: '', experience_years: '', experience_summary: '',
  nearest_station: '', available_date: '', work_preference: '',
};

export default function MemberFormModal({ initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Omit<Member, 'id'>>(EMPTY);
  const isEdit = !!(initial && (initial as Member).id);

  useEffect(() => {
    if (initial) setForm({ ...EMPTY, ...initial });
    else setForm(EMPTY);
  }, [initial]);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, isEdit ? (initial as Member).id : undefined);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{isEdit ? '要員編集' : '要員追加'}</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>プロセス</label>
                <select value={form.process} onChange={set('process')}>
                  {MEMBER_PROCESSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>所属先/経由元</label>
                <input type="text" value={form.affiliation} onChange={set('affiliation')} />
              </div>
              <div className="form-group">
                <label>要員名（本名）</label>
                <input type="text" value={form.full_name} onChange={set('full_name')} />
              </div>
              <div className="form-group">
                <label>イニシャル</label>
                <input type="text" value={form.initial} onChange={set('initial')} />
              </div>
              <div className="form-group">
                <label>契約社員化</label>
                <input type="text" value={form.contract_employee} onChange={set('contract_employee')} />
              </div>
              <div className="form-group">
                <label>希望単価</label>
                <input type="text" value={form.desired_price} onChange={set('desired_price')} />
              </div>
              <div className="form-group">
                <label>希望単価（数値・万円）</label>
                <input type="number" value={form.desired_price_num} onChange={set('desired_price_num')} placeholder="60" />
              </div>
              <div className="form-group">
                <label>経験年数</label>
                <input type="number" value={form.experience_years} onChange={set('experience_years')} placeholder="5" min="0" />
              </div>
              <div className="form-group full-width">
                <label>連絡先</label>
                <input type="text" value={form.contact} onChange={set('contact')} />
              </div>
              <div className="form-group">
                <label>希望ポジション</label>
                <input type="text" value={form.desired_position} onChange={set('desired_position')} />
              </div>
              <div className="form-group">
                <label>最寄駅</label>
                <input type="text" value={form.nearest_station} onChange={set('nearest_station')} />
              </div>
              <div className="form-group">
                <label>稼働可能日</label>
                <input type="text" value={form.available_date} onChange={set('available_date')} />
              </div>
              <div className="form-group">
                <label>勤務形態希望</label>
                <input type="text" value={form.work_preference} onChange={set('work_preference')} />
              </div>
              <div className="form-group full-width">
                <label>スキルシートURL</label>
                <input type="text" value={form.skill_sheet_url} onChange={set('skill_sheet_url')} />
              </div>
              <div className="form-group full-width">
                <label>スキルタグ <span className="tag-hint">Enterで追加 / ×で削除</span></label>
                <TagInput value={form.skill_tags} onChange={v => setForm(p => ({ ...p, skill_tags: v }))} placeholder="Java, AWS, PM 等を入力..." />
              </div>
              <div className="form-group full-width">
                <label>業界タグ <span className="tag-hint">Enterで追加 / ×で削除</span></label>
                <TagInput value={form.industry_tags} onChange={v => setForm(p => ({ ...p, industry_tags: v }))} placeholder="金融, 官公庁, EC 等を入力..." />
              </div>
              <div className="form-group full-width">
                <label>スキル一覧（概要メモ）</label>
                <textarea value={form.skills_summary} onChange={set('skills_summary')} rows={2} />
              </div>
              <div className="form-group full-width">
                <label>経験一覧（概要）</label>
                <textarea value={form.experience_summary} onChange={set('experience_summary')} rows={3} />
              </div>
              <div className="form-group full-width">
                <label>営業コメント</label>
                <textarea value={form.sales_comment} onChange={set('sales_comment')} rows={3} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
