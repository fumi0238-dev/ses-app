'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import TagInput from '../TagInput';
import { Project, PROJECT_STATUSES, SHAREABLE_VALUES, WORK_STYLE_CATEGORIES } from '../../lib/types';

interface Props {
  initial: Partial<Project> | null;
  onClose: () => void;
  onSave: (data: Omit<Project, 'id'>, id?: string) => void;
}

const EMPTY: Omit<Project, 'id'> = {
  status: 'Open', shareable: 'OK', share_note: '', added_date: '', source: '',
  project_name_original: '', project_name_rewrite: '', client_price: '', purchase_price: '',
  purchase_price_num: '', required_experience_years: '', role: '', location: '', work_style: '',
  client_price_min: '', client_price_max: '', purchase_price_min: '', purchase_price_max: '',
  work_style_category: '', work_style_office_days: '', work_style_initial_onsite: '',
  work_style_transition_onsite: '', work_style_note: '',
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
              <div className="form-group full-width">
                <label>元単価（万円）</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={form.client_price_min} onChange={set('client_price_min')} placeholder="下限" style={{ flex: 1 }} min="0" />
                  <span style={{ color: 'var(--text-secondary)' }}>～</span>
                  <input type="number" value={form.client_price_max} onChange={set('client_price_max')} placeholder="上限" style={{ flex: 1 }} min="0" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>万円</span>
                </div>
              </div>
              <div className="form-group full-width">
                <label>仕入単価（万円）</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={form.purchase_price_min} onChange={set('purchase_price_min')} placeholder="下限" style={{ flex: 1 }} min="0" />
                  <span style={{ color: 'var(--text-secondary)' }}>～</span>
                  <input type="number" value={form.purchase_price_max} onChange={set('purchase_price_max')} placeholder="上限" style={{ flex: 1 }} min="0" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>万円</span>
                </div>
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
                <select value={form.work_style_category} onChange={set('work_style_category')}>
                  <option value="">未設定</option>
                  {WORK_STYLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(form.work_style_category === 'リモート併用' || form.work_style_category === 'オンサイト') && (
                <div className="form-group">
                  <label>出社日数（週）</label>
                  <input type="text" value={form.work_style_office_days} onChange={set('work_style_office_days')} placeholder="例: 2～3" />
                </div>
              )}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={form.work_style_initial_onsite === 'true' || form.work_style_initial_onsite === true as unknown as string}
                    onChange={e => setForm(prev => ({ ...prev, work_style_initial_onsite: e.target.checked ? 'true' : '' }))}
                  />
                  参画初期の出社対応可能
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={form.work_style_transition_onsite === 'true' || form.work_style_transition_onsite === true as unknown as string}
                    onChange={e => setForm(prev => ({ ...prev, work_style_transition_onsite: e.target.checked ? 'true' : '' }))}
                  />
                  ※過渡期の出社対応可能
                </label>
              </div>
              <div className="form-group">
                <label>働き方備考</label>
                <input type="text" value={form.work_style_note} onChange={set('work_style_note')} placeholder="補足事項..." />
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
