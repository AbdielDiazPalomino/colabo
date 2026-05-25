/* =============================================
   COLABO — board.js
   Main board logic: columns, cards, modals (Made by Abdiel Diaz)
   ============================================= */

// State
let currentBoardId = null;
let currentBoard = null;
let editingCardId = null;
let editingCardColId = null;

// Tag styles
const TAG_STYLES = {
  diseño:    { bg: '#6366f120', color: '#818cf8' },
  dev:       { bg: '#10b98120', color: '#34d399' },
  revisión:  { bg: '#f59e0b20', color: '#fbbf24' },
  deploy:    { bg: '#06b6d420', color: '#67e8f9' },
  docs:      { bg: '#9898a820', color: '#c4b5fd' },
  bug:       { bg: '#f8717120', color: '#f87171' },
  idea:      { bg: '#ec489920', color: '#f472b6' },
};

// ── INIT ──
function init() {
  currentBoardId = ColaboDB.getCurrentBoardId();

  if (!currentBoardId) {
    // No board ID — use first available or redirect
    const boards = ColaboDB.getBoards();
    if (boards.length > 0) {
      window.location.href = `board.html?id=${boards[0].id}`;
    } else {
      window.location.href = 'new-board.html';
    }
    return;
  }

  currentBoard = ColaboDB.getBoardById(currentBoardId);
  if (!currentBoard) {
    window.location.href = 'dashboard.html';
    return;
  }

  ColaboDB.addRecentBoard(currentBoardId);
  renderHeader();
  renderBoard();
  setupEvents();
  DragManager.init();
  NotesManager.render(currentBoard.notes, currentBoardId);
  NotesManager.setupModal();
}

// ── HEADER ──
function renderHeader() {
  document.title = `${currentBoard.name} — Colabo`;
  document.getElementById('boardEmoji').textContent = currentBoard.emoji || '📋';
  document.getElementById('boardTitle').textContent = currentBoard.name;
  document.documentElement.style.setProperty('--board-accent', currentBoard.color || '#6366f1');

  // Editable title
  const titleEl = document.getElementById('boardTitle');
  titleEl.addEventListener('blur', () => {
    const newName = titleEl.textContent.trim();
    if (newName && newName !== currentBoard.name) {
      ColaboDB.updateBoard(currentBoardId, { name: newName });
      currentBoard.name = newName;
    }
  });
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
  });
}

// ── RENDER BOARD ──
function renderBoard() {
  currentBoard = ColaboDB.getBoardById(currentBoardId);
  const canvas = document.getElementById('boardCanvas');
  canvas.innerHTML = '';
  (currentBoard.columns || []).forEach(col => {
    canvas.appendChild(createColEl(col));
  });
}

// ── CREATE COLUMN ELEMENT ──
function createColEl(col) {
  const el = document.createElement('div');
  el.className = 'col';
  el.dataset.colId = col.id;
  el.setAttribute('draggable', 'false');

  const cards = col.cards || [];

  el.innerHTML = `
    <div class="col-header">
      <div class="col-header-left">
        <span class="col-dot" style="background:${col.color || '#6366f1'}"></span>
        <span class="col-name" contenteditable="true" spellcheck="false">${col.name}</span>
        <span class="col-count">${cards.length}</span>
      </div>
      <div class="col-header-right">
        <button class="col-btn" title="Añadir tarjeta" onclick="openNewCardModal('${col.id}')">+</button>
        <button class="col-btn" title="Eliminar columna" onclick="deleteColumn('${col.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="cards-container" data-col-id="${col.id}">
      ${cards.map(card => createCardHTML(card, col.id)).join('')}
    </div>
    <button class="add-card-btn" onclick="openNewCardModal('${col.id}')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
      Añadir tarjeta
    </button>
  `;

  // Editable col name
  const nameEl = el.querySelector('.col-name');
  nameEl.addEventListener('blur', () => {
    const newName = nameEl.textContent.trim();
    if (newName) ColaboDB.updateColumn(currentBoardId, col.id, { name: newName });
  });
  nameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
  });

  return el;
}

