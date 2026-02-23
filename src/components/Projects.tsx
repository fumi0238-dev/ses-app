'use client';

import React, { useState, useMemo } from 'react';
import { FaSearch, FaPlus, FaFileImport, FaFileExport, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaCheck, FaTimes } from 'react-icons/fa';
import { Project, Matching, PROJECT_STATUSES, SHAREABLE_VALUES } from '../lib/types';
import { truncate } from '../lib/helpers';

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
}

type SortField = 'status' | 'added_date' | 'project_name' | 'purchase_price_num' | 'match_count';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <FaSort className="sort-icon" />;
  return sortDir === 'asc'
    ? <FaSortUp className="sort-icon" style={{ opacity: 1, color: 'var(--primary)' }} />
    : <FaSortDown className="sort-icon" style={{ opacity: 1, color: 'var(--primary)' }} />;
}

export default function Projects({ projects, matchings, onAdd, onEdit, onDelete, onDetail, onImport, onExport, onBulkUpdate }: Props) {
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
    if (filterWorkstyle) list = list.filter(p => (p.work_style || '').includes(filterWorkstyle));
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
              <th className="sortable" onClick={() => handleSort('purchase_price_num')}>仕入単価 <SortIcon field="purchase_price_num" sortField={sortField} sortDir={sortDir} /></th>
              <th>案件元</th>
              <th className="sortable" onClick={() => handleSort('match_count')}>提案 <SortIcon field="match_count" sortField={sortField} sortDir={sortDir} /></th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} className="empty-state"><p>該当する案件がありません</p></td></tr>
            ) : filtered.map(p => {
              const matchCount = matchings.filter(mt => mt.project_id === p.id).length;
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
                  </td>
                  <td>{truncate(p.role, 20)}</td>
                  <td>{p.location || '-'}</td>
                  <td>{p.work_style || '-'}</td>
                  <td>{p.purchase_price || '-'}</td>
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
