// Metropolis Estates - main.js

let gameState = {
    cash: 200,
    rentPerSecond: 0,
    netRentPerSecond: 0,
    facilityUpkeepPerSecond: 0,
    buildingMaterials: 100,
    researchPoints: 0,
    unlockedResearch: [],
};

const GAME_TICK_INTERVAL = 1000;
let gameLoopIntervalId;

function gameTick() {
    applyFacilityOutputs();

    let incomeThisTick = gameState.rentPerSecond;
    let expensesThisTick = gameState.facilityUpkeepPerSecond;
    gameState.cash += (incomeThisTick - expensesThisTick);

    if (gameState.cash < -10000 && ownedProperties.length > 0) {
        // console.warn("[GAME] Warning: Cash is significantly negative!"); // Using console directly
    }

    updateCashDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
}

function updateGameData() {
    ensureUIInitialized(); // From ui.js

    gameState.rentPerSecond = calculateTotalPropertiesRPS();
    gameState.facilityUpkeepPerSecond = calculateTotalFacilityUpkeep();
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    // Update all static stat displays once
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    displayCurrentViewContent(); // ui.js: This populates lists and calls updateAllButtonStatesForCurrentView
}

function initGame() {
    console.log(`Metropolis Estates Initializing (v0.3.1)... ${new Date().toLocaleTimeString()}`);
    initialRender(); // ui.js: This calls initializeUIElements() then switchView('rentals')
    // updateGameData() is called by switchView, so it doesn't need to be called again here.

    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);
    console.log("[GAME] Game initialized. Expand your empire!");
}

document.addEventListener('DOMContentLoaded', initGame);
