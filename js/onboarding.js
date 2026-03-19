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
    const age = parseInt(document.getElementById('age').value);
    const genderRatio = parseFloat(document.getElementById('gender').value);

    // Creazione oggetto Utente
    const userProfile = {
        username: username,
        weight: weight,
        height: height,
        age: age,
        ratio: genderRatio, // Coefficiente di Widmark
        createdAt: new Date().toLocaleDateString()
    };

    // Salvataggio nel LocalStorage del browser
    localStorage.setItem('bevid0_user', JSON.stringify(userProfile));

    // Feedback visivo e reindirizzamento alla dashboard
    console.log("Profilo Creato:", userProfile);
    window.location.href = 'dashboard.html';
});