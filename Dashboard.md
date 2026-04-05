---
tags: [dashboard]
---

# 🧠 Dashboard

> **今日の日付**: {{date:YYYY-MM-DD}}
> **今週**: {{date:YYYY-[W]WW}}

---

## 🎯 今日の TOP 3

> [!tip] ルール: 最大3件。4件目は追加できない。これだけは必ず今日終わらせる。

- [ ]
- [ ]
- [ ]

---

## 📥 インボックス処理

> [!info] [[Inbox]] にたまったタスクをここで処理する

```dataview
TASK
FROM "Inbox"
WHERE !completed
LIMIT 10
```

*Dataviewがない場合: [[Inbox]] を直接開いて処理する*

---

## ⏰ 今日のタイムブロック

| 時間 | タスク / 予定 | 状態 |
|------|--------------|------|
| 09:00 | | |
| 10:00 | | |
| 11:00 | | |
| 13:00 | | |
| 14:00 | | |
| 15:00 | | |
| 16:00 | | |
| 17:00 | | |

---

## 🗂 コンテキスト別 Next Action

> [!note] 今いる場所・状況に合わせてフィルタリング

```dataview
TASK
FROM ""
WHERE !completed AND contains(tags, "#next-action")
GROUP BY tags
```

*Dataviewがない場合は以下のリンクで検索:*
- 🏠 [[Context - Home]]
- 🏢 [[Context - Office]]
- 💻 [[Context - Computer]]
- 📞 [[Context - Calls]]
- 🚶 [[Context - Errands]]

---

## 🟥 緊急 × 重要（第1象限）— 今すぐやる

```dataview
TASK
FROM ""
WHERE !completed AND contains(tags, "#Q1")
SORT file.mtime DESC
```

## 🟦 重要 × 余裕あり（第2象限）— 計画してやる

```dataview
TASK
FROM ""
WHERE !completed AND contains(tags, "#Q2")
SORT file.mtime DESC
```

---

## 🔗 クイックリンク

| | |
|---|---|
| [[Inbox]] | 新しいタスクを投入 |
| [[Projects]] | プロジェクト一覧 |
| [[Areas]] | 責務エリア一覧 |
| [[Templates/Daily-Review\|日次レビュー]] | 今日の振り返り |
| [[Templates/Weekly-Review\|週次レビュー]] | 週次レビュー |
| [[Someday-Maybe]] | いつかやる・保留 |

---

## 📊 今週の統計

- 完了タスク数:
- フォーカス時間合計:
- TOP3達成率: / 5日

