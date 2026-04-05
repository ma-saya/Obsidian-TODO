// ============================================================
// weekly-review.js
// ============================================================

const WeeklyReview = (() => {

  const DAYS = ['月','火','水','木','金'];

  function render() {
    const week = Store.weekStr();
    const saved = Store.getWeeklyReview(week) || getDefaultReview(week);

    const el = id => document.getElementById(id);
    if (el('wr-week')) el('wr-week').textContent = week;

    renderStep1(saved);
    renderStep2(saved);
    renderStep3(saved);
    renderStep4(saved);
    renderStep5(saved);
    renderWrStats(saved);
  }

  function getDefaultReview(week) {
    return {
      week,
      step1: { inboxZero: false, emailChecked: false, memosScanned: false, calendarChecked: false },
      step2: {
        highlights: ['', '', ''],
        improvements: ['', ''],
        manualDone: '',
      },
      step3: {
        projects: [],
        allHaveNextAction: null,
      },
      step4: { reviewed: false, activating: '', deleting: '' },
      step5: {
        themes: ['', ''],
        timeblocks: { 月: { am: '', pm: '' }, 火: { am: '', pm: '' }, 水: { am: '', pm: '' }, 木: { am: '', pm: '' }, 金: { am: '', pm: '' } },
        message: '',
      },
      stats: { completedCount: 0, focusHours: 0, top3Rate: 0, inboxRate: 0 },
    };
  }

  // ── STEP 1 ─────────────────────────────────────────────────
  function renderStep1(review) {
    const fields = [
      { key: 'inboxZero',      label: 'Inboxをゼロにした' },
      { key: 'emailChecked',   label: 'メール・チャットを確認してタスク化' },
      { key: 'memosScanned',   label: 'メモ・付箋をスキャンしてInboxへ' },
      { key: 'calendarChecked',label: '来週のカレンダー予定を確認した' },
    ];
    const container = document.getElementById('wr-step1');
    if (!container) return;
    container.innerHTML = fields.map(f => `
      <div class="inline-check ${review.step1[f.key] ? 'done' : ''}">
        <input type="checkbox" id="wr-s1-${f.key}" ${review.step1[f.key]?'checked':''}>
        <label for="wr-s1-${f.key}">${f.label}</label>
      </div>`).join('');
    fields.forEach(f => {
      const el = document.getElementById(`wr-s1-${f.key}`);
      if (el) el.onchange = () => WeeklyReview.autoSave();
    });
  }

  // ── STEP 2 ─────────────────────────────────────────────────
  function renderStep2(review) {
    const container = document.getElementById('wr-step2');
    if (!container) return;

    // Completed tasks from store
    const week = Store.weekStr();
    const completedTasks = getWeekCompletedTasks();

    container.innerHTML = `
      <div style="margin-bottom:14px;">
        <div class="card-title"><span class="icon">✅</span>今週完了したタスク</div>
        ${completedTasks.length > 0
          ? `<div class="task-list">${completedTasks.slice(0,10).map(t => `
            <div class="task-item completed" style="opacity:0.7;">
              <div class="task-checkbox checked">✓</div>
              <div class="task-body"><div class="task-title">${Components.escapeHTML(t.title)}</div></div>
            </div>`).join('')}</div>
            ${completedTasks.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">...他 ${completedTasks.length-10} 件</div>` : ''}`
          : `<div style="color:var(--text-muted);font-size:12px;">今週の完了タスクなし</div>`}
      </div>
      <div style="margin-bottom:14px;">
        <div class="card-title"><span class="icon">🌟</span>今週のハイライト（よかったこと）</div>
        ${[0,1,2].map(i => `
          <input class="form-input" id="wr-highlight-${i}" style="margin-bottom:6px;"
            value="${Components.escapeHTML(review.step2.highlights[i]||'')}"
            placeholder="${i+1}. よかったこと…"
            onchange="WeeklyReview.autoSave()">`).join('')}
      </div>
      <div>
        <div class="card-title"><span class="icon">🔧</span>うまくいかなかったこと・改善点</div>
        ${[0,1].map(i => `
          <input class="form-input" id="wr-improve-${i}" style="margin-bottom:6px;"
            value="${Components.escapeHTML(review.step2.improvements[i]||'')}"
            placeholder="${i+1}. 改善点…"
            onchange="WeeklyReview.autoSave()">`).join('')}
      </div>`;
  }

  function getWeekCompletedTasks() {
    const data = Store.get();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return data.tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      return new Date(t.completedAt) >= monday;
    });
  }

  // ── STEP 3 ─────────────────────────────────────────────────
  function renderStep3(review) {
    const container = document.getElementById('wr-step3');
    if (!container) return;
    const projects = Store.getProjects('active');

    if (projects.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">アクティブなプロジェクトはありません。<a onclick="App.navigate('projects')" style="color:var(--accent);cursor:pointer;">プロジェクトを追加 →</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>プロジェクト</th>
              <th>今週の進捗</th>
              <th>Next Action</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map((p, i) => {
              const saved = (review.step3.projects || [])[i] || {};
              return `<tr>
                <td><strong>${Components.escapeHTML(p.name)}</strong></td>
                <td><input class="focus-input" id="wr-p3-progress-${i}"
                  value="${Components.escapeHTML(saved.progress||'')}"
                  placeholder="今週の進捗…"
                  onchange="WeeklyReview.autoSave()"></td>
                <td>
                  <select class="form-select" id="wr-p3-na-${i}" style="font-size:11px;padding:3px 20px 3px 6px;"
                    onchange="WeeklyReview.autoSave()">
                    <option value="">-</option>
                    <option value="yes" ${saved.nextAction==='yes'?'selected':''}>✅ あり</option>
                    <option value="no"  ${saved.nextAction==='no' ?'selected':''}>❌ なし</option>
                  </select>
                </td>
                <td><input class="focus-input" id="wr-p3-status-${i}"
                  value="${Components.escapeHTML(saved.status||'')}"
                  placeholder="状態変更…"
                  onchange="WeeklyReview.autoSave()"></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;font-size:13px;">
        <span>全プロジェクトにNext Actionがある:</span>
        <label><input type="radio" name="wr-all-na" value="yes" ${review.step3.allHaveNextAction==='yes'?'checked':''}
          onchange="WeeklyReview.autoSave()"> ✅</label>
        <label><input type="radio" name="wr-all-na" value="no" ${review.step3.allHaveNextAction==='no'?'checked':''}
          onchange="WeeklyReview.autoSave()"> ❌</label>
      </div>`;
  }

  // ── STEP 4 ─────────────────────────────────────────────────
  function renderStep4(review) {
    const container = document.getElementById('wr-step4');
    if (!container) return;
    container.innerHTML = `
      <div class="inline-check ${review.step4.reviewed ? 'done' : ''}">
        <input type="checkbox" id="wr-s4-reviewed" ${review.step4.reviewed?'checked':''}
          onchange="WeeklyReview.autoSave()">
        <label for="wr-s4-reviewed">Someday/Maybeリストを見直した</label>
      </div>
      <div class="form-group" style="margin-top:10px;">
        <label class="form-label">アクティブに移すもの</label>
        <input class="form-input" id="wr-s4-activating"
          value="${Components.escapeHTML(review.step4.activating||'')}"
          placeholder="アクティブ化するタスクを記入…"
          onchange="WeeklyReview.autoSave()">
      </div>
      <div class="form-group">
        <label class="form-label">削除するもの</label>
        <input class="form-input" id="wr-s4-deleting"
          value="${Components.escapeHTML(review.step4.deleting||'')}"
          placeholder="削除するタスクを記入…"
          onchange="WeeklyReview.autoSave()">
      </div>`;
  }

  // ── STEP 5 ─────────────────────────────────────────────────
  function renderStep5(review) {
    const container = document.getElementById('wr-step5');
    if (!container) return;
    const s5 = review.step5 || {};

    container.innerHTML = `
      <div style="margin-bottom:14px;">
        <div class="card-title"><span class="icon">🎯</span>来週の最重要テーマ（1〜2個）</div>
        ${[0,1].map(i => `
          <input class="form-input" id="wr-theme-${i}" style="margin-bottom:6px;"
            value="${Components.escapeHTML((s5.themes||[])[i]||'')}"
            placeholder="${i+1}. テーマ…"
            onchange="WeeklyReview.autoSave()">`).join('')}
      </div>
      <div style="margin-bottom:14px;">
        <div class="card-title"><span class="icon">🗓</span>来週のTimeBlock計画</div>
        <div class="weekly-timeblock">
          <table>
            <thead><tr><th>曜日</th><th>午前</th><th>午後</th></tr></thead>
            <tbody>
              ${DAYS.map(d => {
                const tb = (s5.timeblocks || {})[d] || { am: '', pm: '' };
                return `<tr>
                  <td>${d}</td>
                  <td><input class="tb-cell-input" id="wr-tb-${d}-am" value="${Components.escapeHTML(tb.am||'')}"
                    placeholder="午前の予定…" onchange="WeeklyReview.autoSave()"></td>
                  <td><input class="tb-cell-input" id="wr-tb-${d}-pm" value="${Components.escapeHTML(tb.pm||'')}"
                    placeholder="午後の予定…" onchange="WeeklyReview.autoSave()"></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="card-title"><span class="icon">💌</span>来週の自分へのメッセージ</div>
        <textarea class="form-textarea" id="wr-message"
          placeholder="来週の自分へ…"
          onchange="WeeklyReview.autoSave()">${Components.escapeHTML(s5.message||'')}</textarea>
      </div>`;
  }

  // ── Stats ──────────────────────────────────────────────────
  function renderWrStats(review) {
    const completed = getWeekCompletedTasks();
    const el = id => document.getElementById(id);
    if (el('wr-stat-done'))   el('wr-stat-done').textContent   = completed.length;
    if (el('wr-stat-focus'))  el('wr-stat-focus').textContent  = review.stats?.focusHours  || 0;
    if (el('wr-stat-top3'))   el('wr-stat-top3').textContent   = review.stats?.top3Rate    || '-';
    if (el('wr-stat-inbox'))  el('wr-stat-inbox').textContent  = review.stats?.inboxRate !== undefined ? `${review.stats.inboxRate}%` : '-';
  }

  // ── Auto Save ──────────────────────────────────────────────
  function autoSave() {
    const week = Store.weekStr();
    const review = Store.getWeeklyReview(week) || getDefaultReview(week);

    // Step1
    ['inboxZero','emailChecked','memosScanned','calendarChecked'].forEach(key => {
      const el = document.getElementById(`wr-s1-${key}`);
      if (el) review.step1[key] = el.checked;
    });

    // Step2 highlights & improvements
    review.step2.highlights   = [0,1,2].map(i => document.getElementById(`wr-highlight-${i}`)?.value || '');
    review.step2.improvements = [0,1].map(i => document.getElementById(`wr-improve-${i}`)?.value || '');

    // Step3 projects
    const projects = Store.getProjects('active');
    review.step3.projects = projects.map((p, i) => ({
      id:         p.id,
      progress:   document.getElementById(`wr-p3-progress-${i}`)?.value || '',
      nextAction: document.getElementById(`wr-p3-na-${i}`)?.value || '',
      status:     document.getElementById(`wr-p3-status-${i}`)?.value || '',
    }));
    const allNaEl = document.querySelector('input[name="wr-all-na"]:checked');
    review.step3.allHaveNextAction = allNaEl?.value || null;

    // Step4
    const s4reviewed = document.getElementById('wr-s4-reviewed');
    if (s4reviewed) review.step4.reviewed = s4reviewed.checked;
    review.step4.activating = document.getElementById('wr-s4-activating')?.value || '';
    review.step4.deleting   = document.getElementById('wr-s4-deleting')?.value   || '';

    // Step5 themes
    if (!review.step5) review.step5 = getDefaultReview(week).step5;
    review.step5.themes = [0,1].map(i => document.getElementById(`wr-theme-${i}`)?.value || '');
    DAYS.forEach(d => {
      if (!review.step5.timeblocks) review.step5.timeblocks = {};
      review.step5.timeblocks[d] = {
        am: document.getElementById(`wr-tb-${d}-am`)?.value || '',
        pm: document.getElementById(`wr-tb-${d}-pm`)?.value || '',
      };
    });
    review.step5.message = document.getElementById('wr-message')?.value || '';

    Store.saveWeeklyReview(review);
  }

  return { render, autoSave };
})();
