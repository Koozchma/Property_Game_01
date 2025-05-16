// Metropolis Estates - ui.js

// Declare variables that will hold DOM elements
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay,
    buildingMaterialsDisplay, researchPointsDisplay, totalUpkeepDisplay,
    leftColumnTitleElement, leftColumnListElement,
    rightColumnTitleElement, rightColumnListElement,
    navRentalsButton, navMaterialsButton, navResearchButton;

let uiInitialized = false;
let currentView = 'rentals'; // Default view

function initializeUIElements() {
    if (uiInitialized) return;

    cashDisplay = document.getElementById('cash-display');
    netRpsDisplay = document.getElementById('rps-display');
    ownedPropertiesCountDisplay = document.getElementById('owned-properties-count');
    buildingMaterialsDisplay = document.getElementById('building-materials-display');
    researchPointsDisplay = document.getElementById('research-points-display');
    totalUpkeepDisplay = document.getElementById('total-upkeep-display');

    leftColumnTitleElement = document.getElementById('left-column-title');
    leftColumnListElement = document.getElementById('left-column-list');
    rightColumnTitleElement = document.getElementById('right-column-title');
    rightColumnListElement = document.getElementById('right-column-list');

    navRentalsButton = document.getElementById('nav-rentals');
    navMaterialsButton = document.getElementById('nav-materials');
    navResearchButton = document.getElementById('nav-research');

    if (leftColumnTitleElement && rightColumnTitleElement && navRentalsButton &&
        leftColumnListElement && rightColumnListElement) {
        uiInitialized = true;
        console.log("UI Elements Initialized.");

        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navMaterialsButton.addEventListener('click', () => switchView('materials'));
        navResearchButton.addEventListener('click', () => switchView('research'));
    } else {
        console.error("One or more critical UI elements not found during initialization. UI might not function correctly.");
        try {
            document.body.innerHTML = `<div style="padding:20px;text-align:center;color:red;font-family:Arial,sans-serif;"><h1>Critical UI Initialization Error</h1><p>Essential HTML elements for the game are missing. Please check the browser console (F12) for more details and verify HTML element IDs.</p></div>`;
        } catch (e) {
            // Fallback
        }
    }
}

function ensureUIInitialized() {
    if (!uiInitialized) {
        console.warn("UI not initialized, attempting to initialize now (ensure this is not called before DOMContentLoaded).");
        initializeUIElements();
        if (!uiInitialized) {
            console.error("FORCE UI INITIALIZATION FAILED. DOM elements might not be ready or IDs are incorrect.");
        }
    }
}

