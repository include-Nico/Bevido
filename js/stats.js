document.addEventListener('DOMContentLoaded', () => {
    renderStats();
});

// Indice della serata selezionata per il salvataggio ricordo
let pendingMemoryIndex = null;

// ==========================================
// RENDER STORICO
// ==========================================
function renderStats() {
    const history   = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const container = document.getElementById('statsList');
    const noData    = document.getElementById('noData');

    if (history.length === 0) {
        noData.style.display    = 'block';
        container.innerHTML     = '';
        return;
    }

    noData.style.display = 'none';
    const recentLimit    = Math.min(history.length, 10);
    let html = '';

    for (let i = 0; i < recentLimit; i++) {
        const originalIndex = history.length - 1 - i;
        const entry         = history[originalIndex];

        const parts = entry.date.split(', ');
        const day   = parts[0] || entry.date;
        const time  = parts[1] || "";

        // Controlla se esiste già un ricordo salvato per questa voce specifica (per indice)
        const memories    = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
        const hasMemory   = memories.some(m => m.historyIndex === originalIndex);
        const memoryLabel = hasMemory
            ? `<span class="memory-saved-badge"><i class="fa-solid fa-camera"></i> Salvato</span>`
            : `<button class="save-memory-btn" onclick="openStatsMemoryModal(${originalIndex})">
                   <i class="fa-solid fa-camera"></i>
               </button>`;

        html += `
            <div class="stats-card">
                <div class="stats-info-group">
                    <div class="date-texts">
                        <strong>${day}</strong>
                        <span><i class="fa-regular fa-clock"></i> ${time}</span>
                    </div>
                    <div class="stats-meal">
                        <i class="fa-solid fa-utensils"></i> ${entry.mealType}
                    </div>
                </div>
                <div class="stats-action-group">
                    <div class="stats-value" style="color:${getBacColor(entry.maxBac)};">
                        ${entry.maxBac} <small>g/L</small>
                    </div>
                    ${memoryLabel}
                    <button class="delete-single-btn" onclick="deleteSingleEntry(${originalIndex})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
    }

    container.innerHTML = html;
}

function getBacColor(val) {
    if (val < 0.5) return '#00e676';
    if (val < 1.5) return '#ffb400';
    return '#ff4b2b';
}

// ==========================================
// MODAL SALVA RICORDO DA STORICO
// ==========================================
function openStatsMemoryModal(index) {
    pendingMemoryIndex = index;

    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const entry   = history[index];
    if (!entry) return;

    const parts  = entry.date.split(', ');
    const day    = parts[0] || entry.date;
    const time   = parts[1] || "";
    const color  = getBacColor(entry.maxBac);

    // Mostra riepilogo serata nel modal
    document.getElementById('statsMemoryPreview').innerHTML = `
        <div class="stats-memory-preview-inner">
            <div>
                <strong>${day}</strong>
                <span><i class="fa-regular fa-clock"></i> ${time} &nbsp;&middot;&nbsp; <i class="fa-solid fa-utensils"></i> ${entry.mealType}</span>
            </div>
            <div class="memory-bac-badge"
                 style="background:${color}22; color:${color}; border-color:${color}55; min-width:56px; padding:6px 10px;">
                <span style="font-size:1.1rem;">${entry.maxBac}</span>
                <small>g/L</small>
            </div>
        </div>`;

    // Pre-compila il titolo con la data
    document.getElementById('statsMemoryTitle').value = `Serata del ${day}`;
    document.getElementById('statsMemoryImage').value = '';

    document.getElementById('statsMemoryModal').style.display = 'flex';
}

function closeStatsMemoryModal() {
    document.getElementById('statsMemoryModal').style.display = 'none';
    pendingMemoryIndex = null;
}

function confirmStatsMemory() {
    const title = document.getElementById('statsMemoryTitle').value.trim();
    const file  = document.getElementById('statsMemoryImage').files[0];

    if (!title)  return alert("Inserisci un titolo per il ricordo!");
    if (!file)   return alert("Allega una foto!");

    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const entry   = history[pendingMemoryIndex];
    if (!entry) return closeStatsMemoryModal();

    const parts = entry.date.split(', ');
    const day   = parts[0] || entry.date;

    const reader = new FileReader();
    reader.onloadend = function () {
        const memory = {
            id:           Date.now(),
            title,
            image:        reader.result,
            date:         day,
            bac:          entry.maxBac,
            // Drink salvati con la serata (disponibili dalle sessioni nuove)
            drinks:       entry.consumedDrinks || [],
            historyIndex: pendingMemoryIndex,
        };

        let memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
        memories.unshift(memory);
        localStorage.setItem('bevid0_memories', JSON.stringify(memories));

        closeStatsMemoryModal();
        renderStats(); // Aggiorna il badge "Salvato"
    };
    reader.readAsDataURL(file);
}

// ==========================================
// ELIMINA SINGOLA VOCE
// ==========================================
function deleteSingleEntry(index) {
    customConfirm("Vuoi eliminare questa singola serata?", () => {
        let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
        history.splice(index, 1);
        localStorage.setItem('bevid0_history', JSON.stringify(history));
        renderStats();
    });
}

function clearHistory() {
    customConfirm("Vuoi davvero cancellare TUTTO lo storico? L'azione è irreversibile.", () => {
        localStorage.removeItem('bevid0_history');
        renderStats();
    });
}

// ==========================================
// POPUP DI SISTEMA
// ==========================================
function customConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.innerHTML = `
        <div class="glass-container modal-content alert-box"
             style="animation:slideUp 0.3s ease-out; max-width:320px;">
            <h3 style="color:var(--warning); margin-bottom:10px;">
                <i class="fa-solid fa-circle-question"></i> Attenzione
            </h3>
            <p style="margin-bottom:20px; font-size:0.9rem; color:white;">${message}</p>
            <div style="display:flex; gap:10px;">
                <button
                    class="btn-secondary"
                    style="flex:1; margin:0; padding:12px;"
                    onclick="this.closest('.alert-overlay').remove()"
                >
                    Annulla
                </button>
                <button
                    class="btn-primary"
                    style="flex:1; margin:0; padding:12px; background:var(--danger); border-color:var(--danger);"
                    id="confirmBtn"
                >
                    Conferma
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => {
        overlay.remove();
        onConfirm();
    };
}
