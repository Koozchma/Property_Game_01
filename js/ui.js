// Metropolis Estates - ui.js

// Declare variables that will hold DOM elements
let cashDisplay, netRpsDisplay, ownedPropertiesCountDisplay, // Stat displays in header
    buildingMaterialsDisplay, researchPointsDisplay, totalUpkeepDisplay,
    leftColumnTitleElement, leftColumnListElement, // Generic left column parts
    rightColumnTitleElement, rightColumnListElement, // Generic right column parts
    navRentalsButton, navMaterialsButton, navResearchButton, // Navigation buttons
    researchSectionElement; // Keep for specific toggling if needed for R&D view

let uiInitialized = false;
let currentView = 'rentals'; // Default view

function initializeUIElements() {
    if (uiInitialized) return;

    cashDisplay = document.getElementById('cash-display');
    netRpsDisplay = document.getElementById('rps-display');
    ownedPropertiesCountDisplay = document.getElementById('owned-properties-count'); // Will now show "Rentals: X"
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
    
    // researchSectionElement is not directly used in this new layout as research options go into left-column-list

    if (leftColumnTitleElement && rightColumnTitleElement && navRentalsButton) { // Check a few critical elements
        uiInitialized = true;
        console.log("UI Elements Initialized for new layout.");

        // Add event listeners for navigation
        navRentalsButton.addEventListener('click', () => switchView('rentals'));
        navMaterialsButton.addEventListener('click', () => switchView('materials'));
        navResearchButton.addEventListener('click', () => switchView('research'));

    } else {
        console.error("One or more critical UI elements not found during initialization. UI might not function correctly.");
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; font-size: 18px; color: red;">
            <h1>Critical UI Error</h1><p>Essential HTML elements for navigation or content display are missing. Check console.</p></div>`;
        return; // Stop further UI setup
    }
}

function ensureUIInitialized() { // Keep this as a safeguard
    if (!uiInitialized) {
        console.warn("UI not initialized, attempting to initialize now.");
        initializeUIElements();
        if (!uiInitialized) {
            console.error("FORCE INITIALIZATION FAILED. DOM elements might not be ready or IDs are incorrect.");
        }
    }
}

function switchView(viewName) {
    ensureUIInitialized();
    currentView = viewName;

    // Update navigation button active states
    [navRentalsButton, navMaterialsButton, navResearchButton].forEach(btn => btn.classList.remove('active-nav'));
    if (viewName === 'rentals' && navRentalsButton) navRentalsButton.classList.add('active-nav');
    else if (viewName === 'materials' && navMaterialsButton) navMaterialsButton.classList.add('active-nav');
    else if (viewName === 'research' && navResearchButton) navResearchButton.classList.add('active-nav');

    // Update content based on the view
    // This will trigger re-rendering of lists and button states via updateGameData
    updateGameData();
}

function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ---- Stat Update Functions ---- (largely the same, just ensure elements are checked)
function updateCashDisplay() { ensureUIInitialized(); if (cashDisplay) cashDisplay.textContent = `Cash: $${formatNumber(gameState.cash)}`; }
function updateNetRPSDisplay() { ensureUIInitialized(); if (netRpsDisplay) netRpsDisplay.textContent = `Net RPS: $${formatNumber(gameState.netRentPerSecond)}/s`; }
function updateOwnedPropertiesCountDisplay() { ensureUIInitialized(); if (ownedPropertiesCountDisplay) ownedPropertiesCountDisplay.textContent = `Rentals: ${ownedProperties.length}`; } // Changed "Properties" to "Rentals"
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


// ---- Dynamic Content Display Functions ----
// These now populate the generic #left-column-list and #right-column-list

function displayCurrentViewContent() {
    ensureUIInitialized();
    if (!leftColumnListElement || !rightColumnListElement || !leftColumnTitleElement || !rightColumnTitleElement) {
        console.error("Generic list/title elements not ready for displayCurrentViewContent");
        return;
    }

    leftColumnListElement.innerHTML = ''; // Clear previous content
    rightColumnListElement.innerHTML = ''; // Clear previous content

    if (currentView === 'rentals') {
        leftColumnTitleElement.textContent = 'Available Rentals';
        rightColumnTitleElement.textContent = 'My Portfolio';
        displayAvailablePropertiesList(leftColumnListElement);
        displayOwnedPropertiesList(rightColumnListElement);
    } else if (currentView === 'materials') {
        leftColumnTitleElement.textContent = 'Available Construction';
        rightColumnTitleElement.textContent = 'My Constructions';
        displayAvailableFacilitiesList(leftColumnListElement, 'material'); // Pass a filter type
        displayOwnedFacilitiesList(rightColumnListElement, 'material');   // Pass a filter type
    } else if (currentView === 'research') {
        leftColumnTitleElement.textContent = 'Available Research';
        rightColumnTitleElement.textContent = 'My Science Labs';
        displayResearchOptionsList(leftColumnListElement);
        displayOwnedFacilitiesList(rightColumnListElement, 'science');    // Pass a filter type for science labs
    }
    // After populating, update all button states
    updateAllButtonStatesForCurrentView();
}

function displayAvailablePropertiesList(targetElement) {
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
        card.className = 'property-card'; // Use generic .item-card or specific if needed
        card.innerHTML = `
            <h3>${propType.name || 'Unnamed Rental'}</h3>
            <p>${propType.description || 'N/A'}</p>
            <p class="prop-cost">Cost: $${formatNumber(currentMonetaryCost,0)}` +
            (materialsCost > 0 ? ` + ${materialsCost} Materials` : '') + `</p>
            <p>Base RPS: $${formatNumber(propType.baseRPS,1)}/s</p>
            <p>Main Level Max: ${propType.mainLevelMax || 'N/A'}</p>
            <button onclick="buyProperty('${propType.id}')" id="buy-prop-${propType.id}-btn">Buy</button>
        `;
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = PROPERTY_TYPES.some(pt => pt.requiredResearch && !isPropertyTypeUnlocked(pt.id)) ? "<p>More rentals available via research.</p>" : "<p>No rentals currently available or defined.</p>";
}

function displayOwnedPropertiesList(targetElement) {
    ensureUIInitialized();
    if (!targetElement) { // Changed check from ownedPropertiesList to targetElement
        console.error("Target element for owned properties not provided or initialized.");
        return;
    }
    targetElement.innerHTML = ''; // Clear previous content

    if (ownedProperties.length === 0) {
        targetElement.innerHTML = '<p>You don\'t own any rentals yet.</p>'; return;
    }

    ownedProperties.forEach(propInst => {
        const propType = getPropertyTypeById(propInst.typeId); // from properties.js
        if (!propType) { console.error("Orphaned owned rental:", propInst); return; }

        const card = document.createElement('div');
        card.className = 'owned-property-card'; // This class is still used for general card styling
        card.setAttribute('data-id', propInst.uniqueId);
        card.setAttribute('id', `owned-property-card-${propInst.uniqueId}`); // Add unique ID to the card itself

        // Basic Info
        let basicInfoHTML = `
            <h3>${propInst.name} (ID: ${propInst.uniqueId})</h3>
            <p class="prop-level">Main Level: ${propInst.mainLevel}/${propType.mainLevelMax}</p>
            <p class="prop-rps">Current RPS: $${formatNumber(propInst.currentRPS)}/s</p>
            <p>Purchase Cost: $${formatNumber(propInst.purchaseCost, 0)}</p>
        `;

        // Manage Upgrades Button
        let manageUpgradesButtonHTML = `
            <button class="manage-upgrades-btn" onclick="togglePropertyUpgradesView(${propInst.uniqueId})">
                Manage Upgrades
            </button>
        `;

        // Hidden Detail Div for Upgrades
        let upgradesDetailHTML = `
            <div class="property-upgrades-detail" id="upgrades-detail-${propInst.uniqueId}">
                </div>
        `;
        
        // Sell Button
        let sellButtonHTML = `
            <button class="sell-btn" style="margin-top:10px;" onclick="sellPropertyInstance(${propInst.uniqueId})">
                Sell
            </button>
        `;

        card.innerHTML = basicInfoHTML + manageUpgradesButtonHTML + upgradesDetailHTML + sellButtonHTML;
        targetElement.appendChild(card);
    });
    // Note: updatePropertyUpgradeButtonStates will now be effectively replaced by logic within togglePropertyUpgradesView
}


// New function to toggle and populate the upgrades detail view
function togglePropertyUpgradesView(ownedPropertyUniqueId) {
    ensureUIInitialized();
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) {
        console.error("Property instance not found for toggle: ", ownedPropertyUniqueId);
        return;
    }
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) {
        console.error("Property type definition not found for instance: ", propertyInstance.typeId);
        return;
    }

    const upgradesDetailDiv = document.getElementById(`upgrades-detail-${ownedPropertyUniqueId}`);
    const manageButton = document.querySelector(`#owned-property-card-${ownedPropertyUniqueId} .manage-upgrades-btn`);

    if (!upgradesDetailDiv || !manageButton) {
        console.error("Could not find upgrade detail div or manage button for property ID: ", ownedPropertyUniqueId);
        return;
    }

    const isVisible = upgradesDetailDiv.classList.contains('visible');

    if (isVisible) {
        upgradesDetailDiv.classList.remove('visible');
        upgradesDetailDiv.innerHTML = ''; // Clear content when hiding
        manageButton.textContent = 'Manage Upgrades';
    } else {
        upgradesDetailDiv.classList.add('visible');
        manageButton.textContent = 'Hide Upgrades';

        let detailContentHTML = '';

        // 1. Main Level Upgrade Button
        const mainLevelUpgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel - 1));
        let mainLevelDisabledReason = "";
        if (propertyInstance.mainLevel >= propertyType.mainLevelMax) mainLevelDisabledReason = "(Max Level)";
        else if (gameState.cash < mainLevelUpgradeCost) mainLevelDisabledReason = `(Need $${formatNumber(mainLevelUpgradeCost, 0)})`;
        
        detailContentHTML += `
            <button class="upgrade-main-btn-detail" 
                    onclick="upgradePropertyMainLevel(${propertyInstance.uniqueId})" 
                    ${mainLevelDisabledReason ? 'disabled' : ''}>
                Upgrade Main Lvl ${mainLevelDisabledReason || `($${formatNumber(mainLevelUpgradeCost,0)})`}
            </button>
        `;

        // 2. Specific Upgrades
        if (propertyType.upgrades && propertyType.upgrades.length > 0) {
            detailContentHTML += '<p>Specific Upgrades:</p>';
            propertyType.upgrades.forEach(upgDef => {
                const currentTier = propertyInstance.appliedUpgrades[upgDef.id] || 0;
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
                let reason = "";

                if (currentTier >= upgDef.maxTier) { reason = "(Max Tier)"; isDisabled = true; }
                else if (upgDef.requiresResearch && !gameState.unlockedResearch.includes(upgDef.requiresResearch)) { reason = "(Needs Res.)"; isDisabled = true; }
                else if (gameState.cash < costNextTier) { reason = `(Need $${formatNumber(costNextTier,0)})`; isDisabled = true; }
                else if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) { reason = `(Need ${actualMaterialsNeeded} Mats)`; isDisabled = true; }
                else { reason = `($${formatNumber(costNextTier,0)}${actualMaterialsNeeded > 0 ? ', '+actualMaterialsNeeded+' Mats' : ''})`;}
                
                buttonText += ` ${reason}`;

                detailContentHTML += `
                    <button class="specific-upgrade-btn-detail" 
                            onclick="applySpecificPropertyUpgrade(${propertyInstance.uniqueId}, '${upgDef.id}')" 
                            ${isDisabled ? 'disabled' : ''}
                            title="RPS Boost: +${formatNumber(upgDef.rpsBoost,2)}/tier. Materials: ${actualMaterialsNeeded > 0 ? actualMaterialsNeeded : '0'}">
                        ${buttonText}
                    </button>
                `;
            });
        } else {
            detailContentHTML += '<p>No specific upgrades available for this rental.</p>';
        }
        upgradesDetailDiv.innerHTML = detailContentHTML;
    }
}

