// ==========================================
// DATABASE DRINK AVANZATO
// ==========================================
const drinksDB = [
    { name: "Birra chiara (Piccola)",    abv: 4.8,  ml: 200  },
    { name: "Birra chiara (Media)",      abv: 4.8,  ml: 400  },
    { name: "Birra chiara (Litro)",      abv: 4.8,  ml: 1000 },
    { name: "Birra IPA",                 abv: 6.5,  ml: 330  },
    { name: "Birra Stout (Guinness)",    abv: 4.2,  ml: 568  },
    { name: "Birra doppio malto",        abv: 7.5,  ml: 330  },
    { name: "Vino rosso leggero",        abv: 12.5, ml: 150  },
    { name: "Vino rosso strutturato",    abv: 14.5, ml: 150  },
    { name: "Vino bianco fermo",         abv: 12.0, ml: 150  },
    { name: "Prosecco / Spumante",       abv: 11.0, ml: 150  },
    { name: "Champagne",                 abv: 12.0, ml: 150  },
    { name: "Vino passito",              abv: 14.5, ml: 75   },
    { name: "Vermouth",                  abv: 15.5, ml: 50   },
    { name: "Porto",                     abv: 19.5, ml: 75   },
    { name: "Vodka Shot",                abv: 40.0, ml: 40   },
    { name: "Vodka Redbull",             abv: 10.0, ml: 200  },
    { name: "Gin liscio",                abv: 43.0, ml: 40   },
    { name: "Gin Lemon",                 abv: 10.0, ml: 200  },
    { name: "Rum bianco",                abv: 38.0, ml: 40   },
    { name: "Rum scuro",                 abv: 40.0, ml: 40   },
    { name: "Tequila Shot",              abv: 40.0, ml: 40   },
    { name: "Whisky (Single Malt)",      abv: 40.0, ml: 40   },
    { name: "Bourbon Whiskey",           abv: 42.0, ml: 40   },
    { name: "Cognac / Armagnac",         abv: 40.0, ml: 40   },
    { name: "Grappa bianca",             abv: 40.0, ml: 40   },
    { name: "Grappa barricata",          abv: 42.0, ml: 40   },
    { name: "Mezcal",                    abv: 42.0, ml: 40   },
    { name: "Cachaça",                   abv: 40.0, ml: 40   },
    { name: "Assenzio",                  abv: 65.0, ml: 30   },
    { name: "Amaro classico",            abv: 29.0, ml: 40   },
    { name: "Fernet / Amaro forte",      abv: 40.0, ml: 40   },
    { name: "Limoncello",                abv: 30.0, ml: 30   },
    { name: "Sambuca",                   abv: 40.0, ml: 30   },
    { name: "Jägermeister",              abv: 35.0, ml: 40   },
    { name: "Crema di Whisky (Baileys)", abv: 17.0, ml: 50   },
    { name: "Amaretto",                  abv: 28.0, ml: 40   },
    { name: "Campari",                   abv: 25.0, ml: 40   },
    { name: "Aperol",                    abv: 11.0, ml: 40   },
    { name: "Spritz",                    abv: 9.0,  ml: 200  },
    { name: "Negroni",                   abv: 25.0, ml: 90   },
    { name: "Americano",                 abv: 13.0, ml: 150  },
    { name: "Gin Tonic",                 abv: 11.0, ml: 200  },
    { name: "Mojito",                    abv: 12.0, ml: 200  },
    { name: "Moscow Mule",               abv: 11.0, ml: 200  },
    { name: "Margarita",                 abv: 22.0, ml: 100  },
    { name: "Daiquiri",                  abv: 21.0, ml: 100  },
    { name: "Martini Cocktail",          abv: 30.0, ml: 90   },
    { name: "Old Fashioned",             abv: 31.0, ml: 90   },
    { name: "Cosmopolitan",              abv: 16.0, ml: 100  },
    { name: "Piña Colada",               abv: 12.0, ml: 200  },
    { name: "Long Island Iced Tea",      abv: 21.0, ml: 250  },
];

let currentUser = JSON.parse(localStorage.getItem('bevid0_user'));

let activeSession = JSON.parse(localStorage.getItem('bevid0_active_session')) || {
    totalAlcoholGrams: 0,
    mealFactor: 0.9,
    mealName: "Sano",
    consumedDrinks: [],
    startTime: null
};

window.onload = () => {
    if (!currentUser) window.location.href = 'index.html';
    renderDrinks(drinksDB);
    document.querySelectorAll('.meal-btn').forEach(btn => {
        if (btn.querySelector('span').innerText === activeSession.mealName) {
            btn.classList.add('active');
        }
    });
    calculateBAC();
    updateDrinkCounter();
    // Aggiornamento ogni secondo per rendere il countdown fluido
    setInterval(calculateBAC, 1000);
};

function saveActiveSession() {
    localStorage.setItem('bevid0_active_session', JSON.stringify(activeSession));
}

