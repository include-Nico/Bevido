// ==========================================
// DATABASE DRINK AVANZATO
// ==========================================
const drinksDB = [
    { name: "Birra chiara (Piccola)", abv: 4.8, ml: 200 },
    { name: "Birra chiara (Media)", abv: 4.8, ml: 400 },
    { name: "Birra chiara (Litro)", abv: 4.8, ml: 1000 },
    { name: "Birra IPA", abv: 6.5, ml: 330 },
    { name: "Birra Stout (Guinness)", abv: 4.2, ml: 568 },
    { name: "Birra doppio malto", abv: 7.5, ml: 330 },
    { name: "Birra analcolica", abv: 0.5, ml: 330 },
    { name: "Vino rosso leggero", abv: 12.5, ml: 150 },
    { name: "Vino rosso strutturato", abv: 14.5, ml: 150 },
    { name: "Vino bianco fermo", abv: 12.0, ml: 150 },
    { name: "Prosecco / Spumante", abv: 11.0, ml: 150 },
    { name: "Champagne", abv: 12.0, ml: 150 },
    { name: "Vino passito", abv: 14.5, ml: 75 },
    { name: "Vermouth", abv: 15.5, ml: 50 },
    { name: "Porto", abv: 19.5, ml: 75 },
    { name: "Vodka Shot", abv: 40.0, ml: 40 },
    { name: "Vodka Redbull", abv: 10.0, ml: 200 },
    { name: "Gin liscio", abv: 43.0, ml: 40 },
    { name: "Gin Lemon", abv: 10.0, ml: 200 },
    { name: "Rum bianco", abv: 38.0, ml: 40 },
    { name: "Rum scuro", abv: 40.0, ml: 40 },
    { name: "Tequila Shot", abv: 40.0, ml: 40 },
    { name: "Whisky (Single Malt)", abv: 40.0, ml: 40 },
    { name: "Bourbon Whiskey", abv: 42.0, ml: 40 },
    { name: "Cognac / Armagnac", abv: 40.0, ml: 40 },
    { name: "Grappa bianca", abv: 40.0, ml: 40 },
    { name: "Grappa barricata", abv: 42.0, ml: 40 },
    { name: "Mezcal", abv: 42.0, ml: 40 },
    { name: "Cachaça", abv: 40.0, ml: 40 },
    { name: "Assenzio", abv: 65.0, ml: 30 },
    { name: "Amaro classico", abv: 29.0, ml: 40 },
    { name: "Fernet / Amaro forte", abv: 40.0, ml: 40 },
    { name: "Limoncello", abv: 30.0, ml: 30 },
    { name: "Sambuca", abv: 40.0, ml: 30 },
    { name: "Jägermeister", abv: 35.0, ml: 40 },
    { name: "Crema di Whisky (Baileys)", abv: 17.0, ml: 50 },
    { name: "Amaretto", abv: 28.0, ml: 40 },
    { name: "Campari", abv: 25.0, ml: 40 },
    { name: "Aperol", abv: 11.0, ml: 40 },
    { name: "Spritz", abv: 9.0, ml: 200 },
    { name: "Negroni", abv: 25.0, ml: 90 },
    { name: "Americano", abv: 13.0, ml: 150 },
    { name: "Gin Tonic", abv: 11.0, ml: 200 },
    { name: "Mojito", abv: 12.0, ml: 200 },
    { name: "Moscow Mule", abv: 11.0, ml: 200 },
    { name: "Margarita", abv: 22.0, ml: 100 },
    { name: "Daiquiri", abv: 21.0, ml: 100 },
    { name: "Martini Cocktail", abv: 30.0, ml: 90 },
    { name: "Old Fashioned", abv: 31.0, ml: 90 },
    { name: "Cosmopolitan", abv: 16.0, ml: 100 },
    { name: "Piña Colada", abv: 12.0, ml: 200 },
    { name: "Long Island Iced Tea", abv: 21.0, ml: 250 }
];

let currentUser = JSON.parse(localStorage.getItem('bevid0_user'));

// Gestione Sessione Attiva
let activeSession = JSON.parse(localStorage.getItem('bevid0_active_session')) || { 
    totalAlcoholGrams: 0, 
    mealFactor: 0.9, 
    mealName: "Sano",
    consumedDrinks: [] 
};

// Controllo retrocompatibilità per i vecchi salvataggi
if(!activeSession.consumedDrinks) activeSession.consumedDrinks = [];

window.onload = () => {
    if(!currentUser) window.location.href = 'index.html';
    renderDrinks(drinksDB);
    
    // Ripristina pasto attivo
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
// AGGIUNTA E RIMOZIONE DRINK
// ==========================================
function addDrink(name, abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8; 
    
    const timeNow = new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});
    activeSession.consumedDrinks.push({ name: name, abv: abv, ml: ml, grams: grams, time: timeNow });
    
    activeSession.totalAlcoholGrams += grams;
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

function removeDrink(index) {
    const removedDrink = activeSession.consumedDrinks.splice(index, 1)[0];
    
    activeSession.totalAlcoholGrams -= removedDrink.grams;
    if(activeSession.totalAlcoholGrams < 0) activeSession.totalAlcoholGrams = 0; 
    
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

// ==========================================
// UI DRINK CONSUMATI E MODAL
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

    let html = '';
    // Ciclo inverso per mostrare l'ultimo drink in alto
    for(let i = activeSession.consumedDrinks.length - 1; i >= 0; i--) {
        let d = activeSession.consumedDrinks[i];
        html += `
            <div class="consumed-drink-item" style="margin-bottom: 8px;">
                <div class="consumed-drink-info">
                    <strong>${d.name}</strong>
                    <span>${d.ml}ml - ${d.abv}% | <i class="fa-regular fa-clock"></i> ${d.time}</span>
                </div>
                <button class="delete-single-btn" style="width: 35px; height: 35px; font-size: 0.9rem;" onclick="removeDrink(${i})">
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
        renderConsumedDrinks(); 
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}

// ==========================================
// CALCOLI SCIENTIFICI E GESTIONE PASTO
// ==========================================
function getAge(dobString) {
    if (!dobString) return 25; 
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function setMeal(name, factor) {
    activeSession.mealFactor = factor; 
    activeSession.mealName = name;
    saveActiveSession();

    const warning = document.getElementById('mealWarning');
    document.querySelectorAll('.meal-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(name === 'Digiuno') {
        warning.innerHTML = "⚠️ <strong>Attenzione:</strong> Bere a stomaco vuoto causa un picco alcolemico del +20%!";
        warning.style.color = "#ff4b2b";
    } else {
        warning.innerText = "Ottima scelta, mangiare rallenta l'assorbimento dell'alcol.";
        warning.style.color = "#94a3b8";
    }
    calculateBAC();
}

function calculateBAC() {
    let tbw = 0; 
    let age = getAge(currentUser.dob);

    // FORMULA DI WATSON
    if (currentUser.ratio > 0.6) { 
        tbw = 2.447 - (0.09156 * age) + (0.1074 * currentUser.height) + (0.3362 * currentUser.weight);
    } else { 
        tbw = -2.097 + (0.1069 * currentUser.height) + (0.2466 * currentUser.weight);
    }

    let r = (tbw / currentUser.weight) * 0.8;

    // WIDMARK OTTIMIZZATA
    let rawBac = (activeSession.totalAlcoholGrams / (currentUser.weight * r));
    let finalBac = rawBac * activeSession.mealFactor;
    
    if(isNaN(finalBac) || finalBac < 0) finalBac = 0;

    // Passiamo il valore come stringa formattata a due decimali
    updateGauge(finalBac.toFixed(2));
}

function formatTime(totalMins) {
    if (totalMins <= 0) return "0h 0m";
    let h = Math.floor(totalMins / 60);
    let m = Math.round(totalMins % 60);
    return `${h}h ${m}m`;
}

// ==========================================
// FUNZIONE TACHIMETRO E AGGIORNAMENTO COLORI
// ==========================================
function updateGauge(valueStr) {
    const numericValue = parseFloat(valueStr);
    
    const bacElement = document.getElementById('bacValue');
    const progress = document.getElementById('gaugeProgress');
    const statusText = document.getElementById('statusText');
    
    const burnValue = document.getElementById('burnValue');
    const driveTime = document.getElementById('driveTime');
    const driveIcon = document.getElementById('driveIcon');
    const driveLabel = document.getElementById('driveLabel');
    const driveValue = document.getElementById('driveValue');
    
    bacElement.innerText = valueStr;
    
    let percentage = Math.min(numericValue, 4.0) / 4.0;
    progress.style.strokeDashoffset = 251.32 - (percentage * 251.32);

    if(numericValue > 0) {
        let totalMinsZero = (numericValue / 0.15) * 60;
        burnValue.innerText = formatTime(totalMinsZero);

        if (numericValue >= 0.50) {
            let totalMinsDrive = ((numericValue - 0.49) / 0.15) * 60;
            driveValue.innerText = formatTime(totalMinsDrive);
            driveTime.style.color = "#ffb400"; 
            driveTime.style.background = "rgba(255, 180, 0, 0.15)";
            driveIcon.className = "fa-solid fa-car";
            driveLabel.innerText = "Attesa Guida: ";
            driveValue.style.display = "inline";
            driveTime.style.display = 'inline-flex';
        } else {
            driveTime.style.color = "#00e676"; 
            driveTime.style.background = "rgba(0, 230, 118, 0.15)";
            driveIcon.className = "fa-solid fa-car";
            driveLabel.innerText = "Puoi guidare!";
            driveValue.style.display = "none";
            driveTime.style.display = 'inline-flex';
        }
    } else {
        burnValue.innerText = "0h 0m";
        driveTime.style.display = 'none';
    }

    if(numericValue < 0.5) {
        progress.style.stroke = "#00e676"; 
        statusText.innerText = "Livello: SOBRIO / OK";
        statusText.style.color = "#00e676";
    } else if (numericValue < 1.5) {
        progress.style.stroke = "#ffb400"; 
        statusText.innerText = "Livello: EBBREZZA (No Guida)";
        statusText.style.color = "#ffb400";
    } else {
        progress.style.stroke = "#ff4b2b"; 
        statusText.innerText = "Livello: UBRIACO";
        statusText.style.color = "#ff4b2b";
    }
}

// ==========================================
// RICERCA E RENDER DRINK DB (Modificato per testi lunghi)
// ==========================================
function renderDrinks(list) {
    const container = document.getElementById('drinkList');
    container.innerHTML = list.map(drink => {
        let safeName = drink.name.replace(/'/g, "\\'"); 
        return `
        <div class="drink-card" onclick="addDrink('${safeName}', ${drink.abv}, ${drink.ml})">
            <strong>${drink.name}</strong>
            <small>${drink.abv}% | ${drink.ml}ml</small>
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
