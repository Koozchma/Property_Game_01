// Metropolis Estates - main.js (v0.5.2 - Sequential Unlocks Progression)

/**
 * Represents the overall state of the game.
 * This object is globally accessible and modified by game logic.
 */
let gameState = {
    cash: 1000, // Starting cash, enough for initial research
    rentPerSecond: 0, // Gross RPS from all owned rental properties
    netRentPerSecond: 0, // Net RPS after any global upkeep (currently no global upkeep)
    
    buildingMaterials: 0, // Current stock of building materials
    researchPoints: 0,    // Current stock of research points

    // Per-second generation rates for resources.
    // These are updated by research completions and outputs from built facilities.
    buildingMaterialsPerSecond: 0,
    researchPointsPerSecond: 0,

    unlockedResearch: [], // Array of research topic IDs that have been completed
    // ownedProperties and ownedFacilities are managed in their respective .js files
};

const GAME_TICK_INTERVAL = 1000; // Game updates every 1 second
let gameLoopIntervalId; // Stores the ID for the setInterval, to allow clearing it if needed

/**
 * The main game loop function, executed every GAME_TICK_INTERVAL.
 * Handles resource generation, income calculation, and updating dynamic UI elements.
 */
function gameTick() {
    // 1. Generate resources based on per-second rates stored in gameState
    // These rates are calculated in updateGameData based on research and facility outputs
    gameState.researchPoints += gameState.researchPointsPerSecond;
    gameState.buildingMaterials += gameState.buildingMaterialsPerSecond;

    // 2. Calculate income
    // gameState.rentPerSecond is the gross income from properties, calculated in updateGameData.
    // In this model, there's no separate facility upkeep reducing netRPS here,
    // as facility upkeep is already factored into their impact or is a direct RPS cost if designed that way.
    // If a global upkeep mechanic were added, it would be subtracted here.
    gameState.netRentPerSecond = gameState.rentPerSecond; 
    gameState.cash += gameState.netRentPerSecond; // Add net income for the tick

    // Handle potential negative cash scenarios (optional, basic for now)
    if (gameState.cash < 0 && ownedProperties.length > 0) { // Check if any properties are owned
        // console.warn("[GAME] Warning: Cash is negative! Consider selling assets.");
    }

    // 3. Update frequently changing UI stat displays
    // These functions are defined in ui.js
    updateCashDisplay(); 
    updateBuildingMaterialsDisplay(); 
    updateResearchPointsDisplay();    
    updateNetRPSDisplay(); // RPS can change if properties are bought/sold/upgraded, which triggers updateGameData
}

/**
 * Central function to recalculate all derived game statistics and refresh the entire UI.
 * This is called after any major state change in the game, such as:
 * - Completing a research topic.
 * - Buying or selling a rental property.
 * - Buying or selling a facility (if facilities were still individually bought).
 * - Upgrading a property or facility.
 */
function updateGameData() {
    ensureUIInitialized(); // Ensure UI elements are ready (from ui.js)

    // 1. Recalculate total gross RPS from all owned properties.
    // calculateTotalPropertiesRPS (from properties.js) should factor in property levels,
    // specific upgrades, and any global RPS buffs from completed research.
    gameState.rentPerSecond = calculateTotalPropertiesRPS(); 
    gameState.netRentPerSecond = gameState.rentPerSecond; // Update netRPS (no global upkeep currently)

    // 2. Recalculate global per-second resource generation rates.
    // These rates come from two sources:
    //    a) Direct grants from completed research topics (grantsResourcePerSecond property).
    //    b) Output from currently owned and operational facilities (e.g., Lumber Mills, Science Labs).
    let newRPperSec = 0;
    let newMatPerSec = 0;

    // a) Add passive generation from completed research topics
    gameState.unlockedResearch.forEach(researchId => {
        const topic = getResearchTopicById(researchId); // from facilities.js
        if (topic && topic.grantsResourcePerSecond) {
            if (topic.grantsResourcePerSecond.resource === "researchPoints") {
                newRPperSec += topic.grantsResourcePerSecond.amount;
            } else if (topic.grantsResourcePerSecond.resource === "buildingMaterials") {
                newMatPerSec += topic.grantsResourcePerSecond.amount;
            }
            // Add other resource types here if research can grant them
        }
    });

    // b) Add generation from BUILT facilities (if any are producing these resources)
    // ownedFacilities is an array defined in facilities.js
    ownedFacilities.forEach(facilityInstance => { 
       if (facilityInstance.currentOutput) { // currentOutput is calculated by calculateFacilityStats
           if (facilityInstance.currentOutput.resource === 'researchPoints') {
               newRPperSec += facilityInstance.currentOutput.amount;
           }
           if (facilityInstance.currentOutput.resource === 'buildingMaterials') {
               newMatPerSec += facilityInstance.currentOutput.amount;
           }
           // Add other facility outputs here
       }
    });

    gameState.researchPointsPerSecond = parseFloat(newRPperSec.toFixed(2));
    gameState.buildingMaterialsPerSecond = parseFloat(newMatPerSec.toFixed(2));

    // 3. Update all static stat displays in the UI header
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay(); // Will now show the new +X/s rate
    updateResearchPointsDisplay();    // Will now show the new +X/s rate
    // updateTotalUpkeepDisplay(); // No upkeep display if no individual facility upkeep

    // 4. Refresh the main content area based on the current view.
    // displayCurrentViewContent (from ui.js) handles rendering the correct lists
    // (e.g., available rentals, owned portfolio, research options) and also calls
    // updateAllButtonStatesForCurrentView to refresh button states.
    displayCurrentViewContent(); 
}

/**
 * Initializes the game state, UI, and starts the game loop.
 * This function is called once the HTML document is fully loaded.
 */
function initGame() {
    console.log(`Metropolis Estates Initializing (v0.5.2 - Sequential Unlocks)... ${new Date().toLocaleTimeString()}`);
    
    // Set the default starting view for the player.
    // According to the new progression, starting on 'research' is logical.
    currentView = 'research'; 

    // initialRender (from ui.js) does the following:
    // 1. Calls initializeUIElements() to get references to HTML elements.
    // 2. If successful, updates initial static stat displays.
    // 3. Calls switchView(currentView), which then calls updateGameData() to populate the view.
    initialRender(); 
    
    // Start the main game loop
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId); // Clear any existing loop
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);
    
    console.log("[GAME] Game initialized. Your scientific endeavors await!");
}

// Event listener to start the game once the HTML DOM is fully loaded and parsed.
document.addEventListener('DOMContentLoaded', initGame);
