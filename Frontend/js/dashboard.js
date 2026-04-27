// ============================================
// DASHBOARD.JS — Lógica del panel principal
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderBoards();
});

function renderBoards() {
  const grid = document.getElementById('boardsGrid');
  if (!grid) return;

  const boards = Storage.getBoards();

  // Limpiar tableros anteriores (excepto el botón de nueva pizarra)
  const newCard = grid.querySelector('.new-card');
  grid.innerHTML = '';

  // Mostrar tableros guardados
  boards.forEach(board => {
    const card = document.createElement('a');
    card.href = 'board.html';
    card.className = 'board-card';
    card.innerHTML = `
      <div class="board-card-top" style="background:${board.color || '#6366f1'}">
        <span class="board-emoji-preview">${board.emoji || '📋'}</span>
        <button class="board-delete-btn" title="Eliminar" onclick="confirmDeleteBoard(event, '${board.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
      <div class="board-card-body">
        <h3 class="board-card-title">${board.title || 'Sin título'}</h3>
        <p class="board-card-meta">${countTasks(board)} tareas · ${formatDate(board.createdAt)}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      Storage.setActiveBoard(board.id);
    });
    grid.appendChild(card);
  });

  // Agregar botón nueva pizarra al final
  if (newCard) grid.appendChild(newCard);

  // Mostrar estado vacío si no hay tableros
  if (boards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">🗂️</div>
      <h3>Aún no tienes pizarras</h3>
      <p>Crea tu primera pizarra para empezar a organizar tus tareas.</p>
    `;
    grid.insertBefore(empty, newCard);
  }
}

function countTasks(board) {
  if (!board.columns) return 0;
  return board.columns.reduce((total, col) => total + (col.cards ? col.cards.length : 0), 0);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Reciente';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Modal de eliminar
let boardToDelete = null;

function confirmDeleteBoard(e, boardId) {
  e.preventDefault();
  e.stopPropagation();
  boardToDelete = boardId;
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  boardToDelete = null;
}

function confirmDelete() {
  if (!boardToDelete) return;
  const boards = Storage.getBoards().filter(b => b.id !== boardToDelete);
  Storage.saveBoards(boards);
  closeDeleteModal();
  renderBoards();
  showToast('Pizarra eliminada');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}