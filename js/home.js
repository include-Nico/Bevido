window.onload = () => {
    loadUser();
    checkActiveSession();
    renderMemories();
    renderWeeklyChart();
};

let currentUser = null;
let myChart = null;

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if (!currentUser) return window.location.href = 'index.html';
    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    document.getElementById('dispAge').innerText = calculateAge(currentUser.dob) || "--";
}

function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
    return age;
}

function checkActiveSession() {
    const active = JSON.parse(localStorage.getItem('bevid0_active_session'));
    const cardActive = document.getElementById('activeSessionCard');
    const cardNew = document.getElementById('newSessionCard');

    if (active && active.consumedDrinks.length > 0) {
        cardActive.style.display = 'block';
        cardNew.style.display = 'none';

        const updateHomeTimer = () => {
            const freshActive = JSON.parse(localStorage.getItem('bevid0_active_session'));
            if (!freshActive) return;
            const currentBac = calcBAC(freshActive, currentUser);
            const minsToZero = (currentBac / 0.15) * 60;
            document.getElementById('homeTimer').innerText = formatTime(minsToZero);
            
            if (currentBac <= 0 && freshActive.consumedDrinks.length > 0) {
                // Opzionale: gestire fine sessione automatica se smaltito tutto
            }
        };

        updateHomeTimer();
        setInterval(updateHomeTimer, 1000);
    } else {
        cardActive.style.display = 'none';
        cardNew.style.display = 'block';
    }
}

function calcBAC(active, user) {
    if (!active || active.totalAlcoholGrams <= 0 || !user) return 0;
    const age = calculateAge(user.dob) || 25;
    let tbw = (user.ratio > 0.6) 
        ? 2.447 - (0.09156 * age) + (0.1074 * user.height) + (0.3362 * user.weight)
        : -2.097 + (0.1069 * user.height) + (0.2466 * user.weight);
    
    const r = (tbw / user.weight) * 0.8;
    const peakBac = (active.totalAlcoholGrams / (user.weight * r)) * (active.mealFactor || 0.9);
    
    if (active.startTime) {
        const elapsedHours = (Date.now() - active.startTime) / (1000 * 60 * 60);
        return Math.max(0, peakBac - (0.15 * elapsedHours));
    }
    return peakBac;
}

function formatTime(totalMins) {
    if (totalMins <= 0) return "0h 0m 0s";
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    const s = Math.floor((totalMins * 60) % 60);
    return `${h}h ${m}m ${s}s`;
}

function startNewSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify({
        totalAlcoholGrams: 0,
        mealFactor: 0.9,
        mealName: "Sano",
        consumedDrinks: [],
        startTime: null
    }));
    window.location.href = 'dashboard.html';
}

// Funzioni per Grafico e Ricordi (rimaste invariate ma incluse per completezza)
function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart')?.getContext('2d');
    if (!ctx) return;
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const labels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const data = new Array(7).fill(0); // Logica semplificata per esempio

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'g/L Max',
                data: data,
                borderColor: '#00d4ff',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 212, 255, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderMemories() {
    const memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    const container = document.getElementById('memoryGallery');
    if (!container) return;
    if (memories.length === 0) {
        container.innerHTML = `<p style="font-size:0.7rem; color:#94a3b8;">Nessun ricordo.</p>`;
        return;
    }
    container.innerHTML = memories.map(m => `
        <div class="memory-card">
            <img src="${m.image}" alt="Ricordo">
            <div class="memory-info"><strong>${m.title}</strong><span>${m.date}</span></div>
        </div>`).join('');
}
