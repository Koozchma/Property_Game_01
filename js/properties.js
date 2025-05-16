// Metropolis Estates - properties.js (v0.5.1 - New Progression Model)

// --- Property Type Definitions ---
// Each property now has a 'requiredResearch' field.
// The first property (Shack) is unlocked by an initial cash-costing research.
// Subsequent properties are unlocked by research costing RP and/or Materials.
const PROPERTY_TYPES = [
    {
        id: "shack",
        name: "Dilapidated Shack",
        baseCost: 50, // Monetary cost to buy/build after unlocking
        materialsCost: 10, // Material cost to buy/build after unlocking
        baseRPS: 0.5,
        mainLevelMax: 3,
        description: "It's a roof, mostly. Generates minimal rent.",
        category: "cheap", // For targeting buffs
        requiredResearch: "initiate_rental_development", // Unlocked by the initial cash research
        upgrades: [
            { id: "patch_roof", name: "Patch Roof", cost: 20, rpsBoost: 0.2, maxTier: 1, requiresMaterials: 5 },
            { id: "board_windows", name: "Board Windows", cost: 30, rpsBoost: 0.3, maxTier: 1, requiresMaterials: 8 },
            // Example: Plumbing upgrade might require a workshop to be unlocked via research
            { id: "basic_plumbing", name: "Basic Plumbing", cost: 75, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 15, requiredResearch: "unlock_basic_workshop_research" }
        ]
    },
    {
        id: "small_apartment",
        name: "Small Apartment Unit",
        baseCost: 250,
        materialsCost: 75, // Costs materials to build
        baseRPS: 3,
        mainLevelMax: 5,
        description: "A basic living unit. A steady, small earner.",
        category: "cheap",
        requiredResearch: "unlock_urban_planning_1", // Unlocked by the 300 RP + 50 Materials research
        upgrades: [
            { id: "paint_job", name: "Fresh Paint", cost: 100, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 10 },
            { id: "better_fixtures", name: "Better Fixtures", cost: 150, rpsBoost: 1, maxTier: 2, requiresMaterials: 20 },
            { id: "security_door", name: "Security Door", cost: 200, rpsBoost: 0.75, maxTier: 1, requiresMaterials: 15 }
        ]
    },
    {
        id: "trailer_home",
        name: "Trailer Home",
        baseCost: 600,
        materialsCost: 120,
        baseRPS: 7,
        mainLevelMax: 5,
        description: "Mobile, but not going anywhere. Decent income.",
        category: "residential",
        requiredResearch: "unlock_urban_planning_1", // Also unlocked by the 300 RP + 50 Materials research
        upgrades: [
            { id: "skirting", name: "Add Skirting", cost: 250, rpsBoost: 1.5, maxTier: 1, requiresMaterials: 30 },
            { id: "insulation", name: "Insulation", cost: 400, rpsBoost: 2.5, maxTier: 2, requiresMaterials: 40 },
        ]
    },
    {
        id: "suburban_house",
        name: "Suburban House",
        baseCost: 1500,
        materialsCost: 250,
        baseRPS: 15,
        mainLevelMax: 7,
        description: "The classic family home. Reliable returns.",
        category: "residential",
        requiredResearch: "unlock_suburban_homes_research", // Unlocked by its specific research
        upgrades: [
            { id: "landscaping", name: "Landscaping", cost: 500, rpsBoost: 3, maxTier: 2, requiresMaterials: 50 },
            { id: "kitchen_reno", name: "Kitchen Reno", cost: 1000, rpsBoost: 5, maxTier: 1, requiresMaterials: 80, requiredResearch: "unlock_basic_workshop_research" },
            { id: "add_garage", name: "Add Garage", cost: 1200, rpsBoost: 4, maxTier: 1, requiresMaterials: 100 }
        ]
    },
    {
        id: "corner_store",
        name: "Small Corner Store",
        baseCost: 3500,
        materialsCost: 400,
        baseRPS: 30,
        mainLevelMax: 6,
        description: "Sells essentials to the neighborhood. Good cash flow.",
        category: "commercial",
        requiredResearch: "unlock_commercial_rentals_research", // Unlocked by its specific research
        upgrades: [
            { id: "shelf_stocking", name: "Better Shelves", cost: 800, rpsBoost: 5, maxTier: 3, requiresMaterials: 60 },
            // Example: Refrigeration might require a more advanced workshop or specific tech
            // { id: "refrigeration", name: "New Coolers", cost: 1500, rpsBoost: 8, maxTier: 2, requiresMaterials: 90, requiredResearch: "advanced_commercial_tech" },
        ]
    }
    // Add more property types like "luxury_condo" and their 'requiredResearch' here
];

