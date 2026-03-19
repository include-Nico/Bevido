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
let totalAlcoholGrams = 0;
let mealFactor = 1.0; 

window.onload = () => {
    if(!currentUser) window.location.href = 'index.html';
    document.querySelector('#welcomeUser span').innerText = currentUser.username;
    renderDrinks(drinksDB);
    updateGauge(0);
};

function addDrink(abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8;
    totalAlcoholGrams += grams;
    calculateBAC();
}

function setMeal(type, factor) {
    mealFactor = factor;
    const warning = document.getElementById('mealWarning');
    
    document.querySelectorAll('.meal-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(type === 'digiuno') {
        warning.innerHTML = "⚠️ <strong>Attenzione:</strong> Bere a stomaco vuoto è pericoloso e accelera drasticamente l'ebbrezza.";
        warning.style.color = "#ff4b2b";
    } else {
        warning.innerText = "Ottima scelta, mangiare aiuta a gestire l'alcol.";
        warning.style.color = "#94a3b8";
    }
    calculateBAC();
}

function calculateBAC() {
    // Formula Widmark con impatto cibo
    let bac = totalAlcoholGrams / (currentUser.weight * currentUser.ratio * mealFactor);
    updateGauge(bac.toFixed(2));
}

function updateGauge(value) {
    const bacElement = document.getElementById('bacValue');
    const progress = document.getElementById('gaugeProgress');
    const statusText = document.getElementById('statusText');
    const burnTimeSpan = document.querySelector('#burnTime span');
    
    bacElement.innerText = value;
    
    // Range 4.0 g/L
    let percentage = Math.min(value, 4.0) / 4.0;
    let offset = 251.32 - (percentage * 251.32);
    progress.style.strokeDashoffset = offset;

    // Calcolo tempo di smaltimento (0.15 g/L all'ora)
    if(value > 0) {
        let totalMinutes = (value / 0.15) * 60;
        let hours = Math.floor(totalMinutes / 60);
        let mins = Math.round(totalMinutes % 60);
        burnTimeSpan.innerText = `${hours}h ${mins}m`;
    } else {
        burnTimeSpan.innerText = "0h 0m";
    }

    // Stati Visivi
    if(value < 0.5) {
        progress.style.stroke = "#00e676";
        statusText.innerText = "Livello: OK";
    } else if (value < 1.5) {
        progress.style.stroke = "#ffb400";
        statusText.innerText = "Livello: SBRONZO";
    } else {
        progress.style.stroke = "#ff4b2b";
        statusText.innerText = "Livello: UBRIACO";
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

function saveSession() {
    let currentBac = document.getElementById('bacValue').innerText;
    if(currentBac == "0.00") return alert("Nulla da salvare!");
    
    let history = JSON.parse(localStorage.getItem('bevid0_history')) || [];
    history.push({
        date: new Date().toLocaleString(),
        maxBac: currentBac,
        mealType: document.querySelector('.meal-btn.active')?.querySelector('span').innerText || "Ignoto"
    });
    localStorage.setItem('bevid0_history', JSON.stringify(history));
    alert("Serata salvata!");
}