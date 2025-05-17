// js/ui.js

// This object will manage all UI updates
const UIManager = {
    // Store references to frequently updated HTML elements
    elements: {
        mpCountDisplay: document.getElementById('mp-count'),
        clickPowerDisplay: document.getElementById('click-power-display'),
        currentDateDisplay: document.getElementById('current-date')
        // Add more elements here as your UI grows
        // manipulateImage: document.getElementById('manipulate-image') // Can be added if direct JS animation is needed
    },

    // Function to update all visible game data
    updateUI: function() {
        if (this.elements.mpCountDisplay) {
            this.elements.mpCountDisplay.textContent = formatNumber(gameData.manipulationPoints);
        }
        if (this.elements.clickPowerDisplay) {
            this.elements.clickPowerDisplay.textContent = formatNumber(gameData.mpPerClick);
        }
        // Add more UI updates here (e.g., for generators, research items)
    },

    // Function to update the current date (example of dynamic content)
    updateDate: function() {
        if (this.elements.currentDateDisplay) {
            const today = new Date();
            // Using current date from user's system, not the fixed date from prompt
            this.elements.currentDateDisplay.textContent = today.toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }
};

// Helper function to format numbers (optional, but good for larger numbers later)
function formatNumber(number) {
    // Simple formatting for now, can be expanded (e.g., K, M, B for thousands, millions)
    return Math.floor(number).toLocaleString();
}
