// Metropolis Estates - ui.js (v0.5.2 - Sequential Rental Unlocks)

// Declare variables that will hold DOM elements. They will be assigned in initializeUIElements.
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay,
    buildingMaterialsDisplay, researchPointsDisplay, /* totalUpkeepDisplay - removed */
    leftColumnTitleElement, leftColumnListElement,
    rightColumnTitleElement, rightColumnListElement,
    navRentalsButton, /* navMaterialsButton - removed */ navResearchButton;

let uiInitialized = false; // Flag to track if UI elements have been successfully initialized
let currentView = 'research'; // Start on Research tab as per previous logic

/**
 * Initializes references to all DOM elements used by the UI.
 */
function initializeUIElements() {
    if (uiInitialized) return;
    cashDisplay = document.getElementById('cash-display');
    netRpsDisplay = document.getElementById('rps-display');
    ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
    buildingMaterialsDisplay = document.getElementById('building-materials-display');
    researchPointsDisplay = document.getElementById('research-points-display');
    // totalUpkeepDisplay = document.getElementById('total-upkeep-display'); // Removed

    leftColumnTitleElement = document.getElementById('left-column-title');
    leftColumnListElement = document.getElementById('left-column-list');
    rightColumnTitleElement = document.getElementById('right-column-title');
    rightColumnListElement = document.getElementById('right-column-list');

    navRentalsButton = document.getElementById('nav-rentals');
    // navMaterialsButton = document.getElementById('nav-materials'); // Removed
    navResearchButton = document.getElementById('nav-research');

    if (cashDisplay && netRpsDisplay && ownedPropertiesCountDisplay &&
        buildingMaterialsDisplay && researchPointsDisplay && 
        leftColumnTitleElement && leftColumnListElement &&
        rightColumnTitleElement && rightColumnListElement &&
        navRentalsButton && navResearchButton) {
        uiInitialized = true;
        console.log("UI Elements Initialized (v0.5.2).");
        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navResearchButton.addEventListener('click', () => switchView('research'));
    } else {
        console.error("CRITICAL: One or more essential UI elements not found. Check HTML IDs.");
        if(document.body) {
            document.body.innerHTML = `<div style="color:red;text-align:center;padding:20px;font-family:Arial;"><h1>UI ERROR</h1><p>Missing HTML elements. Check console.</p></div>`;
        }
    }
}

/**
 * Helper function to ensure UI elements are initialized before use.
 */
function ensureUIInitialized() {
    if (!uiInitialized) {
        console.warn("UI elements not initialized. Attempting now.");
        initializeUIElements();
        if (!uiInitialized) console.error("FATAL: UI INITIALIZATION FAILED.");
    }
}

/**
 * Switches the main content view.
 * @param {string} viewName - 'rentals' or 'research'.
 */
function switchView(viewName) {
    ensureUIInitialized();
    if (!uiInitialized) return;
    currentView = viewName;
    const navButtons = [navRentalsButton, navResearchButton];
    navButtons.forEach(btn => { if (btn) btn.classList.remove('active-nav'); });
    if (viewName === 'rentals' && navRentalsButton) navRentalsButton.classList.add('active-nav');
    else if (viewName === 'research' && navResearchButton) navResearchButton.classList.add('active-nav');
    updateGameData();
}

