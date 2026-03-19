const drinksDB = [
    { name: "Birra Media", abv: 5, ml: 400 },
    { name: "Vino Rosso", abv: 12, ml: 150 },
    { name: "Gin Lemon", abv: 40, ml: 150 },
    { name: "Spritz", abv: 11, ml: 200 },
    { name: "Shot Tequila", abv: 40, ml: 30 },
    { name: "Negroni", abv: 28, ml: 90 },
    { name: "Mojito", abv: 15, ml: 200 },
    { name: "Vodka Redbull", abv: 40, ml: 200 }
];

let currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
let activeSession = JSON.parse(localStorage.getItem('bevid0_active_session')) || { totalAlcoholGrams: 0, mealFactor: 1.0, mealName: "Sano" };

window.onload = () => {
    if(!currentUser) window.location.href = 'index.html';
    renderDrinks(drinksDB);
    
    // Ripristina la selezione del pasto attiva
    document.querySelectorAll('.meal-btn').forEach(btn => {
        if(btn.querySelector('span').innerText === activeSession.mealName) {
            btn.classList.add('active');
        }
    });

    calculateBAC(); // Calcola basandosi sui dati salvati della sessione
};

function saveActiveSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify(activeSession));
}

function addDrink(abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8;
    activeSession.totalAlcoholGrams += grams;
    saveActiveSession();
    calculateBAC();
}

function setMeal(name, factor) {
    activeSession.mealFactor = factor;
    activeSession.mealName = name;
    saveActiveSession();

    const warning = document.getElementById('mealWarning');
    document.querySelectorAll('.meal-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(name === 'Digiuno') {
        warning.innerHTML = "⚠️ <strong>Attenzione:</strong> Bere a stomaco vuoto è pericoloso.";
        warning.style.color = "#ff4b2b";
    } else {
        warning.innerText = "Ottima scelta, mangiare aiuta a gestire l'alcol.";
        warning.style.color = "#94a3b8";
    }
    calculateBAC();
}

function calculateBAC() {
    let bac = activeSession.totalAlcoholGrams / (currentUser.weight * currentUser.ratio * activeSession.mealFactor);
    updateGauge(bac.toFixed(2));
}

function updateGauge(value) {
    const bacElement = document.getElementById('bacValue');
    const progress = document.getElementById('gaugeProgress');
    const statusText = document.getElementById('statusText');
    const burnTimeSpan = document.querySelector('#burnTime span');
    
    bacElement.innerText = value;
    
    let percentage = Math.min(value, 4.0) / 4.0;
    progress.style.strokeDashoffset = 251.32 - (percentage * 251.32);

    if(value > 0) {
        let totalMinutes = (value / 0.15) * 60;
        let hours = Math.floor(totalMinutes / 60);
        let mins = Math.round(totalMinutes % 60);
        burnTimeSpan.innerText = `${hours}h ${mins}m`;
    } else {
        burnTimeSpan.innerText = "0h 0m";
    }

    if(value < 0.5) {
        progress.style.stroke = "#00e676"; statusText.innerText = "Livello: OK";
    } else if (value < 1.5) {
        progress.style.stroke = "#ffb400"; statusText.innerText = "Livello: SBRONZO";
    } else {
        progress.style.stroke = "#ff4b2b"; statusText.innerText = "Livello: UBRIACO";
    }
}

function renderDrinks(list) {
    const container = document.getElementById('drinkList');
    container.innerHTML = list.map(drink => `
        <div class="drink-card" onclick="addDrink(${drink.abv}, ${drink.ml})">
            ${drink.name} <br> <small>${drink.abv}% | ${drink.ml}ml</small>
        </div>
    `).join('');
}

function filterDrinks() {
    const term = document.getElementById('drinkSearch').value.toLowerCase();
    const filtered = drinksDB.filter(d => d.name.toLowerCase().includes(term));
    renderDrinks(filtered);
}

// NUOVA FUNZIONE: Concludi la Giornata
// NUOVA FUNZIONE: Concludi la Giornata (Senza Secondi)
function concludeSession() {
    let currentBac = document.getElementById('bacValue').innerText;
    if(confirm("Vuoi concludere questa giornata e salvarla nello storico?")) {
        let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
        
        // Formattazione data precisa: es. "15/08/2023, 23:45"
        let now = new Date();
        let dateString = now.toLocaleDateString('it-IT') + ", " + now.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});

        history.push({
            date: dateString,
            maxBac: currentBac,
            mealType: activeSession.mealName
        });
        localStorage.setItem('bevid0_history', JSON.stringify(history));
        
        // Cancella la sessione attiva
        localStorage.removeItem('bevid0_active_session');
        
        // Torna alla home
        window.location.href = 'home.html';
    }
}

// Modal Info Pasti
function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal.style.display === "none") {
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}
