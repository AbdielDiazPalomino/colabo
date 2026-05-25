/* =============================================
   COLABO — notes.js
   Sticky floating notes layer (Made by Abdiel Diaz)
   ============================================= */

let noteDragTarget = null;
let noteDragOffsetX = 0;
let noteDragOffsetY = 0;
let selectedNoteColor = '#fef3c7';

const NotesManager = {
  render(notes, boardId) {
    const layer = document.getElementById('notesLayer');
    if (!layer) return;

    // Remove existing notes
    layer.querySelectorAll('.sticky-note').forEach(n => n.remove());

    (notes || []).forEach(note => {
      const el = createNoteEl(note, boardId);
      layer.appendChild(el);
    });
  },

  setupModal() {
    // Color picker in note modal
    document.querySelectorAll('.nc').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nc').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedNoteColor = btn.dataset.color;
      });
    });
  }
};

function createNoteEl(note, boardId) {
  const el = document.createElement('div');
  el.className = 'sticky-note';
  el.dataset.noteId = note.id;
  el.style.background = note.color || '#fef3c7';
  el.style.left = (note.x || 200) + 'px';
  el.style.top = (note.y || 200) + 'px';
  el.style.transform = `rotate(${(Math.random() - 0.5) * 4}deg)`;

  el.innerHTML = `
    <button class="note-close" onclick="deleteNoteEl(this, '${boardId}', '${note.id}')">✕</button>
    <div class="note-text">${escapeHtml(note.text)}</div>
  `;

  // Make draggable
  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('note-close')) return;
    noteDragTarget = el;
    const rect = el.getBoundingClientRect();
    noteDragOffsetX = e.clientX - rect.left;
    noteDragOffsetY = e.clientY - rect.top;
    el.classList.add('dragging-note');
    el.style.transform = 'rotate(2deg) scale(1.03)';
    e.preventDefault();
  });

  return el;
}

// Global mousemove/mouseup for note dragging
document.addEventListener('mousemove', (e) => {
  if (!noteDragTarget) return;
  const layer = document.getElementById('notesLayer');
  if (!layer) return;
  const layerRect = layer.getBoundingClientRect();
  let x = e.clientX - layerRect.left - noteDragOffsetX;
  let y = e.clientY - layerRect.top - noteDragOffsetY;
  // Constrain within layer
  x = Math.max(0, Math.min(x, layerRect.width - 180));
  y = Math.max(0, Math.min(y, layerRect.height - 100));
  noteDragTarget.style.left = x + 'px';
  noteDragTarget.style.top = y + 'px';
});

document.addEventListener('mouseup', (e) => {
  if (!noteDragTarget) return;
  const noteId = noteDragTarget.dataset.noteId;
  const boardId = ColaboDB.getCurrentBoardId();
  const x = parseInt(noteDragTarget.style.left);
  const y = parseInt(noteDragTarget.style.top);

  if (boardId) {
    ColaboDB.updateNote(boardId, noteId, { x, y });
  }

  noteDragTarget.classList.remove('dragging-note');
  noteDragTarget.style.transform = `rotate(${(Math.random() - 0.5) * 4}deg)`;
  noteDragTarget = null;
});

window.deleteNoteEl = function (btn, boardId, noteId) {
  const el = btn.closest('.sticky-note');
  el.style.transform = 'scale(0) rotate(10deg)';
  el.style.opacity = '0';
  el.style.transition = 'all 0.2s ease';
  setTimeout(() => el.remove(), 200);
  if (boardId) ColaboDB.deleteNote(boardId, noteId);
};

window.createNote = function () {
  const text = document.getElementById('noteText').value.trim();
  if (!text) return;

  const boardId = ColaboDB.getCurrentBoardId();
  const layer = document.getElementById('notesLayer');
  if (!layer) return;

  const layerRect = layer.getBoundingClientRect();
  const x = 100 + Math.random() * (layerRect.width - 300);
  const y = 80 + Math.random() * (layerRect.height - 200);

  const note = boardId
    ? ColaboDB.addNote(boardId, { text, color: selectedNoteColor, x, y })
    : { id: 'tmp_' + Date.now(), text, color: selectedNoteColor, x, y };

  const el = createNoteEl(note, boardId);
  el.style.opacity = '0';
  el.style.transform = 'scale(0.5) rotate(2deg)';
  layer.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.opacity = '1';
    el.style.transform = `rotate(${(Math.random() - 0.5) * 4}deg) scale(1)`;
  });

  closeNoteModal();
  document.getElementById('noteText').value = '';
};

window.closeNoteModal = function () {
  document.getElementById('noteModal').style.display = 'none';
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}