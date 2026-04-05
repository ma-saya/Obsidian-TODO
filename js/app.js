// ============================================================
// app.js — メインアプリ・ルーティング・グローバル操作
// ============================================================

const App = (() => {

  const SECTIONS = {
    dashboard:    { label: 'Dashboard',     icon: '🧠', module: Dashboard },
    inbox:        { label: 'Inbox',         icon: '📥', module: Inbox },
    projects:     { label: 'Projects',      icon: '📁', module: Projects },
    areas:        { label: 'Areas',         icon: '🗂', module: Areas  },
    someday:      { label: 'Someday/Maybe', icon: '💭', module: Someday },
    calendar:     { label: 'カレンダー',     icon: '📆', module: Calendar },
    'daily-review':  { label: '日次レビュー', icon: '📅', module: DailyReview },
    'weekly-review': { label: '週次レビュー', icon: '📖', module: WeeklyReview },
  };

  let currentSection = 'dashboard';

  function init() {
    // Sidebar date
    const dateEl = document.getElementById('sidebar-date');
    if (dateEl) dateEl.textContent = Components.todayJP();

    // Nav click handlers
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.section));
    });

    // Hash-based routing
    const hash = location.hash.replace('#', '');
    navigate(SECTIONS[hash] ? hash : 'dashboard');

    // Quick add — dashboard
    setupGlobalQuickAdd();

    // Keyboard shortcut: N = new task from anywhere
    document.addEventListener('keydown', (e) => {
      if (e.key === 'n' && !isInputActive()) {
        e.preventDefault();
        App.newTask();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });

    refreshNavBadge();
  }

  function isInputActive() {
    const tag = document.activeElement?.tagName;
    return ['INPUT','TEXTAREA','SELECT'].includes(tag);
  }

  function navigate(sectionId) {
    if (!SECTIONS[sectionId]) sectionId = 'dashboard';
    currentSection = sectionId;
    location.hash = sectionId;

    // Update sections visibility
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`section-${sectionId}`);
    if (el) el.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Update topbar title
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) {
      const info = SECTIONS[sectionId];
      titleEl.textContent = `${info.icon} ${info.label}`;
    }

    // Render section
    const mod = SECTIONS[sectionId]?.module;
    if (mod && typeof mod.render === 'function') mod.render();

    refreshNavBadge();
  }

  function refresh() {
    const mod = SECTIONS[currentSection]?.module;
    if (mod && typeof mod.render === 'function') mod.render();
    refreshNavBadge();
  }

  function refreshNavBadge() {
    const inboxCount = Store.getTasks({ completed: false, category: 'inbox' }).length;
    const badge = document.getElementById('inbox-badge');
    if (badge) {
      badge.textContent = inboxCount;
      badge.style.display = inboxCount > 0 ? 'inline-block' : 'none';
    }
  }

  // ── Global Quick Add ───────────────────────────────────────
  function setupGlobalQuickAdd() {
    const input = document.getElementById('inbox-quick-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          Inbox.quickAdd(input.value);
        }
      });
    }
  }

  // ── Task Operations ────────────────────────────────────────
  function toggleTask(id) {
    const tasks = Store.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    Store.updateTask(id, { completed: !task.completed });
    refresh();
  }

  function editTask(id) {
    const tasks = Store.getTasks();
    const task = tasks.find(t => t.id === id) || { id: 'new', title: '', category: 'inbox' };
    Components.showTaskEditor(task);
  }

  function deleteTask(id) {
    if (!Components.confirm('このタスクを削除しますか？')) return;
    Store.deleteTask(id);
    refresh();
    Components.toast('削除しました', 'error');
  }

  function newTask() {
    Components.showTaskEditor({ id: 'new', title: '', category: currentSection === 'inbox' ? 'inbox' : 'inbox' });
  }

  function moveTaskDialog(taskId) {
    const task = Store.getTasks().find(t => t.id === taskId);
    if (!task) return;
    editTask(taskId);
  }

  // ── Export ─────────────────────────────────────────────────
  function exportData() {
    const data = Store.get();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obsidian-todo-backup-${Store.todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Components.toast('データをエクスポートしました', 'success');
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          Store.save(data);
          refresh();
          Components.toast('インポートしました', 'success');
        } catch {
          Components.toast('ファイルの読み込みに失敗しました', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return {
    init, navigate, refresh, refreshNavBadge,
    toggleTask, editTask, deleteTask, newTask, moveTaskDialog,
    exportData, importData,
  };
})();

// ── Start ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
