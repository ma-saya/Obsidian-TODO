// ============================================================
// someday.js
// ============================================================

const Someday = (() => {

  const CATEGORIES = [
    { key: 'want',   icon: '⭐', label: 'やりたいこと' },
    { key: 'learn',  icon: '📚', label: '学びたいこと' },
    { key: 'buy',    icon: '🛒', label: '買いたい・試したいもの' },
    { key: 'hold',   icon: '⏸', label: '保留・様子見' },
  ];

  function render() {
    const container = document.getElementById('someday-content');
    if (!container) return;

    const allSomeday = Store.getTasks({ category: 'someday' });

    container.innerHTML = CATEGORIES.map(cat => {
      const tasks = allSomeday.filter(t => (t.somedayCategory || 'want') === cat.key);
      return `
      <div class="someday-section">
        <div class="someday-section-title">
          ${cat.icon} ${cat.label}
          <span style="color:var(--text-muted);font-weight:400;">(${tasks.length}件)</span>
        </div>
        <div class="quick-add" style="margin-bottom:10px;">
          <span style="font-size:14px;">${cat.icon}</span>
          <input class="quick-add-input" id="someday-add-${cat.key}"
            placeholder="${cat.label}を追加…"
            onkeydown="if(event.key==='Enter')Someday.addItem('${cat.key}')">
          <button class="btn btn-primary btn-sm" onclick="Someday.addItem('${cat.key}')">＋</button>
        </div>
        <div class="task-list" id="someday-list-${cat.key}">
          ${tasks.length === 0
            ? `<div style="color:var(--text-muted);font-size:12px;padding:6px 0;">なし</div>`
            : tasks.map(t => somedayItem(t)).join('')}
        </div>
      </div>`;
    }).join('');
  }

  function somedayItem(task) {
    return `
    <div class="task-item" data-id="${task.id}">
      <div class="task-checkbox ${task.completed?'checked':''}"
           onclick="App.toggleTask('${task.id}')">
        ${task.completed?'✓':''}
      </div>
      <div class="task-body">
        <div class="task-title ${task.completed?'completed':''}">${Components.escapeHTML(task.title)}</div>
        ${task.notes ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">${Components.escapeHTML(task.notes)}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" onclick="Someday.activate('${task.id}')" title="アクティブに">⚡ 活性化</button>
        <button class="btn btn-ghost btn-icon" onclick="App.editTask('${task.id}')" title="編集">✏️</button>
        <button class="btn btn-ghost btn-icon" onclick="App.deleteTask('${task.id}')" title="削除">🗑️</button>
      </div>
    </div>`;
  }

  function addItem(catKey) {
    const input = document.getElementById(`someday-add-${catKey}`);
    if (!input || !input.value.trim()) return;
    Store.addTask({
      title: input.value.trim(),
      category: 'someday',
      status: 'someday',
      somedayCategory: catKey,
    });
    input.value = '';
    render();
  }

  function activate(taskId) {
    Store.updateTask(taskId, {
      category: 'inbox',
      status: null,
      somedayCategory: null,
    });
    render();
    Components.toast('Inboxに移動しました ⚡', 'success');
    App.refreshNavBadge();
  }

  return { render, addItem, activate };
})();
