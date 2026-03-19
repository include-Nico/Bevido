// Eseguito al caricamento della pagina
window.onload = () => {
    loadUser();
    checkActiveSession();
    calculateWeeklyStats();
};

let currentUser = null;

// ==========================================
// 1. GESTIONE UTENTE E PROFILO
// ==========================================
function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if(!currentUser) return window.location.href = 'index.html'; // Se non c'è, torna al login

    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    
    // Popola i dati in sola lettura
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    document.getElementById('dispAge').innerText = currentUser.age;

    // Popola i campi di input per la modifica
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editAge').value = currentUser.age;
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
    currentUser.age = parseInt(document.getElementById('editAge').value);
    currentUser.ratio = parseFloat(document.getElementById('editGender').value);

    // Salva nel LocalStorage
    localStorage.setItem('bevid0_user', JSON.stringify(currentUser));
    
    // Ricarica la vista
    loadUser();
    toggleEditMode();
    alert("Dati aggiornati con successo! I prossimi drink useranno questi valori.");
}

// ==========================================
// 2. GESTIONE SERATA ATTIVA
// ==========================================
function checkActiveSession() {
    const activeSession = JSON.parse(localStorage.getItem('bevid0_active_session'));
    
    if (activeSession && activeSession.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display = 'none';
        
        // Calcola BAC e Timer
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
        startTime: Date.now() // Salviamo l'orario di inizio per calcolare la durata in futuro!
    }));
    window.location.href = 'dashboard.html';
}

// ==========================================
// 3. STATISTICHE SETTIMANALI
// ==========================================
function calculateWeeklyStats() {
    const history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    
    // Otteniamo la data di 7 giorni fa
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let weekCount = 0;
    let weekMaxBac = 0.0;

    history.forEach(session => {
        // Converte la stringa data salvata in oggetto Date
        // Nota: Assumiamo formato "DD/MM/YYYY, HH:mm:ss" di toLocaleString()
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
