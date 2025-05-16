// Metropolis Estates - ui.js (v0.4.2)

// Declare variables that will hold DOM elements. They will be assigned in initializeUIElements.
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay,
    buildingMaterialsDisplay, researchPointsDisplay, totalUpkeepDisplay,
    leftColumnTitleElement, leftColumnListElement,
    rightColumnTitleElement, rightColumnListElement,
    navRentalsButton, navMaterialsButton, navResearchButton;

let uiInitialized = false; // Flag to track if UI elements have been successfully initialized
let currentView = 'rentals'; // Default view when the game loads

/**
 * Initializes references to all DOM elements used by the UI.
 * This function should only be called once the DOM is fully loaded.
 * It sets the uiInitialized flag upon successful completion.
 */
function initializeUIElements() {
    if (uiInitialized) return; // Prevent re-initialization

    // Get references to header stat display elements
    cashDisplay = document.getElementById('cash-display');
    netRpsDisplay = document.getElementById('rps-display');
    ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
    buildingMaterialsDisplay = document.getElementById('building-materials-display');
    researchPointsDisplay = document.getElementById('research-points-display');
    totalUpkeepDisplay = document.getElementById('total-upkeep-display');

    // Get references to the dynamic column content areas
    leftColumnTitleElement = document.getElementById('left-column-title');
    leftColumnListElement = document.getElementById('left-column-list');
    rightColumnTitleElement = document.getElementById('right-column-title');
    rightColumnListElement = document.getElementById('right-column-list');

    // Get references to navigation buttons
    navRentalsButton = document.getElementById('nav-rentals');
    navMaterialsButton = document.getElementById('nav-materials');
    navResearchButton = document.getElementById('nav-research');

    // Check if all critical elements were found
    if (cashDisplay && netRpsDisplay && ownedPropertiesCountDisplay &&
        buildingMaterialsDisplay && researchPointsDisplay && totalUpkeepDisplay &&
        leftColumnTitleElement && leftColumnListElement &&
        rightColumnTitleElement && rightColumnListElement &&
        navRentalsButton && navMaterialsButton && navResearchButton) {
        
        uiInitialized = true;
        console.log("UI Elements Initialized successfully.");

        // Attach event listeners to navigation buttons
        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navMaterialsButton.addEventListener('click', () => switchView('materials'));
        navResearchButton.addEventListener('click', () => switchView('research'));
    } else {
        console.error("CRITICAL: One or more essential UI elements not found during initialization. Check HTML IDs. UI might not function correctly.");
        if (document.body) { 
            const criticalErrorDiv = document.createElement('div');
            criticalErrorDiv.style.cssText = "padding:20px;text-align:center;color:red;font-family:Arial,sans-serif;background-color:#fff;border:2px solid red;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;box-shadow:0 0 15px rgba(0,0,0,0.5);";
            criticalErrorDiv.innerHTML = `<h1>Critical UI Initialization Error</h1><p>Essential HTML elements are missing. Check console (F12) and HTML IDs.</p>`;
            document.body.innerHTML = ''; 
            document.body.appendChild(criticalErrorDiv);
        }
    }
}

/**
 * Helper function to ensure UI elements are initialized before use.
 */
function ensureUIInitialized() {
    if (!uiInitialized) {
        console.warn("UI elements not initialized. Attempting to initialize now. This should ideally be called after DOMContentLoaded via initialRender.");
        initializeUIElements(); 
        if (!uiInitialized) {
            console.error("FATAL: UI INITIALIZATION FAILED. The game cannot proceed with UI operations.");
        }
    }
}

/**
 * Switches the main content view (Rentals, Materials, Research).
 * @param {string} viewName - The name of the view to switch to ('rentals', 'materials', 'research').
 */
function switchView(viewName) {
    ensureUIInitialized();
    if (!uiInitialized) return; 

    currentView = viewName;

    const navButtons = [navRentalsButton, navMaterialsButton, navResearchButton];
    navButtons.forEach(btn => {
        if (btn) btn.classList.remove('active-nav');
    });

    if (viewName === 'rentals' && navRentalsButton) navRentalsButton.classList.add('active-nav');
    else if (viewName === 'materials' && navMaterialsButton) navMaterialsButton.classList.add('active-nav');
    else if (viewName === 'research' && navResearchButton) navResearchButton.classList.add('active-nav');

    updateGameData(); 
}

