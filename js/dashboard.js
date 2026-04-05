// ============================================================
// dashboard.js
// ============================================================

const Dashboard = (() => {

  const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  function render() {
    const today = Store.todayStr();
    const week  = Store.weekStr();
    const stats = Store.getWeekStats();
    const todayStats = Store.getTodayStats();

    document.getElementById('dashboard-date').textContent = Components.todayJP();
    document.getElementById('dashboard-week').textContent = week;

    renderTop3(today);
    renderTimeBlock(today);
    renderContextSection();
    renderQuadrants();
    renderStats(stats, todayStats);
    renderInboxSnippet();
  }

  // ── TOP3 ──────────────────────────────────────────────────
  function renderTop3(today) {
    const saved = Store.getTop3(today);
    const container = document.getElementById('top3-list');
    if (!container) return;

    container.innerHTML = [0,1,2].map(i => `
      <div class="top3-item ${saved[i]?.done ? 'done' : ''}" data-idx="${i}">
        <div class="top3-num">${i+1}</div>
        <input class="top3-input" placeholder="今日これだけは終わらせる…"
          value="${Components.escapeHTML(saved[i]?.text || '')}"
          id="top3-input-${i}"
          onchange="Dashboard.saveTop3()"
          onkeydown="if(event.key==='Enter' && ${i}<2) document.getElementById('top3-input-${i+1}').focus()">
        <span class="top3-done-btn" onclick="Dashboard.toggleTop3Done(${i})" title="達成！">
          ${saved[i]?.done ? '✅' : '⬜'}
        </span>
      </div>`).join('');
  }

  function saveTop3() {
    const today = Store.todayStr();
    const existing = Store.getTop3(today);
    const tasks = [0,1,2].map(i => {
      const inp = document.getElementById(`top3-input-${i}`);
      return {
        text: inp ? inp.value.trim() : '',
        done: existing[i]?.done || false,
      };
    });
    Store.saveTop3(today, tasks);
  }

  function toggleTop3Done(idx) {
    const today = Store.todayStr();
    const tasks = Store.getTop3(today);
    const current = tasks[idx] || { text: '', done: false };
    if (!current.text) {
      // try to read from input
      current.text = document.getElementById(`top3-input-${idx}`)?.value.trim() || '';
    }
    current.done = !current.done;
    tasks[idx] = current;
    Store.saveTop3(today, tasks);
    renderTop3(today);
    Components.toast(current.done ? '✅ TOP3達成！' : '未達成に戻しました', current.done ? 'success' : 'info');
  }

  // ── Time Block ─────────────────────────────────────────────
  function renderTimeBlock(today) {
    const tb = Store.getTimeBlocks(today);
    const container = document.getElementById('timeblock-table-body');
    if (!container) return;
    container.innerHTML = TIME_SLOTS.map(slot => {
      const val = tb[slot] || '';
      return `<tr>
        <td class="text-secondary">${slot}</td>
        <td><input class="timeblock-input" value="${Components.escapeHTML(val)}"
          placeholder="タスク / 予定"
          onchange="Dashboard.saveTimeBlock('${slot}', this.value)"></td>
        <td>
          <select class="form-select" style="padding:3px 24px 3px 6px; font-size:11px; width:auto;"
            onchange="Dashboard.saveTimeBlockStatus('${slot}', this.value)">
            <option value="">-</option>
            <option value="done"    ${tb[slot+'_status']==='done'   ?'selected':''}>✅ 完了</option>
            <option value="skip"    ${tb[slot+'_status']==='skip'   ?'selected':''}>⏭ スキップ</option>
            <option value="move"    ${tb[slot+'_status']==='move'   ?'selected':''}>➡ 移動</option>
          </select>
        </td>
      </tr>`;
    }).join('');
  }

  function saveTimeBlock(slot, value) {
    const today = Store.todayStr();
    Store.setTimeBlock(today, slot, value);
  }

  function saveTimeBlockStatus(slot, value) {
    const today = Store.todayStr();
    Store.setTimeBlock(today, slot + '_status', value);
  }

  // ── Context Filter ─────────────────────────────────────────
  let activeCtx = null;

  function renderContextSection() {
    renderContextTasks(activeCtx);
  }

  function setContext(ctx) {
    activeCtx = ctx === activeCtx ? null : ctx;
    document.querySelectorAll('.ctx-btn').forEach(btn => {
      btn.classList.toggle('active-ctx', btn.dataset.ctx === activeCtx);
    });
    renderContextTasks(activeCtx);
  }

  function renderContextTasks(ctx) {
    const container = document.getElementById('context-tasks-list');
    if (!container) return;

    let tasks = Store.getTasks({ completed: false, status: 'next-action' });
    if (ctx) tasks = tasks.filter(t => t.context === ctx);

    if (tasks.length === 0) {
      container.innerHTML = Components.emptyState('⚡', ctx
        ? `${ctx} の next-action はありません`
        : 'next-action がありません');
      return;
    }
    container.innerHTML = `<div class="task-list">${tasks.slice(0,10).map(t => Components.taskItemHTML(t)).join('')}</div>`;
  }

  // ── Quadrants ──────────────────────────────────────────────
  function renderQuadrants() {
    ['Q1','Q2','Q3','Q4'].forEach(q => {
      const el = document.getElementById(`quadrant-${q.toLowerCase()}`);
      if (!el) return;
      const tasks = Store.getTasks({ completed: false, quadrant: q });
      if (tasks.length === 0) {
        el.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">なし</div>`;
      } else {
        el.innerHTML = tasks.slice(0,5).map(t => `
          <div class="task-item" style="margin-bottom:4px;padding:6px 10px;" data-id="${t.id}">
            <div class="task-checkbox ${t.completed?'checked':''}"
                 onclick="App.toggleTask('${t.id}')">
              ${t.completed?'✓':''}
            </div>
            <div class="task-body" style="font-size:12px;">${Components.escapeHTML(t.title)}</div>
          </div>`).join('');
      }
    });
  }

  // ── Stats ──────────────────────────────────────────────────
  function renderStats(weekStats, todayStats) {
    const el = id => document.getElementById(id);
    if (el('stat-today-done'))   el('stat-today-done').textContent = todayStats.completedCount;
    if (el('stat-week-done'))    el('stat-week-done').textContent  = weekStats.completedCount;
    if (el('stat-inbox-count')) {
      const inboxCount = Store.getTasks({ completed: false, category: 'inbox' }).length;
      el('stat-inbox-count').textContent = inboxCount;
    }
    if (el('stat-top3-done')) {
      const today = Store.todayStr();
      const top3 = Store.getTop3(today);
      const doneCount = top3.filter(t => t?.done).length;
      el('stat-top3-done').textContent = `${doneCount}/3`;
    }
  }

  // ── Inbox Snippet ──────────────────────────────────────────
  function renderInboxSnippet() {
    const container = document.getElementById('inbox-snippet');
    if (!container) return;
    const tasks = Store.getTasks({ completed: false, category: 'inbox' });
    if (tasks.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">Inboxは空です 🎉</div>`;
      return;
    }
    container.innerHTML = `<div class="task-list">${tasks.slice(0,5).map(t => Components.taskItemHTML(t, { showMove: true })).join('')}</div>
      ${tasks.length > 5 ? `<div style="text-align:center;margin-top:8px;"><button class="btn btn-ghost btn-sm" onclick="App.navigate('inbox')">あと ${tasks.length - 5} 件を見る →</button></div>` : ''}`;

    // Update badge
    const badge = document.getElementById('inbox-badge');
    if (badge) badge.textContent = tasks.length;
  }

  return {
    render, saveTop3, toggleTop3Done,
    saveTimeBlock, saveTimeBlockStatus,
    setContext, renderContextSection,
  };
})();
