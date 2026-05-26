/* =============================================
   COLABO — board.js
   Main board logic: columns, cards, modals (Made by Abdiel Diaz)
   ============================================= */

// State
let currentBoardId = null;
let currentBoard = null;
let editingCardId = null;
let editingCardColId = null;
let boardSocket = null;
let currentCardAttachments = [];

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

// ── INIT ──
async function init() {
  currentBoardId = ColaboDB.getCurrentBoardId();

  if (!currentBoardId) {
    const boards = await ColaboDB.getBoards();
    if (boards.length > 0) {
      window.location.href = `board.html?id=${boards[0].id}`;
    } else {
      window.location.href = 'new-board.html';
    }
    return;
  }

  currentBoard = await ColaboDB.getBoardById(currentBoardId);
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

  // 🔴 CONEXIÓN WEBSOCKET PARA TIEMPO REAL
  boardSocket = new WebSocket(`ws://localhost:8000/ws/board/${currentBoardId}/`);
  
  boardSocket.onmessage = async function(e) {
    const data = JSON.parse(e.data);
    if (data.action === 'refresh') {
      // Si alguien más hace un cambio, recargamos la pizarra
      currentBoard = await ColaboDB.getBoardById(currentBoardId);
      renderBoard();
      NotesManager.render(currentBoard.notes, currentBoardId);
    }
  };
}

// ── HEADER ──
function renderHeader() {
  document.title = `${currentBoard.name} — Colabo`;
  document.getElementById('boardEmoji').textContent = currentBoard.emoji || '📋';
  document.getElementById('boardTitle').textContent = currentBoard.name;
  document.documentElement.style.setProperty('--board-accent', currentBoard.color || '#6366f1');

  // Editable title
  const titleEl = document.getElementById('boardTitle');
  const newTitleEl = titleEl.cloneNode(true); // Limpiar eventos anteriores
  titleEl.parentNode.replaceChild(newTitleEl, titleEl);

  newTitleEl.addEventListener('blur', async () => {
    const newName = newTitleEl.textContent.trim();
    if (newName && newName !== currentBoard.name) {
      await ColaboDB.updateBoard(currentBoardId, { name: newName });
      currentBoard.name = newName;
      if (typeof notifyBoardUpdate === 'function') notifyBoardUpdate();
    }
  });
  newTitleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); newTitleEl.blur(); }
  });
}

// ── RENDER BOARD ──
async function renderBoard() {
  currentBoard = await ColaboDB.getBoardById(currentBoardId);

  console.log("Respuesta de Django (currentBoard):", currentBoard);

  const canvas = document.getElementById('boardCanvas');
  canvas.innerHTML = '';
  (currentBoard.columns || []).forEach(col => {
    canvas.appendChild(createColEl(col));
  });

  // Re-apply search filter if there is active search query
  const searchInput = document.getElementById('boardSearchInput');
  if (searchInput && searchInput.value.trim()) {
    filterCards(searchInput.value);
  }
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
  nameEl.addEventListener('blur', async () => {
    const newName = nameEl.textContent.trim();
    if (newName && newName !== col.name) {
      await ColaboDB.updateColumn(currentBoardId, col.id, { name: newName });
      col.name = newName; // Actualizamos localmente
      if (typeof notifyBoardUpdate === 'function') notifyBoardUpdate();
    }
  });
  nameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
  });

  return el;
}