/**
 * Formats a number for display.
 * @param {number} num - The number to format.
 * @param {number} [decimals=2] - The number of decimal places.
 * @returns {string} The formatted number string, or 'N/A'.
 */
function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ---- Stat Update Functions ----
function updateCashDisplay() { ensureUIInitialized(); if (cashDisplay) cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`; }
function updateNetRPSDisplay() { ensureUIInitialized(); if (netRpsDisplay) netRpsDisplay.textContent = `Net RPS: $${formatNumber(gameState.netRentPerSecond)}/s`; }
function updateOwnedPropertiesCountDisplay() { ensureUIInitialized(); if (ownedPropertiesCountDisplay) ownedPropertiesCountDisplay.textContent = `Rentals: ${ownedProperties.length}`; }

function updateBuildingMaterialsDisplay() {
    ensureUIInitialized();
    if (buildingMaterialsDisplay) {
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)}`;
        const materialsAreRelevant = PROPERTY_TYPES.some(p => p.materialsCost > 0) || FACILITY_TYPES.some(ft => ft.materialsCost > 0) || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials');
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || materialsAreRelevant ? 'inline-block' : 'none';
    }
}
function updateResearchPointsDisplay() {
    ensureUIInitialized();
    if (researchPointsDisplay) {
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)}`;
        const researchIsRelevant = RESEARCH_TOPICS.length > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'researchPoints');
        researchPointsDisplay.style.display = gameState.researchPoints > 0 || researchIsRelevant ? 'inline-block' : 'none';
    }
}
function updateTotalUpkeepDisplay() {
    ensureUIInitialized();
    if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
        totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';
    }
}

// ---- Main Content Display Router ----
function displayCurrentViewContent() {
    ensureUIInitialized();
    if (!uiInitialized || !leftColumnListElement || !rightColumnListElement || !leftColumnTitleElement || !rightColumnTitleElement) {
        console.error("displayCurrentViewContent: Crucial UI column elements not initialized.");
        return;
    }
    leftColumnListElement.innerHTML = ''; 
    rightColumnListElement.innerHTML = '';

    if (currentView === 'rentals') {
        leftColumnTitleElement.textContent = 'Available Rentals';
        rightColumnTitleElement.textContent = 'My Portfolio';
        displayAvailablePropertiesList(leftColumnListElement);
        displayOwnedPropertiesList(rightColumnListElement);
    } else if (currentView === 'materials') {
        leftColumnTitleElement.textContent = 'Available Construction';
        rightColumnTitleElement.textContent = 'My Constructions';
        displayAvailableFacilitiesList(leftColumnListElement, 'material');
        displayOwnedFacilitiesList(rightColumnListElement, 'material');
    } else if (currentView === 'research') {
        leftColumnTitleElement.textContent = 'Available Research';
        rightColumnTitleElement.textContent = 'My Science Labs';
        displayResearchOptionsList(leftColumnListElement);
        displayOwnedFacilitiesList(rightColumnListElement, 'science');
    }
    updateAllButtonStatesForCurrentView();
}

// ---- Specific List Display Functions ----

function displayAvailablePropertiesList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedItemCount = 0;

    // 1. Display all currently unlocked and buyable properties
    PROPERTY_TYPES.forEach(propType => {
        if (isPropertyTypeUnlocked(propType.id)) { // from properties.js
            displayedItemCount++;
            const currentMonetaryCost = calculateDynamicPropertyCost(propType); // from properties.js
            const materialsCost = propType.materialsCost || 0;
            const card = document.createElement('div');
            card.className = 'property-card';
            card.innerHTML = `
                <h3>${propType.name}</h3>
                <p>${propType.description}</p>
                <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
                <p>Base RPS: $${formatNumber(propType.baseRPS,1)}/s</p>
                <p>Max Lvl: ${propType.mainLevelMax || 'N/A'}</p>
                <button onclick="buyProperty('${propType.id}')" id="buy-prop-${propType.id}-btn">Buy</button>
            `;
            targetElement.appendChild(card);
        }
    });

    // 2. Find and display the *next* research that unlocks more properties as a button
    let nextPropertyUnlockResearch = null;
    for (const research of RESEARCH_TOPICS) { // from facilities.js
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0 &&
            !gameState.unlockedResearch.includes(research.id) && 
            isResearchAvailable(research.id)) { 
            
            // Check if this research unlocks properties that aren't already buyable
            const trulyUnlocksNew = research.unlocksPropertyType.some(propId => {
                const propType = getPropertyTypeById(propId);
                return propType && !isPropertyTypeUnlocked(propType.id); 
            });

            if (trulyUnlocksNew) {
                nextPropertyUnlockResearch = research;
                break; 
            }
        }
    }

    if (nextPropertyUnlockResearch) {
        displayedItemCount++; 
        const unlockButtonContainer = document.createElement('div');
        unlockButtonContainer.className = 'unlock-next-tier-button-container'; 

        let costStrings = [];
        if (nextPropertyUnlockResearch.hasOwnProperty('cost') && typeof nextPropertyUnlockResearch.cost === 'number' && nextPropertyUnlockResearch.cost > 0) {
            costStrings.push(`$${formatNumber(nextPropertyUnlockResearch.cost, 0)}`);
        }
        if (nextPropertyUnlockResearch.hasOwnProperty('materialsCost') && typeof nextPropertyUnlockResearch.materialsCost === 'number' && nextPropertyUnlockResearch.materialsCost > 0) {
            costStrings.push(`${formatNumber(nextPropertyUnlockResearch.materialsCost, 0)} Materials`);
        }
        if (nextPropertyUnlockResearch.hasOwnProperty('costRP') && typeof nextPropertyUnlockResearch.costRP === 'number' && nextPropertyUnlockResearch.costRP > 0) {
            costStrings.push(`${formatNumber(nextPropertyUnlockResearch.costRP, 1)} RP`);
        }
        let costText = costStrings.length > 0 ? costStrings.join(' + ') : "Free";

        const unlocksNames = nextPropertyUnlockResearch.unlocksPropertyType
            .map(id => getPropertyTypeById(id)?.name)
            .filter(name => name) 
            .join(', ');

        unlockButtonContainer.innerHTML = `
            <button class="unlock-next-tier-btn" 
                    onclick="completeResearchAndRefreshUI('${nextPropertyUnlockResearch.id}')" 
                    id="unlock-property-tier-${nextPropertyUnlockResearch.id}-btn"
                    title="Unlocks: ${unlocksNames || 'New Rentals'}">
                Unlock Next Rentals (${nextPropertyUnlockResearch.name}) - Cost: ${costText}
            </button>
        `;
        targetElement.appendChild(unlockButtonContainer);
    }

    if (displayedItemCount === 0) {
        targetElement.innerHTML = "<p>No rentals or unlocks currently available. Check Research & Development.</p>";
    }
}

function completeResearchAndRefreshUI(researchId) {
    const success = completeResearch(researchId); // from facilities.js
    // completeResearch already calls updateGameData() on success, which refreshes the UI.
}

function displayOwnedPropertiesList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    if (ownedProperties.length === 0) {
        targetElement.innerHTML = '<p>You don\'t own any rentals yet.</p>'; return;
    }
    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId);
        if (!propType) { console.error("Orphaned owned rental:", propInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInst.uniqueId);
        card.id = `owned-property-card-${propInst.uniqueId}`;
        card.innerHTML = `<h3>${propInst.name}</h3>
            <div class="property-info-grid">
                <p><span class="label">Lvl:</span> <span class="value">${propInst.mainLevel}/${propType.mainLevelMax}</span></p>
                <p><span class="label">RPS:</span> <span class="value">$${formatNumber(propInst.currentRPS)}/s</span></p>
                <p><span class="label">Cost:</span> <span class="value">$${formatNumber(propInst.purchaseCost, 0)}</span></p>
                <p><span class="label">ID:</span> <span class="value">${propInst.uniqueId}</span></p>
            </div>
            <div class="card-actions">
                <button class="manage-upgrades-btn" onclick="togglePropertyUpgradesView(${propInst.uniqueId})">Upgrades</button>
                <button class="sell-btn" onclick="sellPropertyInstance(${propInst.uniqueId})">Sell</button>
            </div>
            <div class="property-upgrades-detail" id="upgrades-detail-${propInst.uniqueId}"></div>`;
        targetElement.appendChild(card);
    });
}

function togglePropertyUpgradesView(ownedPropertyUniqueId) {
    ensureUIInitialized();
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) return;
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) return;
    const upgradesDetailDiv = document.getElementById(`upgrades-detail-${ownedPropertyUniqueId}`);
    const manageButton = document.querySelector(`#owned-property-card-${ownedPropertyUniqueId} .manage-upgrades-btn`);
    if (!upgradesDetailDiv || !manageButton) return;

    const isVisible = upgradesDetailDiv.classList.contains('visible');
    if (isVisible) {
        upgradesDetailDiv.classList.remove('visible');
        manageButton.textContent = 'Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';
        let detailContentHTML = '';
        const mainLevelUpgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel - 1));
        let mainDisabledText = "", mainIsDisabled = false;
        if (propertyInstance.mainLevel >= propertyType.mainLevelMax) { mainDisabledText = "(Max Level)"; mainIsDisabled = true; }
        else if (gameState.cash < mainLevelUpgradeCost) { mainDisabledText = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`; mainIsDisabled = true; }
        else { mainDisabledText = `($${formatNumber(mainLevelUpgradeCost,0)})`; }
        detailContentHTML += `<button class="upgrade-main-btn-detail" onclick="upgradePropertyMainLevel(${propertyInstance.uniqueId})" ${mainIsDisabled ? 'disabled' : ''}>Upgrade Main Lvl ${mainDisabledText}</button>`;
        
        if (propertyType.upgrades && propertyType.upgrades.length > 0) {
            detailContentHTML += '<p>Specific Upgrades:</p>';
            propertyType.upgrades.forEach(upgDef => {
                const currentTier = propertyInstance.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor(upgDef.cost * Math.pow(1.5, currentTier));
                const materialsBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                let efficiency = 1;
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buff = getResearchTopicById("advanced_material_processing")?.globalBuff;
                    if (buff && buff.type === "material_usage_efficiency") efficiency = 1 - buff.percentage;
                }
                const actualMats = Math.floor(materialsBase * efficiency);
                let btnText = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                let isDisabled = false, reason = "";
                if (currentTier >= upgDef.maxTier) { reason = "(Max Tier)"; isDisabled = true; }
                else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) { reason = "(Needs Res.)"; isDisabled = true; }
                else if (gameState.cash < costNextTier) { reason = `(Need $${formatNumber(costNextTier,0)})`; isDisabled = true; }
                else if (actualMats > 0 && gameState.buildingMaterials < actualMats) { reason = `(Need ${actualMats} Mats)`; isDisabled = true; }
                else { reason = `($${formatNumber(costNextTier,0)}${actualMats > 0 ? ', '+actualMats+' Mats' : ''})`;}
                btnText += ` ${reason}`;
                detailContentHTML += `<button class="specific-upgrade-btn-detail" onclick="applySpecificPropertyUpgrade(${propertyInstance.uniqueId}, '${upgDef.id}')" ${isDisabled ? 'disabled' : ''} title="RPS: +${formatNumber(upgDef.rpsBoost,2)}/tier. Mats: ${actualMats>0?actualMats:0}">${btnText}</button>`;
            });
        } else { detailContentHTML += '<p>No specific upgrades for this rental.</p>'; }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}

function displayAvailableFacilitiesList(targetElement, filterType) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedCount = 0;
    FACILITY_TYPES.filter(facType => {
        if (!isFacilityTypeUnlocked(facType.id)) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return false; 
    }).forEach(facType => {
        if (!facType || typeof facType.cost === 'undefined') { console.error("Invalid construction type:", facType); return; }
        displayedCount++;
        const currentMonetaryCost = calculateFacilityDynamicCost(facType);
        const materialsCost = facType.materialsCost || 0;
        let outputText = facType.output ? `${formatNumber(facType.output.amount,3)}/s ${facType.output.resource}` : (facType.effects ? "Global Buff(s)" : "No direct output");
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `<h3>${facType.name}</h3><p>${facType.description}</p>
            <p class="facility-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
            <p class="facility-upkeep">Upkeep: $${formatNumber(facType.baseUpkeepRPS,2)}/s</p>
            <p class="facility-output">Output: ${outputText}</p>
            <button onclick="buyFacility('${facType.id}')" id="buy-fac-${facType.id}-btn">Build</button>`;
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id) && ((filterType === 'material' && (ft.output?.resource === 'buildingMaterials' || ft.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material")))) || (filterType === 'science' && ft.output?.resource === 'researchPoints'))) ? `<p>More ${filterType} construction via research.</p>` : `<p>No ${filterType} construction options.</p>`;
}

function displayOwnedFacilitiesList(targetElement, filterType) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    const filtered = ownedFacilities.filter(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return false; 
    });
    if (filtered.length === 0) { targetElement.innerHTML = `<p>No ${filterType} constructions owned.</p>`; return; }
    filtered.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) { console.error("Orphaned construction:", facInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-facility-card';
        card.setAttribute('data-id', facInst.uniqueId);
        card.id = `owned-facility-card-${facInst.uniqueId}`;
        let outputText = facInst.currentOutput ? `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}` : (facType.effects ? "Provides Global Buff(s)" : "No direct output");
        card.innerHTML = `<h3>${facInst.name} (ID: ${facInst.uniqueId})</h3>
             <div class="property-info-grid">
                <p><span class="label">Lvl:</span> <span class="value">${facInst.mainLevel}/${facType.mainLevelMax}</span></p>
                <p><span class="label">Upkeep:</span> <span class="value">$${formatNumber(facInst.currentUpkeepRPS)}/s</span></p>
                <p><span class="label">Output:</span> <span class="value">${outputText}</span></p>
            </div>
            <div class="card-actions">
                <button class="manage-upgrades-btn" onclick="toggleFacilityUpgradesView(${facInst.uniqueId})">Upgrades</button>
                <button class="sell-btn" onclick="sellFacilityInstance(${facInst.uniqueId})">Demolish</button>
            </div>
            <div class="property-upgrades-detail" id="upgrades-detail-facility-${facInst.uniqueId}"></div>`;
        targetElement.appendChild(card);
    });
}

function toggleFacilityUpgradesView(facilityUniqueId) {
    ensureUIInitialized();
    const facilityInstance = ownedFacilities.find(f => f.uniqueId === facilityUniqueId);
    if (!facilityInstance) return;
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    if (!facilityType) return;
    const upgradesDetailDiv = document.getElementById(`upgrades-detail-facility-${facilityUniqueId}`);
    const manageButton = document.querySelector(`#owned-facility-card-${facilityUniqueId} .manage-upgrades-btn`);
    if (!upgradesDetailDiv || !manageButton) return;

    const isVisible = upgradesDetailDiv.classList.contains('visible');
    if (isVisible) {
        upgradesDetailDiv.classList.remove('visible');
        manageButton.textContent = 'Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';
        let detailContentHTML = '';
        const mainLevelUpgradeCost = Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, facilityInstance.mainLevel - 1));
        let mainDisabledText = "", mainIsDisabled = false;
        if (facilityInstance.mainLevel >= facilityType.mainLevelMax) { mainDisabledText = "(Max Lvl)"; mainIsDisabled = true; }
        else if (gameState.cash < mainLevelUpgradeCost) { mainDisabledText = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`; mainIsDisabled = true; }
        else { mainDisabledText = `($${formatNumber(mainLevelUpgradeCost,0)})`; }
        detailContentHTML += `<button class="upgrade-main-btn-detail" onclick="upgradeFacilityMainLevel(${facilityInstance.uniqueId})" ${mainIsDisabled ? 'disabled' : ''}>Upgrade Main Lvl ${mainDisabledText}</button>`;
        
        if (facilityType.upgrades && facilityType.upgrades.length > 0) {
            detailContentHTML += '<p>Specific Upgrades:</p>';
            facilityType.upgrades.forEach(upgDef => {
                const currentTier = facilityInstance.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor(upgDef.cost * Math.pow(1.6, currentTier));
                const materialsBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                let efficiency = 1;
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buff = getResearchTopicById("advanced_material_processing")?.globalBuff;
                    if (buff && buff.type === "material_usage_efficiency") efficiency = 1 - buff.percentage;
                }
                const actualMats = Math.floor(materialsBase * efficiency);
                let btnText = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                let isDisabled = false, reason = "";
                if (currentTier >= upgDef.maxTier) { reason = "(Max Tier)"; isDisabled = true; }
                else if (gameState.cash < costNextTier) { reason = `(Need $${formatNumber(costNextTier,0)})`; isDisabled = true; }
                else if (actualMats > 0 && gameState.buildingMaterials < actualMats) { reason = `(Need ${actualMats} Mats)`; isDisabled = true; }
                else { reason = `($${formatNumber(costNextTier,0)}${actualMats > 0 ? ', '+actualMats+' Mats' : ''})`;}
                btnText += ` ${reason}`;
                detailContentHTML += `<button class="specific-upgrade-btn-detail" onclick="applySpecificFacilityUpgrade(${facilityInstance.uniqueId}, '${upgDef.id}')" ${isDisabled ? 'disabled' : ''} title="Effect: Varies. Mats: ${actualMats>0?actualMats:0}">${btnText}</button>`;
            });
        } else { detailContentHTML += '<p>No specific upgrades for this construction.</p>'; }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}

function displayResearchOptionsList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedCount = 0;
    RESEARCH_TOPICS.forEach(topic => {
        if (gameState.unlockedResearch.includes(topic.id)) return;
        if (!isResearchAvailable(topic.id)) return;
        if (!topic || (typeof topic.cost === 'undefined' && typeof topic.materialsCost === 'undefined' && typeof topic.costRP === 'undefined')) {
            console.error("Skipping invalid research topic (missing cost):", topic); return;
        }
        displayedCount++;
        const card = document.createElement('div');
        card.className = 'research-item-card';
        let costStrings = [];
        if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) costStrings.push(`$${formatNumber(topic.cost, 0)}`);
        if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) costStrings.push(`${formatNumber(topic.materialsCost, 0)} Materials`);
        if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) costStrings.push(`${formatNumber(topic.costRP, 1)} RP`);
        let costText = "Cost: " + (costStrings.length > 0 ? costStrings.join(' + ') : "Free");

        card.innerHTML = `<h3>${topic.name}</h3><p>${topic.description}</p>
            <p class="research-cost">${costText}</p>
            <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn">Research</button>`;
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = RESEARCH_TOPICS.every(t => gameState.unlockedResearch.includes(t.id)) ? '<p>All research completed!</p>' : '<p>No new research. Check prerequisites.</p>';
}

