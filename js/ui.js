// Metropolis Estates - ui.js

// Assume DOM element consts are defined above as before...
/*
const cashDisplay = document.getElementById('cash-display');
...
const researchOptionsList = document.getElementById('research-options-list');
*/

function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A';
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function updateCashDisplay() { if (cashDisplay) cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`; }
function updateNetRPSDisplay() { if (netRpsDisplay) netRpsDisplay.textContent = `Net RPS: $${formatNumber(gameState.netRentPerSecond)}/s`; }
function updateOwnedPropertiesCountDisplay() { if (ownedPropertiesCountDisplay) ownedPropertiesCountDisplay.textContent = `Properties: ${ownedProperties.length}`; }
function updateBuildingMaterialsDisplay() {
    if (buildingMaterialsDisplay) {
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)}`;
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials') || PROPERTY_TYPES.some(p => p.materialsCost > 0) || FACILITY_TYPES.some(ft => ft.materialsCost > 0) ? 'inline-block' : 'none';
    }
}
function updateResearchPointsDisplay() {
    if (researchPointsDisplay) {
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)}`;
        researchPointsDisplay.style.display = gameState.researchPoints > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'researchPoints') || RESEARCH_TOPICS.length > 0 ? 'inline-block' : 'none';
        document.getElementById('research-section').style.display = researchPointsDisplay.style.display; // Sync research section visibility
    }
}
function updateTotalUpkeepDisplay() {
     if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
        totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';
    }
}

function displayAvailableProperties() {
    if (!availablePropertiesList) return;
    const propertiesSectionTitle = availablePropertiesList.parentElement.querySelector('h2');
    if (propertiesSectionTitle) propertiesSectionTitle.textContent = 'Available Rentals';
    availablePropertiesList.innerHTML = '';
    let displayedCount = 0;

    PROPERTY_TYPES.forEach(propType => {
        if (!isPropertyTypeUnlocked(propType.id)) return; // From properties.js (checks research)
        if (!propType || typeof propType.baseCost === 'undefined' || typeof propType.baseRPS === 'undefined') {
            console.error("Skipping invalid rental type:", propType); return;
        }
        displayedCount++;
        const currentMonetaryCost = calculateDynamicPropertyCost(propType); // From properties.js
        const materialsCost = propType.materialsCost || 0;

        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `
            <h3>${propType.name || 'Unnamed Rental'}</h3>
            <p>${propType.description || 'N/A'}</p>
            <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}` +
            (materialsCost > 0 ? ` + ${materialsCost} Materials` : '') + `</p>
            <p>Base RPS: $${formatNumber(propType.baseRPS,1)}/s</p>
            <p>Main Level Max: ${propType.mainLevelMax || 'N/A'}</p>
            <button onclick="buyProperty('${propType.id}')" id="buy-prop-${propType.id}-btn">Buy</button>
        `;
        availablePropertiesList.appendChild(card);
    });
    if (displayedCount === 0) availablePropertiesList.innerHTML = PROPERTY_TYPES.some(pt => !isPropertyTypeUnlocked(pt.id)) ? "<p>More rentals available via research.</p>" : "<p>No rentals currently available.</p>";
}

function displayOwnedProperties() {
    if (!ownedPropertiesList) return;
    ownedPropertiesList.innerHTML = '';
    if (ownedProperties.length === 0) {
        ownedPropertiesList.innerHTML = '<p>You don\'t own any rentals yet.</p>'; return;
    }

    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId);
        if (!propType) { console.error("Orphaned owned rental:", propInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInst.uniqueId);

        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (propType.upgrades && propType.upgrades.length > 0) {
            propType.upgrades.forEach(upgDef => {
                const currentTier = propInst.appliedUpgrades[upgDef.id] || 0;
                // Costs are calculated when button state is updated. Text here is static.
                upgradesHTML += `
                    <button onclick="applySpecificPropertyUpgrade(${propInst.uniqueId}, '${upgDef.id}')" id="upgrade-prop-${propInst.uniqueId}-${upgDef.id}-btn">
                        ${upgDef.name} (${currentTier}/${upgDef.maxTier})
                    </button>
                `;
            });
        } else { upgradesHTML += '<p>No specific upgrades.</p>'; }
        upgradesHTML += '</div>';

        card.innerHTML = `
            <h3>${propInst.name} (ID: ${propInst.uniqueId})</h3>
            <p class="prop-level">Main Level: ${propInst.mainLevel}/${propType.mainLevelMax}</p>
            <p class="prop-rps">Current RPS: $${formatNumber(propInst.currentRPS)}/s</p>
            <p>Purchase Cost: $${formatNumber(propInst.purchaseCost, 0)}</p>
            <button class="upgrade-main-btn" onclick="upgradePropertyMainLevel(${propInst.uniqueId})" id="upgrade-main-prop-${propInst.uniqueId}-btn">
                Upgrade Main Lvl
            </button>
            ${upgradesHTML}
            <button class="sell-btn" style="margin-top:10px;" onclick="sellPropertyInstance(${propInst.uniqueId})">Sell</button>
        `;
        ownedPropertiesList.appendChild(card);
    });
}

function displayAvailableFacilities() {
    if (!availableFacilitiesList) return;
    const facilitiesSectionTitle = availableFacilitiesList.parentElement.querySelector('h2');
    if (facilitiesSectionTitle) facilitiesSectionTitle.textContent = 'Available Construction';
    availableFacilitiesList.innerHTML = '';
    let displayedCount = 0;

    FACILITY_TYPES.forEach(facType => { // from facilities.js
        if (!isFacilityTypeUnlocked(facType.id)) return; // from facilities.js
        if (!facType || typeof facType.cost === 'undefined' || typeof facType.baseUpkeepRPS === 'undefined') {
            console.error("Skipping invalid construction type:", facType); return;
        }
        displayedCount++;
        const currentMonetaryCost = calculateFacilityDynamicCost(facType); // from facilities.js
        const materialsCost = facType.materialsCost || 0;
        let outputText = facType.output ? `${formatNumber(facType.output.amount,3)}/s ${facType.output.resource}` : (facType.effects ? "Global Buff" : "No direct output");

        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `
            <h3>${facType.name || 'Unnamed Construction'}</h3>
            <p>${facType.description || 'N/A'}</p>
            <p class="facility-cost">Cost: $${formatNumber(currentMonetaryCost,0)}` +
            (materialsCost > 0 ? ` + ${materialsCost} Materials` : '') + `</p>
            <p class="facility-upkeep">Base Upkeep: $${formatNumber(facType.baseUpkeepRPS,0)}/s</p>
            <p class="facility-output">Base Output: ${outputText}</p>
            <button onclick="buyFacility('${facType.id}')" id="buy-fac-${facType.id}-btn">Build</button>
        `;
        availableFacilitiesList.appendChild(card);
    });
    if (displayedCount === 0) availableFacilitiesList.innerHTML = FACILITY_TYPES.some(ft => !isFacilityTypeUnlocked(ft.id)) ? "<p>More construction options available via research.</p>" : "<p>No construction options currently available.</p>";
}

function displayOwnedFacilities() {
    if (!ownedFacilitiesList) return;
    ownedFacilitiesList.innerHTML = '';
    if (ownedFacilities.length === 0) {
        ownedFacilitiesList.innerHTML = '<p>You don\'t own any constructions yet.</p>'; return;
    }

    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) { console.error("Orphaned owned construction:", facInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-facility-card';
        card.setAttribute('data-id', facInst.uniqueId);

        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (facType.upgrades && facType.upgrades.length > 0) {
            facType.upgrades.forEach(upgDef => {
                 upgradesHTML += `
                    <button onclick="applySpecificFacilityUpgrade(${facInst.uniqueId}, '${upgDef.id}')" id="upgrade-fac-${facInst.uniqueId}-${upgDef.id}-btn">
                        ${upgDef.name} (${(facInst.appliedUpgrades[upgDef.id] || 0)}/${upgDef.maxTier})
                    </button>
                `;
            });
        } else { upgradesHTML += '<p>No specific upgrades.</p>'; }
        upgradesHTML += '</div>';

        let outputText = facInst.currentOutput ? `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}` : (facType.effects ? "Provides Global Buff" : "No direct output");

        card.innerHTML = `
            <h3>${facInst.name} (ID: ${facInst.uniqueId})</h3>
            <p class="prop-level">Main Level: ${facInst.mainLevel}/${facType.mainLevelMax}</p>
            <p class="facility-upkeep">Current Upkeep: $${formatNumber(facInst.currentUpkeepRPS)}/s</p>
            <p class="facility-output">Current Output: ${outputText}</p>
            <button class="upgrade-main-btn" onclick="upgradeFacilityMainLevel(${facInst.uniqueId})" id="upgrade-main-fac-${facInst.uniqueId}-btn">
                Upgrade Main Lvl
            </button>
            ${upgradesHTML}
            <button class="sell-btn" style="margin-top:10px;" onclick="sellFacilityInstance(${facInst.uniqueId})">Demolish</button>
        `;
        ownedFacilitiesList.appendChild(card);
    });
}

function displayResearchOptions() {
    if (!researchOptionsList) return;
    researchOptionsList.innerHTML = '';
    let displayedCount = 0;

    RESEARCH_TOPICS.forEach(topic => { // from facilities.js
        if (!isResearchAvailable(topic.id)) return; // from facilities.js (checks prereqs and if already done)
        if (!topic || typeof topic.costRP === 'undefined') {
            console.error("Skipping invalid research topic:", topic); return;
        }
        displayedCount++;
        const card = document.createElement('div');
        card.className = 'research-item-card';
        card.innerHTML = `
            <h3>${topic.name || 'Unnamed Research'}</h3>
            <p>${topic.description || 'N/A'}</p>
            <p class="research-cost">Cost: ${formatNumber(topic.costRP,1)} RP. Labs Req: ${topic.requiredLabs || 0}</p>
            <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn">Research</button>
        `;
        researchOptionsList.appendChild(card);
    });

    if (displayedCount === 0) {
        if (RESEARCH_TOPICS.every(topic => gameState.unlockedResearch.includes(topic.id))) {
            researchOptionsList.innerHTML = '<p>All research completed!</p>';
        } else {
            researchOptionsList.innerHTML = '<p>No new research available. Check prerequisites or build more labs.</p>';
        }
    }
}

function updateAllBuyButtonStates() { // For Rentals
    PROPERTY_TYPES.forEach(propType => {
        if (!isPropertyTypeUnlocked(propType.id)) return;
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) {
            const monetaryCost = calculateDynamicPropertyCost(propType);
            const materialsCost = propType.materialsCost || 0;
            let disabledReason = "";
            if (gameState.cash < monetaryCost) disabledReason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) disabledReason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!disabledReason;
            buyButton.textContent = `Buy ${disabledReason}`;
        }
    });
}

function updateAllFacilityBuyButtonStates() { // For Construction
    FACILITY_TYPES.forEach(facType => {
        if (!isFacilityTypeUnlocked(facType.id)) return;
        const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
        if (buyButton) {
            const monetaryCost = calculateFacilityDynamicCost(facType);
            const materialsCost = facType.materialsCost || 0;
            let disabledReason = "";
            if (gameState.cash < monetaryCost) disabledReason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) disabledReason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!disabledReason;
            buyButton.textContent = `Build ${disabledReason}`;
        }
    });
}

function updateAllUpgradeButtonStates() { // For Rentals
    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId);
        if (!propType) return;

        const mainUpgradeButton = document.getElementById(`upgrade-main-prop-${propInst.uniqueId}-btn`);
        if (mainUpgradeButton) {
            const mainLevelUpgradeCost = Math.floor(propInst.purchaseCost * 0.3 * Math.pow(1.8, propInst.mainLevel -1));
            let disabledReason = "";
            if (propInst.mainLevel >= propType.mainLevelMax) disabledReason = "(Max Level)";
            else if (gameState.cash < mainLevelUpgradeCost) disabledReason = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`;
            mainUpgradeButton.disabled = !!disabledReason;
            mainUpgradeButton.textContent = `Upgrade Main Lvl ${disabledReason}`;
        }

        if (propType.upgrades) {
            propType.upgrades.forEach(upgDef => {
                const specificUpgradeButton = document.getElementById(`upgrade-prop-${propInst.uniqueId}-${upgDef.id}-btn`);
                if (specificUpgradeButton) {
                    const currentTier = propInst.appliedUpgrades[upgDef.id] || 0;
                    const costNextTier = Math.floor(upgDef.cost * Math.pow(1.5, currentTier));
                    const materialsNeededBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                    let materialUsageEfficiency = 1;
                    if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                        const buffResearch = getResearchTopicById("advanced_material_processing");
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);
                    let disabledReason = "";
                    if (currentTier >= upgDef.maxTier) disabledReason = "(Max Tier)";
                    else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) disabledReason = "(Needs Res.)";
                    else if (gameState.cash < costNextTier) disabledReason = `($${formatNumber(costNextTier,0)})`;
                    else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) disabledReason = `(${actualMaterialsNeeded} Mats)`;
                    specificUpgradeButton.disabled = !!disabledReason && disabledReason !== `($${formatNumber(costNextTier,0)})` && disabledReason !== `(${actualMaterialsNeeded} Mats)`; // Only disable if truly can't afford due to non-cost reason
                    specificUpgradeButton.textContent = `${upgDef.name} (${currentTier}/${upgDef.maxTier}) ${disabledReason}`;
                }
            });
        }
    });
}
function updateAllFacilityUpgradeButtonStates() { // For Construction
    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return;

        const mainUpgradeButton = document.getElementById(`upgrade-main-fac-${facInst.uniqueId}-btn`);
         if (mainUpgradeButton) {
            const mainLevelUpgradeCost = Math.floor(facType.cost * 0.4 * Math.pow(1.7, facInst.mainLevel -1));
            let disabledReason = "";
            if (facInst.mainLevel >= facType.mainLevelMax) disabledReason = "(Max Level)";
            else if (gameState.cash < mainLevelUpgradeCost) disabledReason = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`;
            mainUpgradeButton.disabled = !!disabledReason;
            mainUpgradeButton.textContent = `Upgrade Main Lvl ${disabledReason}`;
        }

        if (facType.upgrades) {
            facType.upgrades.forEach(upgDef => {
                const specificUpgradeButton = document.getElementById(`upgrade-fac-${facInst.uniqueId}-${upgDef.id}-btn`);
                if (specificUpgradeButton) {
                    const currentTier = facInst.appliedUpgrades[upgDef.id] || 0;
                    const costNextTier = Math.floor(upgDef.cost * Math.pow(1.6, currentTier));
                    const materialsNeededBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                    let materialUsageEfficiency = 1;
                     if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                        const buffResearch = getResearchTopicById("advanced_material_processing");
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);
                    let disabledReason = "";
                     if (currentTier >= upgDef.maxTier) disabledReason = "(Max Tier)";
                     else if (gameState.cash < costNextTier) disabledReason = `($${formatNumber(costNextTier,0)})`;
                     else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) disabledReason = `(${actualMaterialsNeeded} Mats)`;
                    specificUpgradeButton.disabled = !!disabledReason && disabledReason !== `($${formatNumber(costNextTier,0)})` && disabledReason !== `(${actualMaterialsNeeded} Mats)`;
                    specificUpgradeButton.textContent = `${upgDef.name} (${currentTier}/${upgDef.maxTier}) ${disabledReason}`;
                }
            });
        }
    });
}

function updateResearchButtonStates() {
    RESEARCH_TOPICS.forEach(topic => {
        if (!isResearchAvailable(topic.id) && !gameState.unlockedResearch.includes(topic.id)) { // If not available and not yet unlocked
            const researchButton = document.getElementById(`research-${topic.id}-btn`);
            if(researchButton) researchButton.style.display = 'none'; // Hide unavailable research
            return;
        }
        const researchButton = document.getElementById(`research-${topic.id}-btn`);
        if (researchButton) {
            researchButton.style.display = 'inline-block'; // Ensure it's visible if available
            const requiredLabsCount = topic.requiredLabs || 0;
            const ownedScienceLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;
            let disabledReason = "";
            if(ownedScienceLabs < requiredLabsCount) disabledReason = `(Need ${requiredLabsCount} Lab(s))`;
            else if (gameState.researchPoints < topic.costRP) disabledReason = `(Need ${formatNumber(topic.costRP,1)} RP)`;
            researchButton.disabled = !!disabledReason;
            researchButton.textContent = `Research ${disabledReason}`;
        }
    });
}

function logMessage(message, type = "info") {
    if (!messageLogElement) return;
    const p = document.createElement('p');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    p.textContent = `[${timestamp}] ${message}`;
    p.className = `log-${type}`;
    messageLogElement.prepend(p);
    const maxMessages = 30;
    while (messageLogElement.children.length > maxMessages) {
        messageLogElement.removeChild(messageLogElement.lastChild);
    }
}

function initialRender() {
    updateBuildingMaterialsDisplay(); // Update display based on initial gameState
    updateResearchPointsDisplay();   // Update display based on initial gameState
    updateTotalUpkeepDisplay();      // Update display based on initial gameState

    displayAvailableProperties();
    displayOwnedProperties();
    displayAvailableFacilities();
    displayOwnedFacilities();
    displayResearchOptions();
}
