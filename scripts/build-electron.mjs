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
import { cpSync, existsSync, mkdirSync, rmSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// ローカルの node_modules/.bin を使うようにPATHを設定
const localBin = path.join(root, 'node_modules', '.bin');
const env = {
  ...process.env,
  PATH: `${localBin}${path.delimiter}${process.env.PATH}`,
};

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: root, env, ...opts });
}

// インストール済み Electron のバージョンを取得
function getElectronVersion() {
  const pkgPath = path.join(root, 'node_modules', 'electron', 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('ERROR: electron が node_modules に見つかりません。npm install を先に実行してください。');
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

// ── Step 1: Next.js ビルド ──
console.log('========================================');
console.log('Step 1/6: Next.js ビルド');
console.log('========================================');
run('next build --webpack');

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
  try {
    rmSync(electronStandalone, { recursive: true });
  } catch (err) {
    if (err.code === 'EPERM') {
      // Windows でプロセスが CWD としてディレクトリを保持している場合 EPERM になる
      // cmd.exe の rd コマンドはより強制的に削除できる
      console.log('  rmSync EPERM: cmd rd にフォールバック...');
      run(`cmd /c rd /s /q "${electronStandalone}"`, { env: process.env });
    } else {
      throw err;
    }
  }
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
  run('prisma db push --accept-data-loss', {
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

const electronVersion = getElectronVersion();
console.log(`  Electron バージョン: ${electronVersion}`);

// EPERM 回避策:
// Claude Code / Prisma が root の better_sqlite3.node をロック中のため
// root node_modules には触れず、一時ディレクトリで prebuild-install を実行する。
// better-sqlite3 v12.6.2 + Electron 34.x には win32-x64 のプリビルドバイナリが存在するため
// VS Build Tools なしでダウンロードのみで対応可能。

const tempPrebuildDir = path.join(root, '.build-temp', 'prebuild-test');
const tempSqliteDir = path.join(tempPrebuildDir, 'better-sqlite3');

if (existsSync(tempPrebuildDir)) {
  rmSync(tempPrebuildDir, { recursive: true });
}

// prebuild-install が必要とする最低限のファイルを用意
mkdirSync(path.join(tempSqliteDir, 'build', 'Release'), { recursive: true });
cpSync(
  path.join(root, 'node_modules', 'better-sqlite3', 'package.json'),
  path.join(tempSqliteDir, 'package.json')
);

// 一時ディレクトリで prebuild-install を実行
// → Electron 向けプリビルドバイナリをダウンロード（コンパイル不要）
run(
  `prebuild-install --runtime electron --target ${electronVersion} --arch x64`,
  { cwd: tempSqliteDir }
);

const downloadedBinary = path.join(tempSqliteDir, 'build', 'Release', 'better_sqlite3.node');
if (!existsSync(downloadedBinary)) {
  console.error('ERROR: prebuild-install がバイナリをダウンロードできませんでした');
  rmSync(tempPrebuildDir, { recursive: true });
  process.exit(1);
}

// ダウンロードしたバイナリを electron/standalone にコピー
const destBinaryDir = path.join(electronStandalone, 'node_modules', 'better-sqlite3', 'build', 'Release');
const destBinary = path.join(destBinaryDir, 'better_sqlite3.node');

if (!existsSync(destBinaryDir)) {
  mkdirSync(destBinaryDir, { recursive: true });
}

cpSync(downloadedBinary, destBinary);
console.log('  Electron 用バイナリを取得・コピーしました');

// 一時ディレクトリを削除
rmSync(tempPrebuildDir, { recursive: true });

// ── Step 6: electron-builder でパッケージング ──
console.log('\n========================================');
console.log('Step 6/6: Electron パッケージング');
console.log('========================================');

run('electron-builder --config electron-builder.json');

// Clean up electron/standalone (it's now packaged)
if (existsSync(electronStandalone)) {
  rmSync(electronStandalone, { recursive: true });
}

console.log('\n========================================');
console.log('ビルド完了！');
console.log('出力先: dist-electron/');
console.log('========================================');
