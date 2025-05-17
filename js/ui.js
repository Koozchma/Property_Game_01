// js/ui.js

const UIManager = {
    elements: {
        mpCountDisplay: document.getElementById('mp-count'),
        mpsCountDisplay: document.getElementById('mps-count'), // Added
        clickPowerDisplay: document.getElementById('click-power-display'),
        idleGeneratorsListDiv: document.getElementById('idle-generators-list') // Added
    },

    updateUI: function() {
        if (this.elements.mpCountDisplay) {
            this.elements.mpCountDisplay.textContent = formatNumber(gameData.manipulationPoints);
        }
        if (this.elements.mpsCountDisplay) { // Update MPS display
            this.elements.mpsCountDisplay.textContent = formatNumber(gameData.mps, 2); // Show 2 decimal places for MPS
        }
        if (this.elements.clickPowerDisplay) {
            this.elements.clickPowerDisplay.textContent = formatNumber(gameData.mpPerClick);
        }
        this.renderIdleGenerators(); // Re-render generators to update costs and owned counts
    },

    renderIdleGenerators: function() {
        if (!this.elements.idleGeneratorsListDiv) return;

        this.elements.idleGeneratorsListDiv.innerHTML = ''; // Clear existing generators

        gameData.idleGenerators.forEach(generator => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('generator-item');

            // Calculate current cost
            const currentCost = Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, generator.owned));
            generator.cost = currentCost; // Update gameData with current cost for buying logic

            itemDiv.innerHTML = `
                <div class="name">${generator.name}</div>
                <div class="description">${generator.description}</div>
                <div class="stats">Generates: ${formatNumber(generator.mps, 2)} MP/s each</div>
                <div class="owned">Owned: ${generator.owned}</div>
                <div class="cost-info">Cost: ${formatNumber(currentCost)} MP</div>
                <button id="buy-${generator.id}">Buy 1</button>
            `;
            this.elements.idleGeneratorsListDiv.appendChild(itemDiv);

            // Add event listener to the buy button
            const buyButton = itemDiv.querySelector(`#buy-${generator.id}`);
            if (buyButton) {
                buyButton.addEventListener('click', () => {
                    Game.buyGenerator(generator.id);
                });
                // Disable button if player can't afford it
                if (gameData.manipulationPoints < currentCost) {
                    buyButton.disabled = true;
                }
            }
        });
    }
};

// Simple number formatting (updated to handle decimals)
function formatNumber(number, decimals = 0) {
    if (typeof number !== 'number') return '0';
    // For very small numbers that are not zero, toFixed might show "0.00"
    // if (number > 0 && number < Math.pow(0.1, decimals)) {
    //     return number.toExponential(decimals > 0 ? decimals -1 : 0);
    // }
    return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
