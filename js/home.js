// Eseguito al caricamento della pagina
window.onload = () => {
    loadUser();
    checkActiveSession();
    calculateWeeklyStats();
};

let currentUser = null;

// ==========================================
// 1. GESTIONE UTENTE E CALCOLO ETÀ
// ==========================================
function calculateAge(dobString) {
    if (!dobString) return "--"; 
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if(!currentUser) return window.location.href = 'index.html'; 

    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    
    // Popola i dati in sola lettura
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    
    const computedAge = currentUser.dob ? calculateAge(currentUser.dob) : (currentUser.age || "-");
    document.getElementById('dispAge').innerText = computedAge;

    // Popola i campi di input nel Modal per la modifica
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editDob').value = currentUser.dob || "";
    document.getElementById('editGender').value = currentUser.ratio;
}

function toggleEditMode() {
    const modal = document.getElementById('profileEditModal');
    if (modal.style.display === 'none') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function saveProfile() {
    currentUser.weight = parseFloat(document.getElementById('editWeight').value);
    currentUser.height = parseFloat(document.getElementById('editHeight').value);
    currentUser.dob = document.getElementById('editDob').value; 
    currentUser.ratio = parseFloat(document.getElementById('editGender').value);

    localStorage.setItem('bevid0_user', JSON.stringify(currentUser));
    
    loadUser();
    toggleEditMode(); // Chiude il modal
    customAlert("Dati aggiornati con successo!");
}

// ==========================================
// 2. GESTIONE SERATA ATTIVA
// ==========================================
function checkActiveSession() {
    const activeSession = JSON.parse(localStorage.getItem('bevid0_active_session'));
    
    if (activeSession && activeSession.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display = 'none';
        
        let tbw = 0;
        let age = calculateAge(currentUser.dob) || 25;
        if (currentUser.ratio > 0.6) { 
            tbw = 2.447 - (0.09156 * age) + (0.1074 * currentUser.height) + (0.3362 * currentUser.weight);
        } else { 
            tbw = -2.097 + (0.1069 * currentUser.height) + (0.2466 * currentUser.weight);
        }
        let r = (tbw / currentUser.weight) * 0.8;
        
        let rawBac = (activeSession.totalAlcoholGrams / (currentUser.weight * r));
        let bac = rawBac * activeSession.mealFactor;
        
        let totalMinutes = (bac / 0.15) * 60;
        let hours = Math.floor(totalMinutes / 60);
        let mins = Math.round(totalMinutes % 60);
        
        if (bac <= 0 || isNaN(bac)) {
            document.getElementById('homeTimer').innerText = `0h 0m`;
        } else {
            document.getElementById('homeTimer').innerText = `${hours}h ${mins}m`;
        }
    } else {
        document.getElementById('activeSessionCard').style.display = 'none';
        document.getElementById('newSessionCard').style.display = 'block';
    }
}

function startNewSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify({
        totalAlcoholGrams: 0,
        mealFactor: 0.9,
        mealName: "Sano",
        startTime: Date.now(),
        consumedDrinks: []
    }));
    window.location.href = 'dashboard.html';
}

// ==========================================
// 3. STATISTICHE SETTIMANALI
// ==========================================
function calculateWeeklyStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let weekCount = 0;
    let weekMaxBac = 0.0;

    history.forEach(session => {
        const sessionParts = session.date.split(',')[0].split('/'); 
        if(sessionParts.length === 3) {
            const sessionDate = new Date(sessionParts[2], sessionParts[1] - 1, sessionParts[0]);
            
            if (sessionDate >= sevenDaysAgo) {
                weekCount++;
                let bacVal = parseFloat(session.maxBac);
                if (bacVal > weekMaxBac) weekMaxBac = bacVal;
            }
        }
    });

    document.getElementById('weekCount').innerText = weekCount;
    document.getElementById('weekMax').innerText = weekMaxBac.toFixed(2);
}

// ==========================================
// 4. POPUP CUSTOM ALERTS
// ==========================================
function customAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.innerHTML = `
        <div class="glass-container modal-content alert-box" style="animation: slideUp 0.3s ease-out; max-width: 320px;">
            <h3 style="color: var(--success); margin-bottom: 10px;"><i class="fa-solid fa-check-circle"></i> Fatto!</h3>
            <p style="margin-bottom: 20px; font-size: 0.9rem; color: white;">${message}</p>
            <button class="btn-primary" style="margin: 0; padding: 12px; width: 100%;" onclick="this.closest('.alert-overlay').remove()">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
}
