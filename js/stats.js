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
    container.innerHTML = history.reverse().map(entry => `
        <div class="stats-card">
            <div class="stats-info">
                <strong>${entry.date}</strong>
                <span>Pasto: ${entry.mealType}</span>
            </div>
            <div class="stats-value" style="color: ${getBacColor(entry.maxBac)}">
                ${entry.maxBac} <small>g/L</small>
            </div>
        </div>
    `).join('');
}

function getBacColor(val) {
    if (val < 0.5) return '#00e676';
    if (val < 1.5) return '#ffb400';
    return '#ff4b2b';
}

function clearHistory() {
    if(confirm("Vuoi davvero cancellare tutto lo storico?")) {
        localStorage.removeItem('bevid0_history');
        location.reload();
    }
}