function displayAvailableFacilitiesList(targetElement, filterType) { // filterType: 'material' or 'science' (or 'all')
    let displayedCount = 0;
    FACILITY_TYPES.filter(facType => {
        if (!isFacilityTypeUnlocked(facType.id)) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.type === "property_cost_reduction" || e.type === "material_usage_efficiency" || e.propertyCategory); // Material producers or construction buffs
        if (filterType === 'science') return facType.output?.resource === 'researchPoints'; // Science labs
        return true; // Default if no filter or unknown filter
    }).forEach(facType => {
        if (!facType || typeof facType.cost === 'undefined' || typeof facType.baseUpkeepRPS === 'undefined') {
            console.error("Skipping invalid construction type:", facType); return;
        }
        displayedCount++;
        const currentMonetaryCost = calculateFacilityDynamicCost(facType);
        const materialsCost = facType.materialsCost || 0;
        let outputText = facType.output ? `${formatNumber(facType.output.amount,3)}/s ${facType.output.resource}` : (facType.effects ? "Provides Global Buff(s)" : "No direct output");
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
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) targetElement.innerHTML = FACILITY_TYPES.some(ft => ft.requiredResearch && !isFacilityTypeUnlocked(ft.id)) ? `<p>More ${filterType || ''} construction available via research.</p>` : `<p>No ${filterType || ''} construction options currently available or defined.</p>`;
}

