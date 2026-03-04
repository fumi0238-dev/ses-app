import { Project, Member, Matching } from './types';
import { parseTags, formatPriceRange, getStructuredPriceRange } from './helpers';

const SKILL_GROUPS: string[][] = [
  ['java', 'kotlin', 'scala'],
  ['javascript', 'typescript', 'node.js', 'nodejs'],
  ['python', 'django', 'flask', 'fastapi'],
  ['c#', '.net', 'asp.net', 'vb.net'],
  ['c', 'c++'],
  ['ruby', 'ruby on rails', 'rails'],
  ['php', 'laravel', 'cakephp', 'symfony'],
  ['go', 'golang'],
  ['swift', 'objective-c', 'ios'],
  ['dart', 'flutter'],
  ['react', 'react.js', 'next.js', 'nextjs'],
  ['vue', 'vue.js', 'nuxt.js', 'nuxtjs'],
  ['angular', 'angularjs'],
  ['html', 'css', 'html5', 'css3'],
  ['aws', 'amazon web services'],
  ['azure', 'microsoft azure'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['mysql', 'mariadb'],
  ['postgresql', 'postgres'],
  ['oracle', 'oracle db', 'pl/sql'],
  ['sql server', 'mssql', 'tsql'],
  ['mongodb', 'dynamodb', 'nosql'],
  ['docker', 'kubernetes', 'k8s', 'コンテナ'],
  ['terraform', 'cloudformation', 'iac'],
  ['linux', 'unix', 'centos', 'ubuntu', 'rhel'],
  ['pm', 'プロジェクトマネージャー', 'プロジェクトマネージャ', 'プロジェクト管理'],
  ['pmo', 'プロジェクト管理支援'],
  ['pl', 'プロジェクトリーダー', 'プロジェクトリーダ'],
  ['se', 'システムエンジニア'],
  ['pg', 'プログラマ', 'プログラマー'],
  ['テスト', 'qa', 'テスト設計', 'テスト実行', '品質管理'],
  ['sap', 'erp', 'sap fi', 'sap co', 'sap mm', 'sap sd'],
  ['ai', '機械学習', 'ml', 'deep learning', 'ディープラーニング'],
  ['セキュリティ', 'cybersecurity', '情報セキュリティ', 'isms'],
  ['ネットワーク', 'cisco', 'ccna', 'ccnp', 'firewall'],
];

// --- 働き方の正規化・互換性スコア ---
type WorkStyleCategory = 'remote' | 'hybrid' | 'onsite' | 'flexible' | 'unknown';

function normalizeWorkStyle(text: string | undefined | null): WorkStyleCategory {
  if (!text) return 'unknown';
  const t = text.trim();
  // ゴミデータ除外（単価情報など）
  if (t.startsWith('■') || t.includes('万円')) return 'unknown';
  if (/確認中/.test(t)) return 'unknown';
  // フルリモート判定（「基本リモート」も含む）
  if (/フルリモ|基本リモート|完全リモート|原則リモート/.test(t)) return 'remote';
  // リモート併用判定
  if (/リモート併用|リモート可|リモ併用/.test(t)) return 'hybrid';
  // オンサイト／常駐／フル出社判定
  if (/オンサイト|常駐|フル出社|出社必須/.test(t)) return 'onsite';
  // 柔軟対応
  if (/応相談|柔軟|相談可|対応可能/.test(t)) return 'flexible';
  // 「出社」を含むがリモートも含む場合はhybrid
  if (/出社/.test(t) && /リモート/.test(t)) return 'hybrid';
  if (/出社/.test(t)) return 'onsite';
  if (/リモート/.test(t)) return 'hybrid';
  return 'unknown';
}

const WORK_STYLE_LABELS: Record<WorkStyleCategory, string> = {
  remote: 'リモート',
  hybrid: 'ハイブリッド',
  onsite: 'オンサイト',
  flexible: '柔軟',
  unknown: '不明',
};

// 互換性マトリクス [案件の要件][要員の希望] → スコア加減
const WORK_STYLE_COMPAT: Record<WorkStyleCategory, Record<WorkStyleCategory, number>> = {
  remote:   { remote: 2, hybrid: 1, onsite: -1, flexible: 1, unknown: 0 },
  hybrid:   { remote: 1, hybrid: 2, onsite: 1,  flexible: 2, unknown: 0 },
  onsite:   { remote: -2, hybrid: 0, onsite: 2, flexible: 1, unknown: 0 },
  flexible: { remote: 2, hybrid: 2, onsite: 1,  flexible: 2, unknown: 0 },
  unknown:  { remote: 0, hybrid: 0, onsite: 0,  flexible: 0, unknown: 0 },
};

// 構造化カテゴリ（日本語）→ 内部カテゴリ
function categoryToInternal(cat: string): WorkStyleCategory {
  const map: Record<string, WorkStyleCategory> = {
    'フルリモート': 'remote',
    'リモート併用': 'hybrid',
    'オンサイト': 'onsite',
  };
  return map[cat] || 'unknown';
}

function calcWorkStyleCompat(
  projCategory: string | undefined,
  projStyleText: string | undefined,
  memCategory: string | undefined,
  memPrefText: string | undefined
): { score: number; note: string } {
  // 構造化カテゴリ優先、なければ旧テキストからフォールバック
  const pCat = projCategory ? categoryToInternal(projCategory) : normalizeWorkStyle(projStyleText);
  const mCat = memCategory ? categoryToInternal(memCategory) : normalizeWorkStyle(memPrefText);
  if (pCat === 'unknown' || mCat === 'unknown') return { score: 0, note: '' };
  const score = WORK_STYLE_COMPAT[pCat][mCat];
  const pLabel = WORK_STYLE_LABELS[pCat];
  const mLabel = WORK_STYLE_LABELS[mCat];
  if (score >= 2) return { score, note: `働き方◎ (${pLabel}↔${mLabel})` };
  if (score >= 1) return { score, note: `働き方○ (${pLabel}↔${mLabel})` };
  if (score <= -1) return { score, note: `働き方△ (案件:${pLabel} / 希望:${mLabel})` };
  return { score, note: '' };
}

function findSimilarSkills(skill: string): string[] {
  const norm = skill.toLowerCase();
  for (const group of SKILL_GROUPS) {
    if (group.includes(norm)) {
      return group.filter(s => s !== norm);
    }
  }
  return [];
}

const STOP_WORDS = new Set(['以上', '経験', '対応', '可能', '業務', '開発', '設計', '担当', '必須', '不問', 'スキル', '案件', '要員', '希望', '年齢', '歓迎', '応募', '作業', '工程', '知識', 'システム', 'プロジェクト', '環境', '求める', '構築', '管理', '運用', '保守', 'テスト', '実装', '製造', '詳細', '基本', '概要']);

function extractCleanKeywords(text: string): string[] {
  if (!text) return [];
  const cleaned = text.toLowerCase()
    .replace(/[（）()「」【】■●・※\n\r]/g, ' ')
    .replace(/[、。]/g, ' ');
  const words = cleaned.split(/[\s,/]+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function calcFallbackScore(project: Project, member: Member): number {
  const projectText = `${project.required_skills} ${project.preferred_skills} ${project.role}`;
  const memberText = `${member.skills_summary} ${member.experience_summary} ${member.desired_position}`;
  const pWords = extractCleanKeywords(projectText);
  const mWords = extractCleanKeywords(memberText);
  let score = 0;
  pWords.forEach(pw => {
    if (mWords.some(mw => mw === pw)) score++;
  });
  return Math.min(score, 5);
}

export interface MatchResult {
  member: Member;
  score: number;
  matchedRequired: string[];
  matchedPreferred: string[];
  matchedSimilar: string[];
  matchedIndustry: string[];
  penalties: string[];
  priceNote: string;
  isExisting: boolean;
  reqCoverage: number | null;
  workStyleNote: string;
}

export function doMatching(
  project: Project,
  members: Member[],
  matchings: Matching[]
): MatchResult[] {
  const reqTags = parseTags(project.required_skill_tags);
  const prefTags = parseTags(project.preferred_skill_tags);
  const projIndustryTags = parseTags(project.industry_tags);
  const allProjectTags = [...reqTags, ...prefTags];
  const projPrice = getStructuredPriceRange(project.purchase_price_min, project.purchase_price_max, project.purchase_price);
  const projExpYears = parseFloat(project.required_experience_years) || 0;

  const existingMemberIds = matchings
    .filter(mt => mt.project_id === project.id && mt.status !== '見送り')
    .map(mt => mt.member_id);

  const scored: MatchResult[] = members.map(m => {
    const memberTags = parseTags(m.skill_tags);
    const memIndustryTags = parseTags(m.industry_tags);
    const memPrice = getStructuredPriceRange(m.desired_price_min, m.desired_price_max, m.desired_price);
    const memExpYears = parseFloat(m.experience_years) || 0;

    let score = 0;
    const matchedRequired: string[] = [];
    const matchedPreferred: string[] = [];
    const matchedSimilar: string[] = [];
    const matchedIndustry: string[] = [];
    const penalties: string[] = [];

    reqTags.forEach(rt => {
      if (memberTags.some(mt => mt === rt)) {
        score += 3;
        matchedRequired.push(rt);
      } else {
        const similar = findSimilarSkills(rt);
        const found = memberTags.find(mt => similar.includes(mt));
        if (found) {
          score += 1.5;
          matchedSimilar.push(`${rt}≒${found}`);
        }
      }
    });

    prefTags.forEach(pt => {
      if (memberTags.some(mt => mt === pt)) {
        score += 1;
        matchedPreferred.push(pt);
      } else {
        const similar = findSimilarSkills(pt);
        const found = memberTags.find(mt => similar.includes(mt));
        if (found) {
          score += 0.5;
          matchedSimilar.push(`${pt}≒${found}`);
        }
      }
    });

    projIndustryTags.forEach(it => {
      if (memIndustryTags.some(mt => mt === it)) {
        score += 2;
        matchedIndustry.push(it);
      }
    });

    if (project.role && m.desired_position) {
      const roleNorm = project.role.toLowerCase();
      const posNorm = m.desired_position.toLowerCase();
      if (roleNorm.includes(posNorm) || posNorm.includes(roleNorm)) {
        score += 2;
      }
    }

    if (projExpYears > 0 && memExpYears > 0) {
      if (memExpYears >= projExpYears) {
        score += 1;
      } else {
        penalties.push(`経験${memExpYears}年 < 必要${projExpYears}年`);
        score -= 1;
      }
    }

    // 単価範囲ベースの比較
    let priceNote = '';
    const projHasPrice = projPrice.min > 0 || projPrice.max > 0;
    const memHasPrice = memPrice.min > 0 || memPrice.max > 0;
    if (projHasPrice && memHasPrice) {
      // 案件の上限(max) vs 要員の下限(min) で比較
      const projTop = projPrice.max || projPrice.min; // maxが0なら min以上
      const memBottom = memPrice.min || memPrice.max; // minが0なら max以下
      const diff = projTop - memBottom;
      if (diff >= 10) {
        score += 1;
        priceNote = `余裕+${diff}万 (${formatPriceRange(projPrice)}↔${formatPriceRange(memPrice)})`;
      } else if (diff >= 0) {
        priceNote = `差${diff}万 (${formatPriceRange(projPrice)}↔${formatPriceRange(memPrice)})`;
      } else {
        score -= 2;
        penalties.push(`単価超過${Math.abs(diff)}万 (案件:${formatPriceRange(projPrice)} / 希望:${formatPriceRange(memPrice)})`);
        priceNote = `超過${Math.abs(diff)}万`;
      }
    }

    if (allProjectTags.length === 0 || memberTags.length === 0) {
      score += calcFallbackScore(project, m);
    }

    // 働き方互換性スコア（構造化カテゴリ優先、旧テキストフォールバック）
    const wsCompat = calcWorkStyleCompat(project.work_style_category, project.work_style, m.work_style_category, m.work_preference);
    score += wsCompat.score;
    if (wsCompat.score <= -1) {
      penalties.push(wsCompat.note);
    }

    const isExisting = existingMemberIds.includes(m.id);
    const reqCoverage = reqTags.length > 0
      ? Math.round(
          (matchedRequired.length +
            matchedSimilar.filter(s => reqTags.some(rt => s.startsWith(rt))).length * 0.5) /
            reqTags.length * 100
        )
      : null;

    return { member: m, score, matchedRequired, matchedPreferred, matchedSimilar, matchedIndustry, penalties, priceNote, isExisting, reqCoverage, workStyleNote: wsCompat.note };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  return scored;
}
