window.onload = () => {
    loadUser();
    checkActiveSession();
    renderMemories();
    renderWeeklyChart();
};

let currentUser = null;
let myChart = null;

function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
    if (!currentUser) return window.location.href = 'index.html';

    document.getElementById('homeWelcome').innerText = `Ciao, ${currentUser.username}!`;
    document.getElementById('dispWeight').innerText = currentUser.weight;
    document.getElementById('dispHeight').innerText = currentUser.height;
    
    const age = calculateAge(currentUser.dob);
    document.getElementById('dispAge').innerText = age !== null ? age : "--";

    // Setup Edit form
    document.getElementById('editWeight').value = currentUser.weight;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editDob').value = currentUser.dob || "";
}

function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function checkActiveSession() {
    const active = JSON.parse(localStorage.getItem('bevid0_active_session'));
    const activeCard = document.getElementById('activeSessionCard');
    const newCard = document.getElementById('newSessionCard');

    if (active && active.totalAlcoholGrams > 0) {
        activeCard.style.display = 'block';
        newCard.style.display = 'none';

        const updateTimer = () => {
            const freshActive = JSON.parse(localStorage.getItem('bevid0_active_session'));
            if (!freshActive) return;

            const currentBac = calcBAC(freshActive, currentUser);
            const minsToZero = (currentBac / 0.15) * 60;
            
            // Aggiorna interfaccia con i secondi
            document.getElementById('homeTimer').innerText = formatTime(minsToZero);
        };

        updateTimer();
        setInterval(updateTimer, 1000); // 1000 ms per far scorrere i secondi!

    } else {
        activeCard.style.display = 'none';
        newCard.style.display = 'block';
    }
}

function calcBAC(active, user) {
    if (!active || active.totalAlcoholGrams <= 0 || !user) return 0;
    
    const age = calculateAge(user.dob) || 25;
    let tbw = 0;

    if (parseFloat(user.ratio) > 0.6) {
        tbw = 2.447 - (0.09156 * age) + (0.1074 * user.height) + (0.3362 * user.weight);
    } else {
        tbw = -2.097 + (0.1069 * user.height) + (0.2466 * user.weight);
    }

    const r = (tbw / user.weight) * 0.8;
    const peakBac = (active.totalAlcoholGrams / (user.weight * r)) * (active.mealFactor || 0.9);

    if (active.startTime) {
        const elapsedHours = (Date.now() - active.startTime) / (1000 * 60 * 60);
        return Math.max(0, peakBac - (0.15 * elapsedHours));
    }
    return peakBac;
}

function formatTime(totalMins) {
    if (totalMins <= 0) return "0h 0m 0s";
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    const s = Math.floor((totalMins * 60) % 60);
    return `${h}h ${m}m ${s}s`;
}

function startNewSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify({
        totalAlcoholGrams: 0,
        mealFactor: 0.9,
        mealName: "Sano",
        consumedDrinks: [],
        startTime: null
    }));
    window.location.href = 'dashboard.html';
}

// (Le altre funzioni renderMemories, renderWeeklyChart mantengono la loro logica)