/**
 * Formats a number for display.
 * @param {number} num - The number to format.
 * @param {number} [decimals=2] - Decimal places.
 * @returns {string} Formatted number or 'N/A'.
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
        const rate = gameState.buildingMaterialsPerSecond || 0;
        buildingMaterialsDisplay.textContent = `Materials: ${formatNumber(gameState.buildingMaterials, 0)} (+${formatNumber(rate,1)}/s)`;
        const materialsAreRelevant = PROPERTY_TYPES.some(p => p.materialsCost > 0) || 
                                   RESEARCH_TOPICS.some(r => r.materialsCost > 0) || 
                                   FACILITY_TYPES.some(ft => ft.materialsCost > 0) || 
                                   rate > 0; 
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || materialsAreRelevant ? 'inline-block' : 'none';
    }
}
function updateResearchPointsDisplay() {
    ensureUIInitialized();
    if (researchPointsDisplay) {
        const rate = gameState.researchPointsPerSecond || 0;
        researchPointsDisplay.textContent = `RP: ${formatNumber(gameState.researchPoints, 1)} (+${formatNumber(rate,1)}/s)`;
        const researchIsRelevant = RESEARCH_TOPICS.length > 0 || rate > 0;
        researchPointsDisplay.style.display = gameState.researchPoints > 0 || researchIsRelevant ? 'inline-block' : 'none';
    }
}
// Removed updateTotalUpkeepDisplay as individual facility upkeep is gone.

// ---- Main Content Display Router ----
function displayCurrentViewContent() {
    ensureUIInitialized();
    if (!uiInitialized || !leftColumnListElement || !rightColumnListElement || !leftColumnTitleElement || !rightColumnTitleElement) return;
    leftColumnListElement.innerHTML = ''; 
    rightColumnListElement.innerHTML = '';

    if (currentView === 'rentals') {
        leftColumnTitleElement.textContent = 'Available Rentals';
        rightColumnTitleElement.textContent = 'My Portfolio';
        displayAvailablePropertiesList(leftColumnListElement);
        displayOwnedPropertiesList(rightColumnListElement);
    } else if (currentView === 'research') {
        leftColumnTitleElement.textContent = 'Available Research';
        rightColumnTitleElement.textContent = 'Global Production & Buffs';
        displayResearchOptionsList(leftColumnListElement); 
        displayGlobalProductionAndBuffs(rightColumnListElement); 
    }
    updateAllButtonStatesForCurrentView();
}

// ---- Specific List Display Functions ----

/**
 * Displays available rental properties and the next unlock card.
 * @param {HTMLElement} targetElement - The HTML element to populate.
 */
