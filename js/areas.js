// ============================================================
// areas.js
// ============================================================

const Areas = (() => {

  function render() {
    const container = document.getElementById('areas-grid');
    if (!container) return;
    const areas = Store.getAreas();
    container.innerHTML = areas.map(a => areaCard(a)).join('');
  }

  function areaCard(area) {
    const tasks = Store.getTasks({ areaId: area.id, completed: false });
    return `
    <div class="area-card">
      <div class="area-header">
        <span class="area-icon">${area.icon}</span>
        <span class="area-name">${Components.escapeHTML(area.name)}</span>
        <span class="area-count">${tasks.length} タスク</span>
        <button class="btn btn-ghost btn-icon" onclick="Areas.editArea('${area.id}')" title="編集">✏️</button>
      </div>
      ${area.goalLevel ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">🎯 ${Components.escapeHTML(area.goalLevel)}</div>` : ''}
      ${tasks.length > 0
        ? `<div class="task-list">${tasks.slice(0,4).map(t => Components.taskItemHTML(t, {showDelete:true})).join('')}</div>`
        : `<div style="font-size:12px;color:var(--text-muted);">タスクなし</div>`}
      <div style="margin-top:10px;display:flex;gap:6px;">
        <input id="area-task-${area.id}" class="form-input" placeholder="このエリアにタスクを追加…"
          style="flex:1;padding:5px 10px;font-size:12px;"
          onkeydown="if(event.key==='Enter')Areas.addAreaTask('${area.id}')">
        <button class="btn btn-primary btn-sm" onclick="Areas.addAreaTask('${area.id}')">＋</button>
      </div>
    </div>`;
  }

  function addAreaTask(areaId) {
    const input = document.getElementById(`area-task-${areaId}`);
    if (!input || !input.value.trim()) return;
    Store.addTask({ title: input.value.trim(), areaId, category: 'area' });
    input.value = '';
    render();
    Components.toast('タスクを追加しました', 'success');
  }

  function editArea(id) {
    const area = Store.getAreas().find(a => a.id === id);
    if (!area) return;
    showAreaModal(area);
  }

  function showAreaModal(area) {
    const modalId = 'modal-area';
    const body = `
      <div class="form-group">
        <label class="form-label">アイコン</label>
        <input class="form-input" id="area-icon" value="${area.icon}" maxlength="4" style="max-width:80px;">
      </div>
      <div class="form-group">
        <label class="form-label">エリア名</label>
        <input class="form-input" id="area-name" value="${Components.escapeHTML(area.name)}" placeholder="例: 健康" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">説明</label>
        <textarea class="form-textarea" id="area-desc" placeholder="このエリアの役割や説明">${Components.escapeHTML(area.description||'')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">🎯 目標水準</label>
        <input class="form-input" id="area-goal" value="${Components.escapeHTML(area.goalLevel||'')}" placeholder="このエリアで維持したい状態">
      </div>`;

    const footer = `
      <button class="btn btn-danger btn-sm" onclick="Areas.deleteArea('${area.id}', '${modalId}')">削除</button>
      <button class="btn btn-secondary" onclick="Components.closeModal('${modalId}')">キャンセル</button>
      <button class="btn btn-primary" onclick="Areas.saveArea('${area.id}', '${modalId}')">保存</button>`;

    Components.createModal({ id: modalId, title: `${area.icon} エリアを編集`, body, footer });
    Components.openModal(modalId);
  }

  function showNewAreaModal() {
    showAreaModal({ id: 'new', name: '', icon: '🗂', description: '', goalLevel: '' });
  }

  function saveArea(id, modalId) {
    const val = (elId) => { const el = document.getElementById(elId); return el ? el.value.trim() : ''; };
    const name = val('area-name');
    if (!name) { Components.toast('エリア名を入力してください', 'error'); return; }

    const data = {
      name,
      icon:      val('area-icon') || '🗂',
      description: document.getElementById('area-desc')?.value || '',
      goalLevel: val('area-goal'),
    };

    if (id === 'new') {
      Store.addArea(data);
    } else {
      Store.updateArea(id, data);
    }
    Components.closeModal(modalId);
    Components.toast('保存しました', 'success');
    App.refresh();
  }

  function deleteArea(id, modalId) {
    if (!Components.confirm('このエリアを削除しますか？')) return;
    Store.deleteArea(id);
    Components.closeModal(modalId);
    Components.toast('削除しました', 'error');
    App.refresh();
  }

  return {
    render, addAreaTask, editArea, showNewAreaModal, saveArea, deleteArea,
  };
})();
