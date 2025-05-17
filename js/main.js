// js/main.js

const Game = {
    init: function() {
        console.log("Psychopath Clicker Section Initialized.");

        const manipulateImage = document.getElementById('manipulate-image');
        if (manipulateImage) {
            manipulateImage.addEventListener('click', () => {
                this.earnMP();
            });
        } else {
            console.error("ERROR: Clickable image 'manipulate-image' not found!");
        }

        // Initial UI update to show 0 MP and 1 MP per click
        UIManager.updateUI();
    },

    earnMP: function() {
        gameData.manipulationPoints += gameData.mpPerClick;
        UIManager.updateUI(); // Update the display after earning points
    }
};

// Start the game logic when the HTML is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
