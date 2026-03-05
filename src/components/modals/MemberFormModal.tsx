'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import TagInput from '../TagInput';
import { Member, MEMBER_PROCESSES, SHAREABLE_VALUES, WORK_STYLE_CATEGORIES } from '../../lib/types';

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
  shareable: 'OK', share_note: '',
  desired_price_min: '', desired_price_max: '',
  work_style_category: '', work_style_office_days: '', work_style_initial_onsite: '',
  work_style_transition_onsite: '', work_style_note: '',
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
                <label>共有可否</label>
                <select value={form.shareable} onChange={set('shareable')}>
                  {SHAREABLE_VALUES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {form.shareable === 'NG' && (
                <div className="form-group">
                  <label>共有NG理由</label>
                  <input type="text" value={form.share_note} onChange={set('share_note')} placeholder="理由を入力..." />
                </div>
              )}
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
              <div className="form-group full-width">
                <label>希望単価（万円）</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={form.desired_price_min} onChange={set('desired_price_min')} placeholder="下限" style={{ flex: 1 }} min="0" />
                  <span style={{ color: 'var(--text-secondary)' }}>～</span>
                  <input type="number" value={form.desired_price_max} onChange={set('desired_price_max')} placeholder="上限" style={{ flex: 1 }} min="0" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>万円</span>
                </div>
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