// ---- Button State Update Router ----
function updateAllButtonStatesForCurrentView() {
    ensureUIInitialized();
    if (currentView === 'rentals') {
        updatePropertyBuyButtonStates();
    } else if (currentView === 'materials') {
        updateFacilityBuyButtonStates('material');
    } else if (currentView === 'research') {
        updateResearchButtonStatesList();
    }
    // Upgrade buttons for owned items are updated when their respective detail views are toggled.
}

// ---- Specific Button State Update Functions ----
function updatePropertyBuyButtonStates() {
    ensureUIInitialized();
    if (!leftColumnListElement) return; 

    PROPERTY_TYPES.forEach(propType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-prop-${propType.id}-btn`);
        if (buyButton) {
            const cardElement = buyButton.closest('.property-card');
            if(!isPropertyTypeUnlocked(propType.id)) {
                if(cardElement) cardElement.style.display = 'none'; 
                return;
            }
            if(cardElement) cardElement.style.display = 'flex'; 

            const monetaryCost = calculateDynamicPropertyCost(propType);
            const materialsCost = propType.materialsCost || 0;
            let reason = "";
            if (gameState.cash < monetaryCost) reason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) reason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!reason;
            buyButton.textContent = `Buy ${reason}`;
        }
    });

    // Update the "Unlock Next Rentals" button state
    let nextUnlockResearch = null;
    for (const research of RESEARCH_TOPICS) {
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0 &&
            !gameState.unlockedResearch.includes(research.id) &&
            isResearchAvailable(research.id)) {
            const trulyUnlocksNew = research.unlocksPropertyType.some(propId => {
                const propType = getPropertyTypeById(propId);
                return propType && !isPropertyTypeUnlocked(propType.id); 
            });
            if (trulyUnlocksNew) {
                nextUnlockResearch = research;
                break;
            }
        }
    }

    if (nextUnlockResearch) {
        const unlockButton = leftColumnListElement.querySelector(`#unlock-property-tier-${nextUnlockResearch.id}-btn`);
        if (unlockButton) {
            const buttonContainer = unlockButton.closest('.unlock-next-tier-button-container');
             if (!buttonContainer) return; // Should not happen if button exists

            if (gameState.unlockedResearch.includes(nextUnlockResearch.id) || !isResearchAvailable(nextUnlockResearch.id)) {
                 buttonContainer.style.display = 'none';
                return;
            }
            buttonContainer.style.display = 'block'; 

            let canAfford = true;
            let missingReasonParts = [];
            let costTextParts = [];

            if (nextUnlockResearch.hasOwnProperty('cost') && typeof nextUnlockResearch.cost === 'number' && nextUnlockResearch.cost > 0) {
                costTextParts.push(`$${formatNumber(nextUnlockResearch.cost,0)}`);
                if (gameState.cash < nextUnlockResearch.cost) { canAfford = false; missingReasonParts.push(`$${formatNumber(nextUnlockResearch.cost - gameState.cash,0)}`); }
            }
            if (nextUnlockResearch.hasOwnProperty('materialsCost') && typeof nextUnlockResearch.materialsCost === 'number' && nextUnlockResearch.materialsCost > 0) {
                costTextParts.push(`${formatNumber(nextUnlockResearch.materialsCost,0)} Mats`);
                if (gameState.buildingMaterials < nextUnlockResearch.materialsCost) { canAfford = false; missingReasonParts.push(`${formatNumber(nextUnlockResearch.materialsCost - gameState.buildingMaterials,0)} Mats`); }
            }
            if (nextUnlockResearch.hasOwnProperty('costRP') && typeof nextUnlockResearch.costRP === 'number' && nextUnlockResearch.costRP > 0) {
                costTextParts.push(`${formatNumber(nextUnlockResearch.costRP,1)} RP`);
                if (gameState.researchPoints < nextUnlockResearch.costRP) { canAfford = false; missingReasonParts.push(`${formatNumber(nextUnlockResearch.costRP - gameState.researchPoints,1)} RP`); }
            }
            
            unlockButton.disabled = !canAfford;
            let baseButtonText = `Unlock Next Rentals (${nextUnlockResearch.name})`;
            let costDisplayForButton = costTextParts.length > 0 ? costTextParts.join(' + ') : "Free";

            if (!canAfford && missingReasonParts.length > 0) {
                unlockButton.textContent = `${baseButtonText} (Need ${missingReasonParts.join(', ')})`;
            } else {
                unlockButton.textContent = `${baseButtonText} - Cost: ${costDisplayForButton}`;
            }
        }
    }
}