// ── CARD HTML ──
function createCardHTML(card, colId) {
  const tag = resolveTagStyle(card.tag);
  const tagHTML = tag
    ? `<span class="card-tag" style="background:${tag.bg};color:${tag.color}">${escapeHtml(card.tag)}</span>`
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

  // Attachments & Cover
  const attachments = card.attachments || [];
  const imageAttachment = attachments.find(att => att.type && att.type.startsWith('image/'));
  const coverHTML = imageAttachment
    ? `<div class="card-cover-wrap"><img src="${imageAttachment.data}" class="card-cover-img" alt="Cover" /></div>`
    : '';
  
  const attachBadgeHTML = attachments.map(att => {
    const isImage = att.type && att.type.startsWith('image/');
    const icon = isImage ? '🖼️' : '📄';
    const cleanName = att.name.replace(/"/g, '&quot;');
    return `<span class="card-badge-attach" 
                  onclick="event.stopPropagation(); downloadAttachmentDirectly('${card.id}', '${att.id}')" 
                  title="Descargar ${cleanName}">
              ${icon} ${escapeHtml(att.name.slice(0, 10))}${att.name.length > 10 ? '…' : ''}
            </span>`;
  }).join('');

  // Due Date Rendering with Dynamic warning classes
  let dueDateHTML = '';
  if (card.dueDate) {
    const dateObj = new Date(card.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dueClass = '';
    if (card.done || card.progress === 100) {
      dueClass = 'due-completed';
    } else if (diffDays < 0) {
      dueClass = 'due-overdue';
    } else if (diffDays === 0) {
      dueClass = 'due-today';
    } else if (diffDays <= 2) {
      dueClass = 'due-near';
    }

    const formattedDate = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    dueDateHTML = `<span class="card-badge-date ${dueClass}" title="Fecha límite: ${card.dueDate}">📅 ${formattedDate}</span>`;
  }

  return `
    <div class="card ${card.done ? 'done' : ''}" 
         data-card-id="${card.id}" 
         data-col-id="${colId}"
         draggable="true"
         ${card.color ? `style="background:${card.color}"` : ''}
         ondblclick="openEditCardModal('${colId}', '${card.id}')">
      ${coverHTML}
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
        ${attachBadgeHTML}
        ${dueDateHTML}
        ${prioHTML}
        ${assigneeHTML}
      </div>
    </div>
  `;
}

// ── CARD MODAL ──
window.openNewCardModal = function (colId) {
  populateTagsDatalist();
  editingCardId = null;
  editingCardColId = colId;
  currentCardAttachments = [];

  document.getElementById('cardModalTitle').textContent = 'Nueva tarjeta';
  document.getElementById('cardTitle').value = '';
  document.getElementById('cardDesc').value = '';
  document.getElementById('cardPriority').value = 'none';
  document.getElementById('cardTag').value = '';
  document.getElementById('cardAssignee').value = '';
  document.getElementById('cardDueDate').value = '';
  document.getElementById('cardProgress').value = 0;
  document.getElementById('progressVal').textContent = '0%';
  document.getElementById('deleteCardBtn').style.display = 'none';
  document.querySelectorAll('.cc').forEach(b => b.classList.remove('active'));
  document.querySelector('.cc').classList.add('active');

  // Reset file input and list UI
  document.getElementById('cardFileInput').value = '';
  renderAttachmentsList();

  document.getElementById('cardModal').style.display = 'flex';
  document.getElementById('cardTitle').focus();
};

window.openEditCardModal = function (colId, cardId) {
  populateTagsDatalist();
  const col = currentBoard.columns.find(c => c.id === colId);
  if (!col) return;
  const card = col.cards.find(c => c.id === cardId);
  if (!card) return;

  editingCardId = cardId;
  editingCardColId = colId;
  currentCardAttachments = [...(card.attachments || [])];

  document.getElementById('cardModalTitle').textContent = 'Editar tarjeta';
  document.getElementById('cardTitle').value = card.title;
  document.getElementById('cardDesc').value = card.desc || '';
  document.getElementById('cardPriority').value = card.priority || 'none';
  document.getElementById('cardTag').value = card.tag || '';
  document.getElementById('cardAssignee').value = card.assignee || '';
  document.getElementById('cardDueDate').value = card.dueDate || '';
  document.getElementById('cardProgress').value = card.progress || 0;
  document.getElementById('progressVal').textContent = (card.progress || 0) + '%';
  document.getElementById('deleteCardBtn').style.display = 'flex';

  // Restore color selection
  document.querySelectorAll('.cc').forEach(b => {
    b.classList.toggle('active', b.dataset.color === (card.color || ''));
  });

  // Reset file input and render attachments list UI
  document.getElementById('cardFileInput').value = '';
  renderAttachmentsList();

  document.getElementById('cardModal').style.display = 'flex';
  document.getElementById('cardTitle').focus();
};

window.closeCardModal = function () {
  document.getElementById('cardModal').style.display = 'none';
};

window.saveCard = async function () {
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
    color: activeCC ? activeCC.dataset.color : '',
    dueDate: document.getElementById('cardDueDate').value || null
  };

  cardData.done = cardData.progress === 100;

  if (editingCardId) {
    await ColaboDB.updateCard(currentBoardId, editingCardColId, editingCardId, cardData);
  } else {
    await ColaboDB.addCard(currentBoardId, editingCardColId, cardData);
  }

  closeCardModal();
  
  // Refrescar localmente y avisar a los demás
  currentBoard = await ColaboDB.getBoardById(currentBoardId);
  renderBoard();
  notifyBoardUpdate(); 

  if (cardData.progress === 100 && typeof window.triggerConfetti === 'function') {
    window.triggerConfetti();
  }

  showToast(editingCardId ? 'Tarjeta actualizada ✓' : 'Tarjeta creada 🎉');
};

window.deleteCurrentCard = async function () {
  if (!editingCardId || !editingCardColId) return;
  await ColaboDB.deleteCard(currentBoardId, editingCardColId, editingCardId);
  closeCardModal();
  currentBoard = await ColaboDB.getBoardById(currentBoardId);
  renderBoard();
  notifyBoardUpdate();
  showToast('Tarjeta eliminada');
};

// Función helper para avisar al WebSocket
function notifyBoardUpdate() {
  if (boardSocket && boardSocket.readyState === WebSocket.OPEN) {
    boardSocket.send(JSON.stringify({
      action: 'refresh',
      data: {}
    }));
  }
}

// ── COLUMN ACTIONS ──
window.deleteColumn = async function (colId) {
  if (!confirm('¿Eliminar esta columna y todas sus tarjetas?')) return;
  
  // Borramos en Django
  await ColaboDB.deleteColumn(currentBoardId, colId);
  
  // Actualizamos visualmente
  currentBoard = await ColaboDB.getBoardById(currentBoardId);
  renderBoard();
  
  if (typeof notifyBoardUpdate === 'function') notifyBoardUpdate();
};

// ── ADD COLUMN ──
function setupAddColumn() {
  const btn = document.getElementById('addColBtn');
  
  // Clonamos el botón para limpiar listeners viejos y evitar que se dupliquen eventos
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', async () => {
    const name = prompt('Nombre de la columna:');
    if (!name || !name.trim()) return;
    
    // 1. Enviamos a Django
    await ColaboDB.addColumn(currentBoardId, name.trim());
    
    // 2. Pedimos los datos actualizados a Django
    currentBoard = await ColaboDB.getBoardById(currentBoardId);
    
    // 3. Pintamos la pizarra
    renderBoard();
    
    // 4. Avisamos a los demás conectados (si el socket está activo)
    if (typeof notifyBoardUpdate === 'function') notifyBoardUpdate();
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

  // Search input events
  const searchInput = document.getElementById('boardSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterCards(searchInput.value);
    });
  }

  setupAddColumn();
  setupProgressSlider();
  setupCardColors();
  setupFileUpload();
}

