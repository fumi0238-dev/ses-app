# SES営業向けマッチング管理ツール — 現在の実装状況

## 実装日：2026年2月22日

---

## ✅ 実装済み機能（2024年1月時点から追加）

### 基本機能（確立済み）
- **ダッシュボード**: KPIカード、最近の案件・要員、活動ログ
- **案件管理**: CRUD、検索・フィルタ（ステータス・案件元・勤務地）、詳細モーダル
- **要員管理**: カード表示、CRUD、検索・フィルタ（プロセス・勤務希望・稼働可能日）、詳細モーダル
- **マッチング**: 自動スコア計算、登録・編集・削除、マッチング履歴

### 最近追加した機能（2026年2月版）

#### 1. **進捗管理ページ（進捗管理メニュー）**
- テーブルビュー（14列）とカンバンビュー（7ステータス列）の切り替え
- マッチングごとの詳細情報表示
  - ステータス、案件名、職種、勤務地、仕入単価
  - 要員名、希望単価、単価差（色分け）
  - スキルマッチ率、提案日、面談日
- 基本フィルタ（ステータス、テキスト検索）
- ステータス集計バッジ（クリックで絞り込み）

#### 2. **ネクストアクション（タスク管理）機能** ✨
DB・API・Storeスタック完成。UI追加済み。

**機能:**
- マッチングごとのタスク管理
- ステータス別推奨タスク自動生成
- タスク進捗バー（n/m 完了表示）
- チェックボックスで完了/未完了切り替え
- Enterキーでカスタムタスク追加

**表示:**
- **カンバン**: カード内にタスク進捗ヘッダー（クリックで展開）
- **テーブル**: タスク列のバッジ（クリックで展開行表示）

#### 3. **タスク期日設定 + アラート機能** ✨ ← NEW
期日までの日数に応じた4段階色分け表示

**アラート色:**
| 状態 | 色 | 表示例 |
|------|-----|--------|
| 期限切れ | 🔴 赤（点滅） | "3日超過" |
| 今日期限 | 🔴 赤 | "今日" |
| 1～3日以内 | 🟠 オレンジ | "2日後" |
| 4日以上 | ⬜ グレー | "2/28" |

**操作:**
- タスク追加時: テキスト入力 + 日付ピッカーで同時入力
- 既存タスク期日: バッジ/アイコンをクリック → インライン編集（日付ピッカー）
- 期日未設定: カレンダーアイコン（薄い）表示 → クリックで設定

---

## 🔄 現在の技術スタック

### フロントエンド
- **Next.js 16** + React 19 + TypeScript
- Tailwind CSS 4
- React Icons (FA 6)
- Chart.js（ダッシュボード）

### バックエンド
- **Prisma 7** ORM
- **SQLite** (better-sqlite3)
- Next.js API Routes

### データベース
```
Projects (29フィールド)
├─ status, shareable, added_date, source
├─ project_name_original, project_name_rewrite
├─ purchase_price, purchase_price_num (数値)
├─ role, location, work_style, period
├─ required_skill_tags, preferred_skill_tags, industry_tags (タグ)
├─ required_experience_years, required_skills, preferred_skills
├─ description_original, description_rewrite
├─ age_limit, nationality, english, commercial_flow, interview_count

Members (21フィールド)
├─ process, affiliation, full_name, initial
├─ desired_price, desired_price_num (数値)
├─ skill_tags, industry_tags, experience_years (タグ)
├─ skills_summary, experience_summary
├─ contact, desired_position, skill_sheet_url
├─ sales_comment, available_date, work_preference

Matchings (7フィールド)
├─ project_id, member_id, status
├─ note, proposed_date, interview_date

Tasks ✨ (NEW)
├─ matching_id, content, done
├─ due_date (期日), sort_order
├─ created_at, updated_at

ActivityLogs (記録用)
├─ action, target_table, target_id, target_name, detail, timestamp

Notes (コメント)
├─ target_table, target_id, content, timestamp
```

---

## 📋 実装済み・未実装一覧

### ✅ 完成した機能
- [x] ダッシュボード（KPI・最近の活動）
- [x] 案件管理（CRUD・詳細・フィルタ）
- [x] 要員管理（CRUD・詳細・フィルタ）
- [x] マッチング（スコア計算・登録編集）
- [x] 進捗管理ページ（テーブル + カンバン）
- [x] タスク管理（CRUD・推奨タスク自動生成）
- [x] タスク期日設定 + アラート表示
- [x] マッチング履歴・ノート機能
- [x] 活動ログ記録
- [x] データインポート（Excel ドラッグ&ドロップ）
- [x] データエクスポート（Excel 出力）
- [x] レスポンシブデザイン

