// ============================================================
// daily-review.js
// ============================================================

const DailyReview = (() => {

  function render() {
    const today = Store.todayStr();
    const saved = Store.getDailyReview(today) || getDefaultReview(today);

    // Header date
    const el = id => document.getElementById(id);
    if (el('dr-date')) el('dr-date').textContent = Components.todayJP();

    renderTop3(saved);
    renderFocusSessions(saved);
    renderEvening(saved);
    renderStats(saved);
  }

  function getDefaultReview(date) {
    const top3 = Store.getTop3(date);
    return {
      date,
      morning: {
        top3: top3.map(t => ({ text: t?.text || '', done: t?.done || false })),
        calendarChecked: false,
        timeblockSet: false,
        inboxProcessed: false,
        context: '',
        theme: '',
      },
      focusSessions: [
        { task: '', start: '', end: '', minutes: '' },
        { task: '', start: '', end: '', minutes: '' },
        { task: '', start: '', end: '', minutes: '' },
        { task: '', start: '', end: '', minutes: '' },
      ],
      evening: {
        completedTasks: [],
        rescheduled: [],
        note: '',
      },
      stats: {
        completedCount: 0,
        focusSessionCount: 0,
        top3Done: 0,
        inboxZero: false,
      },
    };
  }

  function renderTop3(review) {
    const container = document.getElementById('dr-top3');
    if (!container) return;

    const top3 = review.morning.top3;
    container.innerHTML = [0,1,2].map(i => {
      const item = top3[i] || { text: '', done: false };
      return `
      <div class="top3-item ${item.done ? 'done' : ''}" id="dr-top3-item-${i}">
        <div class="top3-num">${i+1}</div>
        <input class="top3-input" id="dr-top3-input-${i}"
          value="${Components.escapeHTML(item.text)}"
          placeholder="今日のTOP${i+1}…"
          onchange="DailyReview.autoSave()">
        <span class="top3-done-btn" onclick="DailyReview.toggleTop3(${i})" title="達成">
          ${item.done ? '✅' : '⬜'}
        </span>
      </div>`;
    }).join('');

    // Morning checklist
    const mc = review.morning;
    ['calendar','timeblock','inbox'].forEach((key, idx) => {
      const labels = ['カレンダーに会議・予定を確認した', 'TOP3をタイムブロックに配置した', 'Inboxを処理してから始める'];
      const field = ['calendarChecked','timeblockSet','inboxProcessed'][idx];
      const el = document.getElementById(`dr-morning-${key}`);
      if (el) {
        el.checked = mc[field] || false;
        el.onchange = () => DailyReview.autoSave();
      }
      const lbl = document.getElementById(`dr-morning-${key}-lbl`);
      if (lbl) lbl.textContent = labels[idx];
    });
  }

  function renderFocusSessions(review) {
    const tbody = document.getElementById('dr-focus-tbody');
    if (!tbody) return;
    const sessions = review.focusSessions || [];
    tbody.innerHTML = sessions.map((s, i) => `
      <tr>
        <td style="color:var(--text-muted);font-size:12px;">${i+1}</td>
        <td><input class="focus-input" id="dr-fs-task-${i}" value="${Components.escapeHTML(s.task||'')}"
          placeholder="タスク名" onchange="DailyReview.autoSave()"></td>
        <td><input class="focus-input" id="dr-fs-start-${i}" value="${s.start||''}"
          placeholder="9:00" style="width:60px;" onchange="DailyReview.autoSave()"></td>
        <td><input class="focus-input" id="dr-fs-end-${i}" value="${s.end||''}"
          placeholder="10:00" style="width:60px;" onchange="DailyReview.autoSave()"></td>
        <td><input class="focus-input" id="dr-fs-min-${i}" value="${s.minutes||''}"
          placeholder="60" style="width:50px;" type="number" onchange="DailyReview.autoSave()"></td>
      </tr>`).join('');
  }

  function renderEvening(review) {
    const noteEl = document.getElementById('dr-evening-note');
    if (noteEl) {
      noteEl.value = review.evening?.note || '';
      noteEl.onchange = () => DailyReview.autoSave();
    }

    // TOP3 achievement checkboxes
    [0,1,2].forEach(i => {
      const el = document.getElementById(`dr-achieve-${i}`);
      if (el) {
        el.checked = review.morning.top3[i]?.done || false;
        el.onchange = () => {
          DailyReview.toggleTop3(i);
        };
      }
    });

    // Reschedule table
    const tbody = document.getElementById('dr-reschedule-tbody');
    if (!tbody) return;
    const items = review.evening?.rescheduled || [{ task: '', action: '' }];
    tbody.innerHTML = items.map((r, i) => `
      <tr>
        <td><input class="focus-input" id="dr-reschedule-task-${i}" value="${Components.escapeHTML(r.task||'')}"
          placeholder="未完了タスク" onchange="DailyReview.autoSave()"></td>
        <td>
          <select class="form-select" id="dr-reschedule-action-${i}" style="font-size:12px;padding:4px 24px 4px 8px;"
            onchange="DailyReview.autoSave()">
            <option value="">選択…</option>
            <option value="tomorrow"  ${r.action==='tomorrow' ?'selected':''}>➡ 明日</option>
            <option value="thisweek" ${r.action==='thisweek'?'selected':''}>➡ 今週中</option>
            <option value="someday"  ${r.action==='someday' ?'selected':''}>💭 Someday</option>
            <option value="delete"   ${r.action==='delete'  ?'selected':''}>🗑 削除</option>
          </select>
        </td>
      </tr>`).join('');
  }

  function renderStats(review) {
    const s = review.stats || {};
    const el = id => document.getElementById(id);
    if (el('dr-stat-done'))    el('dr-stat-done').textContent = s.completedCount || 0;
    if (el('dr-stat-focus'))   el('dr-stat-focus').textContent = s.focusSessionCount || 0;
    if (el('dr-stat-top3'))    el('dr-stat-top3').textContent = `${s.top3Done || 0}/3`;
    if (el('dr-stat-inbox') )  el('dr-stat-inbox').textContent = s.inboxZero ? '✅' : '❌';
  }

  function toggleTop3(idx) {
    const today = Store.todayStr();
    const review = Store.getDailyReview(today) || getDefaultReview(today);
    if (!review.morning.top3[idx]) review.morning.top3[idx] = { text: '', done: false };
    review.morning.top3[idx].done = !review.morning.top3[idx].done;
    Store.saveDailyReview(review);
    Store.saveTop3(today, review.morning.top3);
    render();
  }

  function addRescheduleRow() {
    const today = Store.todayStr();
    const review = Store.getDailyReview(today) || getDefaultReview(today);
    if (!review.evening.rescheduled) review.evening.rescheduled = [];
    review.evening.rescheduled.push({ task: '', action: '' });
    Store.saveDailyReview(review);
    render();
  }

  function addFocusSession() {
    const today = Store.todayStr();
    const review = Store.getDailyReview(today) || getDefaultReview(today);
    review.focusSessions.push({ task: '', start: '', end: '', minutes: '' });
    Store.saveDailyReview(review);
    render();
  }

  function autoSave() {
    const today = Store.todayStr();
    const review = Store.getDailyReview(today) || getDefaultReview(today);

    // TOP3
    [0,1,2].forEach(i => {
      const inp = document.getElementById(`dr-top3-input-${i}`);
      if (inp) {
        if (!review.morning.top3[i]) review.morning.top3[i] = { text: '', done: false };
        review.morning.top3[i].text = inp.value;
      }
    });

    // Morning checks
    ['calendarChecked','timeblockSet','inboxProcessed'].forEach((field, i) => {
      const keys = ['calendar','timeblock','inbox'];
      const el = document.getElementById(`dr-morning-${keys[i]}`);
      if (el) review.morning[field] = el.checked;
    });

    // Focus sessions
    review.focusSessions.forEach((s, i) => {
      const get = (sfx) => document.getElementById(`dr-fs-${sfx}-${i}`)?.value || '';
      s.task    = get('task');
      s.start   = get('start');
      s.end     = get('end');
      s.minutes = get('min');
    });

    // Evening note
    const noteEl = document.getElementById('dr-evening-note');
    if (noteEl && review.evening) review.evening.note = noteEl.value;

    // Reschedule rows
    const rows = (review.evening?.rescheduled || []).length;
    review.evening.rescheduled = Array.from({ length: rows }, (_, i) => ({
      task:   document.getElementById(`dr-reschedule-task-${i}`)?.value || '',
      action: document.getElementById(`dr-reschedule-action-${i}`)?.value || '',
    }));

    // Compute stats
    const doneCount  = Store.getTodayStats().completedCount;
    const top3done   = review.morning.top3.filter(t => t?.done).length;
    const sessions   = review.focusSessions.filter(s => s.task).length;
    const inboxCount = Store.getTasks({ category: 'inbox', completed: false }).length;
    review.stats = {
      completedCount:    doneCount,
      focusSessionCount: sessions,
      top3Done:          top3done,
      inboxZero:         inboxCount === 0,
    };

    Store.saveDailyReview(review);
    Store.saveTop3(today, review.morning.top3);
  }

  return { render, toggleTop3, addRescheduleRow, addFocusSession, autoSave };
})();