// ── CARD HTML ──
function createCardHTML(card, colId) {
  const tag = TAG_STYLES[card.tag];
  const tagHTML = tag
    ? `<span class="card-tag" style="background:${tag.bg};color:${tag.color}">${card.tag}</span>`
    : '';

  const prioClass = card.priority !== 'none' ? `prio-${card.priority}` : '';
  const prioLabel = { low: 'Baja', med: 'Media', high: 'Alta', urgent: '🔴 Urgente' }[card.priority] || '';
  const prioHTML = prioLabel ? `<span class="card-priority ${prioClass}">${prioLabel}</span>` : '<span></span>';

  const assigneeHTML = card.assignee
    ? `<div class="card-avatar">${card.assignee.slice(0, 2).toUpperCase()}</div>`
    : '';

  const progressHTML = card.progress > 0 ? `
    <div class="card-progress">
      <div class="card-progress-bar">
        <div class="card-progress-fill" style="width:${card.progress}%;background:${card.progress === 100 ? '#22c55e' : '#7c6fff'}"></div>
      </div>
      <div class="card-progress-label">${card.progress}%</div>
    </div>
  ` : '';

  const doneOverlay = card.done ? '<div class="card-done-overlay"></div>' : '';
  const accentBar = card.color ? `<div class="card-accent-bar" style="background:${card.color.replace('20','80')}"></div>` : '';

  return `
    <div class="card ${card.done ? 'done' : ''}" 
         data-card-id="${card.id}" 
         data-col-id="${colId}"
         draggable="true"
         ${card.color ? `style="background:${card.color}"` : ''}
         ondblclick="openEditCardModal('${colId}', '${card.id}')">
      ${accentBar}
      ${doneOverlay}
      <div class="card-top">
        ${tagHTML}
        <button class="card-edit-btn" onclick="event.stopPropagation();openEditCardModal('${colId}', '${card.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      <div class="card-title">${escapeHtml(card.title)}</div>
      ${card.desc ? `<div class="card-desc">${escapeHtml(card.desc.slice(0, 80))}${card.desc.length > 80 ? '…' : ''}</div>` : ''}
      ${progressHTML}
      <div class="card-footer">
        ${prioHTML}
        ${assigneeHTML}
      </div>
    </div>
  `;
}

// ── CARD MODAL ──
window.openNewCardModal = function (colId) {
  editingCardId = null;
  editingCardColId = colId;

  document.getElementById('cardModalTitle').textContent = 'Nueva tarjeta';
  document.getElementById('cardTitle').value = '';
  document.getElementById('cardDesc').value = '';
  document.getElementById('cardPriority').value = 'none';
  document.getElementById('cardTag').value = '';
  document.getElementById('cardAssignee').value = '';
  document.getElementById('cardProgress').value = 0;
  document.getElementById('progressVal').textContent = '0%';
  document.getElementById('deleteCardBtn').style.display = 'none';
  document.querySelectorAll('.cc').forEach(b => b.classList.remove('active'));
  document.querySelector('.cc').classList.add('active');

  document.getElementById('cardModal').style.display = 'flex';
  document.getElementById('cardTitle').focus();
};

window.openEditCardModal = function (colId, cardId) {
  const col = currentBoard.columns.find(c => c.id === colId);
  if (!col) return;
  const card = col.cards.find(c => c.id === cardId);
  if (!card) return;

  editingCardId = cardId;
  editingCardColId = colId;

  document.getElementById('cardModalTitle').textContent = 'Editar tarjeta';
  document.getElementById('cardTitle').value = card.title;
  document.getElementById('cardDesc').value = card.desc || '';
  document.getElementById('cardPriority').value = card.priority || 'none';
  document.getElementById('cardTag').value = card.tag || '';
  document.getElementById('cardAssignee').value = card.assignee || '';
  document.getElementById('cardProgress').value = card.progress || 0;
  document.getElementById('progressVal').textContent = (card.progress || 0) + '%';
  document.getElementById('deleteCardBtn').style.display = 'flex';

  // Restore color selection
  document.querySelectorAll('.cc').forEach(b => {
    b.classList.toggle('active', b.dataset.color === (card.color || ''));
  });

  document.getElementById('cardModal').style.display = 'flex';
  document.getElementById('cardTitle').focus();
};

