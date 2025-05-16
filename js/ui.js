// Metropolis Estates - ui.js

// Declare variables, but don't assign them from DOM yet
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay,
    buildingMaterialsDisplay, researchPointsDisplay, totalUpkeepDisplay,
    availablePropertiesList, ownedPropertiesList, messageLogElement,
    availableFacilitiesList, ownedFacilitiesList, researchOptionsList,
    propertiesSectionTitleElement, facilitiesSectionTitleElement, researchSectionElement; // Added for titles and research section

// This function should be called once the DOM is ready, e.g., from initGame or initialRender's start
function initializeUIElements() {
    cashDisplay = document.getElementById('cash-display');
    netRpsDisplay = document.getElementById('rps-display');
    ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
    buildingMaterialsDisplay = document.getElementById('building-materials-display');
    researchPointsDisplay = document.getElementById('research-points-display');
    totalUpkeepDisplay = document.getElementById('total-upkeep-display');

    availablePropertiesList = document.getElementById('available-properties-list');
    ownedPropertiesList = document.getElementById('owned-properties-list');
    messageLogElement = document.getElementById('message-log');

    availableFacilitiesList = document.getElementById('available-facilities-list');
    ownedFacilitiesList = document.getElementById('owned-facilities-list');
    researchOptionsList = document.getElementById('research-options-list');

    // Get references to section title H2 elements and the research section itself for visibility toggling
    if (availablePropertiesList) { // Ensure parentElement lookup is safe
        propertiesSectionTitleElement = availablePropertiesList.parentElement.querySelector('h2');
    }
    if (availableFacilitiesList) { // Ensure parentElement lookup is safe
        facilitiesSectionTitleElement = availableFacilitiesList.parentElement.querySelector('h2');
    }
    researchSectionElement = document.getElementById('research-section');

    // Initial static title changes (if not done within display functions every time)
    // This is an alternative to setting it in each display function.
    // For now, I'll keep the title setting within the display functions as per last update,
    // but this is where you'd do it for a one-time setup.
    // if (propertiesSectionTitleElement) propertiesSectionTitleElement.textContent = 'Available Rentals';
    // if (facilitiesSectionTitleElement) facilitiesSectionTitleElement.textContent = 'Available Construction';
}


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
    if (buildingMaterialsDisplay) { // This check is now more critical before initializeUIElements() is called
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)}`;
        // Visibility logic: show if materials exist OR if any property/facility costs materials (implying the resource is active in the game)
        const materialsAreUsed = PROPERTY_TYPES.some(p => p.materialsCost > 0) || FACILITY_TYPES.some(ft => ft.materialsCost > 0);
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials') || materialsAreUsed ? 'inline-block' : 'none';
    }
}
function updateResearchPointsDisplay() {
    if (researchPointsDisplay && researchSectionElement) {
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)}`;
        const researchIsActive = RESEARCH_TOPICS.length > 0; // Check if there's any research defined
        const shouldDisplay = gameState.researchPoints > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'researchPoints') || researchIsActive;

        researchPointsDisplay.style.display = shouldDisplay ? 'inline-block' : 'none';
        researchSectionElement.style.display = shouldDisplay ? 'block' : 'none'; // Sync research section visibility
    }
}
function updateTotalUpkeepDisplay() {
     if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
        totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';
    }
}