// --- Game State Variables for Properties ---
let ownedProperties = []; // Stores instances of properties the player owns
let nextPropertyId = 0;   // Counter for unique IDs for owned property instances

// --- Helper Functions ---
function getPropertyTypeById(id) {
    return PROPERTY_TYPES.find(prop => prop.id === id);
}

/**
 * Calculates the current monetary cost to buy a property type.
 * This version uses a flat baseCost but applies global cost reduction buffs from research.
 * @param {object} propertyType - The property type definition object.
 * @returns {number} The calculated monetary cost.
 */
function calculateDynamicPropertyCost(propertyType) {
    let currentCost = propertyType.baseCost; // Start with flat base monetary cost

    // Apply global property cost reduction from completed research
    // Example: If "Basic Construction Tech" (unlock_basic_workshop_research) provides this buff
    if (gameState.unlockedResearch.includes("unlock_basic_workshop_research")) {
        const researchTopic = getResearchTopicById("unlock_basic_workshop_research"); // from facilities.js
        if (researchTopic && researchTopic.globalBuff && researchTopic.globalBuff.type === "property_cost_reduction") {
            currentCost *= (1 - researchTopic.globalBuff.percentage);
        }
    }
    // Add other similar buff checks here if more research reduces costs

    return Math.floor(currentCost);
}

/**
 * Checks if a specific property type is currently unlocked for purchase based on completed research.
 * @param {string} propertyTypeId - The ID of the property type to check.
 * @returns {boolean} True if the property type is unlocked, false otherwise.
 */
function isPropertyTypeUnlocked(propertyTypeId) {
    const propType = getPropertyTypeById(propertyTypeId);
    if (!propType) return false; // Property type definition not found
    if (!propType.requiredResearch) return true; // No research needed, always considered unlocked (e.g., if a very first item had no research)
    
    // The property type is unlocked if its 'requiredResearch' ID is in the gameState.unlockedResearch array
    return gameState.unlockedResearch.includes(propType.requiredResearch);
}


// --- Core Property Management Functions ---

