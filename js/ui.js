// Metropolis Estates - ui.js

// Declare variables that will hold DOM elements
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay,
    buildingMaterialsDisplay, researchPointsDisplay, totalUpkeepDisplay,
    availablePropertiesList, ownedPropertiesList, messageLogElement,
    availableFacilitiesList, ownedFacilitiesList, researchOptionsList,
    propertiesSectionTitleElement, facilitiesSectionTitleElement, researchSectionElement;

let uiInitialized = false; // Flag to track if UI elements have been initialized

function initializeUIElements() {
    if (uiInitialized) return; // Prevent re-initialization

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

    researchSectionElement = document.getElementById('research-section');

    // Get references to section title H2 elements using parentElement from the list container
    // This is safer as the list containers are what we primarily interact with for content.
    const apl = document.getElementById('available-properties-list');
    if (apl && apl.parentElement) {
        propertiesSectionTitleElement = apl.parentElement.querySelector('h2');
    } else {
        console.error("Could not find available-properties-list or its parent to get title element.");
    }

    const afl = document.getElementById('available-facilities-list');
    if (afl && afl.parentElement) {
        facilitiesSectionTitleElement = afl.parentElement.querySelector('h2');
    } else {
        console.error("Could not find available-facilities-list or its parent to get title element.");
    }
    
    if (propertiesSectionTitleElement && facilitiesSectionTitleElement) { // Check if titles were found
        uiInitialized = true;
        console.log("UI Elements Initialized.");
    } else {
        console.error("One or more critical UI elements (like section titles or list containers) not found during initialization. UI might not function correctly.");
    }
}

function ensureUIInitialized() {
    if (!uiInitialized) {
        console.warn("UI not initialized, attempting to initialize now.");
        initializeUIElements();
        if(!uiInitialized) {
            console.error("FORCE INITIALIZATION FAILED. DOM elements might not be ready or IDs are incorrect.");
            //This is a critical failure point.
            //You might want to throw an error or have a more robust fallback.
        }
    }
}


