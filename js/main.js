// Metropolis Estates - main.js

let gameState = {
    cash: 200,
    rentPerSecond: 0,
    netRentPerSecond: 0,
    facilityUpkeepPerSecond: 0,
    buildingMaterials: 100, // Start with some materials
    researchPoints: 0,
    unlockedResearch: [],
};

const GAME_TICK_INTERVAL = 1000; // 1 second
let gameLoopIntervalId;

function gameTick() {
    applyFacilityOutputs(); // from facilities.js

    let incomeThisTick = gameState.rentPerSecond;
    let expensesThisTick = gameState.facilityUpkeepPerSecond;
    gameState.cash += (incomeThisTick - expensesThisTick);

    if (gameState.cash < -10000 && ownedProperties.length > 0) {
        // logMessage("Warning: Cash is significantly negative!", "error");
    }

    updateCashDisplay(); // from ui.js
    updateBuildingMaterialsDisplay(); // from ui.js
    updateResearchPointsDisplay();    // from ui.js
}

function updateGameData() {
    gameState.rentPerSecond = calculateTotalPropertiesRPS(); // from properties.js
    gameState.facilityUpkeepPerSecond = calculateTotalFacilityUpkeep(); // from facilities.js
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    updateUIDisplays(); // Defined below

    // Re-render lists and button states
    displayAvailableProperties(); // from ui.js
    displayOwnedProperties();   // from ui.js
    displayAvailableFacilities(); // from ui.js
    displayOwnedFacilities();   // from ui.js
    displayResearchOptions();   // from ui.js

    updateAllBuyButtonStates(); // from ui.js
    updateAllFacilityBuyButtonStates(); // from ui.js
    updateAllUpgradeButtonStates(); // from ui.js
    updateAllFacilityUpgradeButtonStates(); // from ui.js
    updateResearchButtonStates(); // from ui.js
}

function updateUIDisplays() {
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();
}

function initGame() {
    console.log("Metropolis Estates Initializing (v0.2.0 - Research Tree & Material Costs)...");
    console.log("Current Date/Time (Client): " + new Date().toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' }));


    initialRender();    // Defined in ui.js
    updateGameData();

    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    logMessage("Game initialized. Expand your empire!", "success");

    // Make sure initial displays are correctly shown/hidden based on gameState
    buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials') ? 'inline-block' : 'none';
    researchPointsDisplay.style.display = gameState.researchPoints > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'researchPoints') ? 'inline-block' : 'none';
    document.getElementById('research-section').style.display = researchPointsDisplay.style.display; // Show research section if RP display is shown
    totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';

    // These are called in updateGameData, but an initial call after visibility setup can be good.
    displayAvailableFacilities();
    displayResearchOptions();
}

document.addEventListener('DOMContentLoaded', initGame);
