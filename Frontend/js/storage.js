/* =============================================
   COLABO — storage.js
   Shared data layer (Made by Abdiel Diaz)
   ============================================= */

const ColaboDB = {
  // ── BOARDS ──
  getBoards() {
    return JSON.parse(localStorage.getItem('colabo_boards') || '[]');
  },

  saveBoards(boards) {
    localStorage.setItem('colabo_boards', JSON.stringify(boards));
  },

  getBoardById(id) {
    return this.getBoards().find(b => b.id === id) || null;
  },

  createBoard({ name, color, emoji, columns, password }) {
    const id = 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const board = {
      id,
      name: name || 'Mi pizarra',
      color: color || '#6366f1',
      emoji: emoji || '🚀',
      password: password || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      columns: columns.map((colName, idx) => ({
        id: 'col_' + idx + '_' + Date.now(),
        name: colName,
        color: ['#6366f1','#f59e0b','#10b981','#8b5cf6','#ec4899'][idx % 5],
        cards: []
      })),
      notes: []
    };
    const boards = this.getBoards();
    boards.unshift(board);
    this.saveBoards(boards);
    return board;
  },

  updateBoard(id, updates) {
    const boards = this.getBoards();
    const idx = boards.findIndex(b => b.id === id);
    if (idx === -1) return null;
    boards[idx] = { ...boards[idx], ...updates, updatedAt: Date.now() };
    this.saveBoards(boards);
    return boards[idx];
  },

  deleteBoard(id) {
    const boards = this.getBoards().filter(b => b.id !== id);
    this.saveBoards(boards);
  },

  // ── COLUMNS ──
  addColumn(boardId, name) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return null;
    const col = {
      id: 'col_' + Date.now(),
      name,
      color: '#6366f1',
      cards: []
    };
    board.columns.push(col);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
    return col;
  },

  updateColumn(boardId, colId, updates) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const col = board.columns.find(c => c.id === colId);
    if (col) Object.assign(col, updates);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
  },

  deleteColumn(boardId, colId) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    board.columns = board.columns.filter(c => c.id !== colId);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
  },

  // ── CARDS ──
  addCard(boardId, colId, cardData) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return null;
    const col = board.columns.find(c => c.id === colId);
    if (!col) return null;
    const card = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      title: cardData.title || 'Sin título',
      desc: cardData.desc || '',
      priority: cardData.priority || 'none',
      tag: cardData.tag || '',
      assignee: cardData.assignee || '',
      progress: cardData.progress || 0,
      color: cardData.color || '',
      done: false,
      createdAt: Date.now()
    };
    col.cards.push(card);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
    return card;
  },

  updateCard(boardId, colId, cardId, updates) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const col = board.columns.find(c => c.id === colId);
    if (!col) return;
    const card = col.cards.find(c => c.id === cardId);
    if (card) Object.assign(card, updates);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
  },

  deleteCard(boardId, colId, cardId) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const col = board.columns.find(c => c.id === colId);
    if (!col) return;
    col.cards = col.cards.filter(c => c.id !== cardId);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
  },

  moveCard(boardId, fromColId, toColId, cardId, toIndex) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const fromCol = board.columns.find(c => c.id === fromColId);
    const toCol = board.columns.find(c => c.id === toColId);
    if (!fromCol || !toCol) return;
    const cardIdx = fromCol.cards.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    const [card] = fromCol.cards.splice(cardIdx, 1);
    const insertAt = toIndex !== undefined ? toIndex : toCol.cards.length;
    toCol.cards.splice(insertAt, 0, card);
    board.updatedAt = Date.now();
    this.saveBoards(boards);
  },

  // ── NOTES ──
  addNote(boardId, note) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board) return null;
    if (!board.notes) board.notes = [];
    const n = {
      id: 'note_' + Date.now(),
      text: note.text,
      color: note.color || '#fef3c7',
      x: note.x || 200,
      y: note.y || 200,
      createdAt: Date.now()
    };
    board.notes.push(n);
    this.saveBoards(boards);
    return n;
  },

  updateNote(boardId, noteId, updates) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board || !board.notes) return;
    const note = board.notes.find(n => n.id === noteId);
    if (note) Object.assign(note, updates);
    this.saveBoards(boards);
  },

  deleteNote(boardId, noteId) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (!board || !board.notes) return;
    board.notes = board.notes.filter(n => n.id !== noteId);
    this.saveBoards(boards);
  },

  // ── RECENT BOARDS ──
  getRecentBoards() {
    return JSON.parse(localStorage.getItem('colabo_recent') || '[]');
  },

  addRecentBoard(id) {
    const recent = this.getRecentBoards().filter(r => r.id !== id);
    recent.unshift({ id, visitedAt: Date.now() });
    localStorage.setItem('colabo_recent', JSON.stringify(recent.slice(0, 5)));
  },

  // ── UTILS ──
  generateShareLink(boardId) {
    return `${window.location.origin}/colabo/pages/board.html?id=${boardId}`;
  },

  getCurrentBoardId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }
};