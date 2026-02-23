'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import TagInput from '../TagInput';
import { Project, PROJECT_STATUSES, SHAREABLE_VALUES } from '../../lib/types';

interface Props {
  initial: Partial<Project> | null;
  onClose: () => void;
  onSave: (data: Omit<Project, 'id'>, id?: string) => void;
}

const EMPTY: Omit<Project, 'id'> = {
  status: 'Open', shareable: 'OK', share_note: '', added_date: '', source: '',
  project_name_original: '', project_name_rewrite: '', client_price: '', purchase_price: '',
  purchase_price_num: '', required_experience_years: '', role: '', location: '', work_style: '',
  period: '', headcount: '', required_skills: '', preferred_skills: '',
  required_skill_tags: '', preferred_skill_tags: '', industry_tags: '',
  description_original: '', description_rewrite: '', age_limit: '', nationality: '',
  english: '', commercial_flow: '', interview_count: '',
};

export default function ProjectFormModal({ initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Omit<Project, 'id'>>(EMPTY);
  const isEdit = !!(initial && (initial as Project).id);

  useEffect(() => {
    if (initial) {
      setForm({ ...EMPTY, ...initial });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, isEdit ? (initial as Project).id : undefined);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{isEdit ? '案件編集' : '案件追加'}</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>ステータス</label>
                <select value={form.status} onChange={set('status')}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>共有可否</label>
                <select value={form.shareable} onChange={set('shareable')}>
                  {SHAREABLE_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>共有NG理由</label>
                <input type="text" value={form.share_note} onChange={set('share_note')} />
              </div>
              <div className="form-group">
                <label>追加日</label>
                <input type="text" value={form.added_date} onChange={set('added_date')} placeholder="YYYY/MM/DD" />
              </div>
              <div className="form-group">
                <label>案件元/ツール</label>
                <input type="text" value={form.source} onChange={set('source')} />
              </div>
              <div className="form-group">
                <label>募集職種</label>
                <input type="text" value={form.role} onChange={set('role')} />
              </div>
              <div className="form-group full-width">
                <label>案件名（原文）</label>
                <input type="text" value={form.project_name_original} onChange={set('project_name_original')} />
              </div>
              <div className="form-group full-width">
                <label>案件名（リライト）</label>
                <input type="text" value={form.project_name_rewrite} onChange={set('project_name_rewrite')} />
              </div>
              <div className="form-group">
                <label>元単価</label>
                <input type="text" value={form.client_price} onChange={set('client_price')} />
              </div>
              <div className="form-group">
                <label>仕入単価</label>
                <input type="text" value={form.purchase_price} onChange={set('purchase_price')} />
              </div>
              <div className="form-group">
                <label>仕入単価（数値・万円）</label>
                <input type="number" value={form.purchase_price_num} onChange={set('purchase_price_num')} placeholder="70" />
              </div>
              <div className="form-group">
                <label>必要経験年数</label>
                <input type="number" value={form.required_experience_years} onChange={set('required_experience_years')} placeholder="3" min="0" />
              </div>
              <div className="form-group">
                <label>勤務地</label>
                <input type="text" value={form.location} onChange={set('location')} />
              </div>
              <div className="form-group">
                <label>働き方</label>
                <input type="text" value={form.work_style} onChange={set('work_style')} placeholder="オンサイト/リモート併用/フルリモート" />
              </div>
              <div className="form-group">
                <label>期間</label>
                <input type="text" value={form.period} onChange={set('period')} />
              </div>
              <div className="form-group">
                <label>募集人数</label>
                <input type="text" value={form.headcount} onChange={set('headcount')} />
              </div>
              <div className="form-group">
                <label>年齢制限</label>
                <input type="text" value={form.age_limit} onChange={set('age_limit')} />
              </div>
              <div className="form-group">
                <label>外国籍</label>
                <input type="text" value={form.nationality} onChange={set('nationality')} />
              </div>
              <div className="form-group">
                <label>英語</label>
                <input type="text" value={form.english} onChange={set('english')} />
              </div>
              <div className="form-group">
                <label>商流制限</label>
                <input type="text" value={form.commercial_flow} onChange={set('commercial_flow')} />
              </div>
              <div className="form-group">
                <label>面談回数</label>
                <input type="text" value={form.interview_count} onChange={set('interview_count')} />
              </div>
              <div className="form-group full-width">
                <label>必須スキルタグ <span className="tag-hint">Enterで追加 / ×で削除</span></label>
                <TagInput value={form.required_skill_tags} onChange={v => setForm(p => ({ ...p, required_skill_tags: v }))} placeholder="Java, AWS, PM 等を入力..." />
              </div>
              <div className="form-group full-width">
                <label>尚可スキルタグ <span className="tag-hint">Enterで追加 / ×で削除</span></label>
                <TagInput value={form.preferred_skill_tags} onChange={v => setForm(p => ({ ...p, preferred_skill_tags: v }))} placeholder="尚可スキルを入力..." />
              </div>
              <div className="form-group full-width">
                <label>業界タグ <span className="tag-hint">Enterで追加 / ×で削除</span></label>
                <TagInput value={form.industry_tags} onChange={v => setForm(p => ({ ...p, industry_tags: v }))} placeholder="金融, 官公庁, EC 等を入力..." />
              </div>
              <div className="form-group full-width">
                <label>必須スキル（原文メモ）</label>
                <textarea value={form.required_skills} onChange={set('required_skills')} rows={2} />
              </div>
              <div className="form-group full-width">
                <label>尚可スキル（原文メモ）</label>
                <textarea value={form.preferred_skills} onChange={set('preferred_skills')} rows={2} />
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
