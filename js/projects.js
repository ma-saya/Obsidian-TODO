// ============================================================
// projects.js
// ============================================================

const Projects = (() => {

  function render() {
    renderActive();
    renderDone();
  }

  function renderActive() {
    const container = document.getElementById('projects-active-list');
    if (!container) return;
    const projects = Store.getProjects('active');
    if (projects.length === 0) {
      container.innerHTML = Components.emptyState('📁', 'アクティブなプロジェクトはありません');
      return;
    }
    container.innerHTML = projects.map(p => projectCard(p)).join('');
  }

  function renderDone() {
    const container = document.getElementById('projects-done-list');
    if (!container) return;
    const projects = Store.getProjects('done');
    if (projects.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">まだありません</div>`;
      return;
    }
    container.innerHTML = projects.map(p => projectCard(p, true)).join('');
  }

  function projectCard(p, isDone = false) {
    const tasks = Store.getTasks({ projectId: p.id });
    const active = tasks.filter(t => !t.completed);
    const done   = tasks.filter(t => t.completed);
    const pct    = tasks.length ? Math.round(done.length / tasks.length * 100) : 0;
    const areas  = Store.getAreas();
    const area   = areas.find(a => a.id === p.areaId);

    return `
    <div class="project-card">
      <div class="project-header">
        <div class="project-name">📁 ${Components.escapeHTML(p.name)}</div>
        <span class="project-status ${isDone ? 'status-done' : 'status-active'}">
          ${isDone ? '✅ 完了' : '🟢 進行中'}
        </span>
        <div style="display:flex;gap:4px;">
          ${!isDone ? `<button class="btn btn-ghost btn-icon" onclick="Projects.completeProject('${p.id}')" title="完了にする">✅</button>` : ''}
          <button class="btn btn-ghost btn-icon" onclick="Projects.editProject('${p.id}')" title="編集">✏️</button>
          <button class="btn btn-ghost btn-icon" onclick="Projects.deleteProject('${p.id}')" title="削除">🗑️</button>
        </div>
      </div>
      <div class="project-meta">
        ${p.dueDate ? `<span>📅 ${p.dueDate}</span>` : ''}
        ${area ? `<span>${area.icon} ${Components.escapeHTML(area.name)}</span>` : ''}
        ${p.nextAction ? `<span>⚡ ${Components.escapeHTML(p.nextAction)}</span>` : ''}
      </div>
      ${p.goalText ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:8px;border-left:2px solid var(--border);padding-left:8px;">${Components.escapeHTML(p.goalText)}</div>` : ''}
      ${tasks.length > 0 ? `
        <div class="progress-bar" style="margin-top:10px;" title="${pct}%完了">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${done.length}/${tasks.length} 完了 (${pct}%)</div>` : ''}
      ${active.length > 0 ? `
        <div style="margin-top:12px;">
          <div class="task-list">${active.slice(0,5).map(t => Components.taskItemHTML(t)).join('')}</div>
          ${active.length > 5 ? `<button class="btn btn-ghost btn-sm" onclick="Projects.renderProjectTasks('${p.id}')">すべて表示 (${active.length}件)</button>` : ''}
        </div>` : ''}
      ${!isDone ? `
        <div style="margin-top:10px;display:flex;gap:6px;">
          <input id="proj-task-${p.id}" class="form-input" placeholder="タスクを追加…" style="flex:1;padding:5px 10px;font-size:12px;"
            onkeydown="if(event.key==='Enter')Projects.addProjectTask('${p.id}')">
          <button class="btn btn-primary btn-sm" onclick="Projects.addProjectTask('${p.id}')">＋</button>
        </div>` : ''}
    </div>`;
  }

  function addProjectTask(projectId) {
    const input = document.getElementById(`proj-task-${projectId}`);
    if (!input || !input.value.trim()) return;
    Store.addTask({ title: input.value.trim(), projectId, category: 'project', status: 'next-action' });
    input.value = '';
    render();
    Components.toast('タスクを追加しました', 'success');
  }

  function completeProject(id) {
    Store.updateProject(id, { status: 'done', completedAt: new Date().toISOString() });
    render();
    Components.toast('プロジェクトを完了しました 🎉', 'success');
  }

  function deleteProject(id) {
    if (!Components.confirm('このプロジェクトを削除しますか？\n（関連タスクはInboxに移動します）')) return;
    Store.deleteProject(id);
    render();
    Components.toast('削除しました', 'error');
  }

  function editProject(id) {
    const p = Store.getProjects().find(pr => pr.id === id);
    if (!p) return;
    showProjectModal(p);
  }

  function showNewProjectModal() {
    showProjectModal({ id: null, name: '', goalText: '', dueDate: null, areaId: null, nextAction: '' });
  }

  function showProjectModal(p) {
    const areas = Store.getAreas();
    const areaOpts = areas.map(a =>
      `<option value="${a.id}" ${p.areaId === a.id ? 'selected' : ''}>${a.icon} ${Components.escapeHTML(a.name)}</option>`
    ).join('');

    const modalId = 'modal-project';
    const body = `
      <div class="form-group">
        <label class="form-label">プロジェクト名</label>
        <input class="form-input" id="proj-name" value="${Components.escapeHTML(p.name)}" placeholder="例: 転職活動" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">ゴール（完了した状態）</label>
        <textarea class="form-textarea" id="proj-goal" placeholder="このプロジェクトが完了したとき、どうなっている？" style="min-height:60px;">${Components.escapeHTML(p.goalText||'')}</textarea>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">📅 期限</label>
          <input type="date" class="form-input" id="proj-due" value="${p.dueDate||''}">
        </div>
        <div class="form-group">
          <label class="form-label">エリア</label>
          <select class="form-select" id="proj-area">
            <option value="">-</option>
            ${areaOpts}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Next Action</label>
        <input class="form-input" id="proj-next" value="${Components.escapeHTML(p.nextAction||'')}" placeholder="今すぐ着手できる次の一手">
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal('${modalId}')">キャンセル</button>
      <button class="btn btn-primary" onclick="Projects.saveProject('${p.id || 'new'}', '${modalId}')">保存</button>`;

    Components.createModal({ id: modalId, title: p.id ? '✏️ プロジェクトを編集' : '📁 新規プロジェクト', body, footer });
    Components.openModal(modalId);
  }

  function saveProject(id, modalId) {
    const val = (elId) => { const el = document.getElementById(elId); return el ? el.value.trim() || null : null; };
    const name = val('proj-name');
    if (!name) { Components.toast('プロジェクト名を入力してください', 'error'); return; }

    const data = {
      name,
      goalText:   document.getElementById('proj-goal')?.value || '',
      dueDate:    val('proj-due'),
      areaId:     val('proj-area'),
      nextAction: val('proj-next'),
    };

    if (id === 'new') {
      Store.addProject(data);
    } else {
      Store.updateProject(id, data);
    }
    Components.closeModal(modalId);
    Components.toast('保存しました', 'success');
    App.refresh();
  }

  return {
    render, addProjectTask, completeProject, deleteProject, editProject,
    showNewProjectModal, saveProject,
  };
})();
