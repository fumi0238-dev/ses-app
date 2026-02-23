'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FaTimes, FaFileExcel, FaFileCsv, FaCode, FaPaste, FaCloudUploadAlt, FaArrowRight, FaFileAlt, FaColumns, FaEye, FaCheck, FaUndo, FaDatabase, FaCopy } from 'react-icons/fa';

type ImportTarget = 'projects' | 'members';
type TabType = 'excel' | 'csv' | 'json' | 'text';

const FIELD_DEFS = {
  projects: [
    { key: 'status', label: 'ステータス' }, { key: 'shareable', label: '共有可否' }, { key: 'share_note', label: '共有NG理由' },
    { key: 'added_date', label: '追加日' }, { key: 'source', label: '案件元/ツール' },
    { key: 'project_name_original', label: '案件名(原文)' }, { key: 'project_name_rewrite', label: '案件名(リライト)' },
    { key: 'client_price', label: '元単価' }, { key: 'purchase_price', label: '仕入単価' },
    { key: 'purchase_price_num', label: '仕入単価(数値・万円)' }, { key: 'role', label: '募集職種' },
    { key: 'location', label: '勤務地' }, { key: 'work_style', label: '働き方' }, { key: 'period', label: '期間' },
    { key: 'headcount', label: '募集人数' }, { key: 'required_skills', label: '必須スキル' }, { key: 'preferred_skills', label: '尚可スキル' },
    { key: 'required_skill_tags', label: '必須スキルタグ' }, { key: 'preferred_skill_tags', label: '尚可スキルタグ' },
    { key: 'industry_tags', label: '業界タグ' }, { key: 'required_experience_years', label: '必要経験年数' },
    { key: 'age_limit', label: '年齢制限' }, { key: 'nationality', label: '外国籍可否' },
    { key: 'english', label: '英語要件' }, { key: 'commercial_flow', label: '商流制限' }, { key: 'interview_count', label: '面談回数' },
  ],
  members: [
    { key: 'process', label: 'プロセス' }, { key: 'affiliation', label: '所属先/経由元' },
    { key: 'full_name', label: '要員名（本名）' }, { key: 'initial', label: 'イニシャル' },
    { key: 'contract_employee', label: '契約社員化' }, { key: 'desired_price', label: '希望単価' },
    { key: 'desired_price_num', label: '希望単価(数値・万円)' }, { key: 'contact', label: '連絡先' },
    { key: 'desired_position', label: '希望ポジション' }, { key: 'skill_sheet_url', label: 'スキルシートURL' },
    { key: 'skill_tags', label: 'スキルタグ' }, { key: 'industry_tags', label: '業界タグ' },
    { key: 'experience_years', label: '経験年数' }, { key: 'sales_comment', label: '営業コメント' },
    { key: 'skills_summary', label: 'スキル一覧' }, { key: 'experience_summary', label: '経験一覧' },
    { key: 'nearest_station', label: '最寄駅' }, { key: 'available_date', label: '稼働可能日' },
    { key: 'work_preference', label: '勤務形態希望' },
  ],
};

const AUTO_MAP: Record<ImportTarget, Record<string, string>> = {
  projects: {
    'ステータス': 'status', '共有可否': 'shareable', '追加日': 'added_date', '案件元': 'source',
    '案件元/ツール': 'source', '案件名(原文)': 'project_name_original', '案件名(リライト)': 'project_name_rewrite',
    '元単価': 'client_price', '仕入単価': 'purchase_price', '仕入単価(数値)': 'purchase_price_num',
    '仕入単価(万円)': 'purchase_price_num', '募集職種': 'role', '勤務地': 'location', '働き方': 'work_style',
    '期間': 'period', '募集人数': 'headcount', '必須スキル': 'required_skills', '尚可スキル': 'preferred_skills',
    '年齢制限': 'age_limit', '外国籍': 'nationality', '外国籍可否': 'nationality', '英語': 'english',
    '英語要件': 'english', '商流制限': 'commercial_flow', '面談回数': 'interview_count', '面談': 'interview_count',
    '必須スキルタグ': 'required_skill_tags', '尚可スキルタグ': 'preferred_skill_tags', '業界タグ': 'industry_tags',
    '業界': 'industry_tags', '必要経験年数': 'required_experience_years',
  },
  members: {
    'プロセス': 'process', '所属先/経由元': 'affiliation', '所属先': 'affiliation',
    '要員名（本名）': 'full_name', '要員名': 'full_name', 'イニシャル': 'initial',
    '契約社員化': 'contract_employee', '希望単価': 'desired_price', '連絡先': 'contact',
    '希望ポジション': 'desired_position', 'スキルシート': 'skill_sheet_url', 'スキルシートURL': 'skill_sheet_url',
    '営業コメント': 'sales_comment', 'スキル一覧': 'skills_summary', '経験一覧': 'experience_summary',
    '最寄駅': 'nearest_station', '稼働可能日': 'available_date', '勤務形態': 'work_preference',
    '勤務形態希望': 'work_preference', 'スキルタグ': 'skill_tags', '業界タグ': 'industry_tags',
    '業界': 'industry_tags', '経験年数': 'experience_years', '希望単価(数値)': 'desired_price_num',
    '希望単価(万円)': 'desired_price_num',
  },
};

