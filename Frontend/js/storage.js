// STORAGE.JS — Manejo de datos locales
const Storage = {
  // Obtener todos los tableros
  getBoards() {
    const data = localStorage.getItem('colabo_boards');
    return data ? JSON.parse(data) : [];
  },

  // Guardar tableros
  saveBoards(boards) {
    localStorage.setItem('colabo_boards', JSON.stringify(boards));
  },

  // Obtener tablero activo
  getActiveBoard() {
    const id = localStorage.getItem('colabo_active_board');
    if (!id) return null;
    return this.getBoards().find(b => b.id === id) || null;
  },

  // Guardar tablero activo
  setActiveBoard(id) {
    localStorage.setItem('colabo_active_board', id);
  },

  // Obtener actividad del equipo
  getActivity() {
    const data = localStorage.getItem('colabo_activity');
    return data ? JSON.parse(data) : [];
  },

  // Agregar una actividad nueva
  addActivity(action, detail) {
    const activities = this.getActivity();
    activities.unshift({
      id: Date.now(),
      action,
      detail,
      timestamp: new Date().toISOString(),
      user: 'Tú'
    });
    // Solo guardar las últimas 100
    localStorage.setItem('colabo_activity', JSON.stringify(activities.slice(0, 100)));
  },

  // Obtener preferencias del usuario
  getPreferences() {
    const data = localStorage.getItem('colabo_prefs');
    return data ? JSON.parse(data) : { darkMode: true, notifications: true };
  },

  // Guardar preferencias
  savePreferences(prefs) {
    localStorage.setItem('colabo_prefs', JSON.stringify(prefs));
  },

  // Limpiar todo
  clearAll() {
    localStorage.removeItem('colabo_boards');
    localStorage.removeItem('colabo_activity');
    localStorage.removeItem('colabo_active_board');
  }
};