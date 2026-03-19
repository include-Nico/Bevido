window.onload = () => {
    loadUser();
    checkActiveSession();
    calculateWeeklyStats();
    renderMemories();
};

let currentUser = null;
let myChart     = null;

// ==========================================
// 1. GESTIONE UTENTE E PROFILO
// ==========================================
function calculateAge(dobString) {
    if (!dobString) return null;
    const dob   = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if (!currentUser) return window.location.href = 'index.html';

    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    document.getElementById('dispWeight').innerText  = currentUser.weight;
    document.getElementById('dispHeight').innerText  = currentUser.height;

    const age = calculateAge(currentUser.dob);
    document.getElementById('dispAge').innerText = age !== null ? age : "--";

    // Popola input modal modifica profilo
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editDob').value    = currentUser.dob || "";
}

function toggleEditMode() {
    const m = document.getElementById('profileEditModal');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

function saveProfile() {
    currentUser.weight = parseFloat(document.getElementById('editWeight').value);
    currentUser.height = parseFloat(document.getElementById('editHeight').value);
    currentUser.dob    = document.getElementById('editDob').value;
    localStorage.setItem('bevid0_user', JSON.stringify(currentUser));
    loadUser();
    toggleEditMode();
}

// ==========================================
// 2. GRAFICO SETTIMANALE
// ==========================================
function toggleChart() {
    const modal = document.getElementById('chartModal');
    if (modal.style.display === 'none') {
        modal.style.display = 'flex';
        renderWeeklyChart();
    } else {
        modal.style.display = 'none';
    }
}

function renderWeeklyChart() {
    const history    = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const days       = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const dataPoints = new Array(7).fill(0);
    const labels     = [];
    const today      = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(days[d.getDay()]);

        const dateStr = d.toLocaleDateString('it-IT');
        const session = history.find(s => s.date.startsWith(dateStr));
        if (session) dataPoints[6 - i] = parseFloat(session.maxBac);
    }

    if (myChart) myChart.destroy();
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Picco g/L',
                data: dataPoints,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                fill: true,
                tension: 0.4,
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
            },
        },
    });
}

// ==========================================
// 3. SEZIONE RICORDI
// ==========================================
function toggleMemoryModal() {
    const m = document.getElementById('memoryModal');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

document.getElementById('confirmSaveMemory').onclick = function () {
    const title = document.getElementById('memoryTitle').value;
    const file  = document.getElementById('memoryImage').files[0];

    if (!title || !file) return alert("Inserisci un titolo e una foto!");

    const reader = new FileReader();
    reader.onloadend = function () {
        const memory = {
            id:    Date.now(),
            title,
            image: reader.result,
            date:  new Date().toLocaleDateString('it-IT'),
            bac:   document.getElementById('homeTimer').innerText,
        };

        let memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
        memories.unshift(memory);
        localStorage.setItem('bevid0_memories', JSON.stringify(memories));

        renderMemories();
        toggleMemoryModal();
    };
    reader.readAsDataURL(file);
};

function renderMemories() {
    const memories  = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    const container = document.getElementById('memoryGallery');

    if (memories.length === 0) {
        container.innerHTML = `<p style="font-size:0.7rem; color:#94a3b8;">Nessun ricordo salvato.</p>`;
        return;
    }

    container.innerHTML = memories.map(m => `
        <div class="memory-card">
            <img src="${m.image}">
            <div class="memory-info">
                <strong>${m.title}</strong>
                <span>${m.date}</span>
            </div>
            <button class="del-mem" onclick="deleteMemory(${m.id})">×</button>
        </div>
    `).join('');
}

function deleteMemory(id) {
    let memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    memories = memories.filter(m => m.id !== id);
    localStorage.setItem('bevid0_memories', JSON.stringify(memories));
    renderMemories();
}

// ==========================================
// 4. STATO SESSIONE ATTIVA & TIMER RECUPERO
// ==========================================
function calcBAC(active, user) {
    // Usa la stessa formula Watson + Widmark di dashboard.js
    const age = calculateAge(user.dob) || 25;       // fallback numerico sicuro

    let tbw;
    if (parseFloat(user.ratio) > 0.6) {
        tbw = 2.447 - (0.09156 * age) + (0.1074 * user.height) + (0.3362 * user.weight);
    } else {
        tbw = -2.097 + (0.1069 * user.height) + (0.2466 * user.weight);
    }

    const r          = (tbw / user.weight) * 0.8;
    const mealFactor = active.mealFactor || 0.9;     // fallback se mancante
    const bac        = (active.totalAlcoholGrams / (user.weight * r)) * mealFactor;

    return isNaN(bac) || bac < 0 ? 0 : bac;
}

function formatTime(totalMins) {
    if (totalMins <= 0) return "0h 0m";
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    return `${h}h ${m}m`;
}

function checkActiveSession() {
    const active = JSON.parse(localStorage.getItem('bevid0_active_session'));

    if (active && active.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display    = 'none';

        const bac  = calcBAC(active, currentUser);
        const mins = (bac / 0.15) * 60;

        document.getElementById('homeTimer').innerText = formatTime(mins);
    } else {
        // Nessuna sessione attiva o ancora nessun drink — mostra il bottone Inizia
        document.getElementById('activeSessionCard').style.display = 'none';
        document.getElementById('newSessionCard').style.display    = 'block';
    }
}

function startNewSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify({
        totalAlcoholGrams: 0,
        mealFactor:        0.9,
        mealName:          "Sano",
        consumedDrinks:    [],
    }));
    window.location.href = 'dashboard.html';
}

// ==========================================
// 5. STATISTICHE SETTIMANALI
// ==========================================
function calculateWeeklyStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];

    const weekCount = history.filter(s => {
        const d = new Date(s.date.split(',')[0].split('/').reverse().join('-'));
        return (new Date() - d) / (1000 * 60 * 60 * 24) <= 7;
    }).length;

    document.getElementById('weekCount').innerText = weekCount;

    const max = Math.max(...history.map(s => parseFloat(s.maxBac)), 0);
    document.getElementById('weekMax').innerText = max.toFixed(2);
}
