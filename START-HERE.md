# 🚀 このシステムの使い方

## ファイル構成

```
📂 ObsidianTODO/
├── 🧠 Dashboard.md        ← 毎日ここから始める
├── 📥 Inbox.md            ← タスクを全部ここに投げる
├── 📁 Projects.md         ← プロジェクト一覧
├── 🗂 Areas.md            ← 責務エリア一覧
├── 💭 Someday-Maybe.md    ← いつかやる・保留
└── 📂 Templates/
    ├── Daily-Review.md    ← 毎日の朝・夜ルーティン
    ├── Weekly-Review.md   ← 毎週金曜夕方
    └── New-Task.md        ← タスク記法リファレンス
```

---

## 毎日のルーティン

### ☀️ 朝（5分）
1. [[Dashboard]] を開く
2. [[Inbox]] に昨日追加したタスクを処理する
3. **TOP3を3件だけ選ぶ**（絶対3件まで）
4. タイムブロックに配置する

### 🌙 夜（10分）
1. [[Templates/Daily-Review]] を開いてコピー → その日の日付ファイルとして保存
2. TOP3の達成確認
3. 未完了タスクを再スケジューリング

---

## 毎週のルーティン（金曜夕方 or 日曜夜 30分）

1. [[Templates/Weekly-Review]] を開いてコピー → その週のファイルとして保存
2. STEP 1〜5 を順番に実施

---

## タスクの基本記法

```
- [ ] タスク名 #P1 #Q1 #context/office #next-action 📅2025-04-10 ⏱30min
```

詳細は [[Templates/New-Task]] 参照。

---

## 推奨プラグイン

| プラグイン | 用途 | 必須? |
|-----------|------|-------|
| **Dataview** | タスクの動的一覧・集計 | 強く推奨 |
| **Templater** | テンプレートの日付変数展開 | 推奨 |
| **Tasks** | タスクの期日・繰り返し管理 | あると便利 |
| **Calendar** | 日次ノートのカレンダーナビ | あると便利 |

---

## タグ早見表

| タグ | 意味 |
|------|------|
| `#P1` ~ `#P4` | 優先度（1=最高） |
| `#Q1` ~ `#Q4` | Eisenhower象限 |
| `#next-action` | 今すぐ着手できる |
| `#waiting` | 誰かの対応待ち |
| `#someday` | いつかやる |
| `#context/home` | 家でできる |
| `#context/office` | オフィス必要 |
| `#context/computer` | PC があればできる |
| `#context/calls` | 電話・会議 |
| `#context/errands` | 外出必要 |