function displayOwnedFacilitiesList(targetElement, filterType) {
    const filteredOwnedFacilities = ownedFacilities.filter(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.type === "property_cost_reduction" || e.type === "material_usage_efficiency" || e.propertyCategory);
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return true;
    });

    if (filteredOwnedFacilities.length === 0) {
        targetElement.innerHTML = `<p>You don't own any ${filterType || ''} constructions yet.</p>`; return;
    }
    filteredOwnedFacilities.forEach(facInst => {
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
        let outputText = facInst.currentOutput ? `${formatNumber(facInst.currentOutput.amount,3)}/s ${facInst.currentOutput.resource}` : (facType.effects ? "Provides Global Buff(s)" : "No direct output");
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
        targetElement.appendChild(card);
    });
}

function displayResearchOptionsList(targetElement) {
    let displayedCount = 0;
    RESEARCH_TOPICS.forEach(topic => {
        if (gameState.unlockedResearch.includes(topic.id)) return;
        if (!isResearchAvailable(topic.id)) return;
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
        targetElement.appendChild(card);
    });
    if (displayedCount === 0) {
        targetElement.innerHTML = RESEARCH_TOPICS.every(topic => gameState.unlockedResearch.includes(topic.id)) ? '<p>All research completed!</p>' : '<p>No new research available. Check prerequisites or build more labs.</p>';
    }
}

