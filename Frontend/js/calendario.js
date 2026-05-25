/* =============================================
   COLABO — calendario.js
   Dynamic calendar engine for Month, Week, and Day views
   ============================================= */

// State variables
let currentBoardId = null;
let currentBoard = null;
let currentDate = new Date();
let activeView = 'month'; // 'month', 'week', 'day'
let selectedTask = null;

// Priorities labels & styles
const PRIORITY_LABELS = {
  none: 'Sin prioridad',
  low: 'Baja',
  med: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

function initCalendar() {
  // 1. Load active Board
  const recent = ColaboDB.getRecentBoards();
  currentBoardId = recent.length > 0 ? recent[0].id : null;
  
  if (!currentBoardId) {
    const boards = ColaboDB.getBoards();
    if (boards.length > 0) {
      currentBoardId = boards[0].id;
    }
  }

  if (!currentBoardId) {
    console.warn("No board found for calendar.");
    return;
  }

  currentBoard = ColaboDB.getBoardById(currentBoardId);
  if (!currentBoard) {
    console.warn("Board not found.");
    return;
  }

  // Update page sub to show current board
  const sub = document.querySelector('.page-sub');
  if (sub) {
    sub.textContent = `Pizarra activa: ${currentBoard.name || 'Mi Pizarra'}`;
  }

  // 2. Setup event listeners
  setupControls();

  // 3. Render initial view
  render();
}

// Setup Header Navigation and View Toggles
function setupControls() {
  // Navigation
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    navigate(-1);
  });
  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    navigate(1);
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    render();
  });

  // View toggles (Month, Week, Day)
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeView = btn.dataset.view;
      
      // Hide all views and show active one
      document.getElementById('monthView').style.display = activeView === 'month' ? 'block' : 'none';
      document.getElementById('weekView').style.display = activeView === 'week' ? 'block' : 'none';
      document.getElementById('dayView').style.display = activeView === 'day' ? 'block' : 'none';

      render();
    });
  });

  // Close modal when clicking outside overlay
  const overlay = document.getElementById('taskModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeTaskModal();
      }
    });
  }
}

// Navigate through dates based on active view
function navigate(direction) {
  if (activeView === 'month') {
    currentDate.setMonth(currentDate.getMonth() + direction);
  } else if (activeView === 'week') {
    currentDate.setDate(currentDate.getDate() + (direction * 7));
  } else if (activeView === 'day') {
    currentDate.setDate(currentDate.getDate() + direction);
  }
  render();
}

// Master Render trigger
function render() {
  if (activeView === 'month') {
    renderMonthView();
  } else if (activeView === 'week') {
    renderWeekView();
  } else if (activeView === 'day') {
    renderDayView();
  }
}

// ── GET CARDS BY DATE ──
function getCardsForDate(date) {
  if (!currentBoard) return [];
  // Parse date to YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  const matches = [];
  (currentBoard.columns || []).forEach(col => {
    (col.cards || []).forEach(card => {
      if (card.dueDate === dateStr) {
        matches.push({ ...card, colId: col.id, colName: col.name });
      }
    });
  });
  return matches;
}

// ── MONTH VIEW ──
function renderMonthView() {
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  document.getElementById('currentMonth').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const container = document.getElementById('calendarDays');
  container.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sun = 0
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0, Sun = 6

  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Total days in prev month
  const prevTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  
  // 1. Render preceding days of previous month
  for (let i = adjustedFirstDayIndex; i > 0; i--) {
    const day = prevTotalDays - i + 1;
    const date = new Date(year, month - 1, day);
    const dayEl = createDayEl(day, date, true, today);
    container.appendChild(dayEl);
  }

  // 2. Render current month days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dayEl = createDayEl(day, date, false, today);
    container.appendChild(dayEl);
  }

  // 3. Render trailing days of next month to complete 42 cell grid
  const cellsRendered = adjustedFirstDayIndex + totalDays;
  const cellsRemaining = 42 - cellsRendered;
  for (let day = 1; day <= cellsRemaining; day++) {
    const date = new Date(year, month + 1, day);
    const dayEl = createDayEl(day, date, true, today);
    container.appendChild(dayEl);
  }
}

function createDayEl(dayNum, date, isOtherMonth, today) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  if (isOtherMonth) dayEl.className += ' other-month';

  const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
  if (isToday) dayEl.className += ' today';

  dayEl.innerHTML = `
    <span class="day-number">${dayNum}</span>
    <div class="day-tasks"></div>
  `;

  const tasksContainer = dayEl.querySelector('.day-tasks');
  const cards = getCardsForDate(date);

  cards.forEach(card => {
    const taskEl = document.createElement('div');
    taskEl.className = `day-task ${card.priority} ${card.done ? 'completed' : ''}`;
    taskEl.textContent = card.title;
    taskEl.title = `${card.title} - ${PRIORITY_LABELS[card.priority]}`;
    
    taskEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskModal(card.colId, card.id);
    });
    
    tasksContainer.appendChild(taskEl);
  });

  return dayEl;
}