function displayAvailablePropertiesList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedItemCount = 0;

    // 1. Display all currently unlocked and buyable properties
    // Iterate in the order defined in PROPERTY_TYPES for consistent display
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

    // 2. Find and display the *next* research that unlocks more properties as an "Unlock New Rental" card
    let nextPropertyUnlockResearch = null;
    // Find the first research topic that unlocks properties, is available, and unlocks something new
    for (const research of RESEARCH_TOPICS) { 
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0 &&
            !gameState.unlockedResearch.includes(research.id) && 
            isResearchAvailable(research.id)) { 
            
            const unlocksTrulyNewProperties = research.unlocksPropertyType.some(propId => {
                const propType = getPropertyTypeById(propId);
                return propType && !isPropertyTypeUnlocked(propType.id); 
            });

            if (unlocksTrulyNewProperties) {
                nextPropertyUnlockResearch = research;
                break; 
            }
        }
    }

    if (nextPropertyUnlockResearch) {
        displayedItemCount++; 
        const unlockCard = document.createElement('div');
        unlockCard.className = 'unlock-rental-card'; // Use specific CSS class

        let costStrings = [];
        if (nextPropertyUnlockResearch.hasOwnProperty('cost') && typeof nextPropertyUnlockResearch.cost === 'number' && nextPropertyUnlockResearch.cost > 0) costStrings.push(`$${formatNumber(nextPropertyUnlockResearch.cost, 0)}`);
        if (nextPropertyUnlockResearch.hasOwnProperty('materialsCost') && typeof nextPropertyUnlockResearch.materialsCost === 'number' && nextPropertyUnlockResearch.materialsCost > 0) costStrings.push(`${formatNumber(nextPropertyUnlockResearch.materialsCost, 0)} Materials`);
        if (nextPropertyUnlockResearch.hasOwnProperty('costRP') && typeof nextPropertyUnlockResearch.costRP === 'number' && nextPropertyUnlockResearch.costRP > 0) costStrings.push(`${formatNumber(nextPropertyUnlockResearch.costRP, 1)} RP`);
        let costText = costStrings.length > 0 ? costStrings.join(' + ') : "Free";
        
        // Specific override for the 300 RP unlock if it's "urban_planning_1"
        if (nextPropertyUnlockResearch.id === "unlock_urban_planning_1" && nextPropertyUnlockResearch.costRP === 300) {
            // Rebuild costText to prioritize the 300 RP for this specific research
            let specificCostStrings = [`${formatNumber(300,0)} RP`];
            if (nextPropertyUnlockResearch.materialsCost > 0) specificCostStrings.push(`${formatNumber(nextPropertyUnlockResearch.materialsCost, 0)} Materials`);
            // Add cash if it also has a cash cost
            if (nextPropertyUnlockResearch.cost > 0) specificCostStrings.push(`$${formatNumber(nextPropertyUnlockResearch.cost, 0)}`);
            costText = specificCostStrings.join(' + ');
        }

        const unlocksNames = nextPropertyUnlockResearch.unlocksPropertyType.map(id => getPropertyTypeById(id)?.name).filter(name => name).join(', ');
        unlockCard.innerHTML = `
            <h3>Unlock Next Rentals</h3>
            <p>Via Research: "${nextPropertyUnlockResearch.name}"</p>
            <p>Unlocks: ${unlocksNames || 'Next Tier Properties'}</p>
            <p class="research-cost-display">Research Cost: ${costText}</p>
            <button onclick="completeResearchAndRefreshUI('${nextPropertyUnlockResearch.id}')" 
                    id="unlock-property-via-research-${nextPropertyUnlockResearch.id}-btn">
                Unlock (${costText})
            </button>
        `;
        targetElement.appendChild(unlockCard);
    }

    if (displayedItemCount === 0) {
        // This message appears if no properties are unlocked (not even the first one via its research) 
        // OR if all defined properties are unlocked AND no further property-unlocking research is available.
        const anyPropertyResearchPending = RESEARCH_TOPICS.some(r => r.unlocksPropertyType && r.unlocksPropertyType.length > 0 && !gameState.unlockedResearch.includes(r.id) && isResearchAvailable(r.id));
        if (!anyPropertyResearchPending && PROPERTY_TYPES.every(p => isPropertyTypeUnlocked(p.id))) {
             targetElement.innerHTML = "<p>All available rentals unlocked!</p>";
        } else {
            targetElement.innerHTML = "<p>Complete initial research in R&D to unlock rentals.</p>";
        }
    }
}

/**
 * Helper function called by "Unlock" buttons.
 * @param {string} researchId - The ID of the research topic to complete.
 */
function completeResearchAndRefreshUI(researchId) {
    completeResearch(researchId); // from facilities.js; this already calls updateGameData()
}

/**
 * Displays owned rental properties.
 * @param {HTMLElement} targetElement - The HTML element to populate.
 */