function switchView(viewName) {
    ensureUIInitialized();
    if (!uiInitialized) return; // Don't proceed if UI couldn't initialize

    currentView = viewName;

    // Update navigation button active states
    [navRentalsButton, navMaterialsButton, navResearchButton].forEach(btn => {
        if (btn) btn.classList.remove('active-nav');
    });

    if (viewName === 'rentals' && navRentalsButton) navRentalsButton.classList.add('active-nav');
    else if (viewName === 'materials' && navMaterialsButton) navMaterialsButton.classList.add('active-nav');
    else if (viewName === 'research' && navResearchButton) navResearchButton.classList.add('active-nav');

    updateGameData(); // This will trigger displayCurrentViewContent and button state updates
}

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
        const materialsAreUsed = PROPERTY_TYPES.some(p => p.materialsCost > 0) || FACILITY_TYPES.some(ft => ft.materialsCost > 0);
        buildingMaterialsDisplay.style.display = gameState.buildingMaterials > 0 || ownedFacilities.some(f => f.currentOutput?.resource === 'buildingMaterials') || materialsAreUsed ? 'inline-block' : 'none';
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
        console.error("Generic list/title elements not ready for displayCurrentViewContent");
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
    if (!targetElement) {
        console.error("Target element for available rentals not provided or initialized.");
        return;
    }
    targetElement.innerHTML = ''; // Clear previous content
    let displayedItemCount = 0;

    // 1. Always display the Shack if it's defined and unlocked (it should be by default)
    const shack = getPropertyTypeById("shack"); // from properties.js
    if (shack && isPropertyTypeUnlocked(shack.id)) { // isPropertyTypeUnlocked from properties.js
        displayedItemCount++;
        const currentMonetaryCost = calculateDynamicPropertyCost(shack); // from properties.js
        const materialsCost = shack.materialsCost || 0;
        const card = document.createElement('div');
        card.className = 'property-card'; // Use your futuristic card style
        card.innerHTML = `
            <h3>${shack.name}</h3>
            <p>${shack.description}</p>
            <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
            <p>Base RPS: $${formatNumber(shack.baseRPS,1)}/s</p>
            <p>Max Lvl: ${shack.mainLevelMax || 'N/A'}</p>
            <button onclick="buyProperty('${shack.id}')" id="buy-prop-${shack.id}-btn">Buy</button>
        `;
        targetElement.appendChild(card);
    }

    // 2. Determine the next set of properties to unlock or display
    let nextUnlockableTierFound = false;
    for (const research of RESEARCH_TOPICS) { // from facilities.js
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0) {
            const allPropertiesInThisTierUnlocked = research.unlocksPropertyType.every(propId =>
                isPropertyTypeUnlocked(propId) // This means the research is done
            );

            if (allPropertiesInThisTierUnlocked) {
                // This research is done, so its properties should be displayed IF they are the "current" ones to show
                // We need to ensure we are not re-displaying already unlocked and potentially purchased items
                // or jumping too far ahead.
                // For simplicity here, we'll show all unlocked properties after the shack.
                // A more advanced system might only show the *next immediate available tier*.
                research.unlocksPropertyType.forEach(propId => {
                    // Avoid re-listing if already shown due to another logic path (though unlikely here)
                    if (targetElement.querySelector(`#buy-prop-${propId}-btn`)) return;

                    const propType = getPropertyTypeById(propId);
                    if (propType && isPropertyTypeUnlocked(propType.id)) { // Double check unlock
                        displayedItemCount++;
                        const currentMonetaryCost = calculateDynamicPropertyCost(propType);
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

            } else if (isResearchAvailable(research.id)) { // Research is available but not done
                // This is a candidate for the "Unlock" card
                displayedItemCount++;
                nextUnlockableTierFound = true;
                const placeholderCard = document.createElement('div');
                placeholderCard.className = 'unlock-placeholder-card'; // Use your placeholder style

                let costStrings = [];
                if (research.hasOwnProperty('cost') && typeof research.cost === 'number' && research.cost > 0) {
                    costStrings.push(`$${formatNumber(research.cost, 0)}`);
                }
                if (research.hasOwnProperty('materialsCost') && typeof research.materialsCost === 'number' && research.materialsCost > 0) {
                    costStrings.push(`${formatNumber(research.materialsCost, 0)} Materials`);
                }
                if (research.hasOwnProperty('costRP') && typeof research.costRP === 'number' && research.costRP > 0) {
                    costStrings.push(`${formatNumber(research.costRP, 1)} RP`);
                }
                let costText = costStrings.length > 0 ? costStrings.join(' + ') : "Free";

                placeholderCard.innerHTML = `
                    <h3>Unlock: ${research.name}</h3>
                    <p>Unlocks: ${research.unlocksPropertyType.map(id => getPropertyTypeById(id)?.name || 'New Rentals').join(', ')}</p>
                    <p>Cost: <span class="research-cost-display">${costText}</span></p>
                    <button onclick="completeResearchAndRefreshUI('${research.id}')" id="unlock- μέσω-${research.id}-btn">Unlock</button>
                `;
                targetElement.appendChild(placeholderCard);
                break; // Show only the first available unlock research for properties
            }
        }
    }


    if (displayedItemCount === 0) { // If only shack was displayed, or nothing
        targetElement.innerHTML = "<p>No more rentals currently available. Check Research & Development for further unlocks.</p>";
    } else if (displayedItemCount === 1 && shack && !nextUnlockableTierFound && RESEARCH_TOPICS.some(r => r.unlocksPropertyType && r.unlocksPropertyType.length > 0 && !isResearchAvailable(r.id) && !gameState.unlockedResearch.includes(r.id))) {
        // Only shack is shown, no immediate unlock research available, but there IS future property research
        targetElement.innerHTML += "<p>Further rental tiers require more advanced research.</p>";
    }

    // The actual scrolling behavior is managed by CSS on .scrollable-list
    // We just need to ensure the content causes overflow.
    // If targetElement has few items, it won't scroll.
    // If you want to FORCE a minimum height to show scrollbar even with 1 item, that's CSS.
    // The request "When the next is unlocked it scrolls" implies that adding a 3rd item (Shack + Unlocked Tier + Next Unlock placeholder)
    // should make the list scroll if the CSS max-height for .scrollable-list is set to show ~2 items.

// New helper function to complete research and then trigger a UI refresh for the current view
function completeResearchAndRefreshUI(researchId) {
    const success = completeResearch(researchId); // from facilities.js
    if (success) {
        // updateGameData(); // This is already called by completeResearch if successful
        // Ensure the current view refreshes its content if it was the research view,
        // or if the unlock affects the current view (like rentals).
        // updateGameData() handles refreshing all lists and button states.
    }
    // If the current view was 'research', it will be updated by updateGameData.
    // If the current view was 'rentals' and this research unlocked a rental,
    // updateGameData called by completeResearch will refresh the rentals list.
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
        // upgradesDetailDiv.innerHTML = ''; // Clearing is optional, can save re-render if state hasn't changed
        manageButton.textContent = 'Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';
        let detailContentHTML = '';
        const mainLevelUpgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel - 1));
        let mainDisabledText = "";
        let mainIsDisabled = false;
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
        } else { detailContentHTML += '<p>No specific upgrades.</p>'; }
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
        return true; // Should not happen if filterType is always provided
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
    if (displayedCount === 0) targetElement.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id)) ? `<p>More ${filterType||''} construction via research.</p>` : `<p>No ${filterType||''} options.</p>`;
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
        return true; // Should not happen if filterType is always provided
    });
    if (filtered.length === 0) { targetElement.innerHTML = `<p>No ${filterType||''} constructions owned.</p>`; return; }
    filtered.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) { console.error("Orphaned construction:", facInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-facility-card';
        card.setAttribute('data-id', facInst.uniqueId);
        card.id = `owned-facility-card-${facInst.uniqueId}`;
        let outputText = facInst.currentOutput ? `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}` : (facType.effects ? "Provides Global Buff(s)" : "No direct output");
        card.innerHTML = `<h3>${facInst.name} (ID: ${facInst.uniqueId})</h3>
             <div class="property-info-grid"> <p><span class="label">Lvl:</span> <span class="value">${facInst.mainLevel}/${facType.mainLevelMax}</span></p>
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
        } else { detailContentHTML += '<p>No specific upgrades.</p>'; }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}

function displayResearchOptionsList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedCount = 0;

    RESEARCH_TOPICS.forEach(topic => { // from facilities.js
        if (gameState.unlockedResearch.includes(topic.id)) return; // Don't display if already researched
        if (!isResearchAvailable(topic.id)) return; // Don't display if prerequisites not met

        // Check if at least one cost type is defined
        if (!topic || (typeof topic.cost === 'undefined' && typeof topic.materialsCost === 'undefined' && typeof topic.costRP === 'undefined')) {
            console.error("Skipping invalid research topic (missing any cost type):", topic);
            return;
        }
        displayedCount++;
        const card = document.createElement('div');
        card.className = 'research-item-card';

        let costStrings = [];
        if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) {
            costStrings.push(`$${formatNumber(topic.cost, 0)}`);
        }
        if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
            costStrings.push(`${formatNumber(topic.materialsCost, 0)} Materials`);
        }
        if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
            costStrings.push(`${formatNumber(topic.costRP, 1)} RP`);
        }

        let costText = "Cost: " + (costStrings.length > 0 ? costStrings.join(' + ') : "Free");
        // REMOVED: Lab requirement display
        // costText += `. Labs Req: ${topic.requiredLabs||0}`;

        card.innerHTML = `
            <h3>${topic.name || 'Unnamed Research'}</h3>
            <p>${topic.description || 'N/A'}</p>
            <p class="research-cost">${costText}</p>
            <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn">Research</button>
        `;
        targetElement.appendChild(card);
    });

    if (displayedCount === 0) {
        if (RESEARCH_TOPICS.every(t => gameState.unlockedResearch.includes(t.id))) {
            targetElement.innerHTML = '<p>All research completed!</p>';
        } else {
            targetElement.innerHTML = '<p>No new research available. Check prerequisites.</p>'; // Removed "build more labs"
        }
    }
    // Button states will be updated by updateResearchButtonStatesList via updateAllButtonStatesForCurrentView
}

// ---- Button State Update Router ----
function updateAllButtonStatesForCurrentView() {
    ensureUIInitialized();
    if (currentView === 'rentals') {
        updatePropertyBuyButtonStates();
        // Owned property upgrade buttons updated by togglePropertyUpgradesView when opened
    } else if (currentView === 'materials') {
        updateFacilityBuyButtonStates('material');
        // Owned material facility upgrade buttons updated by toggleFacilityUpgradesView when opened
    } else if (currentView === 'research') {
        updateResearchButtonStatesList();
        // Owned science facility upgrade buttons updated by toggleFacilityUpgradesView when opened
    }
}

// ---- Specific Button State Update Functions ----
function updatePropertyBuyButtonStates() {
    ensureUIInitialized();
    if (!leftColumnListElement) return; 

    PROPERTY_TYPES.forEach(propType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-prop-${propType.id}-btn`); 
        if (buyButton) {
            if(!isPropertyTypeUnlocked(propType.id)) {
                if(buyButton.closest('.property-card')) buyButton.closest('.property-card').style.display = 'none';
                return;
            }
            if(buyButton.closest('.property-card') && buyButton.closest('.property-card').style.display === 'none') {
                buyButton.closest('.property-card').style.display = 'flex'; 
            }

            const monetaryCost = calculateDynamicPropertyCost(propType);
            const materialsCost = propType.materialsCost || 0;
            let reason = "";
            if (gameState.cash < monetaryCost) reason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) reason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!reason;
            buyButton.textContent = `Buy ${reason}`;
        }
    });

    RESEARCH_TOPICS.forEach(topic => {
        if (topic.unlocksPropertyType && topic.unlocksPropertyType.length > 0) {
            const unlockButton = leftColumnListElement.querySelector(`#unlock-via-${topic.id}-btn`);
            if (unlockButton) {
                if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                    if (unlockButton.closest('.unlock-placeholder-card')) unlockButton.closest('.unlock-placeholder-card').style.display = 'none';
                    return;
                }
                if (unlockButton.closest('.unlock-placeholder-card')) unlockButton.closest('.unlock-placeholder-card').style.display = 'flex'; 

                let canAfford = true;
                let disabledReason = "";

                if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) {
                    if (gameState.cash < topic.cost) { canAfford = false; disabledReason += ` $${formatNumber(topic.cost,0)}`; }
                }
                if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
                    if (gameState.buildingMaterials < topic.materialsCost) { canAfford = false; disabledReason += ` ${topic.materialsCost} Mats`; }
                }
                if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
                    if (gameState.researchPoints < topic.costRP) { canAfford = false; disabledReason += ` ${formatNumber(topic.costRP,1)} RP`; }
                }
                
                unlockButton.disabled = !canAfford;
                if (!canAfford && disabledReason) {
                    unlockButton.textContent = `Unlock (Need ${disabledReason.trim()})`;
                } else {
                    unlockButton.textContent = `Unlock`;
                }
            }
        }
    });
} // <<<< Closing brace for updatePropertyBuyButtonStates

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
            if (!isFacilityTypeUnlocked(facType.id)) {
                if(buyButton.closest('.facility-card')) buyButton.closest('.facility-card').style.display = 'none'; return;
            }
            if(buyButton.closest('.facility-card')) buyButton.closest('.facility-card').style.display = 'flex'; 
            const monetaryCost = calculateFacilityDynamicCost(facType);
            const materialsCost = facType.materialsCost || 0;
            let reason = "";
            if (gameState.cash < monetaryCost) reason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) reason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!reason;
            buyButton.textContent = `Build ${reason}`;
        }
    });
} // <<<< Closing brace for updateFacilityBuyButtonStates

