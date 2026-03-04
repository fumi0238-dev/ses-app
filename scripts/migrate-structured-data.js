/**
 * データ移行スクリプト: 既存テキストフィールド → 構造化フィールド
 *
 * 実行: node scripts/migrate-structured-data.js
 *
 * 対象:
 *   - projects: client_price, purchase_price → min/max, work_style → 構造化
 *   - members:  desired_price → min/max, work_preference → 構造化
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

// ===================== 単価パーサー =====================

function parsePriceRange(text) {
  if (!text) return { min: 0, max: 0 };
  // 全角数字→半角、全角チルダ→半角
  let t = text.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30));
  t = t.replace(/〜/g, '～').replace(/～/g, '~');
  // "～80万円" パターン
  const upTo = t.match(/^[~～](\d+)/);
  if (upTo) return { min: 0, max: parseInt(upTo[1]) };
  // "110～130万円" パターン
  const range = t.match(/(\d+)\s*[~～\-ー−–]\s*(\d+)/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  // "110万円～" パターン
  const from = t.match(/(\d+)\s*万円?\s*[~～]$/);
  if (from) return { min: parseInt(from[1]), max: 0 };
  // "110万円～" パターン (文の途中)
  const fromMid = t.match(/(\d+)\s*万円?\s*[~～]/);
  if (fromMid) return { min: parseInt(fromMid[1]), max: 0 };
  // "105万円" 単独
  const single = t.match(/(\d+)\s*万/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return { min: 0, max: 0 };
}

// ===================== 働き方パーサー =====================

function parseWorkStyle(text) {
  if (!text) return { category: null, officeDays: null, initialOnsite: false, note: null };
  const t = text.trim();
  // ゴミデータ除外
  if (t.startsWith('■') || t.includes('万円')) {
    return { category: null, officeDays: null, initialOnsite: false, note: null };
  }
  if (/確認中/.test(t)) {
    return { category: null, officeDays: null, initialOnsite: false, note: null };
  }

  let category = null;
  if (/フルリモ|基本リモート|完全リモート|原則リモート/.test(t)) category = 'フルリモート';
  else if (/リモート併用|リモート可|リモ併用/.test(t)) category = 'リモート併用';
  else if (/オンサイト|常駐|フル出社|出社必須/.test(t)) category = 'オンサイト';
  else if (/応相談|柔軟|相談可|対応可能/.test(t)) category = null; // 柔軟は除外
  else if (/出社/.test(t) && /リモート/.test(t)) category = 'リモート併用';
  else if (/出社/.test(t)) category = 'オンサイト';
  else if (/リモート/.test(t)) category = 'リモート併用';

  // 出社日数
  let officeDays = null;
  const daysMatch = t.match(/週\s*(\d+)\s*[~～\-ー−–]\s*(\d+)\s*日/);
  if (daysMatch) officeDays = `${daysMatch[1]}～${daysMatch[2]}`;
  else {
    const daysSingle = t.match(/週\s*(\d+)\s*日/);
    if (daysSingle) officeDays = daysSingle[1];
  }

  // 初期オンサイト
  const initialOnsite = /初期.*オンサイト|初期.*出社|過渡期.*出社|参画.*オンサイト/.test(t);

  // 備考: ※以降の部分（初期オンサイト関連は除外）
  let note = null;
  const noteMatch = t.match(/※(.+)/);
  if (noteMatch) {
    const noteText = noteMatch[1].trim();
    const coveredByOnsite = initialOnsite && /初期|オンサイト|出社/.test(noteText);
    if (!coveredByOnsite && noteText) note = noteText;
  }
  // PC受け取り
  if (/PC受け取り/.test(t) && !note) note = 'PC受取出社あり';

  return { category, officeDays, initialOnsite, note };
}

// ===================== 移行処理 =====================

console.log('=== データ移行開始 ===');
console.log(`DB: ${dbPath}`);

// --- Projects ---
const projects = db.prepare('SELECT id, client_price, purchase_price, work_style FROM projects').all();
console.log(`\nProjects: ${projects.length}件を処理中...`);

const updateProject = db.prepare(`
  UPDATE projects SET
    client_price_min = ?, client_price_max = ?,
    purchase_price_min = ?, purchase_price_max = ?,
    work_style_category = ?, work_style_office_days = ?,
    work_style_initial_onsite = ?, work_style_note = ?
  WHERE id = ?
`);

let projUpdated = 0;
for (const p of projects) {
  const cp = parsePriceRange(p.client_price);
  const pp = parsePriceRange(p.purchase_price);
  const ws = parseWorkStyle(p.work_style);
  updateProject.run(
    cp.min || null, cp.max || null,
    pp.min || null, pp.max || null,
    ws.category, ws.officeDays,
    ws.initialOnsite ? 1 : 0, ws.note,
    p.id
  );
  if (cp.min || cp.max || pp.min || pp.max || ws.category) projUpdated++;
}
console.log(`  → ${projUpdated}件に構造化データを設定`);

// --- Members ---
const members = db.prepare('SELECT id, desired_price, work_preference FROM members').all();
console.log(`\nMembers: ${members.length}件を処理中...`);

const updateMember = db.prepare(`
  UPDATE members SET
    desired_price_min = ?, desired_price_max = ?,
    work_style_category = ?, work_style_office_days = ?,
    work_style_initial_onsite = ?, work_style_note = ?
  WHERE id = ?
`);

let memUpdated = 0;
for (const m of members) {
  const dp = parsePriceRange(m.desired_price);
  const ws = parseWorkStyle(m.work_preference);
  updateMember.run(
    dp.min || null, dp.max || null,
    ws.category, ws.officeDays,
    ws.initialOnsite ? 1 : 0, ws.note,
    m.id
  );
  if (dp.min || dp.max || ws.category) memUpdated++;
}
console.log(`  → ${memUpdated}件に構造化データを設定`);

// --- 検証 ---
console.log('\n=== 検証 ===');
const projCheck = db.prepare('SELECT COUNT(*) as cnt FROM projects WHERE purchase_price_min IS NOT NULL OR purchase_price_max IS NOT NULL').get();
console.log(`Projects: 単価構造化 ${projCheck.cnt}件`);
const projWsCheck = db.prepare("SELECT COUNT(*) as cnt FROM projects WHERE work_style_category IS NOT NULL").get();
console.log(`Projects: 働き方構造化 ${projWsCheck.cnt}件`);
const memCheck = db.prepare('SELECT COUNT(*) as cnt FROM members WHERE desired_price_min IS NOT NULL OR desired_price_max IS NOT NULL').get();
console.log(`Members: 単価構造化 ${memCheck.cnt}件`);
const memWsCheck = db.prepare("SELECT COUNT(*) as cnt FROM members WHERE work_style_category IS NOT NULL").get();
console.log(`Members: 働き方構造化 ${memWsCheck.cnt}件`);

// カテゴリ分布
const projWsDist = db.prepare("SELECT work_style_category, COUNT(*) as cnt FROM projects WHERE work_style_category IS NOT NULL GROUP BY work_style_category").all();
console.log('\nProjects 働き方分布:', projWsDist.map(r => `${r.work_style_category}: ${r.cnt}`).join(', '));
const memWsDist = db.prepare("SELECT work_style_category, COUNT(*) as cnt FROM members WHERE work_style_category IS NOT NULL GROUP BY work_style_category").all();
console.log('Members 働き方分布:', memWsDist.map(r => `${r.work_style_category}: ${r.cnt}`).join(', '));

db.close();
console.log('\n=== データ移行完了 ===');
