/* =============================================
   COLABO — new-board.js
   Handles board creation form (Made by Abdiel Diaz)
   ============================================= */

let selectedColor = '#6366f1';
let selectedEmoji = '🚀';
let selectedCols = ['Por hacer', 'En progreso', 'Listo'];
let isPrivate = false;
let createdBoardId = null;

function init() {
  setupColorPicker();
  setupEmojiPicker();
  setupColumnPreset();
  setupAccessToggle();
  setupNameInput();
  setupForm();
  setupPasswordToggle();
}

function setupNameInput() {
  const input = document.getElementById('boardName');
  const counter = document.getElementById('nameCount');
  const preview = document.getElementById('previewName');

  input.addEventListener('input', () => {
    const val = input.value.trim();
    counter.textContent = input.value.length;
    preview.textContent = val || 'Mi nueva pizarra';
  });
}

function setupColorPicker() {
  const picker = document.getElementById('colorPicker');
  const colorName = document.getElementById('colorName');
  const thumb = document.getElementById('previewThumb');

  picker.querySelectorAll('.color-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.color-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
      colorName.textContent = btn.dataset.name;
      thumb.style.background = selectedColor + '20';
    });
  });
}

function setupEmojiPicker() {
  document.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedEmoji = btn.dataset.emoji;
    });
  });
}

function setupColumnPreset() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCols = JSON.parse(btn.dataset.cols);
    });
  });
}

function setupAccessToggle() {
  const pubBtn = document.getElementById('accessPublic');
  const privBtn = document.getElementById('accessPrivate');
  const pwField = document.getElementById('passwordField');

  pubBtn.addEventListener('click', () => {
    pubBtn.classList.add('active');
    privBtn.classList.remove('active');
    pwField.style.display = 'none';
    isPrivate = false;
  });

  privBtn.addEventListener('click', () => {
    privBtn.classList.add('active');
    pubBtn.classList.remove('active');
    pwField.style.display = 'block';
    isPrivate = true;
    document.getElementById('boardPassword').focus();
  });
}

function setupPasswordToggle() {
  const toggle = document.getElementById('pwToggle');
  const input = document.getElementById('boardPassword');
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}

function setupForm() {
  const form = document.getElementById('newBoardForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('boardName').value.trim();
    const password = isPrivate ? document.getElementById('boardPassword').value.trim() : null;

    if (!name) {
      const input = document.getElementById('boardName');
      input.classList.add('error');
      input.focus();
      setTimeout(() => input.classList.remove('error'), 2000);
      return;
    }

    // Create board
    const board = ColaboDB.createBoard({
      name,
      color: selectedColor,
      emoji: selectedEmoji,
      columns: selectedCols,
      password
    });

    createdBoardId = board.id;
    showSuccess(board);
  });
}

function showSuccess(board) {
  const overlay = document.getElementById('successOverlay');
  const linkEl = document.getElementById('shareLink');
  const goBtn = document.getElementById('goToBoardBtn');

  const link = `${window.location.origin}${window.location.pathname.replace('new-board.html', '')}board.html?id=${board.id}`;
  linkEl.textContent = link;

  goBtn.addEventListener('click', () => {
    window.location.href = `board.html?id=${board.id}`;
  });

  overlay.style.display = 'flex';
}

window.copyLink = function () {
  const linkEl = document.getElementById('shareLink');
  const btn = document.getElementById('copyBtn');

  navigator.clipboard.writeText(linkEl.textContent).then(() => {
    btn.textContent = '✓ Copiado';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar`;
      btn.classList.remove('copied');
    }, 2000);
  });
};

document.addEventListener('DOMContentLoaded', init);