function updateResearchButtonStatesList() {
    ensureUIInitialized(); 
    if (!leftColumnListElement) return;

    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = leftColumnListElement.querySelector(`#research-${topic.id}-btn`); 
        if (researchButton && researchButton.closest('.research-item-card')) {
            const cardElement = researchButton.closest('.research-item-card');

            if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                cardElement.style.display = 'none'; 
                return;
            }
            cardElement.style.display = 'flex'; 
            
            let disabledReason = "";
            let canAfford = true;
            
            if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) {
                if (gameState.cash < topic.cost) {
                    disabledReason += `(Need $${formatNumber(topic.cost - gameState.cash,0)}) `;
                    canAfford = false;
                }
            }
            if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
                if (gameState.buildingMaterials < topic.materialsCost) {
                    disabledReason += `(Need ${formatNumber(topic.materialsCost - gameState.buildingMaterials,0)} Mats) `;
                    canAfford = false;
                }
            }
            if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
                if (gameState.researchPoints < topic.costRP) {
                    disabledReason += `(Need ${formatNumber(topic.costRP - gameState.researchPoints,1)} RP) `;
                    canAfford = false;
                }
            }

            researchButton.disabled = !canAfford;
            researchButton.textContent = `Research ${disabledReason.trim()}`;
        }
    });
} // <<<< Closing brace for updateResearchButtonStatesList

