// Metropolis Estates - ui.js

const cashDisplay = document.getElementById('cash-display');
const netRpsDisplay = document.getElementById('rps-display'); // ID is still 'rps-display' in HTML
const ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
const buildingMaterialsDisplay = document.getElementById('building-materials-display');
const researchPointsDisplay = document.getElementById('research-points-display');
const totalUpkeepDisplay = document.getElementById('total-upkeep-display');

const availablePropertiesList = document.getElementById('available-properties-list');
const ownedPropertiesList = document.getElementById('owned-properties-list');
const messageLogElement = document.getElementById('message-log');

const availableFacilitiesList = document.getElementById('available-facilities-list');
const ownedFacilitiesList = document.getElementById('owned-facilities-list');
const researchOptionsList = document.getElementById('research-options-list');


function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) { // Added isNaN check
        // console.warn("formatNumber called with invalid number:", num); // Optional: for debugging
        return 'N/A'; // Or '0.00' or some other placeholder
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function updateCashDisplay() {
    if (cashDisplay) cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`;
}

function updateNetRPSDisplay() {
    if (netRpsDisplay) netRpsDisplay.textContent = `Net RPS: $${formatNumber(gameState.netRentPerSecond)}/s`;
}

function updateOwnedPropertiesCountDisplay() {
    if (ownedPropertiesCountDisplay) ownedPropertiesCountDisplay.textContent = `Properties: ${ownedProperties.length}`;
}

function updateBuildingMaterialsDisplay() {
    if (buildingMaterialsDisplay) {
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)}`;
    }
}

function updateResearchPointsDisplay() {
    if (researchPointsDisplay) {
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)}`;
    }
}
function updateTotalUpkeepDisplay() {
     if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
    }
}

function displayAvailableProperties() {
    if (!availablePropertiesList) return;

    // (b) Change the name of available Properties, to Rentals
    const propertiesSectionTitle = availablePropertiesList.parentElement.querySelector('h2');
    if (propertiesSectionTitle) {
        propertiesSectionTitle.textContent = 'Available Rentals';
    }

    availablePropertiesList.innerHTML = ''; // Clear existing list

    PROPERTY_TYPES.forEach(propType => { // PROPERTY_TYPES from properties.js
        if (!propType || typeof propType.baseCost === 'undefined' || typeof propType.baseRPS === 'undefined') {
            console.error("Skipping invalid property type in displayAvailableProperties:", propType);
            return; // Skip this iteration if propType is malformed
        }

        // (a) Stop the increase in building cost, I need this flatlined.
        // This change is in properties.js: calculateDynamicPropertyCost now returns propType.baseCost
        const currentCost = calculateDynamicPropertyCost(propType); // from properties.js

        const baseRPSDisplay = typeof propType.baseRPS === 'number' ? propType.baseRPS.toLocaleString() : 'N/A';
        const currentCostDisplay = typeof currentCost === 'number' ? currentCost.toLocaleString() : 'N/A';

        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `
            <h3>${propType.name || 'Unnamed Property'}</h3>
            <p>${propType.description || 'No description.'}</p>
            <p class="prop-cost">Cost: $${currentCostDisplay}</p>
            <p>Base RPS: $${baseRPSDisplay}/s</p>
            <p>Main Level Max: ${propType.mainLevelMax || 'N/A'}</p>
            <button onclick="buyProperty('${propType.id}')" id="buy-prop-${propType.id}-btn" ${typeof currentCost !== 'number' || gameState.cash < currentCost ? 'disabled' : ''}>Buy</button>
        `;
        availablePropertiesList.appendChild(card);
    });

    if (availablePropertiesList.children.length === 0 && PROPERTY_TYPES.length > 0) {
        availablePropertiesList.innerHTML = '<p>No properties currently meet display criteria or all are invalid.</p>';
    } else if (PROPERTY_TYPES.length === 0) {
        availablePropertiesList.innerHTML = '<p>No property types defined.</p>';
    }
}

function displayOwnedProperties() {
    if (!ownedPropertiesList) return;
    ownedPropertiesList.innerHTML = '';

    if (ownedProperties.length === 0) {
        ownedPropertiesList.innerHTML = '<p>You don\'t own any properties yet.</p>';
        return;
    }

    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId); // from properties.js
        if (!propType) {
            console.error("Could not find property type for owned instance:", propInst);
            return; // Skip this malformed instance
        }

        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInst.uniqueId);

        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (propType.upgrades && propType.upgrades.length > 0) {
            propType.upgrades.forEach(upgDef => {
                const currentTier = propInst.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor((typeof upgDef.cost === 'number' ? upgDef.cost : Infinity) * Math.pow(1.5, currentTier));
                const materialsNextTier = upgDef.requiresMaterials ? Math.floor((typeof upgDef.requiresMaterials === 'number' ? upgDef.requiresMaterials : 0) * Math.pow(1.2, currentTier)) : 0;

                let materialUsageEfficiency = 1; // Recalculate efficiency for display
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buffResearch = getResearchTopicById("advanced_material_processing");
                    if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                        materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                    }
                }
                const actualMaterialsNextTierDisplay = Math.floor(materialsNextTier * materialUsageEfficiency);


                let disabledReason = "";
                if (currentTier >= upgDef.maxTier) disabledReason = "Max Tier";
                else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) disabledReason = "Needs Research";
                else if (gameState.cash < costNextTier) disabledReason = "Low Cash";
                else if (actualMaterialsNextTierDisplay > 0 && gameState.buildingMaterials < actualMaterialsNextTierDisplay) disabledReason = "Low Materials";

                upgradesHTML += `
                    <button onclick="applySpecificPropertyUpgrade(${propInst.uniqueId}, '${upgDef.id}')"
                            title="RPS Boost: +${formatNumber(upgDef.rpsBoost,2)}/tier. Materials: ${actualMaterialsNextTierDisplay > 0 ? actualMaterialsNextTierDisplay : '0'}"
                            ${disabledReason ? 'disabled' : ''}>
                        ${upgDef.name} (${currentTier}/${upgDef.maxTier})
                        ${disabledReason ? ` (${disabledReason})` : ` ($${formatNumber(costNextTier,0)})`}
                    </button>
                `;
            });
        } else {
            upgradesHTML += '<p>No specific upgrades available.</p>';
        }
        upgradesHTML += '</div>';

        const mainLevelUpgradeCost = Math.floor((typeof propInst.purchaseCost === 'number' ? propInst.purchaseCost : Infinity) * 0.3 * Math.pow(1.8, propInst.mainLevel -1));
        let mainLevelDisabledReason = "";
        if (propInst.mainLevel >= propType.mainLevelMax) mainLevelDisabledReason = "Max Level";
        else if (gameState.cash < mainLevelUpgradeCost) mainLevelDisabledReason = "Low Cash";


        card.innerHTML = `
            <h3>${propInst.name || 'Unnamed Property'} (ID: ${propInst.uniqueId})</h3>
            <p class="prop-level">Main Level: ${propInst.mainLevel || 0} / ${propType.mainLevelMax || 'N/A'}</p>
            <p class="prop-rps">Current RPS: $${formatNumber(propInst.currentRPS)}/s</p>
            <p>Original Cost: $${formatNumber(propInst.purchaseCost, 0)}</p>
            <button class="upgrade-main-btn" onclick="upgradePropertyMainLevel(${propInst.uniqueId})"
                ${mainLevelDisabledReason ? 'disabled' : ''}>
                ${mainLevelDisabledReason ? mainLevelDisabledReason : `Upgrade Main Lvl ($${formatNumber(mainLevelUpgradeCost,0)})`}
            </button>
            ${upgradesHTML}
            <button class="sell-btn" style="margin-top:10px;" onclick="sellPropertyInstance(${propInst.uniqueId})">
                Sell (Value Varies)
            </button>
        `;
        ownedPropertiesList.appendChild(card);
    });
}

function displayAvailableFacilities() {
    if (!availableFacilitiesList) return;

    // (b) Change available Facilities to Construction
    const facilitiesSectionTitle = availableFacilitiesList.parentElement.querySelector('h2');
    if (facilitiesSectionTitle) {
        facilitiesSectionTitle.textContent = 'Available Construction';
    }

    availableFacilitiesList.innerHTML = ''; // Clear existing list
    let displayedCount = 0;

    FACILITY_TYPES.forEach(facType => { // FACILITY_TYPES from facilities.js
        if (!isFacilityTypeUnlocked(facType.id)) { // from facilities.js
            return;
        }
        if (!facType || typeof facType.cost === 'undefined' || typeof facType.baseUpkeepRPS === 'undefined') {
            console.error("Skipping invalid facility type in displayAvailableFacilities:", facType);
            return;
        }
        displayedCount++;
        // (a) Stop the increase in building cost (for facilities) - Assuming similar flatline logic in facilities.js for calculateFacilityDynamicCost
        // For facilities, calculateFacilityDynamicCost in facilities.js should be modified like this:
        // function calculateFacilityDynamicCost(facilityType) { return facilityType.cost; }
        const currentCost = calculateFacilityDynamicCost(facType); // from facilities.js

        const currentCostDisplay = typeof currentCost === 'number' ? currentCost.toLocaleString() : 'N/A';
        const baseUpkeepDisplay = typeof facType.baseUpkeepRPS === 'number' ? facType.baseUpkeepRPS.toLocaleString() : 'N/A';

        const card = document.createElement('div');
        card.className = 'facility-card';
        let outputText = "No direct output";
        if (facType.output && typeof facType.output.amount === 'number') {
            outputText = `${formatNumber(facType.output.amount,3)}/s ${facType.output.resource}`;
        } else if (facType.effects) {
            outputText = "Global Buff";
        }

        card.innerHTML = `
            <h3>${facType.name || 'Unnamed Facility'}</h3>
            <p>${facType.description || 'No description.'}</p>
            <p class="facility-cost">Cost: $${currentCostDisplay}</p>
            <p class="facility-upkeep">Base Upkeep: $${baseUpkeepDisplay}/s</p>
            <p class="facility-output">Base Output: ${outputText}</p>
            <button onclick="buyFacility('${facType.id}')" id="buy-fac-${facType.id}-btn" ${typeof currentCost !== 'number' || gameState.cash < currentCost ? 'disabled' : ''}>Build</button>
        `;
        availableFacilitiesList.appendChild(card);
    });

    if (displayedCount === 0 && FACILITY_TYPES.length > 0) {
        availableFacilitiesList.innerHTML = '<p>No construction options currently meet display criteria or all are invalid.</p>'; // Updated text
    } else if (FACILITY_TYPES.length === 0) {
         availableFacilitiesList.innerHTML = '<p>No construction types defined.</p>'; // Updated text
    }
}

function displayOwnedFacilities() {
    if (!ownedFacilitiesList) return;
    ownedFacilitiesList.innerHTML = '';

    if (ownedFacilities.length === 0) {
        ownedFacilitiesList.innerHTML = '<p>You don\'t own any facilities yet.</p>';
        return;
    }

    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId); // from facilities.js
        if (!facType) {
            console.error("Could not find facility type for owned instance:", facInst);
            return;
        }

        const card = document.createElement('div');
        card.className = 'owned-facility-card';
        card.setAttribute('data-id', facInst.uniqueId);

        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (facType.upgrades && facType.upgrades.length > 0) {
            facType.upgrades.forEach(upgDef => {
                const currentTier = facInst.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor((typeof upgDef.cost === 'number' ? upgDef.cost : Infinity) * Math.pow(1.6, currentTier));
                const materialsNeededBase = upgDef.requiresMaterials ? Math.floor((typeof upgDef.requiresMaterials === 'number' ? upgDef.requiresMaterials : 0) * Math.pow(1.2, currentTier)) : 0;

                let materialUsageEfficiency = 1;
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buffResearch = getResearchTopicById("advanced_material_processing");
                    if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                        materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                    }
                }
                const actualMaterialsNeededDisplay = Math.floor(materialsNeededBase * materialUsageEfficiency);

                let disabledReason = "";
                if (currentTier >= upgDef.maxTier) disabledReason = "Max Tier";
                else if (gameState.cash < costNextTier) disabledReason = "Low Cash";
                else if (actualMaterialsNeededDisplay > 0 && gameState.buildingMaterials < actualMaterialsNeededDisplay) disabledReason = "Low Materials";


                upgradesHTML += `
                    <button onclick="applySpecificFacilityUpgrade(${facInst.uniqueId}, '${upgDef.id}')"
                            title="Materials: ${actualMaterialsNeededDisplay > 0 ? actualMaterialsNeededDisplay : '0'}"
                            ${disabledReason ? 'disabled' : ''}>
                        ${upgDef.name} (${currentTier}/${upgDef.maxTier})
                        ${disabledReason ? ` (${disabledReason})` : ` ($${formatNumber(costNextTier,0)})`}
                    </button>
                `;
            });
        } else {
            upgradesHTML += '<p>No specific upgrades.</p>';
        }
        upgradesHTML += '</div>';

        const mainLevelUpgradeCost = Math.floor((typeof facType.cost === 'number' ? facType.cost : Infinity) * 0.4 * Math.pow(1.7, facInst.mainLevel -1));
        let mainLevelDisabledReason = "";
        if (facInst.mainLevel >= facType.mainLevelMax) mainLevelDisabledReason = "Max Level";
        else if (gameState.cash < mainLevelUpgradeCost) mainLevelDisabledReason = "Low Cash";

        let outputText = "Provides Global Buff";
        if (facInst.currentOutput && typeof facInst.currentOutput.amount === 'number') {
             outputText = `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}`;
        } else if (!facType.effects) {
            outputText = "No direct output or buff";
        }


        card.innerHTML = `
            <h3>${facInst.name || 'Unnamed Facility'} (ID: ${facInst.uniqueId})</h3>
            <p class="prop-level">Main Level: ${facInst.mainLevel || 0} / ${facType.mainLevelMax || 'N/A'}</p>
            <p class="facility-upkeep">Current Upkeep: $${formatNumber(facInst.currentUpkeepRPS)}/s</p>
            <p class="facility-output">Current Output: ${outputText}</p>
            <button class="upgrade-main-btn" onclick="upgradeFacilityMainLevel(${facInst.uniqueId})"
                 ${mainLevelDisabledReason ? 'disabled' : ''}>
                ${mainLevelDisabledReason ? mainLevelDisabledReason : `Upgrade Main Lvl ($${formatNumber(mainLevelUpgradeCost,0)})`}
            </button>
            ${upgradesHTML}
            <button class="sell-btn" style="margin-top:10px;" onclick="sellFacilityInstance(${facInst.uniqueId})">
                Demolish (Value: $${formatNumber(facType.cost * 0.5, 0)})
            </button>
        `;
        ownedFacilitiesList.appendChild(card);
    });
}

function displayResearchOptions() {
    if (!researchOptionsList) return;
    researchOptionsList.innerHTML = '';
    let displayedCount = 0;

    RESEARCH_TOPICS.forEach(topic => { // from facilities.js
        if (gameState.unlockedResearch.includes(topic.id)) {
            return;
        }
        if (!topic || typeof topic.costRP === 'undefined') {
            console.error("Skipping invalid research topic:", topic);
            return;
        }

        const requiredLabsCount = topic.requiredLabs || 0;
        const ownedScienceLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;
        let canResearch = gameState.researchPoints >= topic.costRP && ownedScienceLabs >= requiredLabsCount;
        let disabledTooltip = "";
        if(ownedScienceLabs < requiredLabsCount) {
            disabledTooltip = ` (Needs ${requiredLabsCount} Lab(s))`;
        } else if (gameState.researchPoints < topic.costRP) {
            disabledTooltip = ` (Needs ${topic.costRP} RP)`;
        }


        displayedCount++;
        const card = document.createElement('div');
        card.className = 'research-item-card';
        card.innerHTML = `
            <h3>${topic.name || 'Unnamed Research'}</h3>
            <p>${topic.description || 'No description.'}</p>
            <p class="research-cost">Cost: ${formatNumber(topic.costRP,1)} RP. Labs Req: ${requiredLabsCount}</p>
            <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn" ${!canResearch ? 'disabled' : ''}>Research${disabledTooltip}</button>
        `;
        researchOptionsList.appendChild(card);
    });

    if (displayedCount === 0 && RESEARCH_TOPICS.length > 0 && gameState.unlockedResearch.length === RESEARCH_TOPICS.length) {
         researchOptionsList.innerHTML = '<p>All available research completed!</p>';
    } else if (displayedCount === 0 && RESEARCH_TOPICS.length > 0) {
        researchOptionsList.innerHTML = '<p>No new research available or requirements not met (e.g. need more labs).</p>';
    } else if (RESEARCH_TOPICS.length === 0) {
        researchOptionsList.innerHTML = '<p>No research topics defined.</p>';
    }
}


function updateAllBuyButtonStates() {
    PROPERTY_TYPES.forEach(propType => {
        if (!propType || typeof propType.baseCost === 'undefined') return;
        const currentCost = calculateDynamicPropertyCost(propType);
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) buyButton.disabled = typeof currentCost !== 'number' || gameState.cash < currentCost;
    });
}
function updateAllFacilityBuyButtonStates() {
    FACILITY_TYPES.forEach(facType => {
         if (!isFacilityTypeUnlocked(facType.id) || !facType || typeof facType.cost === 'undefined') return;
        const currentCost = calculateFacilityDynamicCost(facType);
        const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
        if (buyButton) buyButton.disabled = typeof currentCost !== 'number' || gameState.cash < currentCost;
    });
}

function updateAllUpgradeButtonStates() { // For properties
    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId);
        if (!propType) return;

        const mainUpgradeButton = ownedPropertiesList.querySelector(`.owned-property-card[data-id='${propInst.uniqueId}'] .upgrade-main-btn`);
        if (mainUpgradeButton) {
            const mainLevelUpgradeCost = Math.floor((typeof propInst.purchaseCost === 'number' ? propInst.purchaseCost : Infinity) * 0.3 * Math.pow(1.8, propInst.mainLevel -1));
            let disabledReason = "";
            if (propInst.mainLevel >= propType.mainLevelMax) disabledReason = "Max Level";
            else if (gameState.cash < mainLevelUpgradeCost) disabledReason = "Low Cash";
            mainUpgradeButton.disabled = !!disabledReason;
            mainUpgradeButton.textContent = disabledReason ? disabledReason : `Upgrade Main Lvl ($${formatNumber(mainLevelUpgradeCost,0)})`;
        }

        if (propType.upgrades) {
            propType.upgrades.forEach(upgDef => {
                const specificUpgradeButton = ownedPropertiesList.querySelector(`.owned-property-card[data-id='${propInst.uniqueId}'] button[onclick*="'${upgDef.id}'"]`);
                if (specificUpgradeButton) {
                    const currentTier = propInst.appliedUpgrades[upgDef.id] || 0;
                    const costNextTier = Math.floor((typeof upgDef.cost === 'number' ? upgDef.cost : Infinity) * Math.pow(1.5, currentTier));
                    const materialsNeededBase = upgDef.requiresMaterials ? Math.floor((typeof upgDef.requiresMaterials === 'number' ? upgDef.requiresMaterials : 0) * Math.pow(1.2, currentTier)) : 0;

                    let materialUsageEfficiency = 1;
                    if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                        const buffResearch = getResearchTopicById("advanced_material_processing");
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);

                    let disabledReason = "";
                    if (currentTier >= upgDef.maxTier) disabledReason = "Max Tier";
                    else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) disabledReason = "Needs Research";
                    else if (gameState.cash < costNextTier) disabledReason = "Low Cash";
                    else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) disabledReason = "Low Materials";

                    specificUpgradeButton.disabled = !!disabledReason;
                    specificUpgradeButton.textContent = `${upgDef.name} (${currentTier}/${upgDef.maxTier}) ${disabledReason ? ` (${disabledReason})` : ` ($${formatNumber(costNextTier,0)})`}`;
                }
            });
        }
    });
}
function updateAllFacilityUpgradeButtonStates() {
    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return;

        const mainUpgradeButton = ownedFacilitiesList.querySelector(`.owned-facility-card[data-id='${facInst.uniqueId}'] .upgrade-main-btn`);
         if (mainUpgradeButton) {
            const mainLevelUpgradeCost = Math.floor((typeof facType.cost === 'number' ? facType.cost : Infinity) * 0.4 * Math.pow(1.7, facInst.mainLevel -1));
            let disabledReason = "";
            if (facInst.mainLevel >= facType.mainLevelMax) disabledReason = "Max Level";
            else if (gameState.cash < mainLevelUpgradeCost) disabledReason = "Low Cash";
            mainUpgradeButton.disabled = !!disabledReason;
            mainUpgradeButton.textContent = disabledReason ? disabledReason : `Upgrade Main Lvl ($${formatNumber(mainLevelUpgradeCost,0)})`;
        }

        if (facType.upgrades) {
            facType.upgrades.forEach(upgDef => {
                const specificUpgradeButton = ownedFacilitiesList.querySelector(`.owned-facility-card[data-id='${facInst.uniqueId}'] button[onclick*="'${upgDef.id}'"]`);
                if (specificUpgradeButton) {
                    const currentTier = facInst.appliedUpgrades[upgDef.id] || 0;
                    const costNextTier = Math.floor((typeof upgDef.cost === 'number' ? upgDef.cost : Infinity) * Math.pow(1.6, currentTier));
                    const materialsNeededBase = upgDef.requiresMaterials ? Math.floor((typeof upgDef.requiresMaterials === 'number' ? upgDef.requiresMaterials : 0) * Math.pow(1.2, currentTier)) : 0;

                    let materialUsageEfficiency = 1;
                     if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                        const buffResearch = getResearchTopicById("advanced_material_processing");
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);


                    let disabledReason = "";
                     if (currentTier >= upgDef.maxTier) disabledReason = "Max Tier";
                     else if (gameState.cash < costNextTier) disabledReason = "Low Cash";
                     else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) disabledReason = "Low Materials";

                    specificUpgradeButton.disabled = !!disabledReason;
                    specificUpgradeButton.textContent = `${upgDef.name} (${currentTier}/${upgDef.maxTier}) ${disabledReason ? ` (${disabledReason})` : ` ($${formatNumber(costNextTier,0)})`}`;
                }
            });
        }
    });
}

function updateResearchButtonStates() {
    RESEARCH_TOPICS.forEach(topic => {
        if (!topic || typeof topic.costRP === 'undefined') return;
        if (!gameState.unlockedResearch.includes(topic.id)) {
            const researchButton = document.getElementById(`research-${topic.id}-btn`);
            if (researchButton) {
                const requiredLabsCount = topic.requiredLabs || 0;
                const ownedScienceLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;
                let canResearch = gameState.researchPoints >= topic.costRP && ownedScienceLabs >= requiredLabsCount;
                let disabledTooltip = "";
                 if(ownedScienceLabs < requiredLabsCount) {
                    disabledTooltip = ` (Needs ${requiredLabsCount} Lab(s))`;
                } else if (gameState.researchPoints < topic.costRP) {
                    disabledTooltip = ` (Needs ${formatNumber(topic.costRP,1)} RP)`;
                }
                researchButton.disabled = !canResearch;
                researchButton.textContent = `Research${disabledTooltip}`;
            }
        }
    });
}


function logMessage(message, type = "info") { // type can be "info", "success", "error", "science"
    if (!messageLogElement) return;
    const p = document.createElement('p');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    p.textContent = `[${timestamp}] ${message}`;
    p.className = `log-${type}`; // For styling based on type

    messageLogElement.prepend(p); // Add new messages to the top
    const maxMessages = 30;
    while (messageLogElement.children.length > maxMessages) {
        messageLogElement.removeChild(messageLogElement.lastChild);
    }
}

function initialRender() {
    displayAvailableProperties();
    displayOwnedProperties();
    displayAvailableFacilities();
    displayOwnedFacilities();
    displayResearchOptions();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();
}