function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A';
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ---- Stat Update Functions ----
function updateCashDisplay() {
    ensureUIInitialized();
    if (cashDisplay) cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`;
}
function updateNetRPSDisplay() {
    ensureUIInitialized();
    if (netRpsDisplay) netRpsDisplay.textContent = `Net RPS: $${formatNumber(gameState.netRentPerSecond)}/s`;
}
function updateOwnedPropertiesCountDisplay() {
    ensureUIInitialized();
    if (ownedPropertiesCountDisplay) ownedPropertiesCountDisplay.textContent = `Properties: ${ownedProperties.length}`;
}
function updateBuildingMaterialsDisplay() {
    ensureUIInitialized(); // Make sure buildingMaterialsDisplay is assigned
    if (buildingMaterialsDisplay) {
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)}`;
        const materialsAreUsed = PROPERTY_TYPES.some(p => p.materialsCost > 0) || FACILITY_TYPES.some(ft => ft.materialsCost > 0);
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials') || materialsAreUsed ? 'inline-block' : 'none';
    } else {
        // This console log will tell you if the element itself is the problem
        // console.error("updateBuildingMaterialsDisplay: buildingMaterialsDisplay element not found/initialized.");
    }
}
function updateResearchPointsDisplay() {
    ensureUIInitialized();
    if (researchPointsDisplay && researchSectionElement) {
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)}`;
        const researchIsActive = RESEARCH_TOPICS.length > 0;
        const shouldDisplay = gameState.researchPoints > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'researchPoints') || researchIsActive;
        researchPointsDisplay.style.display = shouldDisplay ? 'inline-block' : 'none';
        researchSectionElement.style.display = shouldDisplay ? 'block' : 'none';
    }
}
function updateTotalUpkeepDisplay() {
    ensureUIInitialized();
    if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
        totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';
    }
}

// ---- List Display Functions ----
function displayAvailableProperties() {
    ensureUIInitialized();
    if (!availablePropertiesList || !propertiesSectionTitleElement) {
        console.error("displayAvailableProperties: Required DOM elements not initialized.");
        return;
    }
    propertiesSectionTitleElement.textContent = 'Available Rentals';
    availablePropertiesList.innerHTML = '';
    let displayedCount = 0;

    PROPERTY_TYPES.forEach(propType => {
        if (!isPropertyTypeUnlocked(propType.id)) return;
        if (!propType || typeof propType.baseCost === 'undefined' || typeof propType.baseRPS === 'undefined') {
            console.error("Skipping invalid rental type:", propType); return;
        }
        displayedCount++;
        const currentMonetaryCost = calculateDynamicPropertyCost(propType);
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
    if (displayedCount === 0) availablePropertiesList.innerHTML = PROPERTY_TYPES.some(pt => pt.requiredResearch && !isPropertyTypeUnlocked(pt.id)) ? "<p>More rentals available via research.</p>" : "<p>No rentals currently available or defined.</p>";
}

function displayOwnedProperties() {
    ensureUIInitialized();
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
    ensureUIInitialized();
    if (!availableFacilitiesList || !facilitiesSectionTitleElement) {
        console.error("displayAvailableFacilities: Required DOM elements not initialized.");
        return;
    }
    facilitiesSectionTitleElement.textContent = 'Available Construction';
    availableFacilitiesList.innerHTML = '';
    let displayedCount = 0;

    FACILITY_TYPES.forEach(facType => {
        if (!isFacilityTypeUnlocked(facType.id)) return;
        if (!facType || typeof facType.cost === 'undefined' || typeof facType.baseUpkeepRPS === 'undefined') {
            console.error("Skipping invalid construction type:", facType); return;
        }
        displayedCount++;
        const currentMonetaryCost = calculateFacilityDynamicCost(facType);
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
    if (displayedCount === 0) availableFacilitiesList.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id)) ? "<p>More construction options available via research.</p>" : "<p>No construction options currently available or defined.</p>";
}

function displayOwnedFacilities() {
    ensureUIInitialized();
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
    ensureUIInitialized();
    if (!researchOptionsList) return;
    researchOptionsList.innerHTML = '';
    let displayedCount = 0;
    RESEARCH_TOPICS.forEach(topic => {
        if (gameState.unlockedResearch.includes(topic.id)) return; // Don't display if already researched
        if (!isResearchAvailable(topic.id)) return; // Don't display if prerequisites not met

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

// ---- Button State Update Functions ----
function updateAllBuyButtonStates() {
    ensureUIInitialized();
    PROPERTY_TYPES.forEach(propType => {
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) { // Button might not exist if card wasn't rendered (e.g. not unlocked)
            if(!isPropertyTypeUnlocked(propType.id)) { // from properties.js
                if(buyButton.parentElement) buyButton.parentElement.style.display = 'none';
                return;
            }
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex';
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

function updateAllFacilityBuyButtonStates() {
    ensureUIInitialized();
    FACILITY_TYPES.forEach(facType => {
        const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
        if (buyButton) {
            if (!isFacilityTypeUnlocked(facType.id)) { // from facilities.js
                if(buyButton.parentElement) buyButton.parentElement.style.display = 'none';
                return;
            }
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex';
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

function updateAllUpgradeButtonStates() {
    ensureUIInitialized();
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
function updateAllFacilityUpgradeButtonStates() {
    ensureUIInitialized();
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
    ensureUIInitialized();
    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = document.getElementById(`research-${topic.id}-btn`);
        if (researchButton && researchButton.parentElement) { // Check if button and its card exist
            if (!isResearchAvailable(topic.id) || gameState.unlockedResearch.includes(topic.id)) {
                researchButton.parentElement.style.display = 'none'; // Hide card if not available or done
                return;
            }
            researchButton.parentElement.style.display = 'flex'; // Make sure card is visible

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

// ---- Utility Functions ----
function logMessage(message, type = "info") {
    ensureUIInitialized();
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
    initializeUIElements(); // Initialize all DOM element variables FIRST

    if (!uiInitialized) {
        console.error("UI FAILED TO INITIALIZE - Aborting initialRender to prevent further errors.");
        // Display a critical error message to the user in the game body itself
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; font-size: 18px; color: red;">
            <h1>Critical Error</h1>
            <p>The game UI could not be initialized. This usually means there's an issue with the HTML structure (missing element IDs) or a severe JavaScript problem.</p>
            <p>Please check the browser console (F12) for detailed error messages.</p>
        </div>`;
        return; // Stop further rendering
    }

    // Now that elements are initialized, update their content based on initial gameState
    updateCashDisplay(); // These need to be called to set initial text based on gameState
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
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
