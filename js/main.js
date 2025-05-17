// js/main.js

const Game = {
    gameLoopInterval: null, // To store the interval ID

    init: function() {
        console.log("Psychopath Game Initialized with Generators.");

        const manipulateImage = document.getElementById('manipulate-image');
        if (manipulateImage) {
            manipulateImage.addEventListener('click', () => {
                this.earnMPOnClick();
            });
        } else {
            console.error("ERROR: Clickable image 'manipulate-image' not found!");
        }

        // Initial UI update
        UIManager.updateUI(); // This will also call renderIdleGenerators

        // Start the game loop (10 times per second for smoother updates)
        this.gameLoopInterval = setInterval(() => this.gameTick(), 100); // 100ms = 10 ticks per second
    },

    earnMPOnClick: function() {
        gameData.manipulationPoints += gameData.mpPerClick;
        UIManager.updateUI(); // Update display and generator button states
    },

    buyGenerator: function(generatorId) {
        const generator = gameData.idleGenerators.find(gen => gen.id === generatorId);
        if (!generator) {
            console.error("Generator not found:", generatorId);
            return;
        }

        // Recalculate cost just before buying to be sure
        const currentCost = Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, generator.owned));
        generator.cost = currentCost;


        if (gameData.manipulationPoints >= generator.cost) {
            gameData.manipulationPoints -= generator.cost;
            generator.owned++;
            // Cost for the *next* one is now higher, but this will be recalculated on render
            // generator.cost = Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, generator.owned));
            this.recalculateMPS();
            UIManager.updateUI(); // Update display, including new costs and owned counts
        } else {
            console.log("Not enough MP to buy", generator.name);
            // Optionally, provide visual feedback to the player
        }
    },

    recalculateMPS: function() {
        let totalMPS = 0;
        gameData.idleGenerators.forEach(generator => {
            totalMPS += generator.owned * generator.mps;
        });
        gameData.mps = totalMPS;
    },

    gameTick: function() {
        // Calculate passive MP gain for this tick
        // Since gameTick is 10x per second, divide MPS by 10
        const passiveMPThisTick = gameData.mps / 10;
        gameData.manipulationPoints += passiveMPThisTick;

        // Update UI (only essential parts for performance, or full update if simple enough)
        // For now, a full UI update is fine for a simple game.
        // More optimized would be to only update mp-count and mps-count here,
        // and generator button states less frequently or on interaction.
        UIManager.updateUI();
    }
};

// Start the game logic when the HTML is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
