const drinksDB = [
    { name: "Birra chiara (Piccola)", abv: 4.8, ml: 200 },
    { name: "Birra chiara (Media)", abv: 4.8, ml: 400 },
    { name: "Birra chiara (Litro)", abv: 4.8, ml: 1000 },
    { name: "Birra IPA", abv: 6.5, ml: 330 },
    { name: "Birra Stout", abv: 4.2, ml: 568 },
    { name: "Vino rosso", abv: 12.5, ml: 150 },
    { name: "Vino bianco", abv: 11.5, ml: 150 },
    { name: "Spritz", abv: 9.0, ml: 200 },
    { name: "Negroni", abv: 25.0, ml: 100 },
    { name: "Gin Tonic", abv: 12.0, ml: 200 },
    { name: "Vodka Shot", abv: 40.0, ml: 40 },
    { name: "Tequila Shot", abv: 38.0, ml: 40 }
];

let currentUser = JSON.parse(localStorage.getItem('bevid0_user'));
let activeSession = JSON.parse(localStorage.getItem('bevid0_active_session')) || { totalAlcoholGrams: 0, mealFactor: 0.9, mealName: "Sano" };

window.onload = () => {
    if(!currentUser) window.location.href = 'index.html';
    renderDrinks(drinksDB);
    calculateBAC();
};

function renderDrinks(list) {
    const container = document.getElementById('drinkList');
    container.innerHTML = list.map(d => `
        <div class="drink-card" onclick="addDrink('${d.name}', ${d.abv}, ${d.ml})">
            <strong>${d.name}</strong>
            <small>${d.abv}% | ${d.ml}ml</small>
        </div>
    `).join('');
}

function addDrink(name, abv, ml) {
    const grams = (ml * (abv / 100)) * 0.8;
    activeSession.totalAlcoholGrams += grams;
    localStorage.setItem('bevid0_active_session', JSON.stringify(activeSession));
    calculateBAC();
}

function setMeal(name, factor) {
    activeSession.mealFactor = factor;
    activeSession.mealName = name;
    document.querySelectorAll('.meal-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    calculateBAC();
}

function calculateBAC() {
    let age = 25; // Default o calcola da dob
    let tbw = (currentUser.ratio > 0.6) ? 
        2.447 - (0.09156 * age) + (0.1074 * currentUser.height) + (0.3362 * currentUser.weight) :
        -2.097 + (0.1069 * currentUser.height) + (0.2466 * currentUser.weight);
    
    let r = (tbw / currentUser.weight) * 0.8;
    let bac = (activeSession.totalAlcoholGrams / (currentUser.weight * r)) * activeSession.mealFactor;
    updateGauge(bac.toFixed(2));
}

function updateGauge(val) {
    const numeric = parseFloat(val);
    document.getElementById('bacValue').innerText = val;
    const progress = document.getElementById('gaugeProgress');
    progress.style.strokeDashoffset = 251.32 - (Math.min(numeric, 4) / 4 * 251.32);
    
    const burnVal = (numeric / 0.15) * 60;
    document.getElementById('burnValue').innerText = `${Math.floor(burnVal/60)}h ${Math.round(burnVal%60)}m`;
}

function filterDrinks() {
    const term = document.getElementById('drinkSearch').value.toLowerCase();
    renderDrinks(drinksDB.filter(d => d.name.toLowerCase().includes(term)));
}
