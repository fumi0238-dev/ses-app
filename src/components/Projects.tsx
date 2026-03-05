'use client';

import React, { useState, useMemo } from 'react';
import { FaSearch, FaPlus, FaFileImport, FaFileExport, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Project, Matching, PROJECT_STATUSES, SHAREABLE_VALUES, PROJECT_REQUIRED_FIELDS } from '../lib/types';
import { truncate, getMissingFields, formatStructuredPrice } from '../lib/helpers';

/** 案件がOpen状態で指定日数以上経過しているか判定 */
function getDaysOpen(project: Project): number | null {
  if (project.status !== 'Open' || !project.added_date) return null;
  const added = new Date(project.added_date);
  if (isNaN(added.getTime())) return null;
  return Math.floor((Date.now() - added.getTime()) / (1000 * 60 * 60 * 24));
}

interface Props {
  projects: Project[];
  matchings: Matching[];
  onAdd: () => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onDetail: (id: string) => void;
  onImport: () => void;
  onExport: () => void;
  onBulkUpdate: (ids: string[], updates: Partial<Project>) => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortField = 'status' | 'added_date' | 'project_name' | 'purchase_price_num' | 'match_count';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <FaSort className="sort-icon" />;
  return sortDir === 'asc'
    ? <FaSortUp className="sort-icon" style={{ opacity: 1, color: 'var(--primary)' }} />
    : <FaSortDown className="sort-icon" style={{ opacity: 1, color: 'var(--primary)' }} />;
}

