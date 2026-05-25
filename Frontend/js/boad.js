let currentTargetColumn = null;
let draggedElement = null;

const cardModal = document.getElementById('cardModal');
const titleInput = document.getElementById('cardTitle');
const descInput = document.getElementById('cardDesc');
const priorityInput = document.getElementById('cardPriority');
const tagInput = document.getElementById('cardTag');
const assignInput = document.getElementById('cardAssignee');

// Manejo del control de colores
let selectedCardColor = "";
document.querySelectorAll('#cardColorPicker .cc').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#cardColorPicker .cc').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        selectedCardColor = target.getAttribute('data-color');
    });
});

function openCardModal(colId) {
    currentTargetColumn = colId;
    cardModal.style.display = 'flex';
    titleInput.focus();
}

function closeCardModal() {
    cardModal.style.display = 'none';
    // Reset de la tarjeta
    titleInput.value = '';
    descInput.value = '';
    priorityInput.value = 'none';
    tagInput.value = '';
    assignInput.value = '';

    const defaultBtn = document.querySelector('#cardColorPicker .cc');
    if (defaultBtn) {
        document.querySelectorAll('#cardColorPicker .cc').forEach(b => b.classList.remove('active'));
        defaultBtn.classList.add('active');
        selectedCardColor = "";
    }
}

function saveCard() {
    const title = titleInput.value.trim();
    if (!title) {
        alert("¡Ponle un título a tu tarjeta!");
        return;
    }

    const priority = priorityInput.value;
    const tag = tagInput.value;
    const assign = assignInput.value || "YO";

    // Elementos HTML de Prioridad
    let priorityHtml = '';
    if (priority !== 'none') {
        const pLabels = { 'low': 'Baja', 'med': 'Media', 'high': 'Alta', 'urgent': 'Urgente' };
        const pColors = { 'low': '#10b981', 'med': '#f59e0b', 'high': '#f87171', 'urgent': '#ef4444' };
        priorityHtml = `<span class="priority-badge" style="color:${pColors[priority]}">${pLabels[priority]}</span>`;
    }

    // Elementos HTML de Tags
    let tagHtml = '';
    if (tag !== "") {
        tagHtml = `<div class="card-labels"><span class="label" style="background:#6366f120;color:#818cf8">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span></div>`;
    }

    const cardId = 'card_' + Date.now();
    let bgColorStyle = selectedCardColor ? `background-color: ${selectedCardColor};` : '';

    const cardHtml = `
    <div class="card" id="${cardId}" draggable="true" ondragstart="drag(event)" style="${bgColorStyle}">
      ${tagHtml}
      <p class="card-title">${title}</p>
      <div class="card-footer">
        ${priorityHtml}
        <div class="card-avatars"><div class="cv" style="background:#6366f1;color:#fff">${assign.substring(0, 2).toUpperCase()}</div></div>
      </div>
    </div>
  `;

    const targetCol = document.getElementById(currentTargetColumn);
    if (targetCol) {
        targetCol.insertAdjacentHTML('beforeend', cardHtml);
    }

    updateCounts();
    closeCardModal();
}

// ========================
// Drag & Drop Nativo
// ========================
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    draggedElement = ev.target;
    setTimeout(() => { ev.target.style.opacity = '0.4'; }, 0);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const card = document.getElementById(data);
    if (card) card.style.opacity = '1';
    draggedElement = null;

    // Encontrar el contenedor correcto (.col-cards)
    let dropTarget = ev.target;
    while (dropTarget && !dropTarget.classList.contains('col-cards')) {
        dropTarget = dropTarget.parentElement;
    }

    if (dropTarget && dropTarget.classList.contains('col-cards')) {
        dropTarget.appendChild(card);
        updateCounts();
    }
}

document.addEventListener('dragend', (e) => {
    if (draggedElement) draggedElement.style.opacity = '1';
});

// ========================
// Utilidades Compartidas
// ========================
function updateCounts() {
    const t = document.getElementById('cards-todo');
    if (t) document.getElementById('count-todo').innerText = t.children.length;

    const p = document.getElementById('cards-prog');
    if (p) document.getElementById('count-prog').innerText = p.children.length;

    const d = document.getElementById('cards-done');
    if (d) document.getElementById('count-done').innerText = d.children.length;
}

// Configurar receptores de drag and drop dinámicos
document.querySelectorAll('.col-cards').forEach(col => {
    col.addEventListener('dragover', allowDrop);
    col.addEventListener('drop', drop);
});

// Botones generales compartidos del Navbar
function closeShareModal() {
    const sm = document.getElementById('shareModal');
    if (sm) sm.style.display = 'none';
}

const sBtn = document.getElementById('shareBoardBtn');
if (sBtn) sBtn.onclick = function () {
    document.getElementById('shareModal').style.display = 'flex';
}

// Inicialización
updateCounts();
