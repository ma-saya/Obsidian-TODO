---
tags: [task-template]
---

# タスク入力フォーマット（コピー用）

## 基本形式

```
- [ ] タスク名 #P1 #Q1 #context/office #next-action 📅2025-04-10 ⏱30min
```

## よく使うスニペット（テンプレートにも登録推奨）

### 今日やる・急ぎタスク
```
- [ ] タスク名 #P1 #Q1 #next-action 📅{{date:YYYY-MM-DD}} ⏱
```

### 今週中タスク
```
- [ ] タスク名 #P2 #Q2 #context/ 📅{{sunday:YYYY-MM-DD}} ⏱
```

### 誰かの返事待ち
```
- [ ] タスク名 #waiting （→ 誰の対応待ち）
```

### 繰り返しタスク
```
- [ ] タスク名 #context/ 🔁 every week ⏱
```

### いつかやる
```
- [ ] タスク名 #someday #P4
```

---

## 自然言語入力のコツ

Templaterプラグインを使う場合、以下の変数が使える:
- `{{date:YYYY-MM-DD}}` → 今日の日付
- `{{date+1d:YYYY-MM-DD}}` → 明日
- `{{date:dddd}}` → 曜日