export default function Projects({ projects, matchings, onAdd, onEdit, onDelete, onDetail, onImport, onExport, onBulkUpdate, onBulkDelete }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShareable, setFilterShareable] = useState('');
  const [filterWorkstyle, setFilterWorkstyle] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortField, setSortField] = useState<SortField>('added_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkShareable, setBulkShareable] = useState('');

  // 動的にフィルタ選択肢を生成
  const sourceOptions = useMemo(() => [...new Set(projects.map(p => p.source).filter(Boolean))].sort(), [projects]);
  const locationOptions = useMemo(() => [...new Set(projects.map(p => p.location).filter(Boolean))].sort(), [projects]);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.project_name_rewrite || '').toLowerCase().includes(q) ||
        (p.project_name_original || '').toLowerCase().includes(q) ||
        (p.required_skills || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter(p => p.status === filterStatus);
    if (filterShareable) list = list.filter(p => p.shareable === filterShareable);
    if (filterWorkstyle) list = list.filter(p => {
      // 構造化カテゴリ優先、なければ旧テキストでフォールバック
      if (p.work_style_category) return p.work_style_category === filterWorkstyle;
      return (p.work_style || '').includes(filterWorkstyle);
    });
    if (filterSource) list = list.filter(p => p.source === filterSource);
    if (filterLocation) list = list.filter(p => p.location === filterLocation);

    const mult = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortField === 'match_count') {
        const va = matchings.filter(mt => mt.project_id === a.id).length;
        const vb = matchings.filter(mt => mt.project_id === b.id).length;
        return (va - vb) * mult;
      } else if (sortField === 'purchase_price_num') {
        return ((parseFloat(a.purchase_price_num) || 0) - (parseFloat(b.purchase_price_num) || 0)) * mult;
      } else if (sortField === 'project_name') {
        const va = (a.project_name_rewrite || a.project_name_original || '').toLowerCase();
        const vb = (b.project_name_rewrite || b.project_name_original || '').toLowerCase();
        return va.localeCompare(vb) * mult;
      } else {
        return ((a[sortField as keyof Project] as string) || '').localeCompare((b[sortField as keyof Project] as string) || '') * mult;
      }
    });
    return list;
  }, [projects, matchings, search, filterStatus, filterShareable, filterWorkstyle, filterSource, filterLocation, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map(p => p.id)) : new Set());
  };

  const handleBulkApply = () => {
    if (selectedIds.size === 0) return;
    const updates: Partial<Project> = {};
    if (bulkStatus) updates.status = bulkStatus as Project['status'];
    if (bulkShareable) updates.shareable = bulkShareable as Project['shareable'];
    if (Object.keys(updates).length === 0) return;
    onBulkUpdate([...selectedIds], updates);
    setSelectedIds(new Set());
    setBulkStatus('');
    setBulkShareable('');
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件の案件を削除しますか？この操作は取り消せません。`)) return;
    onBulkDelete([...selectedIds]);
    setSelectedIds(new Set());
  };

  return (
    <div className="page">
      <div className="page-actions">
        <div className="search-box">
          <FaSearch />
          <input type="text" placeholder="案件名・スキル・勤務地で検索..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">ステータス: すべて</option>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterShareable} onChange={e => setFilterShareable(e.target.value)}>
            <option value="">共有: すべて</option>
            {SHAREABLE_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterWorkstyle} onChange={e => setFilterWorkstyle(e.target.value)}>
            <option value="">働き方: すべて</option>
            <option value="オンサイト">オンサイト</option>
            <option value="リモート併用">リモート併用</option>
            <option value="フルリモート">フルリモート</option>
          </select>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">案件元: すべて</option>
            {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
            <option value="">勤務地: すべて</option>
            {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><FaPlus /> 案件追加</button>
        <button className="btn btn-secondary" onClick={onImport}><FaFileImport /> インポート</button>
        <button className="btn btn-secondary" onClick={onExport}><FaFileExport /> エクスポート</button>
      </div>

      {/* 件数表示 */}
      <div className="count-bar">
        <span className="count-bar-label">
          {filtered.length === projects.length
            ? <>{projects.length}件</>
            : <>{filtered.length}<span className="count-bar-total"> / {projects.length}</span>件</>
          }
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-count">{selectedIds.size}件選択中</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">ステータス変更...</option>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={bulkShareable} onChange={e => setBulkShareable(e.target.value)}>
            <option value="">共有可否変更...</option>
            {SHAREABLE_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-sm btn-primary" onClick={handleBulkApply}><FaCheck /> 適用</button>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}><FaTrash /> 削除</button>
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}><FaTimes /> 解除</button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table" id="projects-table">
          <thead>
            <tr>
              <th className="th-check">
                <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filtered.length} onChange={e => toggleAll(e.target.checked)} />
              </th>
              <th className="sortable" onClick={() => handleSort('status')}>ステータス <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></th>
              <th>共有</th>
              <th className="sortable" onClick={() => handleSort('added_date')}>追加日 <SortIcon field="added_date" sortField={sortField} sortDir={sortDir} /></th>
              <th className="sortable" onClick={() => handleSort('project_name')}>案件名 <SortIcon field="project_name" sortField={sortField} sortDir={sortDir} /></th>
              <th>募集職種</th>
              <th>勤務地</th>
              <th>働き方</th>
              <th>出社頻度</th>
              <th>期間</th>
              <th className="sortable" onClick={() => handleSort('purchase_price_num')}>仕入単価 <SortIcon field="purchase_price_num" sortField={sortField} sortDir={sortDir} /></th>
              <th>元単価</th>
              <th>案件元</th>
              <th className="sortable" onClick={() => handleSort('match_count')}>提案 <SortIcon field="match_count" sortField={sortField} sortDir={sortDir} /></th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={15} className="empty-state"><h3>該当する案件がありません</h3><p>検索条件を変更するか、新しい案件を追加してください</p></td></tr>
            ) : filtered.map(p => {
              const matchCount = matchings.filter(mt => mt.project_id === p.id).length;
              const missingLabels = getMissingFields(p, PROJECT_REQUIRED_FIELDS);
              const hasMissing = missingLabels.length > 0;
              return (
                <tr key={p.id}>
                  <td className="th-check">
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td><span className={`badge badge-${(p.status || 'open').toLowerCase()}`}>{p.status}</span></td>
                  <td><span className={`badge badge-${(p.shareable || 'ok').toLowerCase()}`}>{p.shareable}</span></td>
                  <td>{p.added_date || '-'}</td>
                  <td>
                    <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }} onClick={e => { e.preventDefault(); onDetail(p.id); }}>
                      {truncate(p.project_name_rewrite || p.project_name_original, 30)}
                    </a>
                    {hasMissing && (
                      <span
                        className="badge badge-missing"
                        data-tooltip={`未入力: ${missingLabels.join(', ')}`}
                        title={`未入力: ${missingLabels.join(', ')}`}
                        style={{ marginLeft: 6, verticalAlign: 'middle', position: 'relative', top: -1 }}
                      >
                        未入力あり
                      </span>
                    )}
                    {(() => {
                      const days = getDaysOpen(p);
                      if (days !== null && days >= 30) {
                        return (
                          <span
                            className="badge badge-long-open"
                            title={`${days}日間Openのままです`}
                            style={{ marginLeft: 6, verticalAlign: 'middle', position: 'relative', top: -1 }}
                          >
                            <FaExclamationTriangle style={{ fontSize: 10, marginRight: 3 }} />
                            {days}日
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </td>
                  <td>{truncate(p.role, 20)}</td>
                  <td>{p.location || '-'}</td>
                  <td>{p.work_style_category || p.work_style || '-'}</td>
                  <td>{p.work_style_office_days ? `週${p.work_style_office_days}日` : '-'}</td>
                  <td>{p.period || '-'}</td>
                  <td>{formatStructuredPrice(p.purchase_price_min, p.purchase_price_max) || p.purchase_price || '-'}</td>
                  <td>{formatStructuredPrice(p.client_price_min, p.client_price_max) || p.client_price || '-'}</td>
                  <td>{truncate(p.source, 15)}</td>
                  <td>
                    {matchCount > 0
                      ? <span className="badge badge-proposed">{matchCount}件</span>
                      : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>-</span>
                    }
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(p)} style={{ marginRight: 4 }}><FaEdit /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(p.id)}><FaTrash /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
