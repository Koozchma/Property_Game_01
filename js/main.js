// Metropolis Estates - main.js

// --- Game State Object ---
let gameState = {
    cash: 100, // Starting cash
    rentPerSecond: 0,
    // other global states can go here
};

// --- Game Loop ---
const GAME_TICK_INTERVAL = 1000; // 1 second
let gameLoopIntervalId;

function gameTick() {
    // 1. Add income from RPS
    let incomeThisTick = gameState.rentPerSecond; // RPS is already per second

    // Consider facility upkeep if facilities are active
    // let facilityUpkeepThisTick = calculateTotalFacilityUpkeep();
    // incomeThisTick -= facilityUpkeepThisTick;

    gameState.cash += incomeThisTick;

    // 2. Update UI
    updateCashDisplay();
    // RPS display is updated when properties are bought/sold/upgraded
    // Owned properties count also updated on buy/sell

    // 3. Update button states (buy/upgrade) based on current cash
    updateAllBuyButtonStates();
    updateAllUpgradeButtonStates();

    // 4. Check for game over or win conditions (later)
}

// --- Game Data Update ---
function updateGameData() {
    // This function is called whenever a significant change happens
    // (e.g., buying/selling/upgrading property)
    gameState.rentPerSecond = calculateTotalRPS();
    // let facilityUpkeep = calculateTotalFacilityUpkeep();
    // gameState.netRentPerSecond = gameState.rentPerSecond - facilityUpkeep; // If using net

    updateCashDisplay();
    updateRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    displayOwnedProperties(); // Re-render the list of owned properties
    updateAllBuyButtonStates(); // Ensure buy buttons are correctly enabled/disabled
    updateAllUpgradeButtonStates(); // Ensure upgrade buttons are correctly enabled/disabled
}


// --- Initialization ---
function initGame() {
    console.log("Metropolis Estates Initializing...");

    // Initial UI render
    initialRender();
    updateGameData(); // Calculate initial RPS, update displays

    // Start the game loop
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId); // Clear if already running
    gameLoopIntervalId = setInterval(gameTick, GAME_TICK_INTERVAL);

    logMessage("Game initialized. Good luck, Tycoon!", "success");
}

// --- Event Listeners & Startup ---
document.addEventListener('DOMContentLoaded', initGame);
