'use client';

import React, { useState } from 'react';
import { FaTimes, FaBriefcase, FaUsers, FaStickyNote, FaEdit, FaHandshake, FaSearch, FaPlus } from 'react-icons/fa';
import { Project, Member, Matching, Note } from '../../lib/types';
import { truncate, getMatchingBadgeClass, getProcessBadgeClass, getStructuredWorkStyle, formatStructuredPrice, formatDateStr, formatPeriodRange, formatAvailableDate } from '../../lib/helpers';

// ---- Notes Section ----
interface NotesSectionProps {
  targetTable: string;
  targetId: string;
  notes: Note[];
  onAddNote: (targetTable: string, targetId: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

function NotesSection({ targetTable, targetId, notes, onAddNote, onDeleteNote }: NotesSectionProps) {
  const [noteText, setNoteText] = useState('');
  const filtered = notes.filter(n => n.target_table === targetTable && n.target_id === targetId);

  const handleAdd = () => {
    if (!noteText.trim()) return;
    onAddNote(targetTable, targetId, noteText.trim());
    setNoteText('');
  };

  return (
    <div className="detail-section">
      <h4><FaStickyNote style={{ color: 'var(--primary)', marginRight: 4, fontSize: 13 }} />メモ（{filtered.length}件）</h4>
      <div className="notes-list">
        {filtered.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>メモなし</p>
          : filtered.map(n => (
            <div key={n.id} className="note-item">
              <div className="note-content">{n.content}</div>
              <div className="note-meta">
                <span>{n.timestamp}</span>
                <button className="btn btn-sm btn-danger" onClick={() => onDeleteNote(n.id)}>
                  <FaTimes />
                </button>
              </div>
            </div>
          ))
        }
      </div>
      <div className="note-form">
        <textarea
          rows={2}
          placeholder="メモを入力..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
        />
        <button className="btn btn-sm btn-primary" style={{ marginTop: 6 }} onClick={handleAdd}>
          + メモ追加
        </button>
      </div>
    </div>
  );
}

// ---- Tags Display ----
function TagsDisplay({ tags, bg, color }: { tags: string; bg: string; color: string }) {
  if (!tags) return <span>-</span>;
  return (
    <>
      {tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
        <span key={i} className="skill-tag" style={{ background: bg, color, marginRight: 4 }}>{t}</span>
      ))}
    </>
  );
}