// ── WEEK VIEW ──
function renderWeekView() {
  const container = document.getElementById('weekGrid');
  const headerContainer = document.getElementById('weekHeader');
  container.innerHTML = '';
  headerContainer.innerHTML = '';

  // Get Monday of current week
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(currentDate.setDate(diff));

  // Render Month Header
  const firstDayOfWeek = new Date(monday);
  const lastDayOfWeek = new Date(monday);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  
  const startMonthStr = firstDayOfWeek.toLocaleString('es-ES', { month: 'short', day: 'numeric' });
  const endMonthStr = lastDayOfWeek.toLocaleString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('currentMonth').textContent = `${startMonthStr} - ${endMonthStr}`;

  // 1. Build Header
  headerContainer.innerHTML = '<div class="week-header-cell">Hora</div>';
  const weekDates = [];
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
    
    const cell = document.createElement('div');
    cell.className = 'week-header-cell';
    cell.textContent = `${weekdays[i]} ${d.getDate()}`;
    headerContainer.appendChild(cell);
  }

  // 2. Build Hourly rows (09:00 to 17:00)
  for (let hour = 9; hour <= 17; hour++) {
    const row = document.createElement('div');
    row.className = 'week-hour-row';
    
    // Hour label cell
    const hourLabel = document.createElement('div');
    hourLabel.className = 'hour-label';
    hourLabel.textContent = `${String(hour).padStart(2, '0')}:00`;
    row.appendChild(hourLabel);

    // Week day cells
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const cell = document.createElement('div');
      cell.className = 'week-task-cell';

      // We place cards scheduled for that day in the 09:00 slot to keep it simple and clean
      if (hour === 9) {
        const cards = getCardsForDate(weekDates[dayIdx]);
        cards.forEach(card => {
          const taskEl = document.createElement('div');
          taskEl.className = `week-task ${card.priority} ${card.done ? 'completed' : ''}`;
          taskEl.textContent = card.title;
          taskEl.addEventListener('click', () => {
            openTaskModal(card.colId, card.id);
          });
          cell.appendChild(taskEl);
        });
      }

      row.appendChild(cell);
    }
    container.appendChild(row);
  }
}

// ── DAY VIEW ──
function renderDayView() {
  const formattedDay = currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('currentMonth').textContent = formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);

  const header = document.getElementById('dayHeader');
  const timeline = document.getElementById('dayTimeline');
  header.innerHTML = '';
  timeline.innerHTML = '';

  // Header date display
  const headerDate = document.createElement('div');
  headerDate.className = 'day-header-date';
  headerDate.textContent = 'Tareas planificadas para hoy';
  header.appendChild(headerDate);

  // Hourly slots (09:00 to 17:00)
  const cards = getCardsForDate(currentDate);

  for (let hour = 9; hour <= 17; hour++) {
    const slot = document.createElement('div');
    slot.className = 'timeline-hour';
    
    const label = document.createElement('div');
    label.className = 'timeline-hour-label';
    label.textContent = `${String(hour).padStart(2, '0')}:00`;
    slot.appendChild(label);

    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'timeline-hour-tasks';

    // Place all scheduled tasks at 09:00
    if (hour === 9 && cards.length > 0) {
      cards.forEach(card => {
        const item = document.createElement('div');
        item.className = `day-task-item ${card.priority} ${card.done ? 'completed' : ''}`;
        item.textContent = card.title;
        item.addEventListener('click', () => {
          openTaskModal(card.colId, card.id);
        });
        tasksContainer.appendChild(item);
      });
    } else if (hour === 9) {
      tasksContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-3)">Sin tareas para hoy</span>';
    }

    slot.appendChild(tasksContainer);
    timeline.appendChild(slot);
  }
}

// ── MODAL MANAGEMENT ──
window.openTaskModal = function (colId, cardId) {
  const col = currentBoard.columns.find(c => c.id === colId);
  if (!col) return;
  const card = col.cards.find(c => c.id === cardId);
  if (!card) return;

  selectedTask = card;

  document.getElementById('modalTaskTitle').textContent = card.title;
  document.getElementById('modalDesc').textContent = card.desc || 'Sin descripción adicional.';
  document.getElementById('modalAssignee').innerHTML = `👤 <strong>Asignado a:</strong> ${card.assignee || 'Sin asignar'}`;
  document.getElementById('modalDate').innerHTML = `📅 <strong>Fecha límite:</strong> ${card.dueDate || 'Sin fecha'}`;

  // Priority badge styling
  const prioEl = document.getElementById('modalPriority');
  prioEl.textContent = PRIORITY_LABELS[card.priority] || 'Sin prioridad';
  prioEl.className = 'task-priority'; // Reset classes
  if (card.done) {
    prioEl.textContent = 'Completada ✓';
    prioEl.style.background = 'rgba(34, 197, 94, 0.15)';
    prioEl.style.color = 'var(--green)';
  } else {
    prioEl.style.background = '';
    prioEl.style.color = '';
    if (card.priority !== 'none') {
      prioEl.className += ` ${card.priority}`;
      if (card.priority === 'urgent') {
        prioEl.style.background = 'rgba(239, 68, 68, 0.2)';
        prioEl.style.color = 'var(--urgent)';
      } else if (card.priority === 'high') {
        prioEl.style.background = 'rgba(249, 115, 22, 0.15)';
        prioEl.style.color = 'var(--high)';
      } else if (card.priority === 'med') {
        prioEl.style.background = 'rgba(251, 191, 36, 0.15)';
        prioEl.style.color = 'var(--med)';
      } else if (card.priority === 'low') {
        prioEl.style.background = 'rgba(34, 197, 94, 0.15)';
        prioEl.style.color = 'var(--low)';
      }
    } else {
      prioEl.style.background = 'var(--surface)';
      prioEl.style.color = 'var(--text-2)';
    }
  }

  // "Ver en tablero" button action
  const openBtn = document.getElementById('openTaskBtn');
  openBtn.onclick = function() {
    window.location.href = `board.html?id=${currentBoardId}`;
  };

  document.getElementById('taskModal').style.display = 'flex';
};

window.closeTaskModal = function () {
  document.getElementById('taskModal').style.display = 'none';
  selectedTask = null;
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Initial launch
document.addEventListener('DOMContentLoaded', initCalendar);
