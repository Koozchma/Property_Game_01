// Metropolis Estates - ui.js

// --- DOM Element References ---
const cashDisplay = document.getElementById('cash-display');
const rpsDisplay = document.getElementById('rps-display');
const ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
const availablePropertiesList = document.getElementById('available-properties-list');
const ownedPropertiesList = document.getElementById('owned-properties-list');
const messageLogElement = document.getElementById('message-log');

// --- UI Update Functions ---

function formatNumber(num) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function updateCashDisplay() {
    if (cashDisplay) {
        cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`;
    }
}

function updateRPSDisplay() {
    if (rpsDisplay) {
        rpsDisplay.textContent = `RPS: $${formatNumber(gameState.rentPerSecond)}/s`;
    }
}
function updateOwnedPropertiesCountDisplay() {
    if (ownedPropertiesCountDisplay) {
        ownedPropertiesCountDisplay.textContent = `Properties: ${ownedProperties.length}`;
    }
}


function displayAvailableProperties() {
    if (!availablePropertiesList) return;
    availablePropertiesList.innerHTML = ''; // Clear existing

    PROPERTY_TYPES.forEach(propType => {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `
            <h3>${propType.name}</h3>
            <p>${propType.description}</p>
            <p class="prop-cost">Cost: $${propType.cost.toLocaleString()}</p>
            <p>Base RPS: $${propType.baseRPS.toLocaleString()}/s</p>
            <p>Max Level: ${propType.maxLevel}</p>
            <button onclick="buyProperty('${propType.id}')" id="buy-${propType.id}-btn">Buy</button>
        `;
        availablePropertiesList.appendChild(card);
        updateBuyButtonState(propType.id, propType.cost); // Initial button state
    });
}

function displayOwnedProperties() {
    if (!ownedPropertiesList) return;
    ownedPropertiesList.innerHTML = ''; // Clear existing

    if (ownedProperties.length === 0) {
        ownedPropertiesList.innerHTML = '<p>You don\'t own any properties yet. Buy some from the list above!</p>';
        return;
    }

    ownedProperties.forEach(propInstance => {
        const propertyType = getPropertyTypeById(propInstance.typeId); // Get base type details
        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInstance.uniqueId);

        const currentMaxLevel = propertyType ? propertyType.maxLevel : 'N/A';
        const upgradeCost = propertyType ? (propInstance.purchaseCost * 0.5 * Math.pow(1.5, propInstance.level -1)) : Infinity;


        card.innerHTML = `
            <h3>${propInstance.name} (ID: ${propInstance.uniqueId})</h3>
            <p class="prop-level">Level: ${propInstance.level} / ${currentMaxLevel}</p>
            <p class="prop-rps">Current RPS: $${formatNumber(propInstance.currentRPS)}/s</p>
            <p>Purchase Cost: $${propInstance.purchaseCost.toLocaleString()}</p>
            <button class="upgrade-btn" onclick="upgradePropertyInstance(${propInstance.uniqueId})" ${propInstance.level >= currentMaxLevel || gameState.cash < upgradeCost ? 'disabled' : ''}>
                Upgrade (Cost: $${formatNumber(upgradeCost)})
            </button>
            <button class="sell-btn" onclick="sellPropertyInstance(${propInstance.uniqueId})">
                Sell (for $${formatNumber(propInstance.purchaseCost * 0.75)})
            </button>
        `;
        ownedPropertiesList.appendChild(card);
    });
}

function updateBuyButtonState(propertyId, cost) {
    const buyButton = document.getElementById(`buy-${propertyId}-btn`);
    if (buyButton) {
        buyButton.disabled = gameState.cash < cost;
    }
}

function updateAllBuyButtonStates() {
    PROPERTY_TYPES.forEach(propType => {
        updateBuyButtonState(propType.id, propType.cost);
    });
}

function updateAllUpgradeButtonStates() {
    ownedProperties.forEach(propInstance => {
        const propertyType = getPropertyTypeById(propInstance.typeId);
        if (!propertyType) return;

        const upgradeButton = ownedPropertiesList.querySelector(`.owned-property-card[data-id='${propInstance.uniqueId}'] .upgrade-btn`);
        if (upgradeButton) {
            const upgradeCost = propInstance.purchaseCost * 0.5 * Math.pow(1.5, propInstance.level -1);
            upgradeButton.disabled = propInstance.level >= propertyType.maxLevel || gameState.cash < upgradeCost;
            if (propInstance.level < propertyType.maxLevel) {
                 upgradeButton.textContent = `Upgrade (Cost: $${formatNumber(upgradeCost)})`;
            } else {
                 upgradeButton.textContent = `Max Level Reached`;
            }
        }
    });
}


function logMessage(message, type = "info") { // type can be "info", "success", "error"
    if (!messageLogElement) return;

    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    p.classList.add(`log-${type}`); // For potential styling based on type

    messageLogElement.appendChild(p);
    // Scroll to the bottom of the log
    messageLogElement.scrollTop = messageLogElement.scrollHeight;

    // Optional: Limit the number of messages
    const maxMessages = 20;
    while (messageLogElement.children.length > maxMessages) {
        messageLogElement.removeChild(messageLogElement.firstChild);
    }
}

// --- Initial UI Setup ---
function initialRender() {
    displayAvailableProperties();
    displayOwnedProperties(); // Initially will show "no properties"
    updateCashDisplay();
    updateRPSDisplay();
    updateOwnedPropertiesCountDisplay();
}