// ---- Button State Update Functions ----
function updatePropertyBuyButtonStates() {
    ensureUIInitialized();
    PROPERTY_TYPES.forEach(propType => {
        const buyButton = document.getElementById(`buy-prop-${propType.id}-btn`);
        if (buyButton) {
            if(!isPropertyTypeUnlocked(propType.id)) {
                if(buyButton.parentElement && buyButton.parentElement.style.display !== 'none') buyButton.parentElement.style.display = 'none';
                return;
            }
            if(buyButton.parentElement && buyButton.parentElement.style.display === 'none') buyButton.parentElement.style.display = 'flex';
            
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
            let disabledReason = "";
            if (gameState.cash < monetaryCost) disabledReason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) disabledReason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!disabledReason;
            buyButton.textContent = `Buy ${disabledReason}`;
        }
    });
}

function updateFacilityBuyButtonStates(filterType) {
    FACILITY_TYPES.filter(facType => {
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.type === "property_cost_reduction" || e.type === "material_usage_efficiency" || e.propertyCategory);
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
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
            let disabledReason = "";
            if (gameState.cash < monetaryCost) disabledReason = `(Need $${formatNumber(monetaryCost,0)})`;
            else if (materialsCost > 0 && gameState.buildingMaterials < materialsCost) disabledReason = `(Need ${materialsCost} Mats)`;
            buyButton.disabled = !!disabledReason;
            buyButton.textContent = `Build ${disabledReason}`;
        }
    });
}

function updatePropertyUpgradeButtonStates() {
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
                    // ... (full button text and disable logic as in previous version)
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

function updateFacilityUpgradeButtonStates(filterType) {
    ownedFacilities.filter(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (!facType) return false;
        if (filterType === 'material') return facType.output?.resource === 'buildingMaterials' || facType.effects?.some(e => e.type === "property_cost_reduction" || e.type === "material_usage_efficiency" || e.propertyCategory);
        if (filterType === 'science') return facType.output?.resource === 'researchPoints';
        return true;
    }).forEach(facInst => {
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
                    // ... (full button text and disable logic as in previous version)
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

function updateResearchButtonStatesList() { // Renamed to avoid conflict if there was a global one
    RESEARCH_TOPICS.forEach(topic => {
        const researchButton = document.getElementById(`research-${topic.id}-btn`);
        if (researchButton && researchButton.parentElement) {
            if (gameState.unlockedResearch.includes(topic.id) || !isResearchAvailable(topic.id)) {
                researchButton.parentElement.style.display = 'none'; return;
            }
            researchButton.parentElement.style.display = 'flex';
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

// Log Message function removed as per request
// function logMessage(message, type = "info") { ... }


function initialRender() {
    initializeUIElements();
    if (!uiInitialized) {
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; font-size: 18px; color: red;"><h1>Critical UI Error</h1><p>UI could not be initialized. Check console.</p></div>`;
        return;
    }
    updateCashDisplay();
    updateNetRPSDisplay();
    updateOwnedPropertiesCountDisplay();
    updateBuildingMaterialsDisplay();
    updateResearchPointsDisplay();
    updateTotalUpkeepDisplay();

    switchView(currentView); // Initial view setup (defaults to 'rentals')
}