function buyProperty(propertyTypeId) {
    const propertyType = getPropertyTypeById(propertyTypeId);
    if (!propertyType) {
        console.error("Buy Property Error: Property type not found - ", propertyTypeId);
        return false;
    }

    if (!isPropertyTypeUnlocked(propertyTypeId)) {
        const requiredResearchDetails = getResearchTopicById(propertyType.requiredResearch); // from facilities.js
        console.log(`[GAME] Cannot buy ${propertyType.name}: Requires research "${requiredResearchDetails ? requiredResearchDetails.name : propertyType.requiredResearch}".`);
        return false;
    }

    const currentMonetaryCost = calculateDynamicPropertyCost(propertyType);
    const materialsNeeded = propertyType.materialsCost || 0;

    if (gameState.cash < currentMonetaryCost) {
        console.log(`[GAME] Not enough cash to buy ${propertyType.name}. Need $${currentMonetaryCost.toLocaleString()}.`);
        return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        console.log(`[GAME] Not enough materials to buy ${propertyType.name}. Need ${materialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}).`);
        return false;
    }

    gameState.cash -= currentMonetaryCost;
    if (materialsNeeded > 0) {
        gameState.buildingMaterials -= materialsNeeded;
    }

    const newProperty = {
        uniqueId: nextPropertyId++,
        typeId: propertyType.id,
        name: propertyType.name,
        mainLevel: 1,
        purchaseCost: currentMonetaryCost, // Store the monetary cost it was bought at
        appliedUpgrades: {}, // Stores tier of applied specific upgrades, e.g., { "patch_roof": 1 }
        baseRPS: propertyType.baseRPS, // Store base RPS of the type for recalculations
        currentRPS: 0 // Will be calculated by calculateInstanceRPS
    };
    newProperty.currentRPS = calculateInstanceRPS(newProperty, propertyType); // Calculate initial RPS
    ownedProperties.push(newProperty);

    updateGameData(); // Refresh game state and UI
    console.log(`[GAME] Purchased ${propertyType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'));
    return true;
}

/**
 * Calculates the current RPS for a single property instance based on its base RPS,
 * applied specific upgrades, and main level.
 * @param {object} propertyInstance - The owned property instance.
 * @param {object} propertyType - The definition of the property type.
 * @returns {number} The calculated current RPS for this instance.
 */
function calculateInstanceRPS(propertyInstance, propertyType) {
    let rpsFromUpgrades = 0;
    if (propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const upgradeTier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef && typeof upgradeDef.rpsBoost === 'number') {
                rpsFromUpgrades += (upgradeDef.rpsBoost * upgradeTier); // RPS boost per tier
            }
        }
    }
    // Main level boosts base RPS and upgrade RPS. Example: 10% boost per mainLevel beyond 1.
    const mainLevelMultiplier = 1 + (propertyInstance.mainLevel - 1) * 0.1;
    return parseFloat(((propertyInstance.baseRPS + rpsFromUpgrades) * mainLevelMultiplier).toFixed(2));
}

/**
 * Calculates the total RPS from all owned properties, applying any global buffs from research.
 * @returns {number} The total RPS.
 */
function calculateTotalPropertiesRPS() {
    let totalRPS = 0;
    
    // Gather global buff percentages from completed research
    let cheapPropertyBuffPercentage = 0;
    let commercialPropertyBuffPercentage = 0;
    // Add more buff variables as needed (e.g., allResidentialBuffPercentage)

    gameState.unlockedResearch.forEach(researchId => {
        const topic = getResearchTopicById(researchId); // from facilities.js
        if (topic && topic.globalBuff) {
            if (topic.globalBuff.type === "property_rps_boost") {
                if (topic.globalBuff.propertyCategory === "cheap") {
                    cheapPropertyBuffPercentage += topic.globalBuff.percentage;
                } else if (topic.globalBuff.scope === "commercial") { // Assuming 'scope' for broader categories
                    commercialPropertyBuffPercentage += topic.globalBuff.percentage;
                }
                // Add more 'else if' for other categories/scopes
            }
        }
    });

    ownedProperties.forEach(propInst => {
        let effectiveRPS = propInst.currentRPS; // This is the RPS from its own level and specific upgrades
        const propTypeDetails = getPropertyTypeById(propInst.typeId);

        if (propTypeDetails) {
            // Apply relevant global buffs
            if (propTypeDetails.category === "cheap" && cheapPropertyBuffPercentage > 0) {
                 effectiveRPS *= (1 + cheapPropertyBuffPercentage);
            }
            if (propTypeDetails.category === "commercial" && commercialPropertyBuffPercentage > 0) {
                 effectiveRPS *= (1 + commercialPropertyBuffPercentage);
            }
            // Add more buff applications here
        }
        totalRPS += effectiveRPS;
    });
    return parseFloat(totalRPS.toFixed(2));
}


function upgradePropertyMainLevel(ownedPropertyUniqueId) {
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) return;
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) return;

    if (propertyInstance.mainLevel < propertyType.mainLevelMax) {
        const upgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel -1)); // Monetary cost
        if (gameState.cash >= upgradeCost) {
            gameState.cash -= upgradeCost;
            propertyInstance.mainLevel++;
            propertyInstance.currentRPS = calculateInstanceRPS(propertyInstance, propertyType);
            updateGameData();
            console.log(`[GAME] ${propertyInstance.name} (ID: ${propertyInstance.uniqueId}) main level upgraded to ${propertyInstance.mainLevel}. Cost: $${upgradeCost.toLocaleString()}.`);
        } else {
            console.log(`[GAME] Not enough cash for main level upgrade of ${propertyInstance.name}. Need $${upgradeCost.toLocaleString()}.`);
        }
    } else {
        console.log(`[GAME] ${propertyInstance.name} is already at max main level.`);
    }
}

function applySpecificPropertyUpgrade(ownedPropertyUniqueId, specificUpgradeId) {
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) return;
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) return;
    const upgradeDef = propertyType.upgrades.find(u => u.id === specificUpgradeId);
    if (!upgradeDef) {
        console.error(`[GAME] Upgrade definition ${specificUpgradeId} not found for ${propertyType.name}.`); return;
    }
    const currentTier = propertyInstance.appliedUpgrades[specificUpgradeId] || 0;
    if (currentTier >= upgradeDef.maxTier) {
        console.log(`[GAME] ${upgradeDef.name} is already at max tier for ${propertyInstance.name}.`); return;
    }

    // Check research requirement for the specific upgrade itself
    if (upgradeDef.requiredResearch && !gameState.unlockedResearch.includes(upgradeDef.requiredResearch)) {
        const researchDef = getResearchTopicById(upgradeDef.requiredResearch); // from facilities.js
        console.log(`[GAME] Cannot apply ${upgradeDef.name}: Requires research "${researchDef ? researchDef.name : upgradeDef.requiredResearch}".`);
        return;
    }

    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.5, currentTier)); // Monetary cost
    const materialsNeededBase = upgradeDef.requiresMaterials ? Math.floor(upgradeDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
    let materialUsageEfficiency = 1;
    // Check for material efficiency buff from research
    if (gameState.unlockedResearch.includes("advanced_material_processing_research")) { // Ensure this ID matches your research topic
        const buffResearch = getResearchTopicById("advanced_material_processing_research");
        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "material_usage_efficiency") {
            materialUsageEfficiency = 1 - buffResearch.globalBuff.percentage;
        }
    }
    const actualMaterialsNeeded = Math.floor(materialsNeededBase * materialUsageEfficiency);

    if (gameState.cash < costForNextTier) {
        console.log(`[GAME] Not enough cash for ${upgradeDef.name}. Need $${costForNextTier.toLocaleString()}.`); return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        console.log(`[GAME] Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}).`); return;
    }

    gameState.cash -= costForNextTier;
    if (actualMaterialsNeeded > 0) gameState.buildingMaterials -= actualMaterialsNeeded;
    propertyInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    propertyInstance.currentRPS = calculateInstanceRPS(propertyInstance, propertyType);
    updateGameData();
    console.log(`[GAME] ${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${propertyInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (actualMaterialsNeeded > 0 ? `, ${actualMaterialsNeeded} materials.` : '.'));
}

