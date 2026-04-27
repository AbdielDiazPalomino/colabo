/* =============================================
   COLABO — drag.js
   Drag & drop for kanban cards (Made by Abdiel Diaz)
   ============================================= */

const DragManager = (() => {
  let draggedCard = null;
  let draggedCardId = null;
  let draggedColId = null;
  let ghost = null;

  function init() {
    // Event delegation on board canvas
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('dragend', onDragEnd, true);
    document.addEventListener('dragover', onDragOver, true);
    document.addEventListener('drop', onDrop, true);
    document.addEventListener('dragenter', onDragEnter, true);
    document.addEventListener('dragleave', onDragLeave, true);
  }

  function onDragStart(e) {
    const card = e.target.closest('.card');
    if (!card) return;

    draggedCard = card;
    draggedCardId = card.dataset.cardId;
    draggedColId = card.dataset.colId;

    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCardId);

    // Custom ghost
    const rect = card.getBoundingClientRect();
    e.dataTransfer.setDragImage(card, rect.width / 2, 20);

    setTimeout(() => { if (draggedCard) draggedCard.style.opacity = '0.4'; }, 0);
  }

  function onDragEnd(e) {
    if (draggedCard) {
      draggedCard.classList.remove('dragging');
      draggedCard.style.opacity = '';
    }
    document.querySelectorAll('.col.drag-over').forEach(c => c.classList.remove('drag-over'));
    document.querySelectorAll('.drag-ghost').forEach(g => g.remove());
    draggedCard = null;
    draggedCardId = null;
    draggedColId = null;
  }

  function onDragEnter(e) {
    const col = e.target.closest('.col');
    if (col && draggedCard) {
      col.classList.add('drag-over');
    }
  }

  function onDragLeave(e) {
    const col = e.target.closest('.col');
    if (col) {
      const related = e.relatedTarget;
      if (!col.contains(related)) {
        col.classList.remove('drag-over');
      }
    }
  }

  function onDragOver(e) {
    const container = e.target.closest('.cards-container');
    if (!container || !draggedCard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Remove existing ghost
    document.querySelectorAll('.drag-ghost').forEach(g => g.remove());

    // Insert ghost at correct position
    const afterCard = getDragAfterElement(container, e.clientY);
    const ghostEl = document.createElement('div');
    ghostEl.className = 'card drag-ghost';
    ghostEl.style.height = draggedCard.offsetHeight + 'px';

    if (!afterCard) {
      container.appendChild(ghostEl);
    } else {
      container.insertBefore(ghostEl, afterCard);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const container = e.target.closest('.cards-container');
    if (!container || !draggedCard || !draggedCardId) return;

    const toColId = container.closest('.col').dataset.colId;
    const afterCard = getDragAfterElement(container, e.clientY);
    const toIndex = afterCard
      ? Array.from(container.querySelectorAll('.card:not(.drag-ghost)')).indexOf(afterCard)
      : undefined;

    const boardId = ColaboDB.getCurrentBoardId();
    if (!boardId) return;

    if (draggedColId !== toColId || toIndex !== undefined) {
      ColaboDB.moveCard(boardId, draggedColId, toColId, draggedCardId, toIndex);
      // Re-render board (event dispatch)
      document.dispatchEvent(new CustomEvent('board:refresh'));
    }
  }

  function getDragAfterElement(container, y) {
    const cards = [...container.querySelectorAll('.card:not(.dragging):not(.drag-ghost)')];
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  return { init };
})();