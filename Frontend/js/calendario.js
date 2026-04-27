// ============================================
// CALENDARIO.JS — Lógica del calendario
// ============================================

let currentDate = new Date();
let currentView = 'month';

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  setupControls();
  setupViewToggle();
});

function setupControls() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
  });
}

function setupViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;

      document.getElementById('monthView').style.display = currentView === 'month' ? 'block' : 'none';
      document.getElementById('weekView').style.display = currentView === 'week' ? 'block' : 'none';
      document.getElementById('dayView').style.display = currentView === 'day' ? 'block' : 'none';

      renderCalendar();
    });
  });
}

function renderCalendar() {
  updateMonthLabel();
  if (currentView === 'month') renderMonthView();
  if (currentView === 'week') renderWeekView();
  if (currentView === 'day') renderDayView();
}

function updateMonthLabel() {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('currentMonth').textContent =
    `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function getTasksForDate(dateStr) {
  const boards = Storage.getBoards();
  const tasks = [];
  boards.forEach(board => {
    if (!board.columns) return;
    board.columns.forEach(col => {
      if (!col.cards) return;
      col.cards.forEach(card => {
        if (card.dueDate && card.dueDate.startsWith(dateStr)) {
          tasks.push({ ...card, columnName: col.title });
        }
      });
    });
  });
  return tasks;
}

function renderMonthView() {
  const container = document.getElementById('calendarDays');
  container.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  // Ajustar inicio semana al lunes
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Días vacíos antes del mes
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  // Días del mes
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const tasks = getTasksForDate(dateStr);
    const isToday = today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === d;

    const day = document.createElement('div');
    day.className = `cal-day${isToday ? ' today' : ''}${tasks.length ? ' has-tasks' : ''}`;
    day.innerHTML = `
      <span class="day-number">${d}</span>
      <div class="day-tasks">
        ${tasks.slice(0, 3).map(t => `
          <div class="day-task priority-${t.priority || 'none'}" onclick="openTaskModal('${t.id}')">
            ${t.title || 'Tarea'}
          </div>
        `).join('')}
        ${tasks.length > 3 ? `<div class="day-more">+${tasks.length - 3} más</div>` : ''}
      </div>
    `;
    container.appendChild(day);
  }
}

function renderWeekView() {
  const header = document.getElementById('weekHeader');
  const grid = document.getElementById('weekGrid');
  header.innerHTML = '';
  grid.innerHTML = '';

  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  days.forEach((dayName, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const isToday = date.toDateString() === new Date().toDateString();

    const col = document.createElement('div');
    col.className = `week-col${isToday ? ' today' : ''}`;
    col.innerHTML = `<div class="week-day-label">${dayName} ${date.getDate()}</div>`;

    const dateStr = date.toISOString().split('T')[0];
    const tasks = getTasksForDate(dateStr);
    tasks.forEach(t => {
      const taskEl = document.createElement('div');
      taskEl.className = `week-task priority-${t.priority || 'none'}`;
      taskEl.textContent = t.title || 'Tarea';
      taskEl.onclick = () => openTaskModal(t.id);
      col.appendChild(taskEl);
    });

    header.appendChild(col);
  });
}

function renderDayView() {
  const header = document.getElementById('dayHeader');
  const timeline = document.getElementById('dayTimeline');
  header.innerHTML = '';
  timeline.innerHTML = '';

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  header.innerHTML = `<h2>${currentDate.getDate()} de ${months[currentDate.getMonth()]}</h2>`;

  const dateStr = currentDate.toISOString().split('T')[0];
  const tasks = getTasksForDate(dateStr);

  for (let h = 7; h <= 21; h++) {
    const hour = document.createElement('div');
    hour.className = 'day-hour';
    hour.innerHTML = `<span class="hour-label">${h}:00</span><div class="hour-tasks"></div>`;
    timeline.appendChild(hour);
  }

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'day-empty';
    empty.innerHTML = '<p>No hay tareas para este día 🎉</p>';
    timeline.appendChild(empty);
  } else {
    const firstHour = timeline.querySelector('.hour-tasks');
    tasks.forEach(t => {
      const taskEl = document.createElement('div');
      taskEl.className = `day-task priority-${t.priority || 'none'}`;
      taskEl.textContent = t.title || 'Tarea';
      taskEl.onclick = () => openTaskModal(t.id);
      firstHour.appendChild(taskEl);
    });
  }
}

function openTaskModal(taskId) {
  const modal = document.getElementById('taskModal');
  if (!modal) return;

  const boards = Storage.getBoards();
  let foundTask = null;
  boards.forEach(board => {
    if (!board.columns) return;
    board.columns.forEach(col => {
      if (!col.cards) return;
      const card = col.cards.find(c => c.id === taskId);
      if (card) foundTask = card;
    });
  });

  if (!foundTask) return;

  document.getElementById('modalTaskTitle').textContent = foundTask.title || 'Tarea';
  document.getElementById('modalDesc').textContent = foundTask.desc || 'Sin descripción';
  document.getElementById('modalPriority').textContent = foundTask.priority || '';
  document.getElementById('modalAssignee').textContent = foundTask.assignee ? `👤 ${foundTask.assignee}` : '';
  document.getElementById('modalDate').textContent = foundTask.dueDate ? `📅 ${foundTask.dueDate}` : '';

  modal.style.display = 'flex';
}

function closeTaskModal() {
  document.getElementById('taskModal').style.display = 'none';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}