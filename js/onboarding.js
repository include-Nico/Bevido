/**
 * Gestione Onboarding B€V!D0
 * Salva i dati fisici dell'utente per i calcoli successivi
 */

document.getElementById('onboardingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Estrazione valori
    const username = document.getElementById('username').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const dob = document.getElementById('dob').value; // Recupero Data di Nascita
    const genderRatio = parseFloat(document.getElementById('gender').value);

    // Creazione oggetto Utente
    const userProfile = {
        username: username,
        weight: weight,
        height: height,
        dob: dob, // Salvato come stringa AAAA-MM-GG
        ratio: genderRatio, 
        createdAt: new Date().toLocaleDateString()
    };

    // Salvataggio nel LocalStorage del browser
    localStorage.setItem('bevid0_user', JSON.stringify(userProfile));

    // Reindirizzamento all'HUB (Home)
    window.location.href = 'home.html';
});
