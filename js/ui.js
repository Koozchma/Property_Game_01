// Metropolis Estates - ui.js

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

    if (leftColumnTitleElement && rightColumnTitleElement && navRentalsButton) {
        uiInitialized = true;
        console.log("UI Elements Initialized.");
        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navMaterialsButton.addEventListener('click', () => switchView('materials'));
        navResearchButton.addEventListener('click', () => switchView('research'));
    } else {
        console.error("Critical UI elements not found. UI might not function correctly.");
        document.body.innerHTML = `<div style="padding:20px;text-align:center;color:red;"><h1>UI Init Error</h1><p>Check console.</p></div>`;
    }
}

function ensureUIInitialized() {
    if (!uiInitialized) {
        console.warn("UI not initialized, attempting now.");
        initializeUIElements();
        if(!uiInitialized) console.error("FORCE UI INITIALIZATION FAILED.");
    }
}

function switchView(viewName) {
    ensureUIInitialized();
    currentView = viewName;
    [navRentalsButton, navMaterialsButton, navResearchButton].forEach(btn => btn.classList.remove('active-nav'));
    if (viewName === 'rentals' && navRentalsButton) navRentalsButton.classList.add('active-nav');
    else if (viewName === 'materials' && navMaterialsButton) navMaterialsButton.classList.add('active-nav');
    else if (viewName === 'research' && navResearchButton) navResearchButton.classList.add('active-nav');
    updateGameData(); // This will trigger displayCurrentViewContent
}

function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

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
        const researchSectionEl = document.getElementById('research-section'); // Assuming research-section div still exists conceptually or is the content-area
        researchPointsDisplay.style.display = gameState.researchPoints > 0 || researchIsRelevant ? 'inline-block' : 'none';
        // If research section visibility is tied to RP display:
        // if (researchSectionEl) researchSectionEl.style.display = researchPointsDisplay.style.display;
    }
}
function updateTotalUpkeepDisplay() {
    ensureUIInitialized();
    if (totalUpkeepDisplay) {
        totalUpkeepDisplay.textContent = `Upkeep: $${formatNumber(gameState.facilityUpkeepPerSecond)}/s`;
        totalUpkeepDisplay.style.display = gameState.facilityUpkeepPerSecond > 0 ? 'inline-block' : 'none';
    }
}

