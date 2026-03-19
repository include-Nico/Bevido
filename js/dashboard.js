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

// Nuova struttura Active Session con Array dei Drink Bevuti
let activeSession = JSON.parse(localStorage.getItem('bevid0_active_session')) || { 
    totalAlcoholGrams: 0, 
    mealFactor: 1.0, 
    mealName: "Sano",
    consumedDrinks: [] // ARRAY DRINK
};

// Se c'è una vecchia sessione salvata senza l'array consumedDrinks, lo creiamo per non far crashare l'app
if(!activeSession.consumedDrinks) activeSession.consumedDrinks = [];

window.onload = () => {
    if(!currentUser) window.location.href = 'index.html';
    renderDrinks(drinksDB);
    
    // Ripristina pasto
    document.querySelectorAll('.meal-btn').forEach(btn => {
        if(btn.querySelector('span').innerText === activeSession.mealName) {
            btn.classList.add('active');
        }
    });

    calculateBAC();
    updateDrinkCounter();
};

function saveActiveSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify(activeSession));
}

// ==========================================
// AGGIUNTA E RIMOZIONE DRINK SINGOLI
// ==========================================
function addDrink(name, abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8;
    
    // Salva il drink nell'array con l'orario
    const timeNow = new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});
    activeSession.consumedDrinks.push({ name: name, abv: abv, ml: ml, grams: grams, time: timeNow });
    
    activeSession.totalAlcoholGrams += grams;
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

function removeDrink(index) {
    // Rimuovi dall'array
    const removedDrink = activeSession.consumedDrinks.splice(index, 1)[0];
    
    // Sottrai i grammi
    activeSession.totalAlcoholGrams -= removedDrink.grams;
    if(activeSession.totalAlcoholGrams < 0) activeSession.totalAlcoholGrams = 0; // Sicurezza
    
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

// ==========================================
// UI DRINK CONSUMATI
// ==========================================
function updateDrinkCounter() {
    document.getElementById('drinkCounter').innerText = activeSession.consumedDrinks.length;
}

function renderConsumedDrinks() {
    const container = document.getElementById('consumedList');
    
    if(activeSession.consumedDrinks.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.8rem; padding: 20px 0;">Non hai ancora bevuto nulla.</p>`;
        return;
    }

    // Mostriamo i drink dal più recente al più vecchio
    let html = '';
    for(let i = activeSession.consumedDrinks.length - 1; i >= 0; i--) {
        let d = activeSession.consumedDrinks[i];
        html += `
            <div class="consumed-drink-item">
                <div class="consumed-drink-info">
                    <strong>${d.name}</strong>
                    <span>${d.ml}ml - ${d.abv}% | <i class="fa-regular fa-clock"></i> ${d.time}</span>
                </div>
                <button class="delete-single-btn" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="removeDrink(${i})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }
    container.innerHTML = html;
}

function toggleConsumedModal() {
    const modal = document.getElementById('consumedModal');
    if (modal.style.display === "none") {
        renderConsumedDrinks(); // Aggiorna lista quando apri
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}

// ==========================================
// CALCOLI E GESTIONE PASTO
// ==========================================
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

// ==========================================
// RICERCA E RENDER DRINK DB
// ==========================================
function renderDrinks(list) {
    const container = document.getElementById('drinkList');
    container.innerHTML = list.map(drink => {
        // Fix per gli apici nei nomi dei drink (es. "Jack Daniel's")
        let safeName = drink.name.replace(/'/g, "\\'");
        return `
        <div class="drink-card" onclick="addDrink('${safeName}', ${drink.abv}, ${drink.ml})">
            ${drink.name} <br> <small>${drink.abv}% | ${drink.ml}ml</small>
        </div>
        `;
    }).join('');
}

function filterDrinks() {
    const term = document.getElementById('drinkSearch').value.toLowerCase();
    const filtered = drinksDB.filter(d => d.name.toLowerCase().includes(term));
    renderDrinks(filtered);
}

// ==========================================
// CHIUSURA E POPUP
// ==========================================
function concludeSession() {
    let currentBac = document.getElementById('bacValue').innerText;
    
    customConfirm("Vuoi concludere questa giornata e salvarla nello storico?", () => {
        let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
        
        let now = new Date();
        let dateString = now.toLocaleDateString('it-IT') + ", " + now.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});

        history.push({
            date: dateString,
            maxBac: currentBac,
            mealType: activeSession.mealName
        });
        localStorage.setItem('bevid0_history', JSON.stringify(history));
        
        localStorage.removeItem('bevid0_active_session');
        window.location.href = 'home.html';
    });
}

function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal.style.display === "none") {
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}

function customConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.innerHTML = `
        <div class="glass-container modal-content alert-box" style="animation: slideUp 0.3s ease-out; max-width: 320px;">
            <h3 style="color: var(--primary); margin-bottom: 10px;"><i class="fa-solid fa-flag-checkered"></i> Fine Serata</h3>
            <p style="margin-bottom: 20px; font-size: 0.9rem; color: white;">${message}</p>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" style="flex: 1; margin: 0; padding: 12px;" onclick="this.closest('.alert-overlay').remove()">Annulla</button>
                <button class="btn-primary" style="flex: 1; margin: 0; padding: 12px;" id="confirmBtn">Vai alla Home</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => {
        overlay.remove();
        onConfirm();
    };
}
