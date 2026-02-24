/**
 * Electron ビルドスクリプト
 *
 * 手順:
 * 1. Next.js をビルド (standalone)
 * 2. static / public を standalone にコピー
 * 3. standalone を electron/standalone にコピー
 * 4. テンプレートDBを作成
 * 5. better-sqlite3 を Electron 向けにリビルド
 * 6. electron-builder でパッケージング
 */

import { execSync } from 'child_process';
import { cpSync, existsSync, rmSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

// ── Step 1: Next.js ビルド ──
console.log('========================================');
console.log('Step 1/6: Next.js ビルド');
console.log('========================================');
run('npx next build --webpack');

const standalonePath = path.join(root, '.next', 'standalone');
if (!existsSync(standalonePath)) {
  console.error('ERROR: standalone output not found.');
  process.exit(1);
}

// ── Step 2: static / public をコピー ──
console.log('\n========================================');
console.log('Step 2/6: 静的ファイルのコピー');
console.log('========================================');

const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(standalonePath, '.next', 'static');
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log('  .next/static -> standalone/.next/static');
}

const publicSrc = path.join(root, 'public');
const publicDest = path.join(standalonePath, 'public');
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log('  public -> standalone/public');
}

// ── Step 3: standalone を electron/standalone にコピー ──
console.log('\n========================================');
console.log('Step 3/6: standalone を electron/ にコピー');
console.log('========================================');

const electronStandalone = path.join(root, 'electron', 'standalone');
if (existsSync(electronStandalone)) {
  rmSync(electronStandalone, { recursive: true });
}
cpSync(standalonePath, electronStandalone, { recursive: true });
console.log('  .next/standalone -> electron/standalone');

// ── Step 4: テンプレートDB作成 ──
console.log('\n========================================');
console.log('Step 4/6: テンプレートデータベースの作成');
console.log('========================================');

const templatePath = path.join(root, 'template.db');
if (existsSync(templatePath)) {
  unlinkSync(templatePath);
}

try {
  run('npx prisma db push --accept-data-loss', {
    env: {
      ...process.env,
      DATABASE_URL: `file:${templatePath}`,
    },
  });
  console.log('  template.db を作成しました');
} catch (err) {
  console.error('WARNING: prisma db push failed, trying direct SQL approach...');
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(templatePath);
  const { readdirSync, readFileSync } = await import('fs');
  const migrationsDir = path.join(root, 'prisma', 'migrations');
  const migrations = readdirSync(migrationsDir)
    .filter((d) => d.match(/^\d/))
    .sort();
  for (const migration of migrations) {
    const sqlPath = path.join(migrationsDir, migration, 'migration.sql');
    if (existsSync(sqlPath)) {
      const sql = readFileSync(sqlPath, 'utf-8');
      db.exec(sql);
      console.log(`  Applied: ${migration}`);
    }
  }
  db.close();
  console.log('  template.db を作成しました (SQL fallback)');
}

// ── Step 5: better-sqlite3 を Electron 向けにリビルド ──
console.log('\n========================================');
console.log('Step 5/6: ネイティブモジュールのリビルド');
console.log('========================================');

try {
  run(`npx @electron/rebuild --force --module-dir "${electronStandalone}" -w better-sqlite3`);
  console.log('  better-sqlite3 を Electron 用にリビルドしました');
} catch (err) {
  console.error('WARNING: Rebuild in standalone failed. Trying alternative...');
  try {
    run('npx @electron/rebuild --force -w better-sqlite3');
    const srcBinding = path.join(root, 'node_modules', 'better-sqlite3');
    const destBinding = path.join(electronStandalone, 'node_modules', 'better-sqlite3');
    if (existsSync(destBinding)) {
      rmSync(destBinding, { recursive: true });
    }
    cpSync(srcBinding, destBinding, { recursive: true });
    console.log('  better-sqlite3 をコピーしました');
  } catch (err2) {
    console.error('ERROR: Native module rebuild failed:', err2.message);
    process.exit(1);
  }
}

// ── Step 6: electron-builder でパッケージング ──
console.log('\n========================================');
console.log('Step 6/6: Electron パッケージング');
console.log('========================================');

run('npx electron-builder --config electron-builder.json');

// Clean up electron/standalone (it's now packaged)
if (existsSync(electronStandalone)) {
  rmSync(electronStandalone, { recursive: true });
}

console.log('\n========================================');
console.log('ビルド完了！');
console.log('出力先: dist-electron/');
console.log('========================================');