function addDrink(name, abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8;
    const timeNow = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    if (!activeSession.startTime) {
        activeSession.startTime = Date.now();
    }
    activeSession.consumedDrinks.push({ name, abv, ml, grams, time: timeNow });
    activeSession.totalAlcoholGrams += grams;
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

function removeDrink(index) {
    const removed = activeSession.consumedDrinks.splice(index, 1)[0];
    activeSession.totalAlcoholGrams -= removed.grams;
    if (activeSession.totalAlcoholGrams < 0) activeSession.totalAlcoholGrams = 0;
    // Se non ci sono più drink, resetta lo startTime
    if (activeSession.consumedDrinks.length === 0) activeSession.startTime = null;
    saveActiveSession();
    calculateBAC();
    updateDrinkCounter();
    renderConsumedDrinks();
}

function calculateBAC() {
    if (!currentUser || activeSession.totalAlcoholGrams <= 0) {
        updateGauge("0.00");
        return;
    }
    let tbw = 0;
    const age = getAge(currentUser.dob);
    if (currentUser.ratio > 0.6) {
        tbw = 2.447 - (0.09156 * age) + (0.1074 * currentUser.height) + (0.3362 * currentUser.weight);
    } else {
        tbw = -2.097 + (0.1069 * currentUser.height) + (0.2466 * currentUser.weight);
    }
    const r = (tbw / currentUser.weight) * 0.8;
    let peakBac = (activeSession.totalAlcoholGrams / (currentUser.weight * r)) * activeSession.mealFactor;
    
    let finalBac = peakBac;
    if (activeSession.startTime) {
        const elapsedHours = (Date.now() - activeSession.startTime) / (1000 * 60 * 60);
        // Tasso di smaltimento medio: 0.15 g/L all'ora
        finalBac = Math.max(0, peakBac - (0.15 * elapsedHours));
    }
    updateGauge(finalBac.toFixed(2));
}

function updateGauge(valueStr) {
    const numericValue = parseFloat(valueStr);
    const bacElement = document.getElementById('bacValue');
    const progress = document.getElementById('gaugeProgress');
    const statusText = document.getElementById('statusText');
    const burnValue = document.getElementById('burnValue');
    const driveTime = document.getElementById('driveTime');
    const driveValue = document.getElementById('driveValue');

    bacElement.innerText = valueStr;
    const percentage = Math.min(numericValue, 4.0) / 4.0;
    progress.style.strokeDashoffset = 251.32 - (percentage * 251.32);

    let color = "#00e676";
    if (numericValue < 0.5) {
        color = "#00e676";
        statusText.innerHTML = "Livello: SOBRIO / OK";
    } else if (numericValue < 1.5) {
        color = "#ffb400";
        statusText.innerHTML = "Livello: EBBREZZA (No Guida)";
    } else if (numericValue < 3.0) {
        color = "#ff4b2b";
        statusText.innerHTML = "Livello: UBRIACO";
    } else {
        color = "#9b00ff";
        statusText.innerHTML = "PERICOLO";
    }

    progress.style.stroke = color;
    bacElement.style.color = color;
    statusText.style.color = color;

    if (numericValue > 0) {
        const totalMinsZero = (numericValue / 0.15) * 60;
        burnValue.innerText = formatTime(totalMinsZero);
        driveTime.style.display = "inline-flex";
        if (numericValue >= 0.5) {
            const minsDrive = ((numericValue - 0.49) / 0.15) * 60;
            driveValue.innerText = formatTime(minsDrive);
        } else {
            driveValue.innerText = "Ora";
        }
    } else {
        burnValue.innerText = "0h 0m";
        driveTime.style.display = "none";
    }
}

function formatTime(totalMins) {
    if (totalMins <= 0) return "0h 0m";
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    const s = Math.floor((totalMins * 60) % 60); // Aggiunti secondi per dinamicità
    return `${h}h ${m}m ${s}s`;
}

function getAge(dobString) {
    if (!dobString) return 25;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
    return age;
}

function setMeal(name, factor) {
    activeSession.mealFactor = factor;
    activeSession.mealName = name;
    saveActiveSession();
    calculateBAC();
}

function renderDrinks(list) {
    const container = document.getElementById('drinkList');
    container.innerHTML = list.map(drink => `
        <div class="drink-card" onclick="addDrink('${drink.name.replace(/'/g, "\\'")}', ${drink.abv}, ${drink.ml})">
            <strong>${drink.name}</strong>
            <small>${drink.abv}% · ${drink.ml}ml</small>
        </div>`).join('');
}

function updateDrinkCounter() {
    document.getElementById('drinkCounter').innerText = activeSession.consumedDrinks.length;
}

function renderConsumedDrinks() {
    const container = document.getElementById('consumedList');
    if (activeSession.consumedDrinks.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px 0;">Nessun drink.</p>`;
        return;
    }
    container.innerHTML = activeSession.consumedDrinks.map((d, i) => `
        <div class="consumed-drink-item" style="margin-bottom:8px;">
            <div class="consumed-drink-info">
                <strong>${d.name}</strong>
                <span>${d.ml}ml · ${d.abv}% | ${d.time}</span>
            </div>
            <button class="delete-single-btn" onclick="removeDrink(${i})"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).reverse().join('');
}

function toggleConsumedModal() {
    const modal = document.getElementById('consumedModal');
    modal.style.display = (modal.style.display === "none") ? "flex" : "none";
    if (modal.style.display === "flex") renderConsumedDrinks();
}

function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = (modal.style.display === "none") ? "flex" : "none";
}

function concludeSession() {
    const currentBac = document.getElementById('bacValue').innerText;
    if (confirm("Vuoi terminare la sessione?")) {
        let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
        history.push({
            date: new Date().toLocaleString('it-IT'),
            maxBac: currentBac,
            mealType: activeSession.mealName,
            consumedDrinks: activeSession.consumedDrinks
        });
        localStorage.setItem('bevid0_history', JSON.stringify(history));
        localStorage.removeItem('bevid0_active_session');
        window.location.href = 'home.html';
    }
}
