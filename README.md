# ObsidianTODO Web App

GTDメソッドに基づいたTODO管理WebアプリをGitHub Pagesでホストし、Obsidianに埋め込むための手順です。

---

## 📦 ファイル構成

```
ObsidianTODO/
├── index.html          ← メインSPA
├── css/
│   └── style.css       ← デザインシステム
├── js/
│   ├── store.js        ← データ永続化 (localStorage)
│   ├── components.js   ← 共通UIコンポーネント
│   ├── app.js          ← ルーティング・メインロジック
│   ├── dashboard.js    ← ダッシュボード
│   ├── inbox.js        ← インボックス
│   ├── projects.js     ← プロジェクト管理
│   ├── areas.js        ← エリア管理
│   ├── someday.js      ← Someday/Maybe
│   ├── daily-review.js ← 日次レビュー
│   └── weekly-review.js← 週次レビュー
└── README.md           ← このファイル
```

---

## 🚀 GitHub Pagesへのデプロイ手順

### 1. GitHubリポジトリを作成

```bash
# 新しいリポジトリを作成（例: todo-dashboard）
# GitHub.com → New repository → Public → 作成
```

### 2. このフォルダをpush

```bash
cd "/path/to/ObsidianTODO"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/todo-dashboard.git
git push -u origin main
```

### 3. GitHub Pagesを有効化

1. リポジトリページ → **Settings** → **Pages**
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)` → **Save**
4. 数分後に `https://YOUR_USERNAME.github.io/todo-dashboard/` で公開される

---

## 🔌 Obsidianへの埋め込み方法

### 方法1: HTMLコードブロックに直接埋め込み（推奨）

Obsidianのノート（例: `Dashboard.md`）に以下を追記：

```html
<iframe
  src="https://YOUR_USERNAME.github.io/todo-dashboard/"
  width="100%"
  height="800px"
  style="border:none;border-radius:12px;"
  allow="clipboard-read; clipboard-write"
></iframe>
```

> **必要プラグイン**: HTMLをレンダリングするため、Obsidianの設定で  
> **「設定 → エディター → HTMLのレンダリングを許可する」** を有効にするか、  
> または `Custom HTML` プラグインを使用

### 方法2: Obsidian内のローカルファイルとして開く

GitHub Pagesを使わずに、ローカルのindex.htmlをブラウザで直接開く：

```
file:///path/to/ObsidianTODO/index.html
```

→ Obsidianのノートからリンクで開く形式でも使える。

---

## ✨ 機能一覧

| 機能 | 説明 |
|------|------|
| **Dashboard** | TODAY TOP3, タイムブロック, コンテキストフィルタ, Eisenhower象限 |
| **Inbox** | 素早いタスク追加, GTD処理チェックリスト (2分ルール, Someday移動) |
| **Projects** | プロジェクトCRUD, 進捗バー, インラインタスク追加 |
| **Areas** | 6エリア + カスタム, エリアごとのタスク管理 |
| **Someday/Maybe** | 4カテゴリ, Inbox活性化 |
| **日次レビュー** | 朝のプランニング, フォーカスセッション記録, 夜の振り返り |
| **週次レビュー** | STEP 1〜5 ガイド付き, プロジェクトレビュー, 来週のTimeBlock計画 |

## タグシステム

| カテゴリ | タグ |
|---------|------|
| 優先度 | P1（最重要）〜 P4（低） |
| Eisenhower | Q1（緊急×重要）〜 Q4（余裕×重要でない） |
| コンテキスト | home, office, computer, calls, errands |
| ステータス | next-action, waiting, someday |

## キーボードショートカット

| キー | 操作 |
|------|------|
| `N` | 新規タスク（入力欄外で） |
| `Escape` | モーダルを閉じる |
| `Enter` | Inboxのクイック追加 |

---

## 💾 データについて

- データは **ブラウザの localStorage** に保存されます
- 同じブラウザ・同じデバイス内ではデータが保持されます
- **Export** ボタンでJSONファイルとして書き出し可能
- **Import** ボタンでJSONファイルを読み込み可能
- 異なるデバイス間での同期は Export/Import で手動で行ってください

---

## 🔄 更新方法

コードを更新したら：

```bash
git add .
git commit -m "Update features"
git push
```

GitHub Pagesが自動的に再デプロイされます（通常1〜2分）。