function updateFacilityBuyButtonStates(filterType) {
    ensureUIInitialized();
    if (!leftColumnListElement) return;
    FACILITY_TYPES.filter(facTypeF => {
        if (filterType === 'material') return facTypeF.output?.resource === 'buildingMaterials' || facTypeF.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facTypeF.output?.resource === 'researchPoints';
        return true;
    }).forEach(facType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-fac-${facType.id}-btn`);
        if (buyButton) {
            const cardElement = buyButton.closest('.facility-card');
            if (!isFacilityTypeUnlocked(facType.id)) {
                if(cardElement) cardElement.style.display = 'none'; return;
            }
            if(cardElement) cardElement.style.display = 'flex';
            const monetaryCost = calculateFacilityDynamicCost(facType);
            const materialsCost = facType.materialsCost || 0;
            let reason = "";
            if (gameState.cash < monetaryCost) reason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) reason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!reason;
            buyButton.textContent = `Build ${reason}`;
        }
    });
}

function updateResearchButtonStatesList() {
    ensureUIInitialized();
    if (!leftColumnListElement) return;
    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = leftColumnListElement.querySelector(`#research-${topic.id}-btn`);
        if (researchButton && researchButton.closest('.research-item-card')) {
            const cardElement = researchButton.closest('.research-item-card');
            if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                cardElement.style.display = 'none'; return;
            }
            cardElement.style.display = 'flex';
            let disabledReason = ""; let canAfford = true;
            if (topic.hasOwnProperty('cost') && topic.cost > 0 && gameState.cash < topic.cost) { canAfford = false; disabledReason += ` $${formatNumber(topic.cost,0)}`; }
            if (topic.hasOwnProperty('materialsCost') && topic.materialsCost > 0 && gameState.buildingMaterials < topic.materialsCost) { canAfford = false; disabledReason += ` ${topic.materialsCost} Mats`; }
            if (topic.hasOwnProperty('costRP') && topic.costRP > 0 && gameState.researchPoints < topic.costRP) { canAfford = false; disabledReason += ` ${formatNumber(topic.costRP,1)} RP`; }
            researchButton.disabled = !canAfford;
            researchButton.textContent = `Research ${canAfford ? '' : '(Need' + disabledReason + ')' }`;
        }
    });
}

// ---- Initial Render ----
function initialRender() {
    initializeUIElements(); 
    if (!uiInitialized) {
        console.error("CRITICAL: UI FAILED TO INITIALIZE FROM initialRender. Aborting further UI setup. Check console messages from initializeUIElements() for missing HTML element IDs.");
        return; 
    }
    console.log("initialRender: Updating initial stat displays.");
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();
    
    console.log("initialRender: Switching to default view:", currentView);
    switchView(currentView); 
    
    console.log("initialRender: UI setup process completed.");
}
