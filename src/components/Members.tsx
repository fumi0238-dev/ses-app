'use client';

import React, { useState, useMemo } from 'react';
import {
  FaSearch, FaPlus, FaFileImport, FaFileExport,
  FaEdit, FaTrash, FaYenSign, FaMapMarkerAlt,
  FaCalendar, FaUserTie, FaBriefcase,
} from 'react-icons/fa';
import { Member, Matching, Project, MEMBER_PROCESSES, MemberProcess } from '../lib/types';
import { truncate, getProcessBadgeClass, getMatchingBadgeClass } from '../lib/helpers';

interface Props {
  members: Member[];
  matchings: Matching[];
  projects: Project[];
  onAdd: () => void;
  onEdit: (m: Member) => void;
  onDelete: (id: string) => void;
  onDetail: (id: string) => void;
  onProcessChange: (id: string, process: MemberProcess) => void;
  onImport: () => void;
  onExport: () => void;
}

export default function Members({
  members, matchings, projects,
  onAdd, onEdit, onDelete, onDetail, onProcessChange, onImport, onExport,
}: Props) {
  const [search, setSearch] = useState('');
  const [filterProcess, setFilterProcess] = useState('');
  const [filterWorkPref, setFilterWorkPref] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  // 動的にフィルタ選択肢を生成
  const processOptions = useMemo(() => [...new Set(members.map(m => m.process).filter(Boolean))].sort(), [members]);
  const workPrefOptions = useMemo(() => [...new Set(members.map(m => m.work_preference).filter(Boolean))].sort(), [members]);

  const filtered = useMemo(() => {
    let list = [...members];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        (m.full_name || '').toLowerCase().includes(q) ||
        (m.initial || '').toLowerCase().includes(q) ||
        (m.skills_summary || '').toLowerCase().includes(q) ||
        (m.desired_position || '').toLowerCase().includes(q) ||
        (m.affiliation || '').toLowerCase().includes(q) ||
        (m.sales_comment || '').toLowerCase().includes(q)
      );
    }
    if (filterProcess) list = list.filter(m => m.process === filterProcess);
    if (filterWorkPref) list = list.filter(m => m.work_preference === filterWorkPref);
    if (filterAvailability) {
      const now = new Date();
      if (filterAvailability === 'immediate') {
        list = list.filter(m => (m.available_date || '').match(/即日|即/));
      } else if (filterAvailability === 'thisMonth') {
        const monthNames = [`${now.getMonth() + 1}月`, `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`];
        list = list.filter(m => {
          const ad = m.available_date || '';
          return ad.match(/即日|即/) || monthNames.some(mn => ad.includes(mn));
        });
      }
    }
    return list;
  }, [members, search, filterProcess, filterWorkPref, filterAvailability]);

  return (
    <div className="page">
      <div className="page-actions">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="名前・スキル・ポジション・所属で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterProcess} onChange={e => setFilterProcess(e.target.value)}>
            <option value="">プロセス: すべて</option>
            {processOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterWorkPref} onChange={e => setFilterWorkPref(e.target.value)}>
            <option value="">勤務形態: すべて</option>
            {workPrefOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)}>
            <option value="">稼働時期: すべて</option>
            <option value="immediate">即日可能</option>
            <option value="thisMonth">今月中</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><FaPlus /> 要員追加</button>
        <button className="btn btn-secondary" onClick={onImport}><FaFileImport /> インポート</button>
        <button className="btn btn-secondary" onClick={onExport}><FaFileExport /> エクスポート</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ gridColumn: '1/-1' }}>
          <p>該当する要員がいません</p>
        </div>
      ) : (
        <div className="members-grid">
          {filtered.map(m => {
            const skills = m.skill_tags
              ? m.skill_tags.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8)
              : (m.skills_summary || '').split(/[,、/]/).slice(0, 6).map(s => s.trim()).filter(Boolean);

            const activeMatchings = matchings
              .filter(mt => mt.member_id === m.id && mt.status !== '見送り');

            const matchingInfo = activeMatchings.map(mt => {
              const p = projects.find(x => x.id === mt.project_id);
              return {
                name: p ? truncate(p.project_name_rewrite || p.project_name_original, 20) : '不明',
                status: mt.status,
              };
            });

            return (
              <div
                key={m.id}
                className="member-card"
                onClick={() => onDetail(m.id)}
              >
                <div className="member-card-header">
                  <div>
                    <div className="member-name">{m.full_name || m.initial}</div>
                    <div className="member-initial">{m.initial} | {m.affiliation || '-'}</div>
                  </div>
                  <select
                    className={`badge process-select ${getProcessBadgeClass(m.process)}`}
                    value={m.process}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      e.stopPropagation();
                      onProcessChange(m.id, e.target.value as MemberProcess);
                    }}
                  >
                    {MEMBER_PROCESSES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="member-meta">
                  <div className="member-meta-item"><FaYenSign />{m.desired_price || '-'}</div>
                  <div className="member-meta-item"><FaMapMarkerAlt />{m.nearest_station || '-'}</div>
                  <div className="member-meta-item"><FaCalendar />{m.available_date || '-'}</div>
                  <div className="member-meta-item"><FaUserTie />{m.desired_position || '-'}</div>
                </div>

                {matchingInfo.length > 0 && (
                  <div className="member-matching-tags">
                    <FaBriefcase style={{ fontSize: 11, color: 'var(--primary)', marginRight: 4 }} />
                    {matchingInfo.map((mi, i) => (
                      <span
                        key={i}
                        className={`badge ${getMatchingBadgeClass(mi.status)}`}
                        style={{ margin: '1px 2px', fontSize: 10 }}
                      >
                        {mi.name} ({mi.status})
                      </span>
                    ))}
                  </div>
                )}

                <div className="member-skills">
                  {skills.map((s, i) => (
                    <span key={i} className="skill-tag">{s}</span>
                  ))}
                </div>

                <div className="member-card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={e => { e.stopPropagation(); onEdit(m); }}
                  >
                    <FaEdit /> 編集
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={e => { e.stopPropagation(); onDelete(m.id); }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