window.closeCardModal = function () {
  document.getElementById('cardModal').style.display = 'none';
};

window.saveCard = function () {
  const title = document.getElementById('cardTitle').value.trim();
  if (!title) {
    document.getElementById('cardTitle').focus();
    return;
  }

  const activeCC = document.querySelector('.cc.active');
  const cardData = {
    title,
    desc: document.getElementById('cardDesc').value.trim(),
    priority: document.getElementById('cardPriority').value,
    tag: document.getElementById('cardTag').value,
    assignee: document.getElementById('cardAssignee').value.trim(),
    progress: parseInt(document.getElementById('cardProgress').value) || 0,
    color: activeCC ? activeCC.dataset.color : ''
  };

  if (editingCardId) {
    ColaboDB.updateCard(currentBoardId, editingCardColId, editingCardId, cardData);
  } else {
    ColaboDB.addCard(currentBoardId, editingCardColId, cardData);
  }

  closeCardModal();
  renderBoard();
  showToast(editingCardId ? 'Tarjeta actualizada ✓' : 'Tarjeta creada 🎉');
};

window.deleteCurrentCard = function () {
  if (!editingCardId || !editingCardColId) return;
  ColaboDB.deleteCard(currentBoardId, editingCardColId, editingCardId);
  closeCardModal();
  renderBoard();
  showToast('Tarjeta eliminada');
};

// ── COLUMN ACTIONS ──
window.deleteColumn = function (colId) {
  if (!confirm('¿Eliminar esta columna y todas sus tarjetas?')) return;
  ColaboDB.deleteColumn(currentBoardId, colId);
  renderBoard();
};

// ── ADD COLUMN ──
function setupAddColumn() {
  document.getElementById('addColBtn').addEventListener('click', () => {
    const name = prompt('Nombre de la columna:');
    if (!name || !name.trim()) return;
    ColaboDB.addColumn(currentBoardId, name.trim());
    renderBoard();
  });
}

// ── SHARE MODAL ──
window.closeShareModal = function () {
  document.getElementById('shareModal').style.display = 'none';
};

// ── NOTE MODAL ──
window.openNoteModal = function () {
  document.getElementById('noteModal').style.display = 'flex';
  document.getElementById('noteText').focus();
};

// ── PROGRESS SLIDER ──
function setupProgressSlider() {
  const slider = document.getElementById('cardProgress');
  const val = document.getElementById('progressVal');
  if (!slider) return;
  slider.addEventListener('input', () => {
    val.textContent = slider.value + '%';
  });
}

// ── CARD COLOR PICKER IN MODAL ──
function setupCardColors() {
  document.querySelectorAll('.cc').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ── EVENTS ──
function setupEvents() {
  // Board refresh after drag & drop
  document.addEventListener('board:refresh', () => {
    renderBoard();
  });

  // Share button
  document.getElementById('shareBoardBtn').addEventListener('click', () => {
    const link = `${window.location.href}`;
    document.getElementById('shareUrl').textContent = link;
    document.getElementById('shareModal').style.display = 'flex';
  });

  // Share: copy
  document.getElementById('copyShareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('shareUrl').textContent).then(() => {
      document.getElementById('copyShareBtn').textContent = '✓ Copiado';
      setTimeout(() => { document.getElementById('copyShareBtn').textContent = 'Copiar link'; }, 2000);
    });
  });

  // Share: social buttons
  document.querySelectorAll('.share-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = encodeURIComponent(window.location.href);
      const label = btn.textContent.trim();
      if (label.includes('WhatsApp')) window.open(`https://wa.me/?text=${link}`, '_blank');
      if (label.includes('Email')) window.open(`mailto:?body=${link}`, '_blank');
    });
  });

  // Add note button
  document.getElementById('addNoteBtn').addEventListener('click', openNoteModal);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  });

  setupAddColumn();
  setupProgressSlider();
  setupCardColors();
}

// ── TOAST ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);