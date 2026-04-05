// ============================================================
// components.js — 共通UIコンポーネント
// ============================================================

const Components = (() => {

  // ── Toast ──────────────────────────────────────────────────
  function toast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      el.style.transition = '0.2s ease';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  // ── Modal ──────────────────────────────────────────────────
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('open');
  }

  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('open');
  }

  function createModal({ id, title, body, footer }) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="Components.closeModal('${id}')">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer || ''}</div>
      </div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(id);
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  // ── Task Badge ─────────────────────────────────────────────
  function priorityBadge(p) {
    if (!p) return '';
    const labels = { P1: '🔴 P1', P2: '🟡 P2', P3: '🔵 P3', P4: '⚫ P4' };
    return `<span class="badge badge-${p.toLowerCase()}">${labels[p] || p}</span>`;
  }

  function quadrantBadge(q) {
    if (!q) return '';
    const labels = { Q1: '🟥 Q1', Q2: '🟦 Q2', Q3: '🟧 Q3', Q4: '⬜ Q4' };
    return `<span class="badge badge-${q.toLowerCase()}">${labels[q] || q}</span>`;
  }

  function contextBadge(ctx) {
    if (!ctx) return '';
    const map = {
      home:     { icon: '🏠', label: 'home',     cls: 'badge-ctx-home' },
      office:   { icon: '🏢', label: 'office',   cls: 'badge-ctx-office' },
      computer: { icon: '💻', label: 'PC',        cls: 'badge-ctx-computer' },
      calls:    { icon: '📞', label: 'calls',     cls: 'badge-ctx-calls' },
      errands:  { icon: '🚶', label: 'errands',   cls: 'badge-ctx-errands' },
    };
    const c = map[ctx];
    if (!c) return `<span class="badge">${ctx}</span>`;
    return `<span class="badge ${c.cls}">${c.icon} ${c.label}</span>`;
  }

  function statusBadge(s) {
    if (!s) return '';
    const map = {
      'next-action': '<span class="badge badge-next-action">⚡ next</span>',
      waiting:       '<span class="badge badge-waiting">⏳ waiting</span>',
      someday:       '<span class="badge badge-someday">💭 someday</span>',
    };
    return map[s] || `<span class="badge">${s}</span>`;
  }

  function dueBadge(date) {
    if (!date) return '';
    return `<span class="badge badge-due">📅 ${date}</span>`;
  }

  function estimateBadge(time) {
    if (!time) return '';
    return `<span class="badge badge-estimate">⏱ ${time}</span>`;
  }

  // ── Task Item HTML ─────────────────────────────────────────
  function taskItemHTML(task, opts = {}) {
    const meta = [
      priorityBadge(task.priority),
      quadrantBadge(task.quadrant),
      contextBadge(task.context),
      statusBadge(task.status),
      dueBadge(task.dueDate),
      estimateBadge(task.estimatedTime),
    ].filter(Boolean).join('');

    const doneClass = task.completed ? 'completed' : '';
    const checkClass = task.completed ? 'checked' : '';
    const checkMark = task.completed ? '✓' : '';

    return `
    <div class="task-item ${doneClass}" data-id="${task.id}">
      <div class="task-checkbox ${checkClass}"
           onclick="App.toggleTask('${task.id}')"
           title="完了/未完了を切り替え">${checkMark}</div>
      <div class="task-body">
        <div class="task-title">${escapeHTML(task.title)}</div>
        ${meta ? `<div class="task-meta">${meta}</div>` : ''}
      </div>
      <div class="task-actions">
        ${opts.showEdit !== false ? `<button class="btn btn-ghost btn-icon" onclick="App.editTask('${task.id}')" title="編集">✏️</button>` : ''}
        ${opts.showDelete !== false ? `<button class="btn btn-ghost btn-icon" onclick="App.deleteTask('${task.id}')" title="削除">🗑️</button>` : ''}
        ${opts.showMove ? `<button class="btn btn-ghost btn-icon" onclick="App.moveTaskDialog('${task.id}')" title="移動">📤</button>` : ''}
      </div>
    </div>`;
  }

  // ── Tag Picker ─────────────────────────────────────────────
  function tagPicker({ name, options, selected, onSelect }) {
    return options.map(opt => {
      const isSelected = selected === opt.value;
      return `<button class="tag-pick ${isSelected ? 'selected' : ''}"
        onclick="(function(el){
          el.closest('.tags-row').querySelectorAll('.tag-pick').forEach(b=>b.classList.remove('selected'));
          el.classList.add('selected');
          ${onSelect ? onSelect : ''}
        })(this)"
        data-value="${opt.value}">${opt.label}</button>`;
    }).join('');
  }

  // ── Confirm Dialog ─────────────────────────────────────────
  function confirm(message) {
    return window.confirm(message);
  }

  // ── Escape HTML ────────────────────────────────────────────
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Format Date ────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return dateStr; }
  }

  function todayJP() {
    const now = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} (${days[now.getDay()]})`;
  }

  function weekJP() {
    const now = new Date();
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  // ── Empty State ────────────────────────────────────────────
  function emptyState(icon, message) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${message}</p></div>`;
  }

  // ── Task Edit Modal ────────────────────────────────────────
  function showTaskEditor(task, onSave) {
    const projects = Store.getProjects();
    const areas = Store.getAreas();
    const id = 'modal-task-edit';

    const projectOptions = projects.filter(p => p.status === 'active').map(p =>
      `<option value="${p.id}" ${task.projectId === p.id ? 'selected' : ''}>${escapeHTML(p.name)}</option>`
    ).join('');

    const areaOptions = areas.map(a =>
      `<option value="${a.id}" ${task.areaId === a.id ? 'selected' : ''}>${a.icon} ${escapeHTML(a.name)}</option>`
    ).join('');

    const body = `
      <div class="form-group">
        <label class="form-label">タスク名</label>
        <input class="form-input" id="te-title" value="${escapeHTML(task.title)}" placeholder="タスク名を入力..." autofocus>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">優先度</label>
          <select class="form-select" id="te-priority">
            <option value="">-</option>
            <option value="P1" ${task.priority==='P1'?'selected':''}>🔴 P1 最重要</option>
            <option value="P2" ${task.priority==='P2'?'selected':''}>🟡 P2 重要</option>
            <option value="P3" ${task.priority==='P3'?'selected':''}>🔵 P3 普通</option>
            <option value="P4" ${task.priority==='P4'?'selected':''}>⚫ P4 低</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Eisenhower象限</label>
          <select class="form-select" id="te-quadrant">
            <option value="">-</option>
            <option value="Q1" ${task.quadrant==='Q1'?'selected':''}>🟥 Q1 緊急×重要</option>
            <option value="Q2" ${task.quadrant==='Q2'?'selected':''}>🟦 Q2 余裕×重要</option>
            <option value="Q3" ${task.quadrant==='Q3'?'selected':''}>🟧 Q3 緊急×重要でない</option>
            <option value="Q4" ${task.quadrant==='Q4'?'selected':''}>⬜ Q4 余裕×重要でない</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">コンテキスト</label>
          <select class="form-select" id="te-context">
            <option value="">-</option>
            <option value="home"     ${task.context==='home'    ?'selected':''}>🏠 home</option>
            <option value="office"   ${task.context==='office'  ?'selected':''}>🏢 office</option>
            <option value="computer" ${task.context==='computer'?'selected':''}>💻 PC</option>
            <option value="calls"    ${task.context==='calls'   ?'selected':''}>📞 calls</option>
            <option value="errands"  ${task.context==='errands' ?'selected':''}>🚶 errands</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ステータス</label>
          <select class="form-select" id="te-status">
            <option value="">-</option>
            <option value="next-action" ${task.status==='next-action'?'selected':''}>⚡ next-action</option>
            <option value="waiting"     ${task.status==='waiting'    ?'selected':''}>⏳ waiting</option>
            <option value="someday"     ${task.status==='someday'    ?'selected':''}>💭 someday</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">📅 期日</label>
          <input type="date" class="form-input" id="te-due" value="${task.dueDate||''}">
        </div>
        <div class="form-group">
          <label class="form-label">🛫 開始日</label>
          <input type="date" class="form-input" id="te-start" value="${task.startDate||''}">
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">⏱ 見積時間</label>
          <select class="form-select" id="te-estimate">
            <option value="">-</option>
            <option value="15min" ${task.estimatedTime==='15min'?'selected':''}>15分</option>
            <option value="30min" ${task.estimatedTime==='30min'?'selected':''}>30分</option>
            <option value="1h"    ${task.estimatedTime==='1h'   ?'selected':''}>1時間</option>
            <option value="2h"    ${task.estimatedTime==='2h'   ?'selected':''}>2時間</option>
            <option value="4h"    ${task.estimatedTime==='4h'   ?'selected':''}>4時間</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">🔁 繰り返し</label>
          <select class="form-select" id="te-recurring">
            <option value="">-</option>
            <option value="every day"   ${task.recurring==='every day'  ?'selected':''}>毎日</option>
            <option value="every week"  ${task.recurring==='every week' ?'selected':''}>毎週</option>
            <option value="every month" ${task.recurring==='every month'?'selected':''}>毎月</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">プロジェクト</label>
          <select class="form-select" id="te-project">
            <option value="">-</option>
            ${projectOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">エリア</label>
          <select class="form-select" id="te-area">
            <option value="">-</option>
            ${areaOptions}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">カテゴリ</label>
        <select class="form-select" id="te-category">
          <option value="inbox"   ${task.category==='inbox'  ?'selected':''}>📥 Inbox</option>
          <option value="project" ${task.category==='project'?'selected':''}>📁 プロジェクト</option>
          <option value="area"    ${task.category==='area'   ?'selected':''}>🗂 エリア</option>
          <option value="someday" ${task.category==='someday'?'selected':''}>💭 Someday</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">メモ</label>
        <textarea class="form-textarea" id="te-notes" placeholder="メモを入力...">${escapeHTML(task.notes||'')}</textarea>
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal('${id}')">キャンセル</button>
      <button class="btn btn-primary" onclick="Components._saveTaskEdit('${id}', '${task.id}', ${JSON.stringify(onSave).replace(/"/g, '&quot;')})">保存</button>`;

    createModal({ id, title: task.id ? '✏️ タスクを編集' : '➕ タスクを追加', body, footer });
    openModal(id);

    // focus
    setTimeout(() => {
      const inp = document.getElementById('te-title');
      if (inp) inp.focus();
    }, 100);
  }

  function _saveTaskEdit(modalId, taskId, onSaveFnName) {
    const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? (el.value.trim() || null) : null;
    };
    const title = getValue('te-title');
    if (!title) { toast('タスク名を入力してください', 'error'); return; }

    const updates = {
      title,
      priority:      getValue('te-priority'),
      quadrant:      getValue('te-quadrant'),
      context:       getValue('te-context'),
      status:        getValue('te-status'),
      dueDate:       getValue('te-due'),
      startDate:     getValue('te-start'),
      estimatedTime: getValue('te-estimate'),
      recurring:     getValue('te-recurring'),
      projectId:     getValue('te-project'),
      areaId:        getValue('te-area'),
      category:      document.getElementById('te-category')?.value || 'inbox',
      notes:         document.getElementById('te-notes')?.value || '',
    };

    if (taskId && taskId !== 'new') {
      Store.updateTask(taskId, updates);
    } else {
      Store.addTask(updates);
    }

    closeModal(modalId);
    toast('保存しました', 'success');
    App.refresh();
  }

  return {
    toast, openModal, closeModal, createModal,
    taskItemHTML,
    priorityBadge, quadrantBadge, contextBadge, statusBadge, dueBadge, estimateBadge,
    tagPicker, confirm, escapeHTML, formatDate, todayJP, weekJP,
    emptyState, showTaskEditor, _saveTaskEdit,
  };
})();