// ---- Project Detail Modal ----
interface ProjectDetailProps {
  project: Project | null;
  members: Member[];
  matchings: Matching[];
  notes: Note[];
  onClose: () => void;
  onEdit: () => void;
  onAddNote: (targetTable: string, targetId: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenMatchingForm: (projectId: string, memberId: string) => void;
}

export function ProjectDetailModal({ project, members, matchings, notes, onClose, onEdit, onAddNote, onDeleteNote, onOpenMatchingForm }: ProjectDetailProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  if (!project) return null;
  const relatedMatchings = matchings.filter(mt => mt.project_id === project.id);

  const alreadyMatchedMemberIds = new Set(relatedMatchings.map(mt => mt.member_id));
  const filteredMembers = members.filter(m => {
    if (!selectorSearch) return true;
    const q = selectorSearch.toLowerCase();
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.initial || '').toLowerCase().includes(q) ||
      (m.skill_tags || '').toLowerCase().includes(q) ||
      (m.affiliation || '').toLowerCase().includes(q)
    );
  });

  const handleSelectMember = (memberId: string) => {
    onOpenMatchingForm(project.id, memberId);
    setShowSelector(false);
    setSelectorSearch('');
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{project.project_name_rewrite || project.project_name_original || '案件詳細'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={onEdit} title="編集">
              <FaEdit style={{ marginRight: 4 }} />編集
            </button>
            <button className="modal-close" onClick={onClose}><FaTimes /></button>
          </div>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <h4>基本情報</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">ステータス</div>
                <div className="detail-item-value"><span className={`badge badge-${(project.status || 'open').toLowerCase()}`}>{project.status}</span></div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">共有可否</div>
                <div className="detail-item-value">
                  <span className={`badge badge-${(project.shareable || 'ok').toLowerCase()}`}>{project.shareable}</span>
                  {project.share_note ? `（${project.share_note}）` : ''}
                </div>
              </div>
              <div className="detail-item"><div className="detail-item-label">追加日</div><div className="detail-item-value">{formatDateStr(project.added_date)}</div></div>
              <div className="detail-item"><div className="detail-item-label">案件元</div><div className="detail-item-value">{project.source || '-'}</div></div>
              <div className="detail-item full-width"><div className="detail-item-label">案件名（原文）</div><div className="detail-item-value">{project.project_name_original || '-'}</div></div>
              <div className="detail-item full-width"><div className="detail-item-label">案件名（リライト）</div><div className="detail-item-value">{project.project_name_rewrite || '-'}</div></div>
            </div>
          </div>
          <div className="detail-section">
            <h4>条件面</h4>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-item-label">募集職種</div><div className="detail-item-value">{project.role || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">元単価</div><div className="detail-item-value">{formatStructuredPrice(project.client_price_min, project.client_price_max) || project.client_price || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">仕入単価</div><div className="detail-item-value">{formatStructuredPrice(project.purchase_price_min, project.purchase_price_max) || project.purchase_price || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">必要経験</div><div className="detail-item-value">{project.required_experience_years ? `${project.required_experience_years}年以上` : '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">勤務地</div><div className="detail-item-value">{project.location || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">働き方</div><div className="detail-item-value">
                {(() => {
                  const ws = getStructuredWorkStyle(project.work_style_category, project.work_style_office_days, project.work_style_initial_onsite, project.work_style_note, project.work_style, project.work_style_transition_onsite);
                  if (ws.category === 'unknown') return '-';
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge work-style-badge ws-${ws.category}`}>{ws.categoryLabel}</span>
                      {ws.officeDaysText && <span className="badge" style={{ fontSize: 11, background: '#e0e7ff', color: '#3730a3' }}>{ws.officeDaysText}</span>}
                      {ws.initialOnsite && <span className="badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e' }}>参画初期出社可</span>}
                      {ws.transitionOnsite && <span className="badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e' }}>過渡期出社可</span>}
                      {ws.notes.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ws.notes.join(' / ')}</span>}
                    </span>
                  );
                })()}
              </div></div>
              <div className="detail-item"><div className="detail-item-label">期間</div><div className="detail-item-value">{formatPeriodRange(project.period_start, project.period_end, project.period)}</div></div>
              <div className="detail-item"><div className="detail-item-label">募集人数</div><div className="detail-item-value">{project.headcount || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">年齢制限</div><div className="detail-item-value">{project.age_limit || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">外国籍</div><div className="detail-item-value">{project.nationality || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">英語</div><div className="detail-item-value">{project.english || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">商流</div><div className="detail-item-value">{project.commercial_flow || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">面談</div><div className="detail-item-value">{project.interview_count || '-'}</div></div>
            </div>
          </div>
          <div className="detail-section">
            <h4>スキル要件</h4>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <div className="detail-item-label">必須スキルタグ</div>
                <div className="detail-item-value"><TagsDisplay tags={project.required_skill_tags} bg="#d1fae5" color="#065f46" /></div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">尚可スキルタグ</div>
                <div className="detail-item-value"><TagsDisplay tags={project.preferred_skill_tags} bg="#dbeafe" color="#1e40af" /></div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">業界タグ</div>
                <div className="detail-item-value"><TagsDisplay tags={project.industry_tags} bg="#fef3c7" color="#92400e" /></div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">必須スキル（原文）</div>
                <div className="detail-item-value long-text">{project.required_skills || '-'}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">尚可スキル（原文）</div>
                <div className="detail-item-value long-text">{project.preferred_skills || '-'}</div>
              </div>
            </div>
          </div>
          {(project.description_rewrite || project.description_original) && (
            <div className="detail-section">
              <h4>業務内容</h4>
              <div className="detail-item-value long-text" style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, maxHeight: 400, overflowY: 'auto', padding: '12px', background: 'var(--bg)', borderRadius: 8 }}>
                {project.description_rewrite || project.description_original}
              </div>
            </div>
          )}
          <div className="detail-section">
            <h4><FaHandshake style={{ color: 'var(--primary)', marginRight: 4, fontSize: 13 }} />マッチング登録</h4>
            {!showSelector ? (
              <button className="btn btn-sm btn-primary" onClick={() => setShowSelector(true)}>
                <FaPlus style={{ marginRight: 4 }} />要員を選んでマッチング登録
              </button>
            ) : (
              <div>
                <div className="search-box" style={{ marginBottom: 8 }}>
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="要員名・スキル・所属で絞り込み..."
                    value={selectorSearch}
                    onChange={e => setSelectorSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="selector-list">
                  {filteredMembers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                      該当する要員がありません
                    </div>
                  ) : filteredMembers.map(m => {
                    const isMatched = alreadyMatchedMemberIds.has(m.id);
                    return (
                      <div key={m.id} className={`selector-item${isMatched ? ' disabled' : ''}`}>
                        <div className="selector-item-info">
                          <span className="selector-item-name">{m.full_name || m.initial || '(名前なし)'}</span>
                          <span className="selector-item-sub">{m.affiliation || ''}{m.desired_price ? ` / ${m.desired_price}` : ''}</span>
                          {isMatched && <span className="badge badge-proposed" style={{ fontSize: 10, padding: '2px 6px' }}>提案済</span>}
                        </div>
                        <button className="btn btn-sm btn-primary" disabled={isMatched} onClick={() => handleSelectMember(m.id)}>
                          選択
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => { setShowSelector(false); setSelectorSearch(''); }}>
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {relatedMatchings.length > 0 && (
            <div className="detail-section">
              <h4><FaUsers style={{ color: 'var(--primary)', marginRight: 4, fontSize: 13 }} />提案中の要員（{relatedMatchings.length}件）</h4>
              <table className="data-table">
                <thead><tr><th>要員名</th><th>ステータス</th><th>提案日</th><th>面談日</th><th>メモ</th></tr></thead>
                <tbody>
                  {relatedMatchings.map(mt => {
                    const m = members.find(x => x.id === mt.member_id);
                    return (
                      <tr key={mt.id}>
                        <td>{m ? (m.full_name || m.initial) : '-'}</td>
                        <td><span className={`badge ${getMatchingBadgeClass(mt.status)}`}>{mt.status}</span></td>
                        <td>{formatDateStr(mt.proposed_date)}</td>
                        <td>{formatDateStr(mt.interview_date)}</td>
                        <td>{truncate(mt.note, 30)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <NotesSection targetTable="projects" targetId={project.id} notes={notes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />
        </div>
      </div>
    </div>
  );
}

// ---- Member Detail Modal ----
interface MemberDetailProps {
  member: Member | null;
  projects: Project[];
  matchings: Matching[];
  notes: Note[];
  onClose: () => void;
  onEdit: () => void;
  onAddNote: (targetTable: string, targetId: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenMatchingForm: (projectId: string, memberId: string) => void;
}

export function MemberDetailModal({ member, projects, matchings, notes, onClose, onEdit, onAddNote, onDeleteNote, onOpenMatchingForm }: MemberDetailProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  if (!member) return null;
  const relatedMatchings = matchings.filter(mt => mt.member_id === member.id);

  const alreadyMatchedProjectIds = new Set(relatedMatchings.map(mt => mt.project_id));
  const filteredProjects = projects.filter(p => {
    if (!selectorSearch) return true;
    const q = selectorSearch.toLowerCase();
    return (
      (p.project_name_rewrite || '').toLowerCase().includes(q) ||
      (p.project_name_original || '').toLowerCase().includes(q) ||
      (p.required_skill_tags || '').toLowerCase().includes(q) ||
      (p.role || '').toLowerCase().includes(q)
    );
  });

  const handleSelectProject = (projectId: string) => {
    onOpenMatchingForm(projectId, member.id);
    setShowSelector(false);
    setSelectorSearch('');
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{member.full_name || member.initial || '要員詳細'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={onEdit} title="編集">
              <FaEdit style={{ marginRight: 4 }} />編集
            </button>
            <button className="modal-close" onClick={onClose}><FaTimes /></button>
          </div>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <h4>基本情報</h4>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-item-label">プロセス</div><div className="detail-item-value"><span className={`badge ${getProcessBadgeClass(member.process)}`}>{member.process}</span></div></div>
              <div className="detail-item">
                <div className="detail-item-label">共有可否</div>
                <div className="detail-item-value">
                  <span className={`badge badge-${(member.shareable || 'ok').toLowerCase()}`}>{member.shareable || '-'}</span>
                  {member.share_note ? `（${member.share_note}）` : ''}
                </div>
              </div>
              <div className="detail-item"><div className="detail-item-label">所属先</div><div className="detail-item-value">{member.affiliation || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">本名</div><div className="detail-item-value">{member.full_name || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">イニシャル</div><div className="detail-item-value">{member.initial || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">希望単価</div><div className="detail-item-value">{formatStructuredPrice(member.desired_price_min, member.desired_price_max) || member.desired_price || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">経験年数</div><div className="detail-item-value">{member.experience_years ? `${member.experience_years}年` : '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">希望ポジション</div><div className="detail-item-value">{member.desired_position || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">最寄駅</div><div className="detail-item-value">{member.nearest_station || '-'}</div></div>
              <div className="detail-item"><div className="detail-item-label">稼働可能日</div><div className="detail-item-value">{formatAvailableDate(member.available_immediately, member.available_date)}</div></div>
              <div className="detail-item"><div className="detail-item-label">勤務形態</div><div className="detail-item-value">
                {(() => {
                  const ws = getStructuredWorkStyle(member.work_style_category, member.work_style_office_days, member.work_style_initial_onsite, member.work_style_note, member.work_preference, member.work_style_transition_onsite);
                  if (ws.category === 'unknown') return '-';
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge work-style-badge ws-${ws.category}`}>{ws.categoryLabel}</span>
                      {ws.officeDaysText && <span className="badge" style={{ fontSize: 11, background: '#e0e7ff', color: '#3730a3' }}>{ws.officeDaysText}</span>}
                      {ws.initialOnsite && <span className="badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e' }}>参画初期出社可</span>}
                      {ws.transitionOnsite && <span className="badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e' }}>過渡期出社可</span>}
                      {ws.notes.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ws.notes.join(' / ')}</span>}
                    </span>
                  );
                })()}
              </div></div>
              <div className="detail-item"><div className="detail-item-label">契約社員化</div><div className="detail-item-value">{member.contract_employee || '-'}</div></div>
              {member.skill_sheet_url && (
                <div className="detail-item full-width">
                  <div className="detail-item-label">スキルシート</div>
                  <div className="detail-item-value">
                    <a href={member.skill_sheet_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>開く →</a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="detail-section">
            <h4>スキル・経験</h4>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <div className="detail-item-label">スキルタグ</div>
                <div className="detail-item-value"><TagsDisplay tags={member.skill_tags} bg="var(--primary-light)" color="var(--primary)" /></div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">業界タグ</div>
                <div className="detail-item-value"><TagsDisplay tags={member.industry_tags} bg="#fef3c7" color="#92400e" /></div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">スキル一覧</div>
                <div className="detail-item-value long-text">{member.skills_summary || '-'}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-item-label">経験一覧</div>
                <div className="detail-item-value long-text">{member.experience_summary || '-'}</div>
              </div>
            </div>
          </div>
          <div className="detail-section">
            <h4>営業コメント</h4>
            <div className="detail-item-value long-text">{member.sales_comment || '-'}</div>
          </div>
          <div className="detail-section">
            <h4><FaHandshake style={{ color: 'var(--primary)', marginRight: 4, fontSize: 13 }} />マッチング登録</h4>
            {!showSelector ? (
              <button className="btn btn-sm btn-primary" onClick={() => setShowSelector(true)}>
                <FaPlus style={{ marginRight: 4 }} />案件を選んでマッチング登録
              </button>
            ) : (
              <div>
                <div className="search-box" style={{ marginBottom: 8 }}>
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="案件名・スキル・職種で絞り込み..."
                    value={selectorSearch}
                    onChange={e => setSelectorSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="selector-list">
                  {filteredProjects.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                      該当する案件がありません
                    </div>
                  ) : filteredProjects.map(p => {
                    const isMatched = alreadyMatchedProjectIds.has(p.id);
                    return (
                      <div key={p.id} className={`selector-item${isMatched ? ' disabled' : ''}`}>
                        <div className="selector-item-info">
                          <span className="selector-item-name">{truncate(p.project_name_rewrite || p.project_name_original || '(案件名なし)', 40)}</span>
                          <span className="selector-item-sub">{p.role || ''}{p.purchase_price ? ` / ${p.purchase_price}` : ''}</span>
                          {isMatched && <span className="badge badge-proposed" style={{ fontSize: 10, padding: '2px 6px' }}>提案済</span>}
                        </div>
                        <button className="btn btn-sm btn-primary" disabled={isMatched} onClick={() => handleSelectProject(p.id)}>
                          選択
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => { setShowSelector(false); setSelectorSearch(''); }}>
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {relatedMatchings.length > 0 && (
            <div className="detail-section">
              <h4><FaBriefcase style={{ color: 'var(--primary)', marginRight: 4, fontSize: 13 }} />提案中の案件（{relatedMatchings.length}件）</h4>
              <table className="data-table">
                <thead><tr><th>案件名</th><th>ステータス</th><th>提案日</th><th>面談日</th><th>メモ</th></tr></thead>
                <tbody>
                  {relatedMatchings.map(mt => {
                    const p = projects.find(x => x.id === mt.project_id);
                    return (
                      <tr key={mt.id}>
                        <td>{p ? truncate(p.project_name_rewrite || p.project_name_original, 30) : '-'}</td>
                        <td><span className={`badge ${getMatchingBadgeClass(mt.status)}`}>{mt.status}</span></td>
                        <td>{formatDateStr(mt.proposed_date)}</td>
                        <td>{formatDateStr(mt.interview_date)}</td>
                        <td>{truncate(mt.note, 30)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <NotesSection targetTable="members" targetId={member.id} notes={notes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />
        </div>
      </div>
    </div>
  );
}
