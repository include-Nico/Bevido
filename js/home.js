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
    if (!dobString) return "--"; // Fallback se manca la data
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    // Se il mese non è ancora arrivato, o se siamo nello stesso mese ma il giorno non è arrivato, togli 1 anno
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if(!currentUser) return window.location.href = 'index.html'; // Torna al login

    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    
    // Popola i dati in sola lettura (calcolando l'età attuale in tempo reale)
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    
    // Usa la data di nascita per mostrare l'età esatta, fallback se era salvato in versione vecchia
    const computedAge = currentUser.dob ? calculateAge(currentUser.dob) : (currentUser.age || "-");
    document.getElementById('dispAge').innerText = computedAge;

    // Popola i campi di input per la modifica
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editDob').value = currentUser.dob || "";
    document.getElementById('editGender').value = currentUser.ratio;
}

function toggleEditMode() {
    const viewDiv = document.getElementById('profileView');
    const editDiv = document.getElementById('profileEdit');
    
    if (viewDiv.style.display === 'none') {
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
    } else {
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
    }
}

function saveProfile() {
    // Aggiorna l'oggetto utente
    currentUser.weight = parseFloat(document.getElementById('editWeight').value);
    currentUser.height = parseFloat(document.getElementById('editHeight').value);
    currentUser.dob = document.getElementById('editDob').value; // Nuova acquisizione DOB
    currentUser.ratio = parseFloat(document.getElementById('editGender').value);

    // Salva nel LocalStorage
    localStorage.setItem('bevid0_user', JSON.stringify(currentUser));
    
    // Ricarica la vista
    loadUser();
    toggleEditMode();
}

// ==========================================
// 2. GESTIONE SERATA ATTIVA
// ==========================================
function checkActiveSession() {
    const activeSession = JSON.parse(localStorage.getItem('bevid0_active_session'));
    
    if (activeSession && activeSession.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display = 'none';
        
        let bac = activeSession.totalAlcoholGrams / (currentUser.weight * currentUser.ratio * activeSession.mealFactor);
        let totalMinutes = (bac / 0.15) * 60;
        let hours = Math.floor(totalMinutes / 60);
        let mins = Math.round(totalMinutes % 60);
        
        if (bac <= 0) {
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
        mealFactor: 1.0,
        mealName: "Sano",
        startTime: Date.now()
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
