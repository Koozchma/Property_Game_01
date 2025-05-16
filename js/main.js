// Metropolis Estates - main.js

let gameState = {
    cash: 200, // Starting cash slightly increased
    rentPerSecond: 0, // Gross RPS from properties
    netRentPerSecond: 0, // RPS after facility upkeep
    facilityUpkeepPerSecond: 0,
    buildingMaterials: 0,
    researchPoints: 0,
    unlockedResearch: [], // Array of research topic IDs that have been completed
    activeBuffs: [] // To store active global buffs from research
    // other global states can go here
};

const GAME_TICK_INTERVAL = 1000; // 1 second
let gameLoopIntervalId;

function gameTick() {
    // 1. Apply facility outputs (generate resources)
    applyFacilityOutputs();

    // 2. Calculate income & expenses
    // Gross RPS is calculated by calculateTotalPropertiesRPS()
    // Facility upkeep is calculated by calculateTotalFacilityUpkeep()

    // Apply global buffs that might affect RPS or upkeep before calculating net
    // This part needs to be more robust if buffs are complex.
    // For now, assuming direct RPS/upkeep values are final.

    let incomeThisTick = gameState.rentPerSecond;
    let expensesThisTick = gameState.facilityUpkeepPerSecond;

    gameState.cash += (incomeThisTick - expensesThisTick);
    if (gameState.cash < 0) {
        // Handle negative cash scenario - e.g., debt, bankruptcy (future feature)
        // For now, just let it go negative.
        // logMessage("Warning: Cash is negative! Manage your expenses.", "error");
    }


    // 3. Update UI
    updateUIDisplays(); // Consolidated UI update function

    // 4. Check for game over or win conditions (later)
}

function updateUIDisplays() {
    updateCashDisplay();
    updateNetRPSDisplay(); // Changed from updateRPSDisplay
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    // Update button states (buy/upgrade) based on current cash & resources
    updateAllBuyButtonStates(); // For properties
    updateAllFacilityBuyButtonStates(); // For facilities
    updateAllUpgradeButtonStates(); // For properties
    updateAllFacilityUpgradeButtonStates(); // For facilities
    updateResearchButtonStates(); // For research items
}


function updateGameData() {
    // Recalculate all core stats
    gameState.rentPerSecond = parseFloat(calculateTotalPropertiesRPS().toFixed(2));
    gameState.facilityUpkeepPerSecond = parseFloat(calculateTotalFacilityUpkeep().toFixed(2));
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    // Update displays that depend on these calculations
    updateUIDisplays();

    // Re-render lists as underlying data might have changed significantly
    displayAvailableProperties(); // Might change if research unlocks new ones
    displayOwnedProperties();
    displayAvailableFacilities(); // Availability depends on research
    displayOwnedFacilities();
    displayResearchOptions();
}

function initGame() {
    console.log("Metropolis Estates Initializing...");

    // Initial UI render (some parts might be hidden until unlocked)
    initialRender(); // Defined in ui.js - sets up initial property list, etc.
    updateGameData(); // Calculate initial RPS, upkeep, netRPS, update all displays

    // Start the game loop
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    logMessage("Game initialized. Your empire awaits!", "success");

    // Make initial facility (Lumber Mill) available if not research-locked by default
    // Or make basic_education research available by default
    if (!RESEARCH_TOPICS.find(rt => rt.id === "basic_education").costRP > 0) {
        // If basic_education is free or doesn't exist, or if we want to kickstart science
        // gameState.unlockedResearch.push("basic_education"); // Auto-unlock it for testing
    }
    // Ensure displays for new resources are visible if starting with them or if they become non-zero
    if(gameState.buildingMaterials > 0) document.getElementById('building-materials-display').style.display = 'inline-block';
    if(gameState.researchPoints > 0 || gameState.unlockedResearch.includes("basic_education")) {
         document.getElementById('research-points-display').style.display = 'inline-block';
         document.getElementById('research-section').style.display = 'block';
    }
    if(gameState.facilityUpkeepPerSecond > 0) document.getElementById('total-upkeep-display').style.display = 'inline-block';


    displayAvailableFacilities(); // Call this to show initially available facilities
    displayResearchOptions();   // Call this to show initially available research
}

document.addEventListener('DOMContentLoaded', initGame);
