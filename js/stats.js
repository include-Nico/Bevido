document.addEventListener('DOMContentLoaded', () => {
    renderStats();
});

function renderStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const container = document.getElementById('statsList');
    const noData = document.getElementById('noData');

    if (history.length === 0) {
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    
    // Mostriamo solo le ultime 10 serate per evitare liste infinite
    const recentHistory = history.reverse().slice(0, 10);

    container.innerHTML = recentHistory.map(entry => {
        // Separa la data e l'ora per la nuova grafica
        let parts = entry.date.split(', ');
        let day = parts[0] || entry.date;
        let time = parts[1] || ""; // Se l'orario non c'è, lascia vuoto

        return `
        <div class="stats-card">
            <div class="stats-date-box">
                <i class="fa-regular fa-calendar"></i>
                <div class="date-texts">
                    <strong>${day}</strong>
                    <span>${time}</span>
                </div>
            </div>
            <div class="stats-meal">
                <i class="fa-solid fa-utensils"></i> ${entry.mealType}
            </div>
            <div class="stats-value" style="color: ${getBacColor(entry.maxBac)}">
                ${entry.maxBac} <small>g/L</small>
            </div>
        </div>
        `;
    }).join('');
}

function getBacColor(val) {
    if (val < 0.5) return '#00e676';
    if (val < 1.5) return '#ffb400';
    return '#ff4b2b';
}

function clearHistory() {
    if(confirm("Vuoi davvero cancellare tutto lo storico? Questa azione è irreversibile.")) {
        localStorage.removeItem('bevid0_history');
        location.reload();
    }
}
