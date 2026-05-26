/* =============================================
   COLABO — dashboard.js
   Renders boards grid from localStorage
   ============================================= */

let boardToDelete = null;

async function init() {
  await seedDemo();
  renderBoards();
}

async function renderBoards() {
  const grid = document.getElementById('boardsGrid');
  const boards = await ColaboDB.getBoards();

  // Remove existing board cards (keep the "new" card)
  grid.querySelectorAll('.board-card:not(.new-card)').forEach(el => el.remove());

  if (boards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-boards';
    empty.innerHTML = `<p style="color:var(--text-3);font-size:0.9rem;grid-column:1/-1;padding:1rem 0;">Aún no tienes pizarras. <a href="new-board.html" style="color:var(--accent-2)">Crea tu primera →</a></p>`;
    grid.insertBefore(empty, grid.querySelector('.new-card'));
    return;
  }

  boards.forEach((board, i) => {
    const card = createBoardCard(board, i);
    grid.insertBefore(card, grid.querySelector('.new-card'));
  });
}

function createBoardCard(board, index) {
  const card = document.createElement('a');
  const isPrivate = board.password && board.password.length > 0;
  if (isPrivate) {
    card.href = '#';
    card.addEventListener('click', (e) => {
      // Prevent navigation if click was on a button inside the card
      if (e.target.closest('.board-actions')) return;
      e.preventDefault();
      promptPassword(board.id, board.password);
    });
  } else {
    card.href = `board.html?id=${board.id}`;
  }
  card.className = 'board-card';
  card.style.animationDelay = `${index * 0.06}s`;

  const cardCount = board.columns
    ? board.columns.reduce((sum, col) => sum + (col.cards ? col.cards.length : 0), 0)
    : 0;

  const timeAgo = getTimeAgo(board.updatedAt || board.createdAt);
  
  let color = board.color || '#6366f1';
  if (!color.startsWith('#') && color.match(/^[0-9a-fA-F]{3,8}$/)) {
    color = '#' + color;
  }

  card.innerHTML = `
    <div class="board-thumb" style="background:${color}18">
      <div class="board-thumb-inner">
        ${(board.columns || []).slice(0, 3).map(col => `
          <div class="mini-col">
            ${(col.cards || []).slice(0, 3).map(() => '<div class="mini-card"></div>').join('')}
          </div>
        `).join('')}
      </div>
    </div>
    <div class="board-info">
      <div class="board-name">
        <span style="margin-right:6px">${board.emoji || '📋'}</span>${board.name}
      </div>
      <div class="board-meta">
        <span class="board-count">${cardCount} tarjeta${cardCount !== 1 ? 's' : ''} · ${timeAgo}</span>
        ${board.password ? '<span class="board-lock">🔒 Protegida</span>' : ''}
      </div>
    </div>
    <div class="board-actions" onclick="event.preventDefault()">
      <button class="board-btn" title="Copiar link" onclick="copyBoardLink(event, '${board.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
      <button class="board-btn danger" title="Eliminar" onclick="openDeleteModal(event, '${board.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `;

  return card;
}

function copyBoardLink(e, id) {
  e.stopPropagation();
  const link = `${window.location.origin}${window.location.pathname.replace('dashboard.html', '')}board.html?id=${id}`;
  navigator.clipboard.writeText(link).then(() => {
    showToast('Link copiado 🎉');
  });
}

function openDeleteModal(e, id) {
  e.stopPropagation();
  boardToDelete = id;
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  boardToDelete = null;
}

function confirmDelete() {
  if (!boardToDelete) return;
  ColaboDB.deleteBoard(boardToDelete);
  closeDeleteModal();
  renderBoards();
}

function showToast(msg) {
  let toast = document.getElementById('dashToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dashToast';
    toast.style.cssText = `
      position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);
      background:var(--surface);border:1px solid var(--border);
      color:var(--text);padding:10px 20px;border-radius:50px;
      font-size:0.85rem;font-weight:500;opacity:0;transition:all 0.3s ease;
      z-index:999;pointer-events:none;font-family:var(--font-sans);
      box-shadow:0 8px 32px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

function getTimeAgo(ts) {
  if (!ts) return 'Reciente';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

// Seed demo data if empty
async function seedDemo() {
  const boards = await ColaboDB.getBoards();
  if (boards && boards.length > 0) return;
  console.log("Creando pizarra de demostración...");

  const b1 = await ColaboDB.createBoard({
    name: 'Sprint de diseño',
    color: '#6366f1',
    emoji: '🎨',
    columns: ['Por hacer', 'En progreso', 'Listo'],
    password: null
  });

  if (b1 && b1.columns && b1.columns.length >= 3) {
    await ColaboDB.addCard(b1.id, b1.columns[0].id, { title: 'Wireframes pantalla principal', priority: 'high', tag: 'diseño', assignee: 'JR', progress: 0 });
    await ColaboDB.addCard(b1.id, b1.columns[0].id, { title: 'Revisar paleta de colores', priority: 'med', tag: 'revisión', assignee: 'AM', progress: 0 });
    await ColaboDB.addCard(b1.id, b1.columns[1].id, { title: 'Sistema de tipografía', priority: 'high', tag: 'diseño', assignee: 'CS', progress: 60 });
    await ColaboDB.addCard(b1.id, b1.columns[2].id, { title: 'Logo e identidad visual', priority: 'low', tag: 'diseño', assignee: 'JR', progress: 100 });
  }

  await ColaboDB.createBoard({
    name: 'Proyecto Alpha',
    color: '#10b981',
    emoji: '🚀',
    columns: ['Backlog', 'Por hacer', 'En progreso', 'Listo'],
    password: 'alpha2024'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  
  init();
});

function promptPassword(id, correctPw) {
  const userInput = prompt("🔒 Esta pizarra está protegida.\nPor favor, ingresa la contraseña para acceder:");
  if (userInput === correctPw) {
    window.location.href = 'board.html?id=' + id;
  } else if (userInput !== null) {
    alert("❌ Contraseña incorrecta. Acceso denegado.");
  }
}

// Expose functions globally to ensure HTML elements and dynamic templates can access them
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.copyBoardLink = copyBoardLink;
window.promptPassword = promptPassword;