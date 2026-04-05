// ============================================================
// calendar.js — カレンダービュー
// ============================================================

const Calendar = (() => {

  let currentYear  = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-indexed
  let selectedDate = null;

  // ── Render ─────────────────────────────────────────────────
  function render() {
    renderHeader();
    renderGrid();
    if (selectedDate) {
      renderDayDetail(selectedDate);
    } else {
      // デフォルトで今日を選択
      const today = Store.todayStr();
      selectDate(today);
    }
  }

  function renderHeader() {
    const el = id => document.getElementById(id);
    if (el('cal-month-label')) {
      el('cal-month-label').textContent =
        `${currentYear}年 ${currentMonth + 1}月`;
    }
  }

  // ── Monthly Grid ───────────────────────────────────────────
  function renderGrid() {
    const container = document.getElementById('cal-grid');
    if (!container) return;

    const today = Store.todayStr();

    // 月の最初の日と最後の日
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay  = new Date(currentYear, currentMonth + 1, 0);

    // 月初の曜日（月曜始まり: 月=0, …, 日=6）
    let startDow = firstDay.getDay(); // 0=日…6=土
    startDow = (startDow + 6) % 7;   // 月曜=0に変換

    // 全タスクから期日をマッピング
    const tasksByDate = {};
    Store.getTasks().forEach(t => {
      if (t.dueDate) {
        if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
        tasksByDate[t.dueDate].push(t);
      }
    });

    // タイムブロックも確認
    const data = Store.get();

    const days   = lastDay.getDate();
    const weeks  = Math.ceil((startDow + days) / 7);
    const DOW_LABELS = ['月','火','水','木','金','土','日'];

    let html = `
    <div class="cal-dow-row">
      ${DOW_LABELS.map((d, i) => `
        <div class="cal-dow ${i >= 5 ? 'weekend' : ''}">${d}</div>`).join('')}
    </div>`;

    let dayCount = 1;
    for (let w = 0; w < weeks; w++) {
      html += `<div class="cal-week">`;
      for (let d = 0; d < 7; d++) {
        const cellIdx = w * 7 + d;
        if (cellIdx < startDow || dayCount > days) {
          html += `<div class="cal-cell cal-cell-empty"></div>`;
        } else {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(dayCount).padStart(2,'0')}`;
          const tasks   = tasksByDate[dateStr] || [];
          const isToday = dateStr === today;
          const isSel   = dateStr === selectedDate;
          const hasTimeblock = data.timeBlocks && data.timeBlocks[dateStr] &&
            Object.keys(data.timeBlocks[dateStr]).some(k => !k.endsWith('_status') && data.timeBlocks[dateStr][k]);
          const isWeekend = d >= 5;

          // タスクのうち優先度P1があるか
          const hasP1 = tasks.some(t => t.priority === 'P1' && !t.completed);
          const doneAll = tasks.length > 0 && tasks.every(t => t.completed);

          html += `
          <div class="cal-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${isWeekend ? 'weekend-cell' : ''}"
               onclick="Calendar.selectDate('${dateStr}')">
            <div class="cal-cell-num ${isToday ? 'today-num' : ''}">${dayCount}</div>
            <div class="cal-cell-tasks">
              ${tasks.slice(0, 3).map(t => `
                <div class="cal-task-dot ${t.completed ? 'done' : ''} priority-${(t.priority||'').toLowerCase()}"
                     title="${Components.escapeHTML(t.title)}">
                  ${t.completed ? '✓ ' : ''}${Components.escapeHTML(t.title.length > 12 ? t.title.slice(0,12)+'…' : t.title)}
                </div>`).join('')}
              ${tasks.length > 3 ? `<div class="cal-task-more">+${tasks.length - 3}件</div>` : ''}
              ${hasTimeblock && tasks.length === 0 ? `<div class="cal-tb-dot">📅</div>` : ''}
            </div>
          </div>`;
          dayCount++;
        }
      }
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  // ── Day Detail ─────────────────────────────────────────────
  function selectDate(dateStr) {
    selectedDate = dateStr;

    // グリッドの selected クラスを更新
    document.querySelectorAll('.cal-cell').forEach(el => {
      el.classList.toggle('selected', el.querySelector('.cal-cell-num') &&
        el.getAttribute('onclick')?.includes(`'${dateStr}'`));
    });

    renderDayDetail(dateStr);
  }

  function renderDayDetail(dateStr) {
    const panel = document.getElementById('cal-day-panel');
    if (!panel) return;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNames = ['日','月','火','水','木','金','土'];
    const label = `${dateObj.getMonth()+1}月${dateObj.getDate()}日 (${dayNames[dateObj.getDay()]})`;

    const allTasks = Store.getTasks();
    const tasks = allTasks.filter(t => t.dueDate === dateStr);
    const tb    = Store.getTimeBlocks(dateStr);
    const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
    const hasAnyTb = TIME_SLOTS.some(s => tb[s]);

    // タスク追加フォームの見出し
    panel.innerHTML = `
    <div class="cal-panel-header">
      <div class="cal-panel-date">${label}</div>
      <button class="btn btn-primary btn-sm" onclick="Calendar.addTaskForDate('${dateStr}')">＋ タスクを追加</button>
    </div>

    <!-- Tasks for this date -->
    <div style="margin-bottom:16px;">
      <div class="card-title" style="margin-bottom:8px;"><span class="icon">📋</span>この日のタスク (${tasks.length}件)</div>
      ${tasks.length === 0
        ? `<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">期日が設定されたタスクはありません</div>`
        : `<div class="task-list">${tasks.map(t => Components.taskItemHTML(t)).join('')}</div>`}
    </div>

    <!-- TimeBlock for this date -->
    <div>
      <div class="card-title" style="margin-bottom:8px;"><span class="icon">⏰</span>タイムブロック</div>
      <div class="table-wrap">
        <table class="timeblock-table" style="font-size:12px;">
          <thead><tr><th>時間</th><th>タスク / 予定</th><th>状態</th></tr></thead>
          <tbody>
            ${TIME_SLOTS.map(slot => {
              const val = tb[slot] || '';
              const status = tb[slot + '_status'] || '';
              const statusDone = status === 'done';
              return `<tr style="${statusDone ? 'opacity:0.5;' : ''}">
                <td style="color:var(--text-muted);font-size:11px;font-weight:600;">${slot}</td>
                <td><input class="timeblock-input" id="cal-tb-${dateStr}-${slot.replace(':','-')}"
                  value="${Components.escapeHTML(val)}"
                  placeholder="予定を入力…"
                  onchange="Calendar.saveTimeBlock('${dateStr}', '${slot}', this.value)"></td>
                <td>
                  <select class="form-select"
                    style="padding:3px 20px 3px 6px;font-size:11px;width:auto;"
                    onchange="Calendar.saveTimeBlockStatus('${dateStr}', '${slot}', this.value)">
                    <option value="">-</option>
                    <option value="done"  ${status==='done' ?'selected':''}>✅ 完了</option>
                    <option value="skip"  ${status==='skip' ?'selected':''}>⏭ スキップ</option>
                    <option value="move"  ${status==='move' ?'selected':''}>➡ 移動</option>
                  </select>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // ── Navigation ─────────────────────────────────────────────
  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDate = null;
    renderHeader();
    renderGrid();
    document.getElementById('cal-day-panel').innerHTML = `<div style="color:var(--text-muted);font-size:13px;">日付を選択すると詳細が表示されます</div>`;
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDate = null;
    renderHeader();
    renderGrid();
    document.getElementById('cal-day-panel').innerHTML = `<div style="color:var(--text-muted);font-size:13px;">日付を選択すると詳細が表示されます</div>`;
  }

  function goToday() {
    const now = new Date();
    currentYear  = now.getFullYear();
    currentMonth = now.getMonth();
    render();
  }

  // ── TimeBlock Save ─────────────────────────────────────────
  function saveTimeBlock(dateStr, slot, value) {
    Store.setTimeBlock(dateStr, slot, value);
  }

  function saveTimeBlockStatus(dateStr, slot, value) {
    Store.setTimeBlock(dateStr, slot + '_status', value);
    renderGrid(); // ドット更新
  }

  // ── Add Task for date ──────────────────────────────────────
  function addTaskForDate(dateStr) {
    Components.showTaskEditor({
      id: 'new',
      title: '',
      category: 'inbox',
      dueDate: dateStr,
    });
  }

  return {
    render, selectDate, prevMonth, nextMonth, goToday,
    saveTimeBlock, saveTimeBlockStatus, addTaskForDate,
  };
})();