// ── SEARCH FILTER CARDS ──
function filterCards(query) {
  const cleanQuery = query.toLowerCase().trim();
  const cols = document.querySelectorAll('.col');

  cols.forEach(col => {
    const colNameEl = col.querySelector('.col-name');
    const colName = colNameEl ? colNameEl.textContent.toLowerCase() : '';
    const colNameMatches = cleanQuery && colName.includes(cleanQuery);

    const cards = col.querySelectorAll('.card');
    let colHasVisibleCard = false;

    cards.forEach(card => {
      const titleEl = card.querySelector('.card-title');
      const descEl = card.querySelector('.card-desc');
      const tagEl = card.querySelector('.card-tag');
      const prioEl = card.querySelector('.card-priority');
      const assigneeEl = card.querySelector('.card-avatar');
      
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const desc = descEl ? descEl.textContent.toLowerCase() : '';
      const tag = tagEl ? tagEl.textContent.toLowerCase() : '';
      const prio = prioEl ? prioEl.textContent.toLowerCase() : '';
      const assignee = assigneeEl ? assigneeEl.textContent.toLowerCase() : '';

      const cardMatches = title.includes(cleanQuery) || 
                          desc.includes(cleanQuery) || 
                          tag.includes(cleanQuery) || 
                          prio.includes(cleanQuery) || 
                          assignee.includes(cleanQuery);

      const isVisible = !cleanQuery || colNameMatches || cardMatches;

      if (isVisible) {
        card.classList.remove('hidden-by-search');
        colHasVisibleCard = true;
      } else {
        card.classList.add('hidden-by-search');
      }
    });

    if (!cleanQuery) {
      col.classList.remove('hidden-by-search');
    } else if (colNameMatches || colHasVisibleCard) {
      col.classList.remove('hidden-by-search');
    } else {
      col.classList.add('hidden-by-search');
    }
  });
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

function populateTagsDatalist() {
  const datalist = document.getElementById('tagsDatalist');
  if (!datalist) return;
  
  // Default list of suggestions
  const defaultTags = ["Diseño", "Desarrollo", "Revisión", "Deploy", "Docs", "Bug", "Idea"];
  const uniqueTags = new Set(defaultTags);
  
  // Add all custom tags already used in the board
  if (currentBoard && currentBoard.columns) {
    currentBoard.columns.forEach(col => {
      if (col.cards) {
        col.cards.forEach(card => {
          if (card.tag && card.tag.trim()) {
            // Capitalize / format nicely
            const t = card.tag.trim();
            uniqueTags.add(t.charAt(0).toUpperCase() + t.slice(1));
          }
        });
      }
    });
  }
  
  datalist.innerHTML = '';
  uniqueTags.forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    datalist.appendChild(opt);
  });
}

