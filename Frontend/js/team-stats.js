/* =============================================
   COLABO — team-stats.js
   Dynamic statistics calculator & renderer
   ============================================= */

// Default tag styles for color matching
const TAG_STYLES = {
  diseño:    { bg: '#6366f120', color: '#818cf8' },
  dev:       { bg: '#10b98120', color: '#34d399' },
  revisión:  { bg: '#f59e0b20', color: '#fbbf24' },
  deploy:    { bg: '#06b6d420', color: '#67e8f9' },
  docs:      { bg: '#9898a820', color: '#c4b5fd' },
  bug:       { bg: '#f8717120', color: '#f87171' },
  idea:      { bg: '#ec489920', color: '#f472b6' },
};

function resolveTagStyle(tagName) {
  if (!tagName) return null;
  const clean = tagName.toLowerCase().trim();
  if (TAG_STYLES[clean]) return TAG_STYLES[clean];

  // Hash code generation for dynamic custom tag colors
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    bg: `hsla(${h}, 60%, 55%, 0.15)`,
    color: `hsl(${h}, 90%, 75%)`
  };
}

async function initStats() {
  // Determine active board ID
  const recent = ColaboDB.getRecentBoards();
  let boardId = recent.length > 0 ? recent[0].id : null;
  
  if (!boardId) {
    const boards = await ColaboDB.getBoards();
    if (boards.length > 0) {
      boardId = boards[0].id;
    }
  }

  if (!boardId) {
    console.warn("No board found for stats.");
    return;
  }

  const board = await ColaboDB.getBoardById(boardId);
  if (!board) {
    console.warn("Selected board not found.");
    return;
  }

  // Set subtitle to board name to give feedback
  const subtitle = document.querySelector('.page-sub');
  if (subtitle) {
    subtitle.textContent = `Pizarra activa: ${board.name || 'Mi Pizarra'}`;
  }

  // Counters
  let total = 0;
  let completed = 0;
  
  let urgentTasks = 0;
  let urgentCompleted = 0;
  let highTasks = 0;
  let highCompleted = 0;
  let medTasks = 0;
  let medCompleted = 0;
  let lowTasks = 0;
  let lowCompleted = 0;

  const memberStats = {}; // { assignee: { total: 0, completed: 0 } }
  const tagStats = {};    // { tag: totalCount }

  // Traverse Columns & Cards
  (board.columns || []).forEach(col => {
    (col.cards || []).forEach(card => {
      total++;
      const isDone = card.done || card.progress === 100;
      if (isDone) {
        completed++;
      }

      // Priorities
      if (card.priority === 'urgent') {
        urgentTasks++;
        if (isDone) urgentCompleted++;
      } else if (card.priority === 'high') {
        highTasks++;
        if (isDone) highCompleted++;
      } else if (card.priority === 'med') {
        medTasks++;
        if (isDone) medCompleted++;
      } else if (card.priority === 'low' || card.priority === 'none') {
        lowTasks++;
        if (isDone) lowCompleted++;
      }

      // Member Contribution
      if (card.assignee && card.assignee.trim()) {
        const name = card.assignee.trim();
        if (!memberStats[name]) {
          memberStats[name] = { total: 0, completed: 0 };
        }
        memberStats[name].total++;
        if (isDone) memberStats[name].completed++;
      }

      // Tags Distribution
      if (card.tag && card.tag.trim()) {
        const tag = card.tag.trim();
        if (!tagStats[tag]) {
          tagStats[tag] = 0;
        }
        tagStats[tag]++;
      }
    });
  });

  // Calculate generic trends
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Render KPIs
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('totalTasks').textContent = total;
  document.getElementById('completionRate').textContent = rate + '%';
  document.getElementById('activeMembers').textContent = Math.max(1, Object.keys(memberStats).length);

  // Set trend values dynamically
  document.getElementById('completedTrend').textContent = completed > 0 ? `+${completed}` : '+0';
  document.getElementById('totalTrend').textContent = total > 0 ? `+${total}` : '+0';
  document.getElementById('rateTrend').textContent = rate > 0 ? `+${Math.round(rate * 0.1)}%` : '+0%';

  // Render Priority Bars
  const urgentPct = urgentTasks > 0 ? Math.round((urgentCompleted / urgentTasks) * 100) : 0;
  const highPct = highTasks > 0 ? Math.round((highCompleted / highTasks) * 100) : 0;
  const medPct = medTasks > 0 ? Math.round((medCompleted / medTasks) * 100) : 0;
  const lowPct = lowTasks > 0 ? Math.round((lowCompleted / lowTasks) * 100) : 0;

  document.getElementById('urgentPercent').textContent = urgentPct + '%';
  document.querySelector('.bar-fill[data-priority="urgent"]').style.width = urgentPct + '%';

  document.getElementById('highPercent').textContent = highPct + '%';
  document.querySelector('.bar-fill[data-priority="high"]').style.width = highPct + '%';

  document.getElementById('medPercent').textContent = medPct + '%';
  document.querySelector('.bar-fill[data-priority="med"]').style.width = medPct + '%';

  document.getElementById('lowPercent').textContent = lowPct + '%';
  document.querySelector('.bar-fill[data-priority="low"]').style.width = lowPct + '%';

  // Render Weekly Activities (Distribute completed cards logically across days)
  const weeklyContainer = document.getElementById('weeklyBars');
  if (weeklyContainer) {
    weeklyContainer.innerHTML = '';
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const distribution = [0, 0, 0, 0, 0, 0, 0];

    // Populate using creation date
    (board.columns || []).forEach(col => {
      (col.cards || []).forEach(card => {
        if (card.done || card.progress === 100) {
          const date = new Date(card.createdAt || Date.now());
          const dayIdx = (date.getDay() + 6) % 7; // Lun = 0, Dom = 6
          distribution[dayIdx]++;
        }
      });
    });

    const maxVal = Math.max(1, ...distribution);

    days.forEach((day, idx) => {
      const val = distribution[idx];
      // Map height visually (max 100px)
      const height = maxVal > 0 ? (val / maxVal) * 80 + 10 : 10;
      
      const item = document.createElement('div');
      item.className = 'weekly-bar-item';
      item.innerHTML = `
        <div class="weekly-bar">
          <div class="weekly-fill" style="height: ${height}px"></div>
        </div>
        <span class="weekly-label">${day}</span>
        <div class="weekly-value">${val}</div>
      `;
      weeklyContainer.appendChild(item);
    });
  }

  // Render Member Contributions list
  const memberList = document.getElementById('memberList');
  if (memberList) {
    memberList.innerHTML = '';
    const members = Object.keys(memberStats);

    if (members.length === 0) {
      memberList.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-3); text-align: center; padding: 1.5rem 0;">
          Ningún miembro tiene tareas asignadas en este tablero.
        </div>
      `;
    } else {
      members.forEach(name => {
        const stats = memberStats[name];
        const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const color = ['#6366f1', '#10b981', '#fbbf24', '#ec4899', '#3b82f6'][Math.abs(name.charCodeAt(0)) % 5];
        
        const row = document.createElement('div');
        row.className = 'member-row';
        row.innerHTML = `
          <div class="member-avatar-sm" style="background:${color}">${name.slice(0, 2).toUpperCase()}</div>
          <div class="member-name-sm">${escapeHtml(name)}</div>
          <span class="member-count">${stats.completed} de ${stats.total}</span>
          <div class="member-bar-container">
            <div class="member-bar-fill" style="width: ${percent}%; background: ${color}"></div>
          </div>
        `;
        memberList.appendChild(row);
      });
    }
  }

  // Render Category/Tags list
  const categoryList = document.getElementById('categoryList');
  if (categoryList) {
    categoryList.innerHTML = '';
    const tags = Object.keys(tagStats);

    if (tags.length === 0) {
      categoryList.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-3); text-align: center; padding: 1.5rem 0;">
          Ninguna tarea contiene etiquetas creadas.
        </div>
      `;
    } else {
      tags.forEach(tag => {
        const count = tagStats[tag];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const style = resolveTagStyle(tag);
        const color = style ? style.color : 'var(--accent)';

        const row = document.createElement('div');
        row.className = 'category-row';
        row.innerHTML = `
          <div class="category-name">${escapeHtml(tag)}</div>
          <div class="category-bar-container">
            <div class="category-bar-fill" style="width: ${pct}%; background: ${color}"></div>
          </div>
          <span class="category-percent">${pct}%</span>
        `;
        categoryList.appendChild(row);
      });
    }
  }

  // Render Burndown Chart (Remaining tasks vs Ideal burn targets)
  const burndownBars = document.getElementById('burndownBars');
  if (burndownBars) {
    burndownBars.innerHTML = '';
    const steps = 7;
    const stepVal = total / steps;
    const rateCompleted = completed;

    for (let i = 0; i <= steps; i++) {
      const target = Math.round(total - (i * stepVal));
      const factor = Math.min(1, i / steps);
      const remaining = Math.max(0, Math.round(total - (factor * rateCompleted)));

      // Height values (max 130px)
      const heightTarget = total > 0 ? (target / total) * 110 + 10 : 10;
      const heightRemaining = total > 0 ? (remaining / total) * 110 + 10 : 10;

      const item = document.createElement('div');
      item.className = 'burndown-item';
      item.innerHTML = `
        <div class="burndown-bar-group">
          <div class="burndown-completed" style="height: ${heightRemaining}px" title="Tareas restantes: ${remaining}"></div>
          <div class="burndown-target" style="height: ${heightTarget}px" title="Meta ideal: ${target}"></div>
        </div>
        <div class="burndown-label">Día ${i}</div>
      `;
      burndownBars.appendChild(item);
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Load statistics on load
document.addEventListener('DOMContentLoaded', initStats);
