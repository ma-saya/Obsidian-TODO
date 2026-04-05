// ============================================================
// inbox.js
// ============================================================

const Inbox = (() => {

  let processTaskId = null;

  function render() {
    renderList();
    renderTagRef();
  }

  // ── Quick Add ──────────────────────────────────────────────
  function quickAdd(title) {
    if (!title.trim()) return;
    Store.addTask({ title: title.trim(), category: 'inbox' });
    const input = document.getElementById('inbox-quick-input');
    if (input) input.value = '';
    renderList();
    Components.toast('Inboxに追加しました', 'success');
    // update badge
    const badge = document.getElementById('inbox-badge');
    if (badge) {
      const count = Store.getTasks({ completed: false, category: 'inbox' }).length;
      badge.textContent = count;
    }
  }

  // ── List ───────────────────────────────────────────────────
  function renderList() {
    const container = document.getElementById('inbox-task-list');
    if (!container) return;
    const tasks = Store.getTasks({ category: 'inbox' });
    const active = tasks.filter(t => !t.completed);
    const done   = tasks.filter(t => t.completed);

    if (active.length === 0 && done.length === 0) {
      container.innerHTML = Components.emptyState('📥', 'Inboxは空です。まずタスクを上から追加してください。');
      return;
    }

    let html = '';
    if (active.length > 0) {
      html += `<div class="task-list">${active.map(t => taskItemWithProcess(t)).join('')}</div>`;
    }
    if (done.length > 0) {
      html += `
        <details style="margin-top:12px;">
          <summary style="font-size:12px;color:var(--text-muted);">✅ 完了済み (${done.length}件)</summary>
          <div class="details-content">
            <div class="task-list">${done.map(t => Components.taskItemHTML(t)).join('')}</div>
          </div>
        </details>`;
    }
    container.innerHTML = html;
  }

  function taskItemWithProcess(task) {
    const meta = [
      Components.priorityBadge(task.priority),
      Components.quadrantBadge(task.quadrant),
      Components.contextBadge(task.context),
      Components.statusBadge(task.status),
      Components.dueBadge(task.dueDate),
      Components.estimateBadge(task.estimatedTime),
    ].filter(Boolean).join('');

    return `
    <div class="task-item" data-id="${task.id}">
      <div class="task-checkbox ${task.completed?'checked':''}"
           onclick="App.toggleTask('${task.id}')">
        ${task.completed?'✓':''}
      </div>
      <div class="task-body">
        <div class="task-title">${Components.escapeHTML(task.title)}</div>
        ${meta ? `<div class="task-meta">${meta}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" onclick="Inbox.openProcess('${task.id}')" title="処理">⚙️ 処理</button>
        <button class="btn btn-ghost btn-icon" onclick="App.editTask('${task.id}')" title="編集">✏️</button>
        <button class="btn btn-ghost btn-icon" onclick="App.deleteTask('${task.id}')" title="削除">🗑️</button>
      </div>
    </div>`;
  }

  // ── Process Modal ──────────────────────────────────────────
  function openProcess(taskId) {
    processTaskId = taskId;
    const task = Store.getTasks().find(t => t.id === taskId);
    if (!task) return;

    const projects = Store.getProjects('active');
    const areas = Store.getAreas();

    const projectOpts = projects.map(p =>
      `<option value="${p.id}">${Components.escapeHTML(p.name)}</option>`
    ).join('');
    const areaOpts = areas.map(a =>
      `<option value="${a.id}">${a.icon} ${Components.escapeHTML(a.name)}</option>`
    ).join('');

    const modalId = 'modal-inbox-process';
    const body = `
      <div class="highlight-bar">📌 処理中: <strong>${Components.escapeHTML(task.title)}</strong></div>

      <div class="process-steps">
        <div class="process-step-title">STEP 1 — アクション可能？</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <button class="btn btn-secondary btn-sm" onclick="Inbox.moveSomeday('${taskId}')">💭 Someday/Maybe へ</button>
          <button class="btn btn-danger btn-sm" onclick="Inbox.deleteAndClose('${taskId}')">🗑️ 削除</button>
          <button class="btn btn-secondary btn-sm" style="margin-left:auto;" onclick="Inbox.markDone2min('${taskId}')">⚡ 2分でできる → 今すぐ完了</button>
        </div>

        <div class="process-step-title">STEP 2 — メタデータを設定</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">優先度</label>
            <select class="form-select" id="proc-priority">
              <option value="">-</option>
              <option value="P1">🔴 P1 最重要</option>
              <option value="P2">🟡 P2 重要</option>
              <option value="P3">🔵 P3 普通</option>
              <option value="P4">⚫ P4 低</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">象限</label>
            <select class="form-select" id="proc-quadrant">
              <option value="">-</option>
              <option value="Q1">🟥 Q1 緊急×重要</option>
              <option value="Q2">🟦 Q2 余裕×重要</option>
              <option value="Q3">🟧 Q3 緊急×重要でない</option>
              <option value="Q4">⬜ Q4 余裕×重要でない</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">コンテキスト</label>
            <select class="form-select" id="proc-context">
              <option value="">-</option>
              <option value="home">🏠 home</option>
              <option value="office">🏢 office</option>
              <option value="computer">💻 PC</option>
              <option value="calls">📞 calls</option>
              <option value="errands">🚶 errands</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ステータス</label>
            <select class="form-select" id="proc-status">
              <option value="next-action">⚡ next-action</option>
              <option value="waiting">⏳ waiting</option>
              <option value="someday">💭 someday</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">📅 期日</label>
            <input type="date" class="form-input" id="proc-due">
          </div>
          <div class="form-group">
            <label class="form-label">⏱ 見積時間</label>
            <select class="form-select" id="proc-estimate">
              <option value="">-</option>
              <option value="15min">15分</option>
              <option value="30min">30分</option>
              <option value="1h">1時間</option>
              <option value="2h">2時間</option>
              <option value="4h">4時間</option>
            </select>
          </div>
        </div>

        <div class="process-step-title">STEP 3 — 移動先を選択</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">プロジェクト</label>
            <select class="form-select" id="proc-project">
              <option value="">Inboxに留める</option>
              ${projectOpts}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">エリア</label>
            <select class="form-select" id="proc-area">
              <option value="">-</option>
              ${areaOpts}
            </select>
          </div>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal('${modalId}')">キャンセル</button>
      <button class="btn btn-primary" onclick="Inbox.saveProcess('${taskId}', '${modalId}')">✅ 処理完了</button>`;

    Components.createModal({ id: modalId, title: '⚙️ Inboxを処理', body, footer });
    Components.openModal(modalId);
  }

  function saveProcess(taskId, modalId) {
    const val = id => { const el = document.getElementById(id); return el ? el.value || null : null; };
    const updates = {
      priority:      val('proc-priority'),
      quadrant:      val('proc-quadrant'),
      context:       val('proc-context'),
      status:        val('proc-status') || 'next-action',
      dueDate:       val('proc-due'),
      estimatedTime: val('proc-estimate'),
      projectId:     val('proc-project'),
      areaId:        val('proc-area'),
      category:      val('proc-project') ? 'project' : (val('proc-area') ? 'area' : 'inbox'),
    };
    Store.updateTask(taskId, updates);
    Components.closeModal(modalId);
    Components.toast('処理完了！', 'success');
    App.refresh();
  }

  function moveSomeday(taskId) {
    Store.updateTask(taskId, { category: 'someday', status: 'someday' });
    Components.closeModal('modal-inbox-process');
    Components.toast('Someday/Maybeに移動しました', 'info');
    App.refresh();
  }

  function deleteAndClose(taskId) {
    if (!Components.confirm('このタスクを削除しますか？')) return;
    Store.deleteTask(taskId);
    Components.closeModal('modal-inbox-process');
    Components.toast('削除しました', 'error');
    App.refresh();
  }

  function markDone2min(taskId) {
    Store.updateTask(taskId, { completed: true });
    Components.closeModal('modal-inbox-process');
    Components.toast('✅ 2分タスク完了！', 'success');
    App.refresh();
  }

  // ── Tag Reference ──────────────────────────────────────────
  function renderTagRef() {
    // static, already in HTML
  }

  return {
    render, quickAdd, renderList,
    openProcess, saveProcess,
    moveSomeday, deleteAndClose, markDone2min,
  };
})();
