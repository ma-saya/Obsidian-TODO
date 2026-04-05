---
tags: [daily-review]
review: daily
date: {{date:YYYY-MM-DD}}
day: {{date:dddd}}
cssclasses: [daily-review]
---

<div class="daily-review-header">
  <h1>📅 {{date:YYYY-MM-DD (ddd)}} 日次レビュー</h1>
  <p><strong>開始前:</strong> [[Dashboard]] と [[Inbox]] を確認</p>
</div>

<details open>
<summary><strong>🌅 朝のプランニング（5分）</strong></summary>

### 今日の TOP 3

> 今日これだけは絶対終わらせる。3件まで。

- [ ] 1.
- [ ] 2.
- [ ] 3.

### 今日のスケジュール確認

- [ ] カレンダーに会議・予定が入っていないか確認した
- [ ] TOP3をタイムブロックに配置した
- [ ] [[Inbox]] を処理してから始める

### 今日のコンテキスト

今日は主に: `#context/`

今日のテーマ:

</details>

<details open>
<summary><strong>⏱ フォーカスセッション記録</strong></summary>

| # | タスク | 開始 | 終了 | 時間 |
|---|--------|------|------|------|
| 1 | | : | : | min |
| 2 | | : | : | min |
| 3 | | : | : | min |
| 4 | | : | : | min |

**合計フォーカス時間**: min

</details>

<details open>
<summary><strong>🌙 夜の振り返り（10分）</strong></summary>

### TOP3 達成確認

- [ ] 1. 達成 / 未達成
  理由:
- [ ] 2. 達成 / 未達成
  理由:
- [ ] 3. 達成 / 未達成
  理由:

### 完了したタスク

> Dataview を使う場合:
```dataview
TASK
FROM ""
WHERE completed AND date(file.name) = date(this.date)
SORT file.mtime DESC
```

手動で書く場合:
- [x]

### 未完了タスク → 再スケジューリング

| タスク | 対処 |
|--------|------|
| | ➡ 明日 / 今週中 / Someday / 削除 |
| | ➡ |

### 今日のひとこと振り返り

> 今日うまくいったこと・学んだこと・明日改善すること

- 

</details>

<details open>
<summary><strong>📊 今日の数字</strong></summary>

- 完了タスク数:
- フォーカスセッション数:
- TOP3達成数: / 3
- インボックスゼロ達成: ✅ / ❌

</details>
