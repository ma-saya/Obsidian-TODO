// ============================================================
// store.js — データストア（localStorage + GitHub Gist 同期）
// ============================================================
const Store = (() => {
  const KEY = 'obsidian-todo-v1';
  const GIST_TOKEN_KEY = 'obsidian-gist-token';
  const GIST_ID_KEY    = 'obsidian-gist-id';
  const GIST_FILENAME  = 'obsidian-todo-data.json';

  const defaults = {
    tasks: [],
    projects: [],
    areas: [
      { id: 'work',     name: '仕事', icon: '💼', description: '', goalLevel: '' },
      { id: 'health',   name: '健康', icon: '🏋️', description: '', goalLevel: '' },
      { id: 'family',   name: '家族', icon: '👨‍👩‍👧', description: '', goalLevel: '' },
      { id: 'learning', name: '学習', icon: '📚', description: '', goalLevel: '' },
      { id: 'finance',  name: '財務', icon: '💰', description: '', goalLevel: '' },
      { id: 'home',     name: '家事', icon: '🏠', description: '', goalLevel: '' },
    ],
    dailyReviews:  [],
    weeklyReviews: [],
    timeBlocks:    {},
    top3:          { date: '', tasks: ['', '', ''] },
    settings:      { theme: 'dark' },
  };

  // ── Gist Sync State ──────────────────────────────────────
  let _syncDebounce = null;
  let _syncListeners = [];

  function onSyncChange(fn) { _syncListeners.push(fn); }
  function _notifySync(status) { _syncListeners.forEach(fn => fn(status)); }

  // ── Gist Token / ID ──────────────────────────────────────
  function getGistToken() { return localStorage.getItem(GIST_TOKEN_KEY) || ''; }
  function setGistToken(t) {
    t ? localStorage.setItem(GIST_TOKEN_KEY, t) : localStorage.removeItem(GIST_TOKEN_KEY);
  }
  function getGistId() { return localStorage.getItem(GIST_ID_KEY) || ''; }
  function setGistId(id) {
    id ? localStorage.setItem(GIST_ID_KEY, id) : localStorage.removeItem(GIST_ID_KEY);
  }

  // ── Core Storage ─────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaults));
      const data = JSON.parse(raw);
      return { ...JSON.parse(JSON.stringify(defaults)), ...data };
    } catch (e) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    // Auto-sync to Gist 2秒後（デバウンス）
    if (getGistToken()) {
      clearTimeout(_syncDebounce);
      _syncDebounce = setTimeout(() => syncToGist(), 2000);
    }
  }

  function get() { return load(); }

  // ── Gist Sync ────────────────────────────────────────────
  async function syncToGist() {
    const token = getGistToken();
    if (!token) return { ok: false, error: 'トークン未設定' };

    _notifySync('syncing');
    const content = JSON.stringify(load(), null, 2);
    const gistId  = getGistId();

    try {
      let res;
      if (gistId) {
        // 既存Gistを更新
        res = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } }),
        });
      } else {
        // 新規プライベートGistを作成
        res = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'Obsidian TODO Data (Private)',
            public: false,
            files: { [GIST_FILENAME]: { content } },
          }),
        });
      }

      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const json = await res.json();
      if (!gistId) setGistId(json.id);
      _notifySync('ok:' + new Date().toLocaleTimeString('ja-JP'));
      return { ok: true };
    } catch (e) {
      _notifySync('error:' + e.message);
      return { ok: false, error: e.message };
    }
  }

  async function syncFromGist() {
    const token  = getGistToken();
    const gistId = getGistId();
    if (!token || !gistId) return { ok: false, error: 'トークン/ID未設定' };

    _notifySync('syncing');
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const gist = await res.json();
      const file = gist.files[GIST_FILENAME];
      if (!file) throw new Error('データファイルが見つかりません');
      const data = JSON.parse(file.content);
      localStorage.setItem(KEY, JSON.stringify(data)); // save without re-triggering sync
      _notifySync('ok:' + new Date().toLocaleTimeString('ja-JP'));
      return { ok: true, data };
    } catch (e) {
      _notifySync('error:' + e.message);
      return { ok: false, error: e.message };
    }
  }

  // ── Tasks ────────────────────────────────────────────────
  function getTasks(filter = {}) {
    const data = load();
    let tasks = data.tasks;
    if (filter.completed !== undefined) tasks = tasks.filter(t => t.completed === filter.completed);
    if (filter.category)  tasks = tasks.filter(t => t.category  === filter.category);
    if (filter.projectId) tasks = tasks.filter(t => t.projectId === filter.projectId);
    if (filter.areaId)    tasks = tasks.filter(t => t.areaId    === filter.areaId);
    if (filter.priority)  tasks = tasks.filter(t => t.priority  === filter.priority);
    if (filter.quadrant)  tasks = tasks.filter(t => t.quadrant  === filter.quadrant);
    if (filter.context)   tasks = tasks.filter(t => t.context   === filter.context);
    if (filter.status)    tasks = tasks.filter(t => t.status    === filter.status);
    return tasks;
  }

  function addTask(task) {
    const data = load();
    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: '', completed: false, priority: null, quadrant: null,
      context: null, status: null, dueDate: null, startDate: null,
      estimatedTime: null, recurring: null, projectId: null, areaId: null,
      category: 'inbox', createdAt: new Date().toISOString(),
      completedAt: null, notes: '',
      ...task,
    };
    data.tasks.unshift(newTask);
    save(data);
    return newTask;
  }

  function updateTask(id, updates) {
    const data = load();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    data.tasks[idx] = { ...data.tasks[idx], ...updates };
    if (updates.completed === true  && !data.tasks[idx].completedAt)
      data.tasks[idx].completedAt = new Date().toISOString();
    if (updates.completed === false) data.tasks[idx].completedAt = null;
    save(data);
    return data.tasks[idx];
  }

  function deleteTask(id) {
    const data = load();
    data.tasks = data.tasks.filter(t => t.id !== id);
    save(data);
  }

  // ── Projects ─────────────────────────────────────────────
  function getProjects(statusFilter) {
    const data = load();
    if (statusFilter) return data.projects.filter(p => p.status === statusFilter);
    return data.projects;
  }

  function addProject(project) {
    const data = load();
    const newProject = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: '', status: 'active', dueDate: null, areaId: null,
      goalText: '', nextAction: '', createdAt: new Date().toISOString(),
      completedAt: null,
      ...project,
    };
    data.projects.unshift(newProject);
    save(data);
    return newProject;
  }

  function updateProject(id, updates) {
    const data = load();
    const idx = data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    data.projects[idx] = { ...data.projects[idx], ...updates };
    save(data);
    return data.projects[idx];
  }

  function deleteProject(id) {
    const data = load();
    data.projects = data.projects.filter(p => p.id !== id);
    data.tasks = data.tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t);
    save(data);
  }

  // ── Areas ────────────────────────────────────────────────
  function getAreas() { return load().areas; }

  function updateArea(id, updates) {
    const data = load();
    const idx = data.areas.findIndex(a => a.id === id);
    if (idx === -1) return null;
    data.areas[idx] = { ...data.areas[idx], ...updates };
    save(data);
    return data.areas[idx];
  }

  function addArea(area) {
    const data = load();
    const newArea = {
      id: Date.now().toString(36),
      name: '', icon: '🗂', description: '', goalLevel: '',
      ...area,
    };
    data.areas.push(newArea);
    save(data);
    return newArea;
  }

  function deleteArea(id) {
    const data = load();
    data.areas = data.areas.filter(a => a.id !== id);
    save(data);
  }

  // ── Daily Review ────────────────────────────────────────
  function getDailyReview(date) {
    const data = load();
    return data.dailyReviews.find(r => r.date === date) || null;
  }

  function saveDailyReview(review) {
    const data = load();
    const idx = data.dailyReviews.findIndex(r => r.date === review.date);
    if (idx !== -1) { data.dailyReviews[idx] = review; } else { data.dailyReviews.push(review); }
    save(data);
  }

  // ── Weekly Review ────────────────────────────────────────
  function getWeeklyReview(week) {
    const data = load();
    return data.weeklyReviews.find(r => r.week === week) || null;
  }

  function saveWeeklyReview(review) {
    const data = load();
    const idx = data.weeklyReviews.findIndex(r => r.week === review.week);
    if (idx !== -1) { data.weeklyReviews[idx] = review; } else { data.weeklyReviews.push(review); }
    save(data);
  }

  // ── Time Blocks ──────────────────────────────────────────
  function getTimeBlocks(date) {
    const data = load();
    return data.timeBlocks[date] || {};
  }

  function setTimeBlock(date, hour, value) {
    const data = load();
    if (!data.timeBlocks[date]) data.timeBlocks[date] = {};
    data.timeBlocks[date][hour] = value;
    save(data);
  }

  // ── TOP3 ─────────────────────────────────────────────────
  function getTop3(date) {
    const data = load();
    if (data.top3.date === date) return data.top3.tasks;
    return ['', '', ''];
  }

  function saveTop3(date, tasks) {
    const data = load();
    data.top3 = { date, tasks };
    save(data);
  }

  // ── Stats ────────────────────────────────────────────────
  function getWeekStats() {
    const data = load();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const completed = data.tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      return new Date(t.completedAt) >= weekStart;
    });
    return { completedCount: completed.length, focusTime: 0, top3Rate: 0 };
  }

  function getTodayStats() {
    const data  = load();
    const today = todayStr();
    const completed = data.tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      return t.completedAt.startsWith(today);
    });
    return { completedCount: completed.length };
  }

  // ── Utils ────────────────────────────────────────────────
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function weekStr() {
    const now  = new Date();
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  return {
    get, save,
    getTasks, addTask, updateTask, deleteTask,
    getProjects, addProject, updateProject, deleteProject,
    getAreas, updateArea, addArea, deleteArea,
    getDailyReview, saveDailyReview,
    getWeeklyReview, saveWeeklyReview,
    getTimeBlocks, setTimeBlock,
    getTop3, saveTop3,
    getWeekStats, getTodayStats,
    todayStr, weekStr,
    // Gist Sync
    getGistToken, setGistToken,
    getGistId,    setGistId,
    syncToGist,   syncFromGist,
    onSyncChange,
  };
})();