// ---- Initial Render ----
function initialRender() {
    // Step 1: Initialize references to all DOM elements used by the UI.
    // This function (initializeUIElements) should populate your global UI element variables.
    initializeUIElements();

    // Step 2: Check if UI initialization was successful.
    // If critical elements weren't found, uiInitialized will be false.
    if (!uiInitialized) {
        console.error("CRITICAL: UI FAILED TO INITIALIZE FROM initialRender. Aborting further UI setup to prevent cascading errors. Check previous console messages from initializeUIElements() for missing HTML element IDs.");
        
        // Display a prominent error message to the user directly on the page.
        const criticalErrorDiv = document.createElement('div');
        criticalErrorDiv.style.padding = "20px";
        criticalErrorDiv.style.textAlign = "center";
        criticalErrorDiv.style.fontSize = "18px";
        criticalErrorDiv.style.color = "red";
        criticalErrorDiv.style.fontFamily = "Arial, sans-serif";
        criticalErrorDiv.style.backgroundColor = "#fff"; // Ensure it's visible on dark themes
        criticalErrorDiv.style.border = "2px solid red";
        criticalErrorDiv.style.position = "fixed";
        criticalErrorDiv.style.top = "50%";
        criticalErrorDiv.style.left = "50%";
        criticalErrorDiv.style.transform = "translate(-50%, -50%)";
        criticalErrorDiv.style.zIndex = "9999";
        criticalErrorDiv.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";

        criticalErrorDiv.innerHTML = `<h1>Critical UI Initialization Error</h1>
                                     <p>Essential HTML elements for the game could not be found or initialized correctly.</p>
                                     <p>Please check the browser console (usually F12) for detailed error messages from <code>initializeUIElements()</code>.</p>
                                     <p>Verify that all element IDs in your <code>index.html</code> file match those expected by the JavaScript in <code>js/ui.js</code>.</p>`;
        
        if (document.body) {
            // Clear the body to prevent interaction with a broken UI, then show the error.
            // Be cautious with document.body.innerHTML = '' if other critical non-game scripts might be running.
            // For this game, it's likely safe.
            document.body.innerHTML = ''; 
            document.body.appendChild(criticalErrorDiv);
        } else {
            // Fallback if document.body itself is somehow not available (very unlikely with DOMContentLoaded)
            alert("CRITICAL UI INITIALIZATION ERROR. The game cannot start. Check browser console.");
        }
        return; // Stop further rendering and UI setup.
    }

    // Step 3: Update all the static stat displays with initial values from gameState.
    console.log("initialRender: Updating initial stat displays.");
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    // Step 4: Switch to the default view (e.g., 'rentals').
    // switchView will call updateGameData, which in turn calls displayCurrentViewContent.
    // displayCurrentViewContent then calls the necessary display...List functions and 
    // updateAllButtonStatesForCurrentView to render the correct lists and button states.
    console.log("initialRender: Switching to default view:", currentView);
    switchView(currentView); 
    
    console.log("initialRender: UI setup process completed.");
} // <<<< THIS IS THE CORRECT CLOSING BRACE FOR initialRender