interface Props {
  target: ImportTarget | null;
  onClose: () => void;
  onImport: (table: ImportTarget, records: Record<string, string>[], mode: 'append' | 'replace') => void;
  onToast: (msg: string) => void;
}

function truncateStr(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export default function ImportModal({ target, onClose, onImport, onToast }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('excel');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [jsonText, setJsonText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textHasHeader, setTextHasHeader] = useState(true);
  const [textDelimiter, setTextDelimiter] = useState<'tab' | 'comma'>('tab');
  const [excelLoaded, setExcelLoaded] = useState<string | null>(null);
  const [csvLoaded, setCsvLoaded] = useState<string | null>(null);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const excelInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const autoMap = useCallback((headers: string[], tgt: ImportTarget) => {
    const maps = AUTO_MAP[tgt] || {};
    const fields = FIELD_DEFS[tgt] || [];
    const mapping: Record<string, string> = {};
    headers.forEach(h => {
      const clean = h.trim();
      if (maps[clean]) { mapping[h] = maps[clean]; return; }
      const directMatch = fields.find(f => f.key === clean);
      if (directMatch) mapping[h] = directMatch.key;
    });
    return mapping;
  }, []);

  const parseAndShow = (headers: string[], rows: Record<string, string>[]) => {
    if (!target) return;
    setParsedHeaders(headers);
    setParsedRows(rows);
    setColumnMapping(autoMap(headers, target));
    setShowPreview(true);
  };

  const parseCSVText = (text: string, delimiter = ','): { headers: string[]; rows: Record<string, string>[] } => {
    const lines: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuote) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuote = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQuote = true; }
        else if (ch === delimiter) { current.push(field); field = ''; }
        else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
          current.push(field); field = '';
          if (current.some(c => c.trim())) lines.push(current);
          current = [];
          if (ch === '\r') i++;
        } else { field += ch; }
      }
    }
    current.push(field);
    if (current.some(c => c.trim())) lines.push(current);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].map(h => h.trim());
    const rows = lines.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { headers, rows };
  };

  const handleExcelFile = async (file: File) => {
    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: unknown[][] = utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
      if (raw.length < 2) { onToast('データが不足しています'); return; }
      const firstCol = raw.map(r => String(r[0] || '').trim());
      const knownHeaders = target ? Object.keys(AUTO_MAP[target] || {}) : [];
      const matchCount = firstCol.filter(v => knownHeaders.includes(v)).length;
      let headers: string[];
      let rows: Record<string, string>[];
      if (matchCount >= 3 && matchCount > (raw[0] as unknown[]).filter(v => knownHeaders.includes(String(v || '').trim())).length) {
        headers = firstCol;
        rows = [];
        for (let col = 1; col < (raw[0] as unknown[]).length; col++) {
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { if (h) row[h] = raw[i] ? String((raw[i] as unknown[])[col] || '') : ''; });
          rows.push(row);
        }
        headers = headers.filter(Boolean);
      } else {
        headers = (raw[0] as unknown[]).map(h => String(h || '').trim());
        rows = raw.slice(1).map(r => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => { obj[h] = String((r as unknown[])[i] || ''); });
          return obj;
        }).filter(r => Object.values(r).some(v => v));
      }
      setExcelLoaded(file.name);
      parseAndShow(headers, rows);
    } catch (err) {
      onToast('Excelの読み込みに失敗しました');
      console.error(err);
    }
  };

  const handleCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSVText(text);
      if (!headers.length) { onToast('データが不足しています'); return; }
      setCsvLoaded(file.name);
      parseAndShow(headers, rows);
    };
    reader.onerror = () => {
      onToast('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleParseJSON = () => {
    try {
      const data = JSON.parse(jsonText.trim());
      if (!Array.isArray(data) || data.length === 0) { onToast('JSON配列形式で1件以上のデータが必要です'); return; }
      const headers = [...new Set(data.flatMap((d: Record<string, unknown>) => Object.keys(d)))] as string[];
      const rows = data.map((d: Record<string, unknown>) => {
        const obj: Record<string, string> = {};
        headers.forEach(h => { obj[h] = String(d[h] || ''); });
        return obj;
      });
      parseAndShow(headers, rows);
    } catch (err) {
      onToast('JSONの解析に失敗しました');
      console.error(err);
    }
  };

  const handleParseText = () => {
    if (!textInput.trim()) { onToast('テキストを入力してください'); return; }
    const delim = textDelimiter === 'tab' ? '\t' : ',';
    const lines = textInput.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
    if (lines.length < (textHasHeader ? 2 : 1)) { onToast('データが不足しています'); return; }
    const splitLines = lines.map(l => l.split(delim));
    let headers: string[];
    let rows: Record<string, string>[];
    if (textHasHeader) {
      headers = splitLines[0].map(h => h.trim());
      rows = splitLines.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
        return obj;
      }).filter(r => Object.values(r).some(v => v));
    } else {
      headers = splitLines[0].map((_, i) => `列${i + 1}`);
      rows = splitLines.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
        return obj;
      }).filter(r => Object.values(r).some(v => v));
    }
    parseAndShow(headers, rows);
  };

  const handleCopyTemplate = () => {
    if (!target) return;
    const fields = FIELD_DEFS[target] || [];
    const sample: Record<string, string> = {};
    fields.forEach(f => { sample[f.key] = ''; });
    const template = JSON.stringify([sample], null, 2);
    navigator.clipboard.writeText(template)
      .then(() => onToast('テンプレートをクリップボードにコピーしました'))
      .catch(() => { setJsonText(template); onToast('テンプレートをテキストエリアに挿入しました'); });
  };

  const handleImport = async () => {
    if (!target) return;
    const fields = FIELD_DEFS[target] || [];
    const mappedFields = Object.entries(columnMapping)
      .filter(([, v]) => fields.find(f => f.key === v))
      .map(([source, targetKey]) => ({ source, target: targetKey }));
    if (mappedFields.length === 0) { onToast('カラムマッピングを設定してください'); return; }
    const records = parsedRows.map(row => {
      const rec: Record<string, string> = {};
      mappedFields.forEach(({ source, target: t }) => { rec[t] = row[source] || ''; });
      return rec;
    }).filter(r => Object.values(r).some(v => v));
    if (records.length === 0) { onToast('インポート可能なデータがありません'); return; }
    setIsImporting(true);
    setImportProgress('インポート中...');
    onImport(target, records, importMode);
    onToast(`${records.length}件のデータをインポートしました`);
    setIsImporting(false);
    onClose();
  };

  const resetPreview = () => {
    setShowPreview(false);
    setParsedHeaders([]);
    setParsedRows([]);
    setColumnMapping({});
    setExcelLoaded(null);
    setCsvLoaded(null);
  };

  const mappedFields = target
    ? Object.entries(columnMapping)
        .filter(([, v]) => (FIELD_DEFS[target] || []).find(f => f.key === v))
        .map(([source, targetKey]) => ({ source, target: targetKey, label: (FIELD_DEFS[target] || []).find(f => f.key === targetKey)?.label || targetKey }))
    : [];

  if (!target) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <h2>{target === 'projects' ? '案件データ インポート' : '要員データ インポート'}</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <div className="import-tabs">
            {(['excel', 'csv', 'json', 'text'] as TabType[]).map(tab => (
              <button key={tab} className={`import-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'excel' && <><FaFileExcel /> Excel</>}
                {tab === 'csv' && <><FaFileCsv /> CSV</>}
                {tab === 'json' && <><FaCode /> JSON</>}
                {tab === 'text' && <><FaPaste /> テキスト貼り付け</>}
              </button>
            ))}
          </div>

          {activeTab === 'excel' && (
            <div
              className={`drop-zone${isDraggingExcel ? ' drop-zone-active' : ''}${excelLoaded ? ' drop-zone-loaded' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDraggingExcel(true); }}
              onDragLeave={() => setIsDraggingExcel(false)}
              onDrop={e => { e.preventDefault(); setIsDraggingExcel(false); const f = e.dataTransfer.files[0]; if (f) handleExcelFile(f); }}
              onClick={() => excelInputRef.current?.click()}
            >
              <FaCloudUploadAlt className="upload-icon" style={{ fontSize: 48, color: 'var(--primary)', opacity: 0.5, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              {excelLoaded
                ? <p className="drop-zone-filename">✓ {excelLoaded}</p>
                : <><p>Excelファイルをドラッグ&ドロップ<br />または クリックしてファイル選択</p><p className="drop-hint">.xlsx / .xls 対応</p></>
              }
              <input ref={excelInputRef} type="file" accept=".xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); }} />
            </div>
          )}

          {activeTab === 'csv' && (
            <div
              className={`drop-zone${isDraggingCsv ? ' drop-zone-active' : ''}${csvLoaded ? ' drop-zone-loaded' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDraggingCsv(true); }}
              onDragLeave={() => setIsDraggingCsv(false)}
              onDrop={e => { e.preventDefault(); setIsDraggingCsv(false); const f = e.dataTransfer.files[0]; if (f) handleCSVFile(f); }}
              onClick={() => csvInputRef.current?.click()}
            >
              <FaCloudUploadAlt className="upload-icon" style={{ fontSize: 48, color: 'var(--primary)', opacity: 0.5, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              {csvLoaded
                ? <p className="drop-zone-filename">✓ {csvLoaded}</p>
                : <><p>CSVファイルをドラッグ&ドロップ<br />または クリックしてファイル選択</p><p className="drop-hint">.csv / .tsv 対応（UTF-8推奨）</p></>
              }
              <input ref={csvInputRef} type="file" accept=".csv,.tsv,.txt" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); }} />
            </div>
          )}

          {activeTab === 'json' && (
            <div className="import-text-area">
              <div className="json-header-row">
                <label>JSONデータを貼り付け（配列形式）</label>
                <button className="btn btn-sm btn-secondary" onClick={handleCopyTemplate}><FaCopy /> テンプレートをコピー</button>
              </div>
              <textarea rows={12} value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder={'[\n  {"status": "Open", ...},\n  ...\n]'} />
              <button className="btn btn-primary" onClick={handleParseJSON}><FaCheck /> JSONを解析</button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="import-text-area">
              <label>テキストデータを貼り付け（タブ区切り / Excelからのコピペ）</label>
              <textarea rows={12} value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Excelからコピーした内容をそのまま貼り付けてください。&#10;1行目がヘッダー行として扱われます。" />
              <div className="text-options">
                <label>
                  <input type="checkbox" checked={textHasHeader} onChange={e => setTextHasHeader(e.target.checked)} />
                  1行目をヘッダーとして使用
                </label>
                <select value={textDelimiter} onChange={e => setTextDelimiter(e.target.value as 'tab' | 'comma')}>
                  <option value="tab">区切り文字: タブ（Excel標準）</option>
                  <option value="comma">区切り文字: カンマ</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleParseText}><FaCheck /> テキストを解析</button>
            </div>
          )}

          {showPreview && (
            <div>
              <div className="import-mapping-header">
                <h3><FaColumns /> カラムマッピング</h3>
                <p className="import-count">検出データ: <strong>{parsedRows.length}</strong>行</p>
              </div>
              <div className="mapping-grid">
                {parsedHeaders.map(h => (
                  <div key={h} className="mapping-item">
                    <div className="mapping-source" title={h}>
                      <FaFileAlt />
                      <span>{truncateStr(h, 20)}</span>
                    </div>
                    <div className="mapping-arrow"><FaArrowRight /></div>
                    <select
                      className="mapping-select"
                      value={columnMapping[h] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setColumnMapping(prev => {
                          const next = { ...prev };
                          if (val) next[h] = val;
                          else delete next[h];
                          return next;
                        });
                      }}
                    >
                      <option value="">-- スキップ --</option>
                      {(FIELD_DEFS[target] || []).map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="import-preview-header">
                <h3><FaEye /> プレビュー（先頭5件）</h3>
              </div>
              <div className="import-preview-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>{mappedFields.map(f => <th key={f.target}>{f.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {mappedFields.map(f => <td key={f.target} title={row[f.source] || ''}>{truncateStr(row[f.source] || '', 40)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-actions">
                <span className="import-mode-label">モード:</span>
                <select value={importMode} onChange={e => setImportMode(e.target.value as 'append' | 'replace')}>
                  <option value="append">追加（既存データに追加）</option>
                  <option value="replace">置換（既存データを全削除して入れ替え）</option>
                </select>
                <button className="btn btn-secondary" id="btn-import-reset" onClick={resetPreview}><FaUndo /> やり直し</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={isImporting}>
                  <FaDatabase /> {isImporting ? importProgress : 'インポート実行'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