function displayOwnedPropertiesList(targetElement) {
    // This function remains the same as the version from ui_js_full_v0_4_9
    // It creates compact cards with an expandable "Manage Upgrades" section.
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

/**
 * Toggles the visibility of the detailed upgrade section for a specific owned property.
 * @param {number} ownedPropertyUniqueId - The unique ID of the property.
 */
function togglePropertyUpgradesView(ownedPropertyUniqueId) {
    // This function remains the same as the version from ui_js_full_v0_4_9
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
        upgradesDetailDiv.classList.remove('visible'); manageButton.textContent = 'Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible'); manageButton.textContent = 'Hide Upgrades';
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
                if (gameState.unlockedResearch.includes("advanced_material_processing_research")) { // Check correct research ID
                    const buff = getResearchTopicById("advanced_material_processing_research")?.globalBuff;
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


// --- RESEARCH & DEVELOPMENT TAB ---
function displayResearchOptionsList(targetElement) {
    // ... (This function remains the same as v0.5.0, showing research topics)
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedItemCount = 0;
    RESEARCH_TOPICS.forEach(topic => {
        if (!gameState.unlockedResearch.includes(topic.id) && isResearchAvailable(topic.id)) {
            displayedItemCount++;
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
        }
    });
    if (displayedItemCount === 0) {
        targetElement.innerHTML = RESEARCH_TOPICS.every(t => gameState.unlockedResearch.includes(t.id)) ? 
                                  "<p>All current research completed!</p>" : 
                                  "<p>No new research available. Check prerequisites.</p>";
    }
}

function displayGlobalProductionAndBuffs(targetElement) {
    // ... (This function remains the same as v0.5.0)
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = ''; 
    let contentHTML = '<h4>Global Rates & Effects:</h4><ul class="global-effects-list">';
    contentHTML += `<li>Research Points: +${formatNumber(gameState.researchPointsPerSecond || 0, 2)}/s</li>`;
    contentHTML += `<li>Building Materials: +${formatNumber(gameState.buildingMaterialsPerSecond || 0, 2)}/s</li>`;
    let hasBuffs = false;
    gameState.unlockedResearch.forEach(researchId => {
        const topic = getResearchTopicById(researchId);
        if (topic && topic.globalBuff) {
            hasBuffs = true;
            let buffText = `Active Buff ("${topic.name}"): `;
            if (topic.globalBuff.type === "property_cost_reduction") buffText += `Property costs -${topic.globalBuff.percentage * 100}%.`;
            else if (topic.globalBuff.type === "research_speed_boost") buffText += `RP generation +${topic.globalBuff.percentage * 100}%.`;
            else if (topic.globalBuff.type === "material_usage_efficiency") buffText += `Upgrade material costs -${topic.globalBuff.percentage * 100}%.`;
            else if (topic.globalBuff.type === "property_rps_boost") buffText += `${topic.globalBuff.scope || 'All'} rentals RPS +${topic.globalBuff.percentage * 100}%.`;
            else buffText += `${topic.globalBuff.type}`;
            contentHTML += `<li>${buffText}</li>`;
        }
    });
    if (!hasBuffs && (gameState.researchPointsPerSecond || 0) === 0 && (gameState.buildingMaterialsPerSecond || 0) === 0) {
        contentHTML += '<li>No global production or buffs active yet.</li>';
    }
    contentHTML += '</ul>';
    targetElement.innerHTML = contentHTML;
}

// ---- Button State Update Router ----
function updateAllButtonStatesForCurrentView() {
    ensureUIInitialized();
    if (currentView === 'rentals') {
        updatePropertyBuyButtonStates();
    } 
    // No 'materials' view to update buttons for here
    else if (currentView === 'research') {
        updateResearchButtonStatesList();
    }
}

// ---- Specific Button State Update Functions ----
function updatePropertyBuyButtonStates() {
    ensureUIInitialized();
    if (!leftColumnListElement) return; 

    PROPERTY_TYPES.forEach(propType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-prop-${propType.id}-btn`);
        if (buyButton) {
            const cardElement = buyButton.closest('.property-card'); 
            if(!isPropertyTypeUnlocked(propType.id)) { // Should not be rendered by display logic if not unlocked
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

    let nextUnlockResearch = null; 
    for (const research of RESEARCH_TOPICS) { 
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0 &&
            !gameState.unlockedResearch.includes(research.id) && isResearchAvailable(research.id)) {
            const trulyUnlocksNew = research.unlocksPropertyType.some(propId => !isPropertyTypeUnlocked(propId));
            if (trulyUnlocksNew) { nextUnlockResearch = research; break; }
        }
    }
    if (nextUnlockResearch) {
        const unlockButton = leftColumnListElement.querySelector(`#unlock-property-via-research-${nextUnlockResearch.id}-btn`);
        if (unlockButton) {
            const buttonContainer = unlockButton.closest('.unlock-rental-card'); 
            if (!buttonContainer) return; 
            if (gameState.unlockedResearch.includes(nextUnlockResearch.id) || !isResearchAvailable(nextUnlockResearch.id)) {
                buttonContainer.style.display = 'none'; return;
            }
            buttonContainer.style.display = 'flex'; 
            let canAfford = true; let missingReasonParts = []; let costTextPartsButton = []; 
            if (nextUnlockResearch.hasOwnProperty('cost') && typeof nextUnlockResearch.cost === 'number' && nextUnlockResearch.cost > 0) { costTextPartsButton.push(`$${formatNumber(nextUnlockResearch.cost,0)}`); if (gameState.cash < nextUnlockResearch.cost) { canAfford = false; missingReasonParts.push(`$${formatNumber(nextUnlockResearch.cost - gameState.cash,0)}`); }}
            if (nextUnlockResearch.hasOwnProperty('materialsCost') && typeof nextUnlockResearch.materialsCost === 'number' && nextUnlockResearch.materialsCost > 0) { costTextPartsButton.push(`${formatNumber(nextUnlockResearch.materialsCost,0)} Mats`); if (gameState.buildingMaterials < nextUnlockResearch.materialsCost) { canAfford = false; missingReasonParts.push(`${formatNumber(nextUnlockResearch.materialsCost - gameState.buildingMaterials,0)} Mats`); }}
            if (nextUnlockResearch.hasOwnProperty('costRP') && typeof nextUnlockResearch.costRP === 'number' && nextUnlockResearch.costRP > 0) { costTextPartsButton.push(`${formatNumber(nextUnlockResearch.costRP,1)} RP`); if (gameState.researchPoints < nextUnlockResearch.costRP) { canAfford = false; missingReasonParts.push(`${formatNumber(nextUnlockResearch.costRP - gameState.researchPoints,1)} RP`); }}
            unlockButton.disabled = !canAfford;
            let baseButtonText = `Unlock (${nextUnlockResearch.name})`; 
            let costDisplayForButton = costTextPartsButton.length > 0 ? costTextPartsButton.join(' + ') : "Free";
            if (!canAfford && missingReasonParts.length > 0) {
                unlockButton.textContent = `${baseButtonText} (Need ${missingReasonParts.join(', ')})`;
            } else {
                unlockButton.textContent = `${baseButtonText} - Cost: ${costDisplayForButton}`;
            }
        }
    }
}

// Removed updateFacilityBuyButtonStates as Material Acquisition tab is removed.
// Facility unlocks will appear as research items in the R&D tab.

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
            if (topic.hasOwnProperty('cost') && topic.cost > 0 && gameState.cash < topic.cost) { canAfford = false; disabledReason += ` $${formatNumber(topic.cost - gameState.cash,0)}`; }
            if (topic.hasOwnProperty('materialsCost') && topic.materialsCost > 0 && gameState.buildingMaterials < topic.materialsCost) { canAfford = false; disabledReason += ` ${formatNumber(topic.materialsCost - gameState.buildingMaterials,0)} Mats`; }
            if (topic.hasOwnProperty('costRP') && topic.costRP > 0 && gameState.researchPoints < topic.costRP) { canAfford = false; disabledReason += ` ${formatNumber(topic.costRP - gameState.researchPoints,1)} RP`; }
            researchButton.disabled = !canAfford;
            researchButton.textContent = `Research ${canAfford ? '' : '(Need' + disabledReason.trim() + ')' }`;
        }
    });
}

// ---- Initial Render ----
function initialRender() {
    initializeUIElements(); 
    if (!uiInitialized) {
        console.error("CRITICAL: UI FAILED TO INITIALIZE FROM initialRender. Aborting.");
        return; 
    }
    console.log("initialRender: Updating initial stat displays.");
    updateCashDisplay(); updateNetRPSDisplay(); updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay(); updateResearchPointsDisplay();
    
    console.log("initialRender: Switching to default view:", currentView); // Should be 'research'
    switchView(currentView); 
    
    console.log("initialRender: UI setup process completed.");
}
