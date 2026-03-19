/**
 * Gestione Onboarding B€V!D0
 */

// CONTROLLO ACCESSO PRECEDENTE ALL'AVVIO
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('bevid0_user');
    
    if(savedUser) {
        // Mostra il loader a tutto schermo
        document.getElementById('loadingScreen').style.display = 'flex';
        
        // Simula un caricamento di 1.5 secondi per l'animazione, poi reindirizza
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    }
});

// GESTIONE REGISTRAZIONE NUOVO UTENTE
document.getElementById('onboardingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Estrazione valori
    const username = document.getElementById('username').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const dob = document.getElementById('dob').value; 
    const genderRatio = parseFloat(document.getElementById('gender').value);

    // Creazione oggetto Utente
    const userProfile = {
        username: username,
        weight: weight,
        height: height,
        dob: dob, 
        ratio: genderRatio, 
        createdAt: new Date().toLocaleDateString()
    };

    // Salvataggio nel LocalStorage del browser
    localStorage.setItem('bevid0_user', JSON.stringify(userProfile));

    // Reindirizzamento all'HUB (Home) senza delay per i nuovi utenti
    window.location.href = 'home.html';
});
