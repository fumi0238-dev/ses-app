// Excel→SQLiteインポートスクリプト（修正版）
const Database = require('C:/Users/masma/Desktop/ses-app/node_modules/better-sqlite3');
const xlsx = require('C:/Users/masma/Desktop/ses-app/node_modules/xlsx');
const { randomUUID } = require('crypto');

const db = new Database('C:/Users/masma/Desktop/ses-app/dev.db');
const wb = xlsx.readFile('C:/Users/masma/Downloads/一時ファイル案件 (2).xlsx');
const now = Date.now();

// ===== ユーティリティ =====

function excelDateToStr(serial) {
  if (!serial || typeof serial !== 'number') return '';
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
}

function normalizeShareable(val) {
  if (!val) return 'OK';
  return String(val).startsWith('NG') ? 'NG' : 'OK';
}

function shareNote(val) {
  if (!val) return '';
  const m = String(val).match(/[（(]([^）)]+)[）)]/);
  return m ? m[1] : '';
}

// 転置Excel → レコード配列
function parseTransposedSheet(sheet) {
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const nonEmpty = raw.filter(row => row.some(v => v !== ''));
  if (nonEmpty.length === 0) return [];
  const records = [];
  for (let col = 1; col < nonEmpty[0].length; col++) {
    const rec = {};
    nonEmpty.forEach(row => { if (row[0]) rec[row[0]] = row[col]; });
    records.push(rec);
  }
  return records;
}

// ■ラベルの値を取得（同一行に「：値」があればそれ、なければ次行を返す）
function extractField(text, label) {
  if (!text) return '';
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`■${label}`)) {
      // 同一行に「：値」があれば返す
      const sameLine = lines[i].replace(/^.*■[^：:]+[：:\s]*/, '').trim();
      if (sameLine) return sameLine;
      // なければ次行を返す
      if (i + 1 < lines.length) return lines[i + 1].trim();
    }
  }
  return '';
}

// ■セクション配下の行を ※行を除いて取得
function extractSection(text, label) {
  if (!text) return '';
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`■${label}`)) {
      const sameLine = lines[i].replace(/^.*■[^：:（(]+[（(]?[^）)]*[）)]?[：:\s]*/, '').trim();
      const buf = sameLine ? [sameLine] : [];
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line.startsWith('■') || line.startsWith('---')) break;
        if (line.startsWith('※')) continue; // 注意書きスキップ
        if (line) buf.push(line);
      }
      return buf.join('\n');
    }
  }
  return '';
}

// ===== 既存データ削除 =====
db.prepare("DELETE FROM matchings").run();
db.prepare("DELETE FROM notes WHERE target_table IN ('projects','members')").run();
db.prepare("DELETE FROM activity_logs WHERE target_table IN ('projects','members')").run();
db.prepare("DELETE FROM projects").run();
db.prepare("DELETE FROM members").run();
console.log('既存データ削除完了');

// ===== 案件インポート =====
const rawProjects = parseTransposedSheet(wb.Sheets['案件']).filter(p =>
  p['案件名(原文)'] || p['案件名(リライト)']
);

const insertProject = db.prepare(`
  INSERT INTO projects (
    id, status, shareable, share_note, added_date, source,
    project_name_original, project_name_rewrite,
    client_price, purchase_price,
    description_original, description_rewrite,
    role, location, work_style, period, headcount,
    age_limit, nationality, english, commercial_flow, interview_count,
    required_skills, preferred_skills,
    required_skill_tags, preferred_skill_tags, industry_tags,
    purchase_price_num, required_experience_years,
    created_at, updated_at, deleted
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
  )
`);

let projCount = 0;
for (const p of rawProjects) {
  // リライト版を優先して解析、なければ原文
  const descForParse = String(p['案件内容(リライト)'] || p['案件内容(原文)'] || '');

  const role = extractField(descForParse, '募集職種');
  const location = extractField(descForParse, '場所');
  const workStyle = extractField(descForParse, '働き方');
  const period = extractField(descForParse, '期間');
  const headcount = extractField(descForParse, '募集人数');
  const ageLimit = extractField(descForParse, '年齢制限');
  const nationality = extractField(descForParse, '外国籍');
  const english = extractField(descForParse, '英語');
  const commercialFlow = extractField(descForParse, '商流制限');
  const interviewCount = extractField(descForParse, '面談');

  const reqSkills = extractSection(descForParse, '必須');
  const prefSkills = extractSection(descForParse, '尚可');

  insertProject.run(
    randomUUID(),
    p['ステータス'] || 'Open',
    normalizeShareable(p['共有可否']),
    shareNote(p['共有可否']),
    excelDateToStr(p['追加日']),
    p['案件元/ツール'] || '',
    p['案件名(原文)'] || '',
    p['案件名(リライト)'] || '',
    p['元単価'] || '',
    p['仕入単価'] || '',
    p['案件内容(原文)'] || '',
    p['案件内容(リライト)'] || '',
    role, location, workStyle, period, headcount,
    ageLimit, nationality, english, commercialFlow, interviewCount,
    reqSkills, prefSkills,
    '', '', '',  // skill_tags (未設定)
    '', '',      // purchase_price_num, required_experience_years (未設定)
    now, now
  );
  projCount++;
}
console.log(`案件 ${projCount}件 インポート完了`);

// ===== 要員インポート =====
const rawMembers = parseTransposedSheet(wb.Sheets['要員']).filter(m =>
  m['イニシャル'] || m['要員名（本名）']
);

const insertMember = db.prepare(`
  INSERT INTO members (
    id, process, affiliation, full_name, initial,
    contract_employee, desired_price,
    contact, desired_position, skill_sheet_url,
    proposal_text, sales_comment,
    skills_summary, experience_summary,
    nearest_station, available_date, work_preference,
    skill_tags, industry_tags,
    desired_price_num, experience_years,
    created_at, updated_at, deleted
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
  )
`);

let memCount = 0;
for (const m of rawMembers) {
  const proposal = String(m['提案文'] || '');

  const nearestStation = extractField(proposal, '最寄駅');
  const availableDate = extractField(proposal, '稼働日');
  const workPref = extractField(proposal, '勤務形態');
  const skillsSummary = extractSection(proposal, 'スキル一覧');
  const expSummary = extractSection(proposal, '経験一覧');

  // 経験ポジションを希望ポジションに流用（希望ポジションが空の場合）
  const position = m['希望ポジション'] || extractField(proposal, '経験ポジション') || '';

  insertMember.run(
    randomUUID(),
    m['プロセス'] || '案件検索中',
    m['所属先/経由元'] || '',
    m['要員名（本名）'] || '',
    m['イニシャル'] || '',
    m['契約社員化'] || '',
    m['希望単価'] || '',
    m['連絡先'] || '',
    position,
    m['スキルシート'] || '',
    proposal,
    m['営業コメント'] || '',
    skillsSummary,
    expSummary,
    nearestStation, availableDate, workPref,
    '', '',  // skill_tags, industry_tags (未設定)
    '',      // desired_price_num
    '',      // experience_years
    now, now
  );
  memCount++;
}
console.log(`要員 ${memCount}件 インポート完了`);

db.close();
console.log('完了');
