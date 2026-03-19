window.onload = () => {
    const user = JSON.parse(localStorage.getItem('bevid0_user'));
    if(!user) return window.location.href = 'index.html'; // Torna al login se non esiste
    
    document.getElementById('homeWelcome').innerText = `Ciao, ${user.username}!`;

    // Controlla se c'è una giornata attiva in memoria
    const activeSession = JSON.parse(localStorage.getItem('bevid0_active_session'));
    
    if (activeSession && activeSession.totalAlcoholGrams > 0) {
        document.getElementById('activeSessionCard').style.display = 'block';
        document.getElementById('newSessionCard').style.display = 'none';
        
        // Calcola il BAC corrente e il timer da mostrare in Home
        let bac = activeSession.totalAlcoholGrams / (user.weight * user.ratio * activeSession.mealFactor);
        let totalMinutes = (bac / 0.15) * 60;
        let hours = Math.floor(totalMinutes / 60);
        let mins = Math.round(totalMinutes % 60);
        
        document.getElementById('homeTimer').innerText = `${hours}h ${mins}m`;
    } else {
        document.getElementById('activeSessionCard').style.display = 'none';
        document.getElementById('newSessionCard').style.display = 'block';
    }
};

function startNewSession() {
    // Inizializza una nuova giornata pulita
    localStorage.setItem('bevid0_active_session', JSON.stringify({
        totalAlcoholGrams: 0,
        mealFactor: 1.0,
        mealName: "Sano"
    }));
    window.location.href = 'dashboard.html';
}