### ⏳ 保留中・今後実装予定
- [ ] **リモート希望マッチング**: マッチング条件に「リモートOK/NG」を加える（仕様検討中）
- [ ] **マッチング結果学習**: 過去のマッチング成功/失敗パターン学習（ML将来版）
- [ ] **粗利・インセンティブ自動計算**: 単価差から粗利、營業インセンティブ自動算出
- [ ] **カレンダー連携**: Google Calendar との連携で面談日程を同期
- [ ] **通知機能**: Slack/メール通知（期限切れタスク・重要マッチング）
- [ ] **ダッシュボード拡張**: より細かいKPI、マッチング成功率グラフ等

### ⚠️ データソース側で対応が必要
- [ ] 既存案件データに `required_skill_tags`, `preferred_skill_tags`, `industry_tags`, `purchase_price_num`, `required_experience_years` を追記
- [ ] 既存要員データに `skill_tags`, `industry_tags`, `experience_years`, `desired_price_num` を追記
- [ ] 単価データを数値比較可能な形式に統一

---

## 🎯 今後の開発方針

### Phase 1: 基本動作確認・ユーザーテスト（現在）
- dev サーバーで動作確認
- 営業チーム（増井さん）による実運用テスト
- 期日機能、タスク推奨の精度確認

### Phase 2: データソース対応（ユーザー側）
- Excel 案件データを新フィールド対応版に更新
- Excel 要員データを新フィールド対応版に更新
- 数値型単価フィールドへの値入力

### Phase 3: オプション機能実装
優先順位（高 → 低）:
1. **粗利・インセンティブ計算**: 営業数値で即効性が高い
2. **通知機能**: Slack連携で進捗見落とし防止
3. **カレンダー連携**: Google Calendar 双方向同期
4. **ダッシュボード拡張**: より詳細なKPI可視化
5. **リモート希望マッチング**: マッチング条件拡張

### Phase 4: 本番環境への移行
- 認証・アクセス制御の追加
- 本番DB（PostgreSQL等）への移行
- ユーザー管理機能
- 定期バックアップ

---

## 📚 ファイル構成

```
ses-app/
├── prisma/
│   ├── schema.prisma          # DB スキーマ定義
│   └── migrations/            # マイグレーション履歴
│
├── src/
│   ├── app/
│   │   ├── page.tsx           # メインアプリ（ページ切り替え）
│   │   ├── globals.css        # グローバルスタイル
│   │   └── api/               # Next.js API Routes
│   │       ├── projects/
│   │       ├── members/
│   │       ├── matchings/
│   │       ├── tasks/         # タスク API ✨
│   │       ├── notes/
│   │       ├── activity-logs/
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── types.ts           # TypeScript 型定義
│   │   ├── helpers.ts         # ユーティリティ関数
│   │   ├── store.tsx          # React Context (グローバル状態)
│   │   └── prisma.ts          # Prisma クライアント
│   │
│   └── components/
│       ├── Dashboard.tsx
│       ├── Projects.tsx
│       ├── Members.tsx
│       ├── Matching.tsx
│       ├── Progress.tsx       # 進捗管理ページ ✨
│       ├── Toast.tsx
│       ├── modals/
│       │   ├── DetailModals.tsx
│       │   ├── ProjectFormModal.tsx
│       │   ├── MemberFormModal.tsx
│       │   ├── MatchingFormModal.tsx
│       │   └── ImportModal.tsx
│       └── ...
│
├── scripts/
│   └── import-data.js         # データインポート用スクリプト
│
├── .env                        # 環境変数
├── package.json
├── next.config.ts
├── tsconfig.json
└── dev.db                      # SQLite データベース

```

---

## 🚀 次の作業予定

### すぐに取り掛かるべき
1. ✨ **タスク期日機能の動作確認**（dev サーバーで実際に使ってみる）
2. **営業向けドキュメント作成**: 各機能の使い方説明書
3. **ダミーデータの拡充**: より現実的なマッチング例を追加

### データ整備（増井さん側）
1. 既存 Excel データを新フィールド対応版に更新
2. 数値型単価フィールドに値を入力

### 次の機能追加候補（ユーザーフィードバック次第）
1. **粗利・インセンティブ自動計算**
2. **Slack 通知**
3. **カレンダー連携**

---

## 📞 今後の確認項目

| 項目 | 現状 | 次ステップ |
|------|------|---------|
| タスク期日アラート表示 | ✅ 実装完了 | 実運用テスト |
| 推奨タスク自動生成 | ✅ 実装完了 | 精度確認（ステータス別タスク定義） |
| マッチング進捗の可視化 | ✅ テーブル + カンバン完成 | UX確認 |
| データ品質（数値型フィールド） | ⚠️ 未整理 | 増井さんが Excel 更新 |
| 営業向け使用方法ドキュメント | ❌ 未作成 | 作成予定 |
| 本番環境構築 | ❌ 未実施 | Phase 4 で検討 |

---

**最終更新**: 2026年2月22日
**開発者**: Claude Code