function displayCurrentViewContent() {
    ensureUIInitialized();
    if (!leftColumnListElement || !rightColumnListElement || !leftColumnTitleElement || !rightColumnTitleElement) return;
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

function displayAvailablePropertiesList(targetElement) {
    let displayedCount = 0;
    PROPERTY_TYPES.forEach(propType => {
        if (!isPropertyTypeUnlocked(propType.id)) return;
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
    });
    if (displayedCount === 0) targetElement.innerHTML = PROPERTY_TYPES.some(pt => pt.requiredResearch && !isPropertyTypeUnlocked(pt.id)) ? "<p>More rentals via research.</p>" : "<p>No rentals available.</p>";
}

function displayOwnedPropertiesList(targetElement) {
    if (ownedProperties.length === 0) { targetElement.innerHTML = '<p>No rentals owned.</p>'; return; }
    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId);
        if (!propType) { console.error("Orphaned rental:", propInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-property-card';
        card.setAttribute('data-id', propInst.uniqueId);
        card.id = `owned-property-card-${propInst.uniqueId}`;
        card.innerHTML = `<h3>${propInst.name} (ID: ${propInst.uniqueId})</h3>
            <p class="prop-level">Lvl: ${propInst.mainLevel}/${propType.mainLevelMax}</p>
            <p class="prop-rps">RPS: $${formatNumber(propInst.currentRPS)}/s</p>
            <p>Cost: $${formatNumber(propInst.purchaseCost,0)}</p>
            <button class="manage-upgrades-btn" onclick="togglePropertyUpgradesView(${propInst.uniqueId})">Manage Upgrades</button>
            <div class="property-upgrades-detail" id="upgrades-detail-${propInst.uniqueId}"></div>
            <button class="sell-btn" style="margin-top:10px;" onclick="sellPropertyInstance(${propInst.uniqueId})">Sell</button>`;
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
        upgradesDetailDiv.innerHTML = '';
        manageButton.textContent = 'Manage Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';
        let detailContentHTML = '';
        const mainLevelUpgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel - 1));
        let mainDisabled = "";
        if (propertyInstance.mainLevel >= propertyType.mainLevelMax) mainDisabled = "(Max Lvl)";
        else if (gameState.cash < mainLevelUpgradeCost) mainDisabled = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`;
        detailContentHTML += `<button class="upgrade-main-btn-detail" onclick="upgradePropertyMainLevel(${propertyInstance.uniqueId})" ${mainDisabled ? 'disabled' : ''}>Upgrade Main Lvl ${mainDisabled || `($${formatNumber(mainLevelUpgradeCost,0)})`}</button>`;
        if (propertyType.upgrades && propertyType.upgrades.length > 0) {
            detailContentHTML += '<p>Specific Upgrades:</p>';
            propertyType.upgrades.forEach(upgDef => {
                const currentTier = propertyInstance.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor(upgDef.cost * Math.pow(1.5, currentTier));
                const materialsBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                let efficiency = 1;
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buff = getResearchTopicById("advanced_material_processing").globalBuff;
                    if (buff && buff.type === "material_usage_efficiency") efficiency = 1 - buff.percentage;
                }
                const actualMats = Math.floor(materialsBase * efficiency);
                let btnTxt = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                let isDisabled = false, reason = "";
                if (currentTier >= upgDef.maxTier) { reason = "(Max Tier)"; isDisabled = true; }
                else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) { reason = "(Needs Res.)"; isDisabled = true; }
                else if (gameState.cash < costNextTier) { reason = `($${formatNumber(costNextTier,0)})`; isDisabled = true; }
                else if (actualMats > 0 && gameState.buildingMaterials < actualMats) { reason = `(${actualMats} Mats)`; isDisabled = true; }
                else { reason = `($${formatNumber(costNextTier,0)}${actualMats > 0 ? ', '+actualMats+' Mats' : ''})`;}
                btnTxt += ` ${reason}`;
                detailContentHTML += `<button class="specific-upgrade-btn-detail" onclick="applySpecificPropertyUpgrade(${propertyInstance.uniqueId}, '${upgDef.id}')" ${isDisabled ? 'disabled' : ''} title="RPS: +${formatNumber(upgDef.rpsBoost,2)}/tier. Mats: ${actualMats>0?actualMats:0}">${btnTxt}</button>`;
            });
        } else { detailContentHTML += '<p>No specific upgrades.</p>'; }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}


function displayAvailableFacilitiesList(targetElement, filterType) {
    let displayedCount = 0;
    FACILITY_TYPES.filter(facType => {
        if (!isFacilityTypeUnlocked(facType.id)) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.type === "property_cost_reduction" || e.type === "material_usage_efficiency" || e.propertyCategory);
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return true;
    }).forEach(facType => {
        if (!facType || typeof facType.cost === 'undefined') { console.error("Invalid facility type:", facType); return; }
        displayedCount++;
        const currentMonetaryCost = calculateFacilityDynamicCost(facType);
        const materialsCost = facType.materialsCost || 0;
        let outputText = facType.output ? `${formatNumber(facType.output.amount,3)}/s ${facType.output.resource}` : (facType.effects ? "Global Buff(s)" : "No direct output");
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `<h3>${facType.name}</h3><p>${facType.description}</p>
            <p class="facility-cost">Cost: $${formatNumber(currentMonetaryCost,0)}${materialsCost > 0 ? ` + ${materialsCost} Mats` : ''}</p>
            <p class="facility-upkeep">Upkeep: $${formatNumber(facType.baseUpkeepRPS,0)}/s</p>
            <p class="facility-output">Output: ${outputText}</p>
            <button onclick="buyFacility('${facType.id}')" id="buy-fac-${facType.id}-btn">Build</button>`;
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id)) ? `<p>More ${filterType||''} construction via research.</p>` : `<p>No ${filterType||''} options.</p>`;
}

function displayOwnedFacilitiesList(targetElement, filterType) {
    const filtered = ownedFacilities.filter(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return true;
    });
    if (filtered.length === 0) { targetElement.innerHTML = `<p>No ${filterType||''} constructions owned.</p>`; return; }
    filtered.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) { console.error("Orphaned construction:", facInst); return; }
        const card = document.createElement('div');
        card.className = 'owned-facility-card';
        card.setAttribute('data-id', facInst.uniqueId);
        card.id = `owned-facility-card-${facInst.uniqueId}`; // For upgrade button toggling
        let upgradesHTML = '<div class="upgrade-buttons-container"><p>Specific Upgrades:</p>';
        if (facType.upgrades && facType.upgrades.length > 0) {
            facType.upgrades.forEach(upgDef => {
                 upgradesHTML += `<button onclick="toggleFacilityUpgradesView(${facInst.uniqueId}, '${upgDef.id}')" id="upgrade-fac-${facInst.uniqueId}-${upgDef.id}-btn">${upgDef.name} (${(facInst.appliedUpgrades[upgDef.id] || 0)}/${upgDef.maxTier})</button>`;
            });
        } else { upgradesHTML += '<p>No specific upgrades.</p>'; }
        upgradesHTML += '</div>';
        let outputText = facInst.currentOutput ? `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}` : (facType.effects ? "Provides Global Buff(s)" : "No direct output");
        // Simplified card for owned facilities to match property upgrade pattern
        card.innerHTML = `<h3>${facInst.name} (ID: ${facInst.uniqueId})</h3>
            <p class="prop-level">Lvl: ${facInst.mainLevel}/${facType.mainLevelMax}</p>
            <p class="facility-upkeep">Upkeep: $${formatNumber(facInst.currentUpkeepRPS)}/s</p>
            <p class="facility-output">Output: ${outputText}</p>
            <button class="manage-upgrades-btn" onclick="toggleFacilityUpgradesView(${facInst.uniqueId})">Manage Upgrades</button>
            <div class="property-upgrades-detail" id="upgrades-detail-facility-${facInst.uniqueId}"></div>
            <button class="sell-btn" style="margin-top:10px;" onclick="sellFacilityInstance(${facInst.uniqueId})">Demolish</button>`;
        targetElement.appendChild(card);
    });
}

// New function for facility upgrade toggling (similar to properties)
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
        upgradesDetailDiv.innerHTML = '';
        manageButton.textContent = 'Manage Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';
        let detailContentHTML = '';
        const mainLevelUpgradeCost = Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, facilityInstance.mainLevel - 1));
        let mainDisabled = "";
        if (facilityInstance.mainLevel >= facilityType.mainLevelMax) mainDisabled = "(Max Lvl)";
        else if (gameState.cash < mainLevelUpgradeCost) mainDisabled = `(Need $${formatNumber(mainLevelUpgradeCost,0)})`;
        detailContentHTML += `<button class="upgrade-main-btn-detail" onclick="upgradeFacilityMainLevel(${facilityInstance.uniqueId})" ${mainDisabled ? 'disabled' : ''}>Upgrade Main Lvl ${mainDisabled || `($${formatNumber(mainLevelUpgradeCost,0)})`}</button>`;
        if (facilityType.upgrades && facilityType.upgrades.length > 0) {
            detailContentHTML += '<p>Specific Upgrades:</p>';
            facilityType.upgrades.forEach(upgDef => {
                const currentTier = facilityInstance.appliedUpgrades[upgDef.id] || 0;
                const costNextTier = Math.floor(upgDef.cost * Math.pow(1.6, currentTier));
                const materialsBase = upgDef.requiresMaterials ? Math.floor(upgDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
                let efficiency = 1;
                if (gameState.unlockedResearch.includes("advanced_material_processing")) {
                    const buff = getResearchTopicById("advanced_material_processing").globalBuff;
                    if (buff && buff.type === "material_usage_efficiency") efficiency = 1 - buff.percentage;
                }
                const actualMats = Math.floor(materialsBase * efficiency);
                let btnTxt = `${upgDef.name} (${currentTier}/${upgDef.maxTier})`;
                let isDisabled = false, reason = "";
                if (currentTier >= upgDef.maxTier) { reason = "(Max Tier)"; isDisabled = true; }
                else if (gameState.cash < costNextTier) { reason = `($${formatNumber(costNextTier,0)})`; isDisabled = true; }
                else if (actualMats > 0 && gameState.buildingMaterials < actualMats) { reason = `(${actualMats} Mats)`; isDisabled = true; }
                else { reason = `($${formatNumber(costNextTier,0)}${actualMats > 0 ? ', '+actualMats+' Mats' : ''})`;}
                btnTxt += ` ${reason}`;
                detailContentHTML += `<button class="specific-upgrade-btn-detail" onclick="applySpecificFacilityUpgrade(${facilityInstance.uniqueId}, '${upgDef.id}')" ${isDisabled ? 'disabled' : ''} title="Effect: Varies. Mats: ${actualMats>0?actualMats:0}">${btnTxt}</button>`;
            });
        } else { detailContentHTML += '<p>No specific upgrades.</p>'; }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}


function displayResearchOptionsList(targetElement) {
    let displayedCount = 0;
    RESEARCH_TOPICS.forEach(topic => {
        if (gameState.unlockedResearch.includes(topic.id)) return;
        if (!isResearchAvailable(topic.id)) return;
        if (!topic || typeof topic.costRP === 'undefined') { console.error("Invalid research topic:", topic); return; }
        displayedCount++;
        const card = document.createElement('div');
        card.className = 'research-item-card';
        card.innerHTML = `<h3>${topic.name}</h3><p>${topic.description}</p>
            <p class="research-cost">Cost: ${formatNumber(topic.costRP,1)} RP. Labs Req: ${topic.requiredLabs||0}</p>
            <button onclick="completeResearch('${topic.id}')" id="research-${topic.id}-btn">Research</button>`;
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = RESEARCH_TOPICS.every(t => gameState.unlockedResearch.includes(t.id)) ? '<p>All research done!</p>' : '<p>No new research. Check prereqs/labs.</p>';
}

function updateAllButtonStatesForCurrentView() {
    ensureUIInitialized();
    if (currentView === 'rentals') {
        updatePropertyBuyButtonStates();
        // Owned property upgrade buttons are updated when their detail view is toggled
    } else if (currentView === 'materials') {
        updateFacilityBuyButtonStates('material');
        // Owned facility upgrade buttons are updated when their detail view is toggled
    } else if (currentView === 'research') {
        updateResearchButtonStatesList();
        // Owned science lab upgrade buttons are updated when their detail view is toggled
    }
}

function updatePropertyBuyButtonStates() {
    PROPERTY_TYPES.forEach(propType => {
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) {
            if(!isPropertyTypeUnlocked(propType.id)) {
                if(buyButton.parentElement) buyButton.parentElement.style.display = 'none'; return;
            }
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex';
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
    FACILITY_TYPES.filter(facTypeF => {
        if (filterType === 'material') return facTypeF.output?.resource === 'buildingMaterials' || facTypeF.effects?.some(e => e.propertyCategory || e.type.includes("cost") || e.type.includes("material"));
        if (filterType === 'science') return facTypeF.output?.resource === 'researchPoints';
        return true;
    }).forEach(facType => {
        const buyButton = document.getElementById(`buy-fac-${facType.id}-btn`);
        if (buyButton) {
            if (!isFacilityTypeUnlocked(facType.id)) {
                if(buyButton.parentElement) buyButton.parentElement.style.display = 'none'; return;
            }
            if(buyButton.parentElement) buyButton.parentElement.style.display = 'flex';
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

// Removed updatePropertyUpgradeButtonStates and updateFacilityUpgradeButtonStates
// as their core logic is now inside the toggle functions.
// If live-updating buttons inside an OPEN detail view is needed, these would be re-introduced
// with logic to find buttons inside visible ".property-upgrades-detail.visible" divs.

function updateResearchButtonStatesList() {
    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = document.getElementById(`research-${topic.id}-btn`);
        if (researchButton && researchButton.parentElement) {
            if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                researchButton.parentElement.style.display = 'none'; return;
            }
            researchButton.parentElement.style.display = 'flex';
            const requiredLabs = topic.requiredLabs || 0;
            const ownedLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;
            let reason = "";
            if(ownedLabs < requiredLabs) reason = `(Need ${requiredLabs} Lab(s))`;
            else if (gameState.researchPoints < topic.costRP) reason = `(Need ${formatNumber(topic.costRP,1)} RP)`;
            researchButton.disabled = !!reason;
            researchButton.textContent = `Research ${reason}`;
        }
    });
}

function initialRender() {
    initializeUIElements();
    if (!uiInitialized) {
        document.body.innerHTML = `<div style="padding:20px;text-align:center;color:red;"><h1>UI Init Error</h1><p>Check console.</p></div>`;
        return;
    }
    // These individual stat updates are called by updateGameData, which is called by switchView
    // So, directly calling switchView is enough to set up the initial view and stats.
    switchView(currentView); // Initial view setup (defaults to 'rentals')
}
