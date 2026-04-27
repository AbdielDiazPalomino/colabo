// ============================================
// TEAM-STATS.JS — Estadísticas del equipo
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderStats('week');
  setupRangeButtons();
});

function setupRangeButtons() {
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderStats(btn.dataset.range);
    });
  });
}

function renderStats(range) {
  const boards = Storage.getBoards();
  const allCards = getAllCards(boards);
  const filtered = filterByRange(allCards, range);

  const completed = filtered.filter(c => c.done || c.columnName === 'Done' || c.columnName === 'Hecho');
  const total = filtered.length;
  const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // KPIs
  document.getElementById('completedTasks').textContent = completed.length;
  document.getElementById('totalTasks').textContent = total;
  document.getElementById('completionRate').textContent = rate + '%';
  document.getElementById('activeMembers').textContent = getActiveMembers(allCards);

  document.getElementById('completedTrend').textContent = completed.length > 0 ? '↑ activo' : '— sin datos';
  document.getElementById('rateTrend').textContent = rate > 50 ? '↑ bien' : '↓ mejorar';

  renderPriorityBars(filtered);
  renderWeeklyBars(boards);
  renderMemberList(allCards);
  renderCategoryList(allCards);
  renderBurndown(boards);
}

function getAllCards(boards) {
  const cards = [];
  boards.forEach(board => {
    if (!board.columns) return;
    board.columns.forEach(col => {
      if (!col.cards) return;
      col.cards.forEach(card => {
        cards.push({ ...card, columnName: col.title });
      });
    });
  });
  return cards;
}

function filterByRange(cards, range) {
  if (range === 'all') return cards;
  const now = new Date();
  const days = range === 'week' ? 7 : 30;
  const cutoff = new Date(now.setDate(now.getDate() - days));
  return cards.filter(c => {
    if (!c.createdAt) return true;
    return new Date(c.createdAt) >= cutoff;
  });
}

function getActiveMembers(cards) {
  const members = new Set();
  cards.forEach(c => { if (c.assignee) members.add(c.assignee); });
  return Math.max(members.size, 1);
}

function renderPriorityBars(cards) {
  const priorities = ['urgent', 'high', 'med', 'low'];
  const total = cards.length || 1;

  priorities.forEach(p => {
    const count = cards.filter(c => c.priority === p).length;
    const percent = Math.round((count / total) * 100);
    const bar = document.querySelector(`.bar-fill[data-priority="${p}"]`);
    const label = document.getElementById(`${p}Percent`);
    if (bar) bar.style.width = percent + '%';
    if (label) label.textContent = percent + '%';
  });
}

function renderWeeklyBars(boards) {
  const container = document.getElementById('weeklyBars');
  if (!container) return;
  container.innerHTML = '';

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const counts = [0, 0, 0, 0, 0, 0, 0];

  const allCards = getAllCards(boards);
  allCards.forEach(card => {
    if (!card.createdAt) return;
    const d = new Date(card.createdAt).getDay();
    const idx = d === 0 ? 6 : d - 1;
    counts[idx]++;
  });

  const max = Math.max(...counts, 1);

  days.forEach((day, i) => {
    const height = Math.round((counts[i] / max) * 100);
    const bar = document.createElement('div');
    bar.className = 'weekly-bar-item';
    bar.innerHTML = `
      <div class="weekly-bar-wrap">
        <div class="weekly-bar-fill" style="height:${height}%"></div>
      </div>
      <span class="weekly-bar-label">${day}</span>
      <span class="weekly-bar-count">${counts[i]}</span>
    `;
    container.appendChild(bar);
  });
}

function renderMemberList(cards) {
  const container = document.getElementById('memberList');
  if (!container) return;
  container.innerHTML = '';

  const members = {};
  cards.forEach(c => {
    const name = c.assignee || 'Sin asignar';
    members[name] = (members[name] || 0) + 1;
  });

  const total = cards.length || 1;
  const sorted = Object.entries(members).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="no-data">Sin datos aún</p>';
    return;
  }

  sorted.forEach(([name, count]) => {
    const percent = Math.round((count / total) * 100);
    const item = document.createElement('div');
    item.className = 'member-item';
    item.innerHTML = `
      <div class="member-avatar-small">${name.substring(0, 2).toUpperCase()}</div>
      <div class="member-bar-wrap">
        <div class="member-bar-header">
          <span class="member-bar-name">${name}</span>
          <span class="member-bar-count">${count} tareas</span>
        </div>
        <div class="member-bar-container">
          <div class="member-bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderCategoryList(cards) {
  const container = document.getElementById('categoryList');
  if (!container) return;
  container.innerHTML = '';

  const categories = {};
  cards.forEach(c => {
    const tag = c.tag || 'Sin etiqueta';
    categories[tag] = (categories[tag] || 0) + 1;
  });

  const total = cards.length || 1;
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="no-data">Sin datos aún</p>';
    return;
  }

  sorted.forEach(([tag, count]) => {
    const percent = Math.round((count / total) * 100);
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-header">
        <span class="category-name">${tag}</span>
        <span class="category-percent">${percent}%</span>
      </div>
      <div class="category-bar-container">
        <div class="category-bar-fill" style="width:${percent}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderBurndown(boards) {
  const container = document.getElementById('burndownBars');
  if (!container) return;
  container.innerHTML = '';

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const allCards = getAllCards(boards);
  const total = allCards.length;
  const target = Math.ceil(total / 7);

  days.forEach((day, i) => {
    const completed = Math.max(0, Math.floor(Math.random() * (target + 2)));
    const bar = document.createElement('div');
    bar.className = 'burndown-bar-item';
    bar.innerHTML = `
      <div class="burndown-bars-wrap">
        <div class="burndown-bar completed" style="height:${Math.min(completed * 20, 100)}px" title="${completed} completadas"></div>
        <div class="burndown-bar target" style="height:${target * 20}px" title="${target} objetivo"></div>
      </div>
      <span class="burndown-label">${day}</span>
    `;
    container.appendChild(bar);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}