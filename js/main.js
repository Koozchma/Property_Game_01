// js/main.js

const Game = {
    // Initialize the game
    init: function() {
        console.log("Psychopath Game: Initialization sequence started...");

        // Setup event listeners
        const manipulateImage = document.getElementById('manipulate-image');
        if (manipulateImage) {
            manipulateImage.addEventListener('click', () => {
                this.earnMP();
                // Optional: Add a class for JS-driven animation if CSS :active isn't enough
                // manipulateImage.classList.add('clicked-animation');
                // setTimeout(() => manipulateImage.classList.remove('clicked-animation'), 100);
            });
        } else {
            console.error("ERROR: Main manipulation image not found! Check ID 'manipulate-image'.");
        }

        // Initial UI setup
        UIManager.updateUI();
        UIManager.updateDate(); // Set the date on load

        // Start the game loop (for passive income, time-based events later)
        // For now, it's simple, but can be expanded.
        // this.gameLoopInterval = setInterval(() => this.gameTick(), 1000); // 1 tick per second

        console.log("Psychopath Game: Ready to manipulate!");
    },

    // Function to earn Manipulation Points
    earnMP: function() {
        gameData.manipulationPoints += gameData.mpPerClick;
        UIManager.updateUI(); // Update the display
        // console.log(`Earned ${gameData.mpPerClick} MP. Total: ${gameData.manipulationPoints}`);
    },

    // The main game tick (called by setInterval)
    gameTick: function() {
        // This is where passive MP generation will happen
        // let passiveMPGain = 0;
        // gameData.idleGenerators.forEach(gen => { passiveMPGain += gen.owned * gen.mps; });
        // gameData.manipulationPoints += passiveMPGain;

        // Update UI every tick
        UIManager.updateUI();
        // console.log("Game tick. Current MP:", gameData.manipulationPoints);
    }

    // More game logic functions will go here:
    // buyGenerator(generatorId) { ... }
    // purchaseResearch(researchId) { ... }
    // saveData() { ... }
    // loadData() { ... }
};

// Wait for the HTML to be fully loaded before starting the game
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
