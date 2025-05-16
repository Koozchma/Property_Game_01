// Metropolis Estates - main.js

let gameState = {
    cash: 200, // Starting cash
    rentPerSecond: 0, // Gross RPS from properties (after their own upgrades AND global buffs)
    netRentPerSecond: 0, // RPS after facility upkeep
    facilityUpkeepPerSecond: 0,
    buildingMaterials: 0,
    researchPoints: 0,
    unlockedResearch: [], // Array of research topic IDs that have been completed
};

const GAME_TICK_INTERVAL = 1000; // 1 second
let gameLoopIntervalId;

function gameTick() {
    // 1. Apply facility outputs (generate resources)
    applyFacilityOutputs(); // from facilities.js

    // 2. Calculate income & expenses
    // Gross RPS and Facility upkeep are calculated in updateGameData and stored in gameState.
    // This means gameState.rentPerSecond already includes all property-specific and global buffs.

    let incomeThisTick = gameState.rentPerSecond; // RPS is per second.
    let expensesThisTick = gameState.facilityUpkeepPerSecond; // Upkeep is also per second.

    gameState.cash += (incomeThisTick - expensesThisTick); // Cash change per second.

    if (gameState.cash < -10000 && ownedProperties.length > 0) {
        // Basic debt warning, could be made more prominent.
        // logMessage("Warning: Cash is significantly negative! Consider selling assets or reducing upkeep.", "error");
    }

    // 3. Update UI for dynamic values (cash, resources that change per tick)
    updateCashDisplay(); // from ui.js
    updateBuildingMaterialsDisplay(); // from ui.js
    updateResearchPointsDisplay();    // from ui.js

    // Button states and list re-renders are handled in updateGameData for efficiency,
    // as they depend on less frequent state changes (purchases, upgrades).
}

// This function is central to updating all calculated stats and triggering UI refreshes
function updateGameData() {
    // Recalculate all core stats. Order can matter if there are interdependencies.

    // 1. Calculate total gross RPS from properties.
    // This function (from properties.js) should internally handle all property-specific upgrades
    // AND any global buffs affecting property RPS (e.g., from research or facilities like workshops).
    gameState.rentPerSecond = calculateTotalPropertiesRPS(); // <<< THIS IS THE CRITICAL CALL

    // 2. Calculate total facility upkeep.
    // This function (from facilities.js) should handle facility-specific upgrades
    // AND any global buffs affecting upkeep (if any).
    gameState.facilityUpkeepPerSecond = calculateTotalFacilityUpkeep(); // from facilities.js

    // 3. Calculate net RPS.
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    // 4. Update all relevant UI display elements that show these calculated values.
    updateUIDisplays(); // Defined below, calls individual UI update functions

    // 5. Re-render lists and button states as underlying data or availability might have changed.
    // These functions are in ui.js
    displayAvailableProperties();
    displayOwnedProperties();
    displayAvailableFacilities();
    displayOwnedFacilities();
    displayResearchOptions();

    // Explicitly update all button states after data changes and lists are re-rendered.
    // These functions are in ui.js
    updateAllBuyButtonStates();
    updateAllFacilityBuyButtonStates();
    updateAllUpgradeButtonStates(); // For properties
    updateAllFacilityUpgradeButtonStates();
    updateResearchButtonStates();
}


// Consolidates calls to individual UI update functions for stats (from ui.js)
function updateUIDisplays() {
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();
}


function initGame() {
    console.log("Metropolis Estates Initializing (v0.1.1 - Error Fix Attempt)..."); // Updated version
    console.log("Current Date/Time (Client): " + new Date().toString());

    // Initial UI render (some parts might be hidden until unlocked)
    initialRender();    // Defined in ui.js
    updateGameData();   // Calculate initial stats, update all displays & button states

    // Start the game loop
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    logMessage("Game initialized. Your empire awaits!", "success");

    // Ensure displays for new resources are visible based on initial state
    if(gameState.buildingMaterials > 0 || FACILITY_TYPES.find(f=>f.id==="lumber_mill" && !f.requiredResearch)) {
        document.getElementById('building-materials-display').style.display = 'inline-block';
    }
    if(gameState.researchPoints > 0 || gameState.unlockedResearch.includes("basic_education") || RESEARCH_TOPICS.find(rt=>rt.id === "basic_education" && rt.costRP <= gameState.researchPoints)) {
         document.getElementById('research-points-display').style.display = 'inline-block';
         document.getElementById('research-section').style.display = 'block';
    }
    if (gameState.facilityUpkeepPerSecond > 0) { // Show upkeep if it's non-zero initially
        document.getElementById('total-upkeep-display').style.display = 'inline-block';
    }

    // Call these once after init to ensure lists are populated based on initial game state
    displayAvailableFacilities(); // from ui.js
    displayResearchOptions();   // from ui.js
}

// --- Event Listeners & Startup ---
document.addEventListener('DOMContentLoaded', initGame);
