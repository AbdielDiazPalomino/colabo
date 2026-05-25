/* =============================================
   COLABO — drag.js
   Drag & drop for kanban cards (Made by Abdiel Diaz)
   ============================================= */

const DragManager = (() => {
    let draggedCard = null;
    let draggedCardId = null;
    let draggedColId = null;

    // Per-column drag counters to avoid flickering
    const dragCounters = new Map();

    function init() {
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

        const rect = card.getBoundingClientRect();
        e.dataTransfer.setDragImage(card, rect.width / 2, 20);

        setTimeout(() => { if (draggedCard) draggedCard.style.opacity = '0.4'; }, 0);
    }

    function onDragEnd(e) {
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
            draggedCard.style.opacity = '';
        }
        // Clean up all columns
        document.querySelectorAll('.col.drag-over').forEach(c => c.classList.remove('drag-over'));
        document.querySelectorAll('.drag-ghost').forEach(g => g.remove());
        dragCounters.clear();

        draggedCard = null;
        draggedCardId = null;
        draggedColId = null;
    }

    function onDragEnter(e) {
        if (!draggedCard) return;
        const col = e.target.closest('.col');
        if (!col) return;

        const colId = col.dataset.colId;
        dragCounters.set(colId, (dragCounters.get(colId) || 0) + 1);
        col.classList.add('drag-over');
    }

    function onDragLeave(e) {
        if (!draggedCard) return;
        const col = e.target.closest('.col');
        if (!col) return;

        const colId = col.dataset.colId;
        const count = (dragCounters.get(colId) || 0) - 1;
        dragCounters.set(colId, count);

        if (count <= 0) {
            dragCounters.set(colId, 0);
            col.classList.remove('drag-over');
            // Remove ghost from this column when leaving
            col.querySelectorAll('.drag-ghost').forEach(g => g.remove());
        }
    }

    function onDragOver(e) {
        if (!draggedCard) return;
        const col = e.target.closest('.col');
        if (!col) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const container = col.querySelector('.cards-container');
        if (!container) return;

        // Remove existing ghost and reinsert at correct position
        container.querySelectorAll('.drag-ghost').forEach(g => g.remove());

        const afterCard = getDragAfterElement(container, e.clientY);
        const ghostEl = document.createElement('div');
        ghostEl.className = 'card drag-ghost';
        ghostEl.style.height = (draggedCard.offsetHeight || 80) + 'px';

        if (!afterCard) {
            container.appendChild(ghostEl);
        } else {
            container.insertBefore(ghostEl, afterCard);
        }
    }

    function onDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedCard || !draggedCardId) return;

        const col = e.target.closest('.col');
        if (!col) return;

        const container = col.querySelector('.cards-container');
        if (!container) return;

        const toColId = col.dataset.colId;
        const afterCard = getDragAfterElement(container, e.clientY);
        const allCards = Array.from(container.querySelectorAll('.card:not(.drag-ghost)'));
        const toIndex = afterCard ? allCards.indexOf(afterCard) : undefined;

        const boardId = ColaboDB.getCurrentBoardId();
        if (!boardId) return;

        ColaboDB.moveCard(boardId, draggedColId, toColId, draggedCardId, toIndex);
        document.dispatchEvent(new CustomEvent('board:refresh'));
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