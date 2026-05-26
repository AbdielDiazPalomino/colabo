/* =============================================
   COLABO — storage.js (Versión API Django)
   ============================================= */

const API_URL = 'http://localhost:8000/api';

const ColaboDB = {
  // ── BOARDS ──
  async getBoards() {
    console.log("Obteniendo pizarras desde Django...");
    try {
      const res = await fetch(`${API_URL}/boards/`);
      return await res.json();
    } catch (e) {
      console.error("Error obteniendo pizarras:", e);
      return [];
    }
  },

  async getBoardById(id) {
    try {
      const res = await fetch(`${API_URL}/boards/${id}/`);
      console.log("Status de la respuesta:", res.status);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async createBoard({ name, color, emoji, columns, password }) {
    // 1. Crear Pizarra
    const boardId = 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const boardData = {
      id: boardId,
      name: name || 'Mi pizarra',
      color: color || '#6366f1',
      emoji: emoji || '🚀',
      password: password || ''
    };

    const res = await fetch(`${API_URL}/boards/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boardData)
    });
    const newBoard = await res.json();

    // 2. Crear las columnas por defecto
    const colColors = ['#6366f1','#f59e0b','#10b981','#8b5cf6','#ec4899'];
    for (let i = 0; i < columns.length; i++) {
      await fetch(`${API_URL}/columns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'col_' + i + '_' + Date.now(),
          board: newBoard.id,
          name: columns[i],
          color: colColors[i % 5],
          order: i
        })
      });
    }

    return await this.getBoardById(newBoard.id);
  },

  async updateBoard(id, updates) {
    const res = await fetch(`${API_URL}/boards/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await res.json();
  },

  async deleteBoard(id) {
    await fetch(`${API_URL}/boards/${id}/`, { method: 'DELETE' });
  },

  // ── COLUMNS ──
  async addColumn(boardId, name) {
    const res = await fetch(`${API_URL}/columns/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'col_' + Date.now(),
        board: boardId,
        name: name,
        color: '#6366f1',
        order: 99
      })
    });
    return await res.json();
  },

  async updateColumn(boardId, colId, updates) {
    await fetch(`${API_URL}/columns/${colId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async deleteColumn(boardId, colId) {
    await fetch(`${API_URL}/columns/${colId}/`, { method: 'DELETE' });
  },

  // ── CARDS ──
  async addCard(boardId, colId, cardData) {
    const res = await fetch(`${API_URL}/cards/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
        column: colId,
        title: cardData.title || 'Sin título',
        desc: cardData.desc || '',
        priority: cardData.priority || 'none',
        tag: cardData.tag || '',
        assignee: cardData.assignee || '',
        progress: cardData.progress || 0,
        color: cardData.color || '',
        dueDate: cardData.dueDate || null,
        done: cardData.done || false
      })
    });
    return await res.json();
  },

  async updateCard(boardId, colId, cardId, updates) {
    // Si la actualización incluye mover de columna
    if (updates.columnId) {
      updates.column = updates.columnId;
      delete updates.columnId;
    }
    
    await fetch(`${API_URL}/cards/${cardId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async deleteCard(boardId, colId, cardId) {
    await fetch(`${API_URL}/cards/${cardId}/`, { method: 'DELETE' });
  },

  async moveCard(boardId, fromColId, toColId, cardId, toIndex) {
    // Actualizamos la columna a la que pertenece la tarjeta
    await this.updateCard(boardId, fromColId, cardId, { column: toColId, order: toIndex || 0 });
  },

  // ── NOTES ──
  async addNote(boardId, note) {
    const res = await fetch(`${API_URL}/notes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'note_' + Date.now(),
        board: boardId,
        text: note.text,
        color: note.color || '#fef3c7',
        x: note.x || 200,
        y: note.y || 200
      })
    });
    return await res.json();
  },

  async updateNote(boardId, noteId, updates) {
    await fetch(`${API_URL}/notes/${noteId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async deleteNote(boardId, noteId) {
    await fetch(`${API_URL}/notes/${noteId}/`, { method: 'DELETE' });
  },

  // ── RECENT BOARDS (Esto se queda local por ahora) ──
  getRecentBoards() {
    return JSON.parse(localStorage.getItem('colabo_recent') || '[]');
  },

  addRecentBoard(id) {
    const recent = this.getRecentBoards().filter(r => r.id !== id);
    recent.unshift({ id, visitedAt: Date.now() });
    localStorage.setItem('colabo_recent', JSON.stringify(recent.slice(0, 5)));
  },

  getCurrentBoardId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }
};