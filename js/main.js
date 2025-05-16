// Metropolis Estates - main.js

let gameState = {
    cash: 200, // Starting cash
    rentPerSecond: 0, // Gross RPS from properties
    netRentPerSecond: 0, // RPS after facility upkeep
    facilityUpkeepPerSecond: 0,
    buildingMaterials: 0,
    researchPoints: 0,
    unlockedResearch: [], // Array of research topic IDs that have been completed
    // gameState.activeBuffs is removed; buffs are applied dynamically by checking unlockedResearch
};

const GAME_TICK_INTERVAL = 1000; // 1 second
let gameLoopIntervalId;

function gameTick() {
    // 1. Apply facility outputs (generate resources)
    applyFacilityOutputs();

    // 2. Calculate income & expenses
    // Gross RPS and Facility upkeep are now calculated in updateGameData and stored in gameState

    let incomeThisTick = gameState.rentPerSecond; // This is already affected by buffs if calculateTotalPropertiesRPS handles it
    let expensesThisTick = gameState.facilityUpkeepPerSecond;

    gameState.cash += (incomeThisTick - expensesThisTick);

    if (gameState.cash < -10000 && ownedProperties.length > 0) { // Example threshold for debt warning
        logMessage("Warning: Cash is significantly negative! Consider selling assets or reducing upkeep.", "error");
    }

    // 3. Update UI for dynamic values (cash, resources that change per tick)
    updateCashDisplay();
    updateBuildingMaterialsDisplay(); // If they change per tick and aren't just on purchase
    updateResearchPointsDisplay();    // Same as above

    // Button states are best updated in updateGameData or after specific actions,
    // but can be refreshed here less frequently if performance allows.
    // For simplicity, they are updated in updateGameData.
}

// This function is central to updating all calculated stats and triggering UI refreshes
function updateGameData() {
    // Recalculate all core stats
    // Order matters: buffs might affect property RPS or facility upkeep/output

    // 1. Calculate total gross RPS from properties (this function should consider buffs)
    gameState.rentPerSecond = parseFloat(calculateTotalPropertiesRPS().toFixed(2));

    // 2. Calculate total facility upkeep (this function could also consider buffs if any applied to upkeep)
    gameState.facilityUpkeepPerSecond = parseFloat(calculateTotalFacilityUpkeep().toFixed(2));

    // 3. Calculate net RPS
    gameState.netRentPerSecond = parseFloat((gameState.rentPerSecond - gameState.facilityUpkeepPerSecond).toFixed(2));

    // 4. Update all relevant UI display elements that show these calculated values
    updateUIDisplays();

    // 5. Re-render lists and button states as underlying data or availability might have changed
    displayAvailableProperties();
    displayOwnedProperties();
    displayAvailableFacilities();
    displayOwnedFacilities();
    displayResearchOptions();

    // Explicitly update all button states after data changes and lists are re-rendered
    updateAllBuyButtonStates();
    updateAllFacilityBuyButtonStates();
    updateAllUpgradeButtonStates(); // For properties
    updateAllFacilityUpgradeButtonStates();
    updateResearchButtonStates();
}


// Consolidates calls to individual UI update functions for stats
function updateUIDisplays() {
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();
}


function initGame() {
    console.log("Metropolis Estates Initializing (v0.1.0)...");
    console.log("Current Date/Time (Client): " + new Date().toString());
    // Attempt to get a more accurate time if needed, but for an idle game, client time is usually fine.
    // For persistent state or server interaction, server time would be critical.

    // Initial UI render (some parts might be hidden until unlocked)
    initialRender();    // Defined in ui.js - sets up initial property/facility/research lists, etc.
    updateGameData();   // Calculate initial RPS, upkeep, netRPS, update all displays & button states

    // Start the game loop
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    logMessage("Game initialized. Your empire awaits!", "success");

    // Ensure displays for new resources are visible if they have starting values or become relevant
    // These checks are also handled in their respective update functions now if they become > 0
    if(gameState.buildingMaterials > 0 || FACILITY_TYPES.find(f=>f.id==="lumber_mill" && !f.requiredResearch)) { // Show if starting with some or if Lumber Mill is available
        document.getElementById('building-materials-display').style.display = 'inline-block';
    }
    if(gameState.researchPoints > 0 || gameState.unlockedResearch.includes("basic_education") || RESEARCH_TOPICS.find(rt=>rt.id === "basic_education" && rt.costRP <= gameState.researchPoints)) {
         document.getElementById('research-points-display').style.display = 'inline-block';
         document.getElementById('research-section').style.display = 'block';
    }
    // Total upkeep display visibility is handled if upkeep > 0 by its update function or buyFacility.

    // Call these once after init to ensure lists are populated based on initial game state (e.g. research)
    displayAvailableFacilities();
    displayResearchOptions();
}

// --- Event Listeners & Startup ---
document.addEventListener('DOMContentLoaded', initGame);
