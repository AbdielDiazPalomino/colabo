// ============================================
// TEAM-ACTIVITY.JS — Actividad del equipo
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderActivity();
  setupFilters();
  setupRefresh();
  updateOnlineCount();
});

function renderActivity(filter = 'all') {
  const activities = Storage.getActivity();
  const todayList = document.getElementById('todayActivities');
  const yesterdayList = document.getElementById('yesterdayActivities');
  const weekList = document.getElementById('weekActivities');
  const olderList = document.getElementById('olderActivities');
  const emptyState = document.getElementById('emptyActivity');

  todayList.innerHTML = '';
  yesterdayList.innerHTML = '';
  weekList.innerHTML = '';
  olderList.innerHTML = '';

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let filtered = activities;
  if (filter !== 'all') {
    filtered = activities.filter(a => a.type === filter);
  }

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    document.getElementById('todayActivities').closest('.activity-group').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.getElementById('todayActivities').closest('.activity-group').style.display = 'block';

  let hasToday = false, hasYesterday = false, hasWeek = false, hasOlder = false;

  filtered.forEach(activity => {
    const actDate = new Date(activity.timestamp);
    const actDateStr = actDate.toDateString();
    const el = createActivityElement(activity);
    const diffDays = Math.floor((now - actDate) / (1000 * 60 * 60 * 24));

    if (actDateStr === todayStr) {
      todayList.appendChild(el);
      hasToday = true;
    } else if (actDateStr === yesterdayStr) {
      yesterdayList.appendChild(el);
      hasYesterday = true;
    } else if (diffDays <= 7) {
      weekList.appendChild(el);
      hasWeek = true;
    } else {
      olderList.appendChild(el);
      hasOlder = true;
    }
  });

  // Si no hay actividad hoy, mostrar mensaje
  if (!hasToday) {
    todayList.innerHTML = '<div class="no-activity-today">Sin actividad hoy todavía</div>';
  }

  document.getElementById('yesterdayGroup').style.display = hasYesterday ? 'block' : 'none';
  document.getElementById('thisWeekGroup').style.display = hasWeek ? 'block' : 'none';
  document.getElementById('olderGroup').style.display = hasOlder ? 'block' : 'none';
}

function createActivityElement(activity) {
  const el = document.createElement('div');
  el.className = 'activity-item';

  const icons = {
    cards: '📋',
    comments: '💬',
    likes: '❤️',
    columns: '📁',
    default: '⚡'
  };

  const icon = icons[activity.type] || icons.default;
  const time = formatTime(activity.timestamp);

  el.innerHTML = `
    <div class="activity-avatar" style="background:#6366f1">
      ${activity.user ? activity.user.substring(0, 2).toUpperCase() : 'YO'}
    </div>
    <div class="activity-content">
      <div class="activity-text">
        <span class="activity-icon">${icon}</span>
        <strong>${activity.user || 'Tú'}</strong>
        ${activity.action}
        ${activity.detail ? `<span class="activity-detail">"${activity.detail}"</span>` : ''}
      </div>
      <span class="activity-time">${time}</span>
    </div>
  `;
  return el;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderActivity(btn.dataset.filter);
    });
  });

  const clearBtn = document.getElementById('clearActivityBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('¿Limpiar toda la actividad?')) {
        localStorage.removeItem('colabo_activity');
        renderActivity();
        showToast('Actividad limpiada');
      }
    });
  }
}

function setupRefresh() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderActivity();
      showToast('Actividad actualizada');
    });
  }

  // Auto-refresh cada 30 segundos
  setInterval(renderActivity, 30000);
}

function updateOnlineCount() {
  const count = document.getElementById('onlineCount');
  if (count) count.textContent = '1 conectado';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}