window.onload = () => {
    loadUser();
    checkActiveSession();
    calculateWeeklyStats();
    renderMemories();
};

let currentUser = null;
let myChart = null;

// ==========================================
// 1. GESTIONE UTENTE E PROFILO
// ==========================================
function calculateAge(dobString) {
    if (!dobString) return "--"; 
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if(!currentUser) return window.location.href = 'index.html'; 
    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    document.getElementById('dispAge').innerText = currentUser.dob ? calculateAge(currentUser.dob) : "--";
    
    // Popola input modal
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editDob').value = currentUser.dob || "";
}

function toggleEditMode() {
    const m = document.getElementById('profileEditModal');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

function saveProfile() {
    currentUser.weight = parseFloat(document.getElementById('editWeight').value);
    currentUser.height = parseFloat(document.getElementById('editHeight').value);
    currentUser.dob = document.getElementById('editDob').value;
    localStorage.setItem('bevid0_user', JSON.stringify(currentUser));
    loadUser(); toggleEditMode();
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
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const dataPoints = new Array(7).fill(0);
    const labels = [];
    
    const today = new Date();
    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(days[d.getDay()]);
        
        const dateStr = d.toLocaleDateString('it-IT');
        const session = history.find(s => s.date.startsWith(dateStr));
        if(session) dataPoints[6-i] = parseFloat(session.maxBac);
    }

    if(myChart) myChart.destroy();
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Picco g/L',
                data: dataPoints,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } } }
        }
    });
}

// ==========================================
// 3. SEZIONE RICORDI (SALVATI)
// ==========================================
function toggleMemoryModal() {
    const m = document.getElementById('memoryModal');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

document.getElementById('confirmSaveMemory').onclick = function() {
    const title = document.getElementById('memoryTitle').value;
    const file = document.getElementById('memoryImage').files[0];
    const activeSession = JSON.parse(localStorage.getItem('bevid0_active_session'));

    if(!title || !file) return alert("Inserisci un titolo e una foto!");

    const reader = new FileReader();
    reader.onloadend = function() {
        const memory = {
            id: Date.now(),
            title: title,
            image: reader.result,
            date: new Date().toLocaleDateString('it-IT'),
            bac: document.getElementById('homeTimer').innerText
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
    const memories = JSON.parse(localStorage.getItem('bevid0_memories')) || [];
    const container = document.getElementById('memoryGallery');
    
    if(memories.length === 0) {
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
// 4. STATO SESSIONE & CALCOLI
// ==========================================
function checkActiveSession() {
    const active = JSON.parse(localStorage.getItem('bevid0_active_session'));
    if (active && active.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display = 'none';
        
        let age = calculateAge(currentUser.dob) || 25;
        let tbw = (currentUser.ratio > 0.6) ? 
            2.447 - (0.09156 * age) + (0.1074 * currentUser.height) + (0.3362 * currentUser.weight) :
            -2.097 + (0.1069 * currentUser.height) + (0.2466 * currentUser.weight);
        
        let bac = (active.totalAlcoholGrams / (currentUser.weight * (tbw/currentUser.weight * 0.8))) * active.mealFactor;
        let mins = (bac / 0.15) * 60;
        document.getElementById('homeTimer').innerText = `${Math.floor(mins/60)}h ${Math.round(mins%60)}m`;
    }
}

function startNewSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify({totalAlcoholGrams:0, mealFactor:0.9, mealName:"Sano", consumedDrinks:[]}));
    window.location.href = 'dashboard.html';
}

function calculateWeeklyStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    document.getElementById('weekCount').innerText = history.filter(s => {
        const d = new Date(s.date.split(',')[0].split('/').reverse().join('-'));
        return (new Date() - d) / (1000*60*60*24) <= 7;
    }).length;
    
    let max = Math.max(...history.map(s => parseFloat(s.maxBac)), 0);
    document.getElementById('weekMax').innerText = max.toFixed(2);
}