function sellPropertyInstance(ownedPropertyUniqueId) {
    const propertyIndex = ownedProperties.findIndex(p => p.uniqueId === ownedPropertyUniqueId);
    if (propertyIndex === -1) return;
    const propertyInstance = ownedProperties[propertyIndex];
    let upgradeValue = 0;
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (propertyType && propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const tier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                for (let i = 0; i < tier; i++) { // Sum cost of each tier achieved
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.5, i)) * 0.25; // Return 25% of specific upgrade costs
                }
            }
        }
    }
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < propertyInstance.mainLevel -1; i++){ // For levels 2 and up
        mainLevelUpgradeValue += Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, i)) * 0.25; // Return 25% of main level upgrade costs
    }
    const sellPrice = Math.floor(propertyInstance.purchaseCost * 0.5 + upgradeValue + mainLevelUpgradeValue); // 50% of base, 25% of upgrades
    const materialsReturned = Math.floor((propertyType.materialsCost || 0) * 0.25); // Return 25% of base material cost

    gameState.cash += sellPrice;
    if (materialsReturned > 0) {
        gameState.buildingMaterials += materialsReturned;
    }
    ownedProperties.splice(propertyIndex, 1);
    updateGameData();
    console.log(`[GAME] Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}` + (materialsReturned > 0 ? ` and recovered ${materialsReturned} materials.` : '.'));
}
