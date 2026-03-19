window.onload = () => {
    loadUser();
    checkActiveSession();
    calculateWeeklyStats();
    renderMemories();
    renderWeeklyChart();
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
// 2. GRAFICO SETTIMANALE INLINE
// ==========================================
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
                label: 'g/L',
                data: dataPoints,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#00d4ff',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid:  { color: 'rgba(255,255,255,0.05)' },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 4 },
                    grid:  { color: 'rgba(255,255,255,0.05)' },
                },
            },
        },
    });
}

// ==========================================
// 3. RICORDI — SALVATAGGIO
// ==========================================
function toggleMemoryModal() {
    const m = document.getElementById('memoryModal');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

document.getElementById('confirmSaveMemory').onclick = function () {
    const title = document.getElementById('memoryTitle').value.trim();
    const file  = document.getElementById('memoryImage').files[0];

    if (!title || !file) return alert("Inserisci un titolo e una foto!");

    // Snapshot della sessione al momento del salvataggio
    const active = JSON.parse(localStorage.getItem('bevid0_active_session')) || {};
    const bac    = calcBAC(active, currentUser);

    const reader = new FileReader();
    reader.onloadend = function () {
        const memory = {
            id:     Date.now(),
            title,
            image:  reader.result,
            date:   new Date().toLocaleDateString('it-IT'),
            // BAC calcolato al momento dello scatto
            bac:    bac.toFixed(2),
            // Copia della lista drink (può essere vuota)
            drinks: active.consumedDrinks ? [...active.consumedDrinks] : [],
        };

        let memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
        memories.unshift(memory);
        localStorage.setItem('bevid0_memories', JSON.stringify(memories));

        renderMemories();
        toggleMemoryModal();

        // Reset form
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryImage').value = '';
    };
    reader.readAsDataURL(file);
};

// ==========================================
// 3b. RICORDI — RENDER GALLERIA
// ==========================================
function bacColor(val) {
    const v = parseFloat(val);
    if (v < 0.5)  return '#00e676';
    if (v < 1.5)  return '#ffb400';
    return '#ff4b2b';
}

function renderMemories() {
    const memories  = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    const container = document.getElementById('memoryGallery');

    if (memories.length === 0) {
        container.innerHTML = `
            <p style="font-size:0.7rem; color:#94a3b8;">Nessun ricordo salvato.</p>`;
        return;
    }

    container.innerHTML = memories.map(m => {
        const hasBac = m.bac && parseFloat(m.bac) > 0;
        const color  = hasBac ? bacColor(m.bac) : null;
        return `
            <div class="memory-card" onclick="openMemoryDetail(${m.id})">
                <img src="${m.image}" alt="${m.title}">
                <div class="memory-info">
                    <strong>${m.title}</strong>
                    <span>${m.date}</span>
                </div>
                ${hasBac ? `
                    <div class="memory-bac-chip"
                         style="background:${color}22; color:${color}; border:1px solid ${color}55;">
                        ${m.bac} g/L
                    </div>` : ''}
            </div>`;
    }).join('');
}

// ==========================================
// 3c. RICORDI — MODAL DETTAGLIO
// ==========================================
function openMemoryDetail(id) {
    const memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    const m = memories.find(x => x.id === id);
    if (!m) return;

    // Immagine, titolo, data
    document.getElementById('detailImage').src           = m.image;
    document.getElementById('detailTitle').innerText     = m.title;
    document.getElementById('detailDate').innerText      = m.date;

    // Badge BAC
    const bac   = m.bac || '0.00';
    const color = bacColor(bac);
    const badge = document.getElementById('detailBacBadge');
    document.getElementById('detailBac').innerText = bac;
    badge.style.background  = color + '22';
    badge.style.color       = color;
    badge.style.borderColor = color + '66';

    // Lista drink: raggruppa drink identici per nome
    const drinkContainer = document.getElementById('detailDrinkList');
    const drinks = m.drinks || [];

    if (drinks.length === 0) {
        drinkContainer.innerHTML = `
            <p style="font-size:0.8rem; color:#94a3b8; text-align:center; padding:10px 0;">
                Nessun drink registrato per questa serata.
            </p>`;
    } else {
        // Raggruppa drink con lo stesso nome
        const grouped = {};
        drinks.forEach(d => {
            if (!grouped[d.name]) grouped[d.name] = { ...d, count: 0 };
            grouped[d.name].count++;
        });

        drinkContainer.innerHTML = Object.values(grouped).map(d => `
            <div class="memory-drink-item">
                <div class="memory-drink-info">
                    <strong>${d.name}</strong>
                    <span>${d.ml}ml &middot; ${d.abv}%</span>
                </div>
                ${d.count > 1
                    ? `<span class="memory-drink-count">×${d.count}</span>`
                    : ''}
            </div>`
        ).join('');
    }

    // Collega il bottone elimina all'id corretto
    document.getElementById('detailDeleteBtn').onclick = () => deleteMemory(id);

    document.getElementById('memoryDetailModal').style.display = 'flex';
}

function closeMemoryDetail() {
    document.getElementById('memoryDetailModal').style.display = 'none';
}

function deleteMemory(id) {
    let memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    memories = memories.filter(m => m.id !== id);
    localStorage.setItem('bevid0_memories', JSON.stringify(memories));
    closeMemoryDetail();
    renderMemories();
}

// ==========================================
// 4. SESSIONE ATTIVA — CALCOLO BAC E TIMER
// ==========================================
function calcBAC(active, user) {
    if (!active || !active.totalAlcoholGrams || !user) return 0;
    const age = calculateAge(user.dob) || 25;   // fallback numerico sicuro

    let tbw;
    if (parseFloat(user.ratio) > 0.6) {
        tbw = 2.447 - (0.09156 * age) + (0.1074 * user.height) + (0.3362 * user.weight);
    } else {
        tbw = -2.097 + (0.1069 * user.height) + (0.2466 * user.weight);
    }

    const r          = (tbw / user.weight) * 0.8;
    const mealFactor = active.mealFactor || 0.9;
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
    // Mantenuto per compatibilità — il grafico inline sostituisce i contatori
}
