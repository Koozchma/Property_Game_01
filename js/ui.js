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
        leftColumnListElement && rightColumnListElement) { // Added checks for list elements
        uiInitialized = true;
        console.log("UI Elements Initialized.");

        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navMaterialsButton.addEventListener('click', () => switchView('materials'));
        navResearchButton.addEventListener('click', () => switchView('research'));
    } else {
        console.error("One or more critical UI elements not found during initialization. UI might not function correctly.");
        // Avoid breaking the entire page if console is not available or if body is already replaced
        try {
            document.body.innerHTML = `<div style="padding:20px;text-align:center;color:red;font-family:Arial,sans-serif;"><h1>Critical UI Initialization Error</h1><p>Essential HTML elements for the game are missing. Please check the browser console (F12) for more details and verify HTML element IDs.</p></div>`;
        } catch (e) {
            // Fallback if document.body is somehow not available
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
    if (!targetElement) return;
    targetElement.innerHTML = '';
    let displayedCount = 0;
    const firstRentalUnlockResearchID = "urban_planning_1"; // Assumed ID for first rental tier unlock

    // 1. Shack
    const shack = getPropertyTypeById("shack");
    if (shack && isPropertyTypeUnlocked(shack.id)) {
        displayedCount++;
        const currentMonetaryCost = calculateDynamicPropertyCost(shack);
        const materialsCost = shack.materialsCost || 0;
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `<h3>${shack.name}</h3><p>${shack.description}</p>
            <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
            <p>Base RPS: $${formatNumber(shack.baseRPS,1)}/s</p><p>Max Lvl: ${shack.mainLevelMax || 'N/A'}</p>
            <button onclick="buyProperty('${shack.id}')" id="buy-prop-${shack.id}-btn">Buy</button>`;
        targetElement.appendChild(card);
    }

    // 2. Unlock Placeholder or Next Tier Rentals
    const firstRentalsUnlockedByResearch = gameState.unlockedResearch.includes(firstRentalUnlockResearchID);

    if (!firstRentalsUnlockedByResearch) {
        displayedCount++;
        const researchTopic = getResearchTopicById(firstRentalUnlockResearchID);
        const rpCost = researchTopic ? researchTopic.costRP : "N/A"; // Handle if researchTopic isn't found
        const placeholderCard = document.createElement('div');
        placeholderCard.className = 'unlock-placeholder-card';
        placeholderCard.innerHTML = `
            <h3>Unlock Next Tier Rentals</h3>
            <p>More rentals available via research.</p>
            <p>Required: "${researchTopic ? researchTopic.name : "Unlock Basic Rentals"}"</p>
            <p>Cost: <span class="research-cost-display">${formatNumber(rpCost, 0)} RP</span></p>
            <button onclick="switchView('research')" title="Go to Research & Development">View Research</button>
        `;
        targetElement.appendChild(placeholderCard);
    } else {
        PROPERTY_TYPES.forEach(propType => {
            if (propType.id === "shack") return; // Already handled
            if (isPropertyTypeUnlocked(propType.id)) {
                if (!propType || typeof propType.baseCost === 'undefined') { console.error("Invalid rental type:", propType); return; }
                displayedCount++;
                const currentMonetaryCost = calculateDynamicPropertyCost(propType);
                const materialsCost = propType.materialsCost || 0;
                const card = document.createElement('div');
                card.className = 'property-card';
                card.innerHTML = `<h3>${propType.name}</h3><p>${propType.description}</p>
                    <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
                    <p>Base RPS: $${formatNumber(propType.baseRPS,1)}/s</p><p>Max Lvl: ${propType.mainLevelMax}</p>
                    <button onclick="buyProperty('${propType.id}')" id="buy-prop-${propType.id}-btn">Buy</button>`;
                targetElement.appendChild(card);
            }
        });
    }

    if (displayedCount === 0) {
        targetElement.innerHTML = "<p>No rentals currently available. Check Research & Development.</p>";
    }
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
    // ... (implementation as provided in previous full ui.js, ensuring it targets buttons in leftColumnListElement)
    PROPERTY_TYPES.forEach(propType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-prop-${propType.id}-btn`); // Target within current view
        if (buyButton) {
            if(!isPropertyTypeUnlocked(propType.id)) {
                if(buyButton.closest('.property-card')) buyButton.closest('.property-card').style.display = 'none'; return;
            }
            if(buyButton.closest('.property-card')) buyButton.closest('.property-card').style.display = 'flex'; // Or 'block'
            const monetaryCost = calculateDynamicPropertyCost(propType);
            const materialsCost = propType.materialsCost || 0;
            let reason = "";
            if (gameState.cash < monetaryCost) reason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) reason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!reason;
            buyButton.textContent = `Buy ${reason}`;
        }
    });
}

function updateFacilityBuyButtonStates(filterType) {
    // ... (implementation as provided in previous full ui.js, ensuring it targets buttons in leftColumnListElement)
    FACILITY_TYPES.filter(facTypeF => {
        if (filterType === 'material') return facTypeF.output?.resource === 'buildingMaterials' || facTypeF.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facTypeF.output?.resource === 'researchPoints';
        return true;
    }).forEach(facType => {
        const buyButton = leftColumnListElement.querySelector(`#buy-fac-${facType.id}-btn`); // Target within current view
        if (buyButton) {
            if (!isFacilityTypeUnlocked(facType.id)) {
                if(buyButton.closest('.facility-card')) buyButton.closest('.facility-card').style.display = 'none'; return;
            }
            if(buyButton.closest('.facility-card')) buyButton.closest('.facility-card').style.display = 'flex'; // Or 'block'
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
    ensureUIInitialized(); // Ensure DOM elements are ready
    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = document.getElementById(`research-${topic.id}-btn`); // Target button directly
        
        if (researchButton && researchButton.closest('.research-item-card')) {
            const cardElement = researchButton.closest('.research-item-card');

            if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                cardElement.style.display = 'none'; // Hide the entire card if not available or done
                return;
            }
            cardElement.style.display = 'flex'; // Or 'block', ensure card is visible if research is available

            // REMOVED: Lab requirement check
            // const requiredLabsCount = topic.requiredLabs || 0;
            // const ownedScienceLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;
            
            let disabledReason = "";
            let canAfford = true;

            // if (ownedScienceLabs < requiredLabsCount) { // REMOVED
            //     disabledReason = `(Need ${requiredLabsCount} Lab(s))`;
            //     canAfford = false;
            // } else // REMOVED 'else'
            
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
            // If no cost properties, canAfford remains true.

            researchButton.disabled = !canAfford;
            researchButton.textContent = `Research ${disabledReason.trim()}`;
        }
    });
}

// ---- Initial Render ----
function initialRender() {
    initializeUIElements(); // Initialize all DOM element variables FIRST
    if (!uiInitialized) {
        // Error message already handled in initializeUIElements if criticals are missing
        return;
    }
    // Initial stat displays based on gameState
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    switchView(currentView); // Setup the default view ('rentals') and its content
}
