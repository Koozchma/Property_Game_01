// js/ui.js

const UIManager = {
    elements: {
        mpCountDisplay: document.getElementById('mp-count'),
        clickPowerDisplay: document.getElementById('click-power-display')
    },

    updateUI: function() {
        if (this.elements.mpCountDisplay) {
            // The example shows 218, but we'll update live from gameData
            this.elements.mpCountDisplay.textContent = formatNumber(gameData.manipulationPoints);
        }
        if (this.elements.clickPowerDisplay) {
            this.elements.clickPowerDisplay.textContent = formatNumber(gameData.mpPerClick);
        }
    }
};

// Simple number formatting
function formatNumber(number) {
    return Math.floor(number).toLocaleString();
}
