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
    applyFacilityOutputs(); // from facilities.js

    let incomeThisTick = gameState.rentPerSecond;
    let expensesThisTick = gameState.facilityUpkeepPerSecond;
    gameState.cash += (incomeThisTick - expensesThisTick);

    // Only update frequently changing stats in gameTick for performance
    updateCashDisplay(); // from ui.js
    updateBuildingMaterialsDisplay(); // from ui.js
    updateResearchPointsDisplay();    // from ui.js
    // NetRPS and Upkeep also change if underlying properties/facilities are bought/sold/upgraded,
    // but those actions trigger updateGameData which handles their display.
    // If buffs cause per-tick changes to RPS/Upkeep not captured by buy/sell, then uncomment:
    // updateNetRPSDisplay();
    // updateTotalUpkeepDisplay();
}

function updateGameData() {
    ensureUIInitialized(); // Make sure UI refs are good, especially if called early

    gameState.rentPerSecond = calculateTotalPropertiesRPS();
    gameState.facilityUpkeepPerSecond = calculateTotalFacilityUpkeep();
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    // Update all static stat displays once
    updateCashDisplay(); // Redundant if also in gameTick but harmless
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay(); // Redundant if also in gameTick
    updateResearchPointsDisplay();    // Redundant if also in gameTick
    updateTotalUpkeepDisplay();

    // Display content for the current view
    // This function will now call the appropriate sub-display functions
    displayCurrentViewContent(); // from ui.js
    // Button states are updated by displayCurrentViewContent calling updateAllButtonStatesForCurrentView
}

// Removed updateUIDisplays as its role is split between gameTick (for rapidly changing values)
// and updateGameData (for broader refreshes including lists and button states via displayCurrentViewContent)

function initGame() {
    console.log(`Metropolis Estates Initializing (v0.3.0 - UI Views)... ${new Date().toLocaleTimeString()}`);

    initialRender();    // ui.js: This calls initializeUIElements() and then switchView('rentals')
                        // switchView('rentals') then calls updateGameData(), which populates the view.

    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    // Log messages removed from here
    // Initial visibility of resource displays now handled within their update functions in ui.js
}

document.addEventListener('DOMContentLoaded', initGame);
