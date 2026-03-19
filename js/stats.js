document.addEventListener('DOMContentLoaded', () => {
    renderStats();
});

function renderStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const container = document.getElementById('statsList');
    const noData = document.getElementById('noData');

    if (history.length === 0) {
        noData.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    noData.style.display = 'none';
    const recentLimit = Math.min(history.length, 10);
    let html = '';

    for(let i = 0; i < recentLimit; i++) {
        let originalIndex = history.length - 1 - i;
        let entry = history[originalIndex];
        
        let parts = entry.date.split(', ');
        let day = parts[0] || entry.date;
        let time = parts[1] || "";

        html += `
        <div class="stats-card">
            <div class="stats-info-group">
                <div class="date-texts">
                    <strong>${day}</strong>
                    <span><i class="fa-regular fa-clock"></i> ${time}</span>
                </div>
                <div class="stats-meal"><i class="fa-solid fa-utensils"></i> ${entry.mealType}</div>
            </div>
            <div class="stats-action-group">
                <div class="stats-value" style="color: ${getBacColor(entry.maxBac)}">
                    ${entry.maxBac} <small>g/L</small>
                </div>
                <button class="delete-single-btn" onclick="deleteSingleEntry(${originalIndex})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
        `;
    }
    container.innerHTML = html;
}

function getBacColor(val) {
    if (val < 0.5) return '#00e676';
    if (val < 1.5) return '#ffb400';
    return '#ff4b2b';
}

function deleteSingleEntry(index) {
    customConfirm("Vuoi eliminare questa singola serata?", () => {
        let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
        history.splice(index, 1); // Rimuove solo quell'elemento
        localStorage.setItem('bevid0_history', JSON.stringify(history));
        renderStats(); // Aggiorna la lista
    });
}

function clearHistory() {
    customConfirm("Vuoi davvero cancellare TUTTO lo storico? L'azione è irreversibile.", () => {
        localStorage.removeItem('bevid0_history');
        renderStats();
    });
}

// --- SISTEMA POPUP (Sostituisce alert/confirm) ---
function customConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.innerHTML = `
        <div class="glass-container modal-content alert-box" style="animation: slideUp 0.3s ease-out; max-width: 320px;">
            <h3 style="color: var(--warning); margin-bottom: 10px;"><i class="fa-solid fa-circle-question"></i> Attenzione</h3>
            <p style="margin-bottom: 20px; font-size: 0.9rem; color: white;">${message}</p>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" style="flex: 1; margin: 0; padding: 12px;" onclick="this.closest('.alert-overlay').remove()">Annulla</button>
                <button class="btn-primary" style="flex: 1; margin: 0; padding: 12px; background: var(--danger); border-color: var(--danger);" id="confirmBtn">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => {
        overlay.remove();
        onConfirm();
    };
}
