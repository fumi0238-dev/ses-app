'use client';

import React, { useState } from 'react';
import {
  FaBriefcase, FaUsers, FaMagic, FaList,
  FaEdit, FaTrash, FaEye, FaPlus, FaRegCalendarAlt,
} from 'react-icons/fa';
import { Project, Member, Matching, MATCHING_STATUSES } from '../lib/types';
import { truncate, formatDateStr } from '../lib/helpers';
import { doMatching } from '../lib/matching';

interface Props {
  projects: Project[];
  members: Member[];
  matchings: Matching[];
  onOpenMatchingForm: (projectId: string, memberId: string) => void;
  onEditMatching: (mt: Matching) => void;
  onDeleteMatching: (id: string) => void;
  onQuickStatusUpdate: (id: string, status: string) => void;
  onUpdateMatchingField: (id: string, data: Partial<Matching>) => Promise<void>;
  onShowMember: (id: string) => void;
}

export default function MatchingPage({
  projects, members, matchings,
  onOpenMatchingForm, onEditMatching, onDeleteMatching, onQuickStatusUpdate, onUpdateMatchingField, onShowMember,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [matchResults, setMatchResults] = useState<ReturnType<typeof doMatching>>([]);
  const [hasMatched, setHasMatched] = useState(false);
  const [editingDateCell, setEditingDateCell] = useState<{ id: string; field: 'proposed_date' | 'interview_date' } | null>(null);

  const openProjects = projects.filter(p => p.status === 'Open');
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    setMatchResults([]);
    setHasMatched(false);
  };

  const handleDoMatch = () => {
    if (!selectedProject) return;
    const results = doMatching(selectedProject, members, matchings);
    setMatchResults(results);
    setHasMatched(true);
  };

  return (
    <div className="page">
      {/* Matching Panel */}
      <div className="matching-layout">
        {/* Left: Project selector */}
        <div className="matching-panel">
          <div className="panel-header">
            <h3><FaBriefcase /> 案件を選択</h3>
          </div>
          <div className="panel-body">
            <select
              className="full-select"
              value={selectedProjectId}
              onChange={handleProjectChange}
            >
              <option value="">-- 案件を選択 --</option>
              {openProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {truncate(p.project_name_rewrite || p.project_name_original, 50)}
                </option>
              ))}
            </select>

            {selectedProject && (
              <div className="detail-box">
                <div className="detail-row">
                  <span className="detail-label">職種</span>
                  <span className="detail-value">{selectedProject.role || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">勤務地</span>
                  <span className="detail-value">{selectedProject.location || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">働き方</span>
                  <span className="detail-value">{selectedProject.work_style || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">仕入単価</span>
                  <span className="detail-value">{selectedProject.purchase_price || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">必須タグ</span>
                  <span className="detail-value">
                    {selectedProject.required_skill_tags
                      ? selectedProject.required_skill_tags.split(',').map((t, i) => (
                        <span key={i} className="skill-tag" style={{ background: '#d1fae5', color: '#065f46', marginRight: 4 }}>{t.trim()}</span>
                      ))
                      : (truncate(selectedProject.required_skills, 80) || '-')
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">尚可タグ</span>
                  <span className="detail-value">
                    {selectedProject.preferred_skill_tags
                      ? selectedProject.preferred_skill_tags.split(',').map((t, i) => (
                        <span key={i} className="skill-tag" style={{ background: '#dbeafe', color: '#1e40af', marginRight: 4 }}>{t.trim()}</span>
                      ))
                      : (truncate(selectedProject.preferred_skills, 80) || '-')
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Match button */}
        <div className="matching-center">
          <button
            className="btn btn-match"
            disabled={!selectedProjectId}
            onClick={handleDoMatch}
          >
            <FaMagic />
            <span>マッチング実行</span>
          </button>
        </div>

        {/* Right: Candidates */}
        <div className="matching-panel">
          <div className="panel-header">
            <h3><FaUsers /> 候補要員</h3>
          </div>
          <div className="panel-body">
            {!hasMatched ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FaMagic /></div>
                <h3>マッチング待ち</h3>
                <p>左のパネルから案件を選択して「マッチング実行」を押してください</p>
              </div>
            ) : matchResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FaUsers /></div>
                <h3>該当者なし</h3>
                <p>マッチする要員が見つかりませんでした</p>
              </div>
            ) : (
              <div className="matching-results">
                {matchResults.map(({ member: m, score, matchedRequired, matchedPreferred, matchedSimilar, matchedIndustry, penalties, priceNote, isExisting, reqCoverage, workStyleNote }) => (
                  <div
                    key={m.id}
                    className="match-candidate"
                    style={{ opacity: isExisting ? 0.55 : 1 }}
                  >
                    <div className="match-candidate-header">
                      <span className="match-candidate-name">
                        {m.full_name || m.initial}
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}> (スコア: {score.toFixed(1)})</span>
                        {reqCoverage !== null && (
                          <span style={{
                            fontSize: 11,
                            marginLeft: 6,
                            color: reqCoverage >= 70 ? 'var(--success)' : reqCoverage >= 40 ? 'var(--warning)' : 'var(--danger)',
                          }}>
                            必須{reqCoverage}%
                          </span>
                        )}
                        {priceNote && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--text-secondary)' }}>💰{priceNote}</span>}
                        {isExisting && <span className="badge badge-interviewing" style={{ marginLeft: 6, fontSize: 10 }}>提案済</span>}
                      </span>
                      <span className="match-candidate-price">
                        {m.desired_price || '-'}{m.experience_years ? ` / ${m.experience_years}年` : ''}
                      </span>
                    </div>

                    <div className="match-candidate-skills">
                      {matchedRequired.length > 0 && (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>必須:</span>{' '}
                          {matchedRequired.map((t, i) => <span key={i} className="skill-tag" style={{ background: '#d1fae5', color: '#065f46', marginRight: 4 }}>{t}</span>)}
                        </>
                      )}
                      {matchedPreferred.length > 0 && (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)' }}>尚可:</span>{' '}
                          {matchedPreferred.map((t, i) => <span key={i} className="skill-tag" style={{ background: '#dbeafe', color: '#1e40af', marginRight: 4 }}>{t}</span>)}
                        </>
                      )}
                      {matchedSimilar.length > 0 && (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>類似:</span>{' '}
                          {matchedSimilar.map((t, i) => <span key={i} className="skill-tag" style={{ background: '#ede9fe', color: '#6b21a8', marginRight: 4 }}>{t}</span>)}
                        </>
                      )}
                      {matchedIndustry.length > 0 && (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>業界:</span>{' '}
                          {matchedIndustry.map((t, i) => <span key={i} className="skill-tag" style={{ background: '#fef3c7', color: '#92400e', marginRight: 4 }}>{t}</span>)}
                        </>
                      )}
                      {matchedRequired.length === 0 && matchedPreferred.length === 0 && matchedSimilar.length === 0 && (
                        truncate(m.skills_summary, 100)
                      )}
                    </div>

                    {workStyleNote && !penalties.some(p => p.includes('働き方')) && (
                      <div style={{ fontSize: 11, marginTop: 4, color: workStyleNote.includes('◎') ? 'var(--success)' : workStyleNote.includes('○') ? 'var(--info)' : 'var(--text-secondary)' }}>
                        🏠 {workStyleNote}
                      </div>
                    )}

                    {penalties.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                        ⚠ {penalties.join(' / ')}
                      </div>
                    )}

                    <div className="match-candidate-actions">
                      {!isExisting && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onOpenMatchingForm(selectedProjectId, m.id)}
                        >
                          <FaPlus /> マッチング登録
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => onShowMember(m.id)}>
                        <FaEye /> 詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matching History */}
      <div className="card mt-20">
        <div className="card-header">
          <h3><FaList /> マッチング履歴</h3>
          <span className="count-bar-label" style={{ marginLeft: 12, fontSize: 13 }}>{matchings.length}件</span>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>案件名</th>
                <th>要員名</th>
                <th>ステータス</th>
                <th>提案日</th>
                <th>面談日</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {matchings.length === 0 ? (
                <tr><td colSpan={7} className="empty-state"><h3>マッチング履歴がありません</h3><p>マッチング実行後に結果が表示されます</p></td></tr>
              ) : matchings.map(mt => {
                const p = projects.find(x => x.id === mt.project_id);
                const m = members.find(x => x.id === mt.member_id);
                return (
                  <tr key={mt.id}>
                    <td>{truncate(p ? (p.project_name_rewrite || p.project_name_original) : '-', 25)}</td>
                    <td>{m ? (m.full_name || m.initial) : '-'}</td>
                    <td>
                      <select
                        className="inline-status-select"
                        value={mt.status}
                        onChange={e => onQuickStatusUpdate(mt.id, e.target.value)}
                      >
                        {MATCHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      {editingDateCell?.id === mt.id && editingDateCell?.field === 'proposed_date' ? (
                        <input
                          type="date"
                          className="inline-date-input"
                          defaultValue={(mt.proposed_date || '').replace(/\//g, '-')}
                          ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
                          onChange={e => { onUpdateMatchingField(mt.id, { proposed_date: e.target.value }); setEditingDateCell(null); }}
                          onBlur={() => setEditingDateCell(null)}
                        />
                      ) : (
                        <span
                          className={`inline-date-badge${mt.proposed_date ? '' : ' empty'}`}
                          onClick={() => setEditingDateCell({ id: mt.id, field: 'proposed_date' })}
                          title="クリックで日付選択"
                        >
                          {mt.proposed_date ? formatDateStr(mt.proposed_date) : <FaRegCalendarAlt style={{ opacity: 0.4, fontSize: 12 }} />}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingDateCell?.id === mt.id && editingDateCell?.field === 'interview_date' ? (
                        <input
                          type="date"
                          className="inline-date-input"
                          defaultValue={(mt.interview_date || '').replace(/\//g, '-')}
                          ref={el => { if (el) { el.focus(); setTimeout(() => { try { el.showPicker(); } catch { /* ignore */ } }, 50); } }}
                          onChange={e => { onUpdateMatchingField(mt.id, { interview_date: e.target.value }); setEditingDateCell(null); }}
                          onBlur={() => setEditingDateCell(null)}
                        />
                      ) : (
                        <span
                          className={`inline-date-badge${mt.interview_date ? '' : ' empty'}`}
                          onClick={() => setEditingDateCell({ id: mt.id, field: 'interview_date' })}
                          title="クリックで日付選択"
                        >
                          {mt.interview_date ? formatDateStr(mt.interview_date) : <FaRegCalendarAlt style={{ opacity: 0.4, fontSize: 12 }} />}
                        </span>
                      )}
                    </td>
                    <td>{truncate(mt.note, 30)}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" style={{ marginRight: 4 }} onClick={() => onEditMatching(mt)}><FaEdit /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => onDeleteMatching(mt.id)}><FaTrash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="matching-legend">
            {[
              { cls: 'badge-candidate', label: '候補' },
              { cls: 'badge-proposed', label: '提案中' },
              { cls: 'badge-interviewing', label: '面談調整中' },
              { cls: 'badge-interviewed', label: '面談済' },
              { cls: 'badge-offered', label: '内定' },
              { cls: 'badge-decided', label: '参画決定' },
              { cls: 'badge-rejected', label: '見送り' },
            ].map(({ cls, label }) => (
              <span key={label} className="legend-item">
                <span className={`badge ${cls}`}>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