// ── ATTACHMENTS MANAGER ──
function renderAttachmentsList() {
  const container = document.getElementById('cardAttachmentsList');
  if (!container) return;
  container.innerHTML = '';

  currentCardAttachments.forEach(att => {
    const isImage = att.type && att.type.startsWith('image/');
    const icon = isImage ? '🖼️' : '📄';

    const item = document.createElement('div');
    item.className = 'attachment-item';
    item.innerHTML = `
      <div class="att-left" onclick="downloadAttachment('${att.id}')">
        <span class="att-icon">${icon}</span>
        <span class="att-name" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
        <span class="att-size">${formatBytes(att.size)}</span>
      </div>
      <button class="att-del" onclick="deleteAttachment('${att.id}')" title="Eliminar archivo">✕</button>
    `;
    container.appendChild(item);
  });
}

window.deleteAttachment = function (id) {
  currentCardAttachments = currentCardAttachments.filter(att => att.id !== id);
  renderAttachmentsList();
};

window.downloadAttachment = function (id) {
  const att = currentCardAttachments.find(a => a.id === id);
  if (!att) return;

  const link = document.createElement('a');
  link.href = att.data;
  link.download = att.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function setupFileUpload() {
  const fileInput = document.getElementById('cardFileInput');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("El archivo supera el límite de 1MB. Por favor, selecciona un archivo más pequeño o comprímelo.");
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      const base64Data = evt.target.result;

      if (file.type.startsWith('image/')) {
        compressImage(base64Data, 300, 300, (compressedBase64) => {
          currentCardAttachments.push({
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
            name: file.name,
            type: file.type,
            size: Math.round(compressedBase64.length * 0.75),
            data: compressedBase64
          });
          renderAttachmentsList();
        });
      } else {
        currentCardAttachments.push({
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data
        });
        renderAttachmentsList();
      }
      fileInput.value = '';
    };
    reader.readAsDataURL(file);
  });
}

function compressImage(base64Str, maxWidth, maxHeight, callback) {
  const img = new Image();
  img.src = base64Str;
  img.onload = function () {
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    callback(dataUrl);
  };
}

window.downloadAttachmentDirectly = function (cardId, attId) {
  if (!currentBoard) return;
  let card = null;
  for (let col of currentBoard.columns) {
    card = col.cards.find(c => c.id === cardId);
    if (card) break;
  }
  if (!card || !card.attachments) return;
  const att = card.attachments.find(a => a.id === attId);
  if (!att) return;

  const link = document.createElement('a');
  link.href = att.data;
  link.download = att.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

document.addEventListener('DOMContentLoaded', init);