function displayAvailableProperties() {
    if (!availablePropertiesList || !propertiesSectionTitleElement) return; // Check if elements are initialized

    propertiesSectionTitleElement.textContent = 'Available Rentals'; // Set title
    availablePropertiesList.innerHTML = ''; // Clear existing list
    let displayedCount = 0;

    PROPERTY_TYPES.forEach(propType => { // PROPERTY_TYPES from properties.js
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
    if (displayedCount === 0) {
        availablePropertiesList.innerHTML = PROPERTY_TYPES.some(pt => pt.requiredResearch && !isPropertyTypeUnlocked(pt.id)) ? "<p>More rentals available via research.</p>" : "<p>No rentals currently available or defined.</p>";
    }
}

function displayOwnedProperties() {
    if (!ownedPropertiesList) return;
    ownedPropertiesList.innerHTML = '';
    if (ownedProperties.length === 0) {
        ownedPropertiesList.innerHTML = '<p>You don\'t own any rentals yet.</p>'; return;
    }

    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId); // from properties.js
        if (!propType) { console.error("Orphaned owned rental:", propInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInst.uniqueId);

        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (propType.upgrades && propType.upgrades.length > 0) {
            propType.upgrades.forEach(upgDef => {
                const currentTier = propInst.appliedUpgrades[upgDef.id] || 0;
                // Button text and disabled state handled by updateAllUpgradeButtonStates
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
    if (!availableFacilitiesList || !facilitiesSectionTitleElement) return;

    facilitiesSectionTitleElement.textContent = 'Available Construction'; // Set title
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
    if (displayedCount === 0) {
        availableFacilitiesList.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id)) ? "<p>More construction options available via research.</p>" : "<p>No construction options currently available or defined.</p>";
    }
}

function displayOwnedFacilities() {
    if (!ownedFacilitiesList) return;
    ownedFacilitiesList.innerHTML = '';
    if (ownedFacilities.length === 0) {
        ownedFacilitiesList.innerHTML = '<p>You don\'t own any constructions yet.</p>'; return;
    }

    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId); // from facilities.js
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
        if (!isResearchAvailable(topic.id) && !gameState.unlockedResearch.includes(topic.id)) { // from facilities.js
             // If not available to research AND not already completed, do nothing here. Button state updates will hide it.
        } else if (gameState.unlockedResearch.includes(topic.id)) {
            // Optionally display completed research differently or not at all
            // For now, we just won't create a button if it's completed, effectively hiding it from "available to research"
            return;
        } else { // It's available to research
            if (!topic || typeof topic.costRP === 'undefined') {
                console.error("Skipping invalid research topic:", topic); return;
            }
            displayedCount++;
            const card = document.createElement('div');
            card.className = 'research-item-card';
            // Button text/disabled state handled by updateResearchButtonStates
            card.innerHTML = `
                <h3>${topic.name || 'Unnamed Research'}</h3>
                <p>${topic.description || 'N/A'}</p>
                <p class="research-cost">Cost: ${formatNumber(topic.costRP,1)} RP. Labs Req: ${topic.requiredLabs || 0}</p>
                <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn">Research</button>
            `;
            researchOptionsList.appendChild(card);
        }
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
        if (!isPropertyTypeUnlocked(propType.id)) { // from properties.js
            const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
            if(buyButton && buyButton.parentElement) buyButton.parentElement.style.display = 'none'; // Hide card if not unlocked
            return;
        }
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) {
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex'; // Ensure card is visible
            const monetaryCost = calculateDynamicPropertyCost(propType); // from properties.js
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
    FACILITY_TYPES.forEach(facType => { // from facilities.js
        if (!isFacilityTypeUnlocked(facType.id)) { // from facilities.js
            const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
            if(buyButton && buyButton.parentElement) buyButton.parentElement.style.display = 'none'; // Hide card
            return;
        }
        const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
        if (buyButton) {
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex'; // Ensure card is visible
            const monetaryCost = calculateFacilityDynamicCost(facType); // from facilities.js
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
        const propType = getPropertyTypeById(propInst.typeId); // from properties.js
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
                        const buffResearch = getResearchTopicById("advanced_material_processing"); // from facilities.js
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);
                    let buttonText = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                    let isDisabled = false;

                    if (currentTier >= upgDef.maxTier) { buttonText += " (Max Tier)"; isDisabled = true; }
                    else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) { buttonText += " (Needs Res.)"; isDisabled = true; }
                    else if (gameState.cash < costNextTier) { buttonText += ` ($${formatNumber(costNextTier,0)})`; isDisabled = true; }
                    else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) { buttonText += ` (${actualMaterialsNeeded} Mats)`; isDisabled = true; }
                    else { buttonText += ` ($${formatNumber(costNextTier,0)}${actualMaterialsNeeded > 0 ? ', '+actualMaterialsNeeded+' Mats' : ''})`;}

                    specificUpgradeButton.disabled = isDisabled;
                    specificUpgradeButton.textContent = buttonText;
                }
            });
        }
    });
}
function updateAllFacilityUpgradeButtonStates() { // For Construction
    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId); // from facilities.js
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
                        const buffResearch = getResearchTopicById("advanced_material_processing"); // from facilities.js
                        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
                            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
                        }
                    }
                    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);
                    let buttonText = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                    let isDisabled = false;

                     if (currentTier >= upgDef.maxTier) { buttonText += " (Max Tier)"; isDisabled = true; }
                     else if (gameState.cash < costNextTier) { buttonText += ` ($${formatNumber(costNextTier,0)})`; isDisabled = true; }
                     else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) { buttonText += ` (${actualMaterialsNeeded} Mats)`; isDisabled = true; }
                     else { buttonText += ` ($${formatNumber(costNextTier,0)}${actualMaterialsNeeded > 0 ? ', '+actualMaterialsNeeded+' Mats' : ''})`;}

                    specificUpgradeButton.disabled = isDisabled;
                    specificUpgradeButton.textContent = buttonText;
                }
            });
        }
    });
}

function updateResearchButtonStates() {
    RESEARCH_TOPICS.forEach(topic => { // from facilities.js
        const researchButton = document.getElementById(`research-${topic.id}-btn`);
        if (researchButton) { // Check if button exists (it might not if topic card wasn't rendered)
            if (!isResearchAvailable(topic.id) || gameState.unlockedResearch.includes(topic.id)) { // from facilities.js
                if(researchButton.parentElement) researchButton.parentElement.style.display = 'none'; // Hide card if not available or done
                return;
            }
            if(researchButton.parentElement) researchButton.parentElement.style.display = 'flex'; // Ensure card is visible

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

// This function is called ONCE when the game starts, after the DOM is ready.
function initialRender() {
    initializeUIElements(); // Initialize all DOM element variables

    // Now that elements are initialized, update their content based on initial gameState
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    // Display initial lists
    displayAvailableProperties();
    displayOwnedProperties();
    displayAvailableFacilities();
    displayOwnedFacilities();
    displayResearchOptions();

    // Update initial button states (important after lists are first drawn)
    updateAllBuyButtonStates();
    updateAllFacilityBuyButtonStates();
    updateAllUpgradeButtonStates();
    updateAllFacilityUpgradeButtonStates();
    updateResearchButtonStates();
}
