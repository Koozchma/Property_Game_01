// Metropolis Estates - properties.js

// --- Property Definitions ---
const PROPERTY_TYPES = [
    {
        id: "shack",
        name: "Dilapidated Shack",
        baseCost: 50, // Renamed from 'cost' to avoid confusion with dynamic cost
        baseRPS: 0.5,
        mainLevelMax: 3, // Max for the general "level"
        description: "It's a roof, mostly. Generates minimal rent.",
        upgrades: [
            { id: "patch_roof", name: "Patch Roof", cost: 20, rpsBoost: 0.2, maxTier: 1, requiresMaterials: 0 },
            { id: "board_windows", name: "Board Windows", cost: 30, rpsBoost: 0.3, maxTier: 1, requiresMaterials: 0 },
            { id: "basic_plumbing", name: "Basic Plumbing", cost: 75, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 5, requiresResearch: null } // Example material req
        ]
    },
    {
        id: "small_apartment",
        name: "Small Apartment Unit",
        baseCost: 250,
        baseRPS: 3,
        mainLevelMax: 5,
        description: "A basic living unit. A steady, small earner.",
        upgrades: [
            { id: "paint_job", name: "Fresh Paint", cost: 100, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 0 },
            { id: "better_fixtures", name: "Better Fixtures", cost: 150, rpsBoost: 1, maxTier: 2, requiresMaterials: 10 }, // Tiered upgrade
            { id: "security_door", name: "Security Door", cost: 200, rpsBoost: 0.75, maxTier: 1, requiresMaterials: 5 }
        ]
    },
    {
        id: "trailer_home",
        name: "Trailer Home",
        baseCost: 600,
        baseRPS: 7,
        mainLevelMax: 5,
        description: "Mobile, but not going anywhere. Decent income.",
        upgrades: [
            { id: "skirting", name: "Add Skirting", cost: 250, rpsBoost: 1.5, maxTier: 1, requiresMaterials: 20 },
            { id: "insulation", name: "Insulation", cost: 400, rpsBoost: 2.5, maxTier: 2, requiresMaterials: 30 },
        ]
    },
    {
        id: "suburban_house",
        name: "Suburban House",
        baseCost: 1500,
        baseRPS: 15,
        mainLevelMax: 7,
        description: "The classic family home. Reliable returns.",
        upgrades: [
            { id: "landscaping", name: "Landscaping", cost: 500, rpsBoost: 3, maxTier: 2, requiresMaterials: 25 },
            { id: "kitchen_reno", name: "Kitchen Reno", cost: 1000, rpsBoost: 5, maxTier: 1, requiresMaterials: 50, requiresResearch: "basic_construction_techniques" }, // Example research req
            { id: "add_garage", name: "Add Garage", cost: 1200, rpsBoost: 4, maxTier: 1, requiresMaterials: 70 }
        ]
    },
    {
        id: "corner_store",
        name: "Small Corner Store",
        baseCost: 3500,
        baseRPS: 30,
        mainLevelMax: 6,
        description: "Sells essentials to the neighborhood. Good cash flow.",
        upgrades: [
            { id: "shelf_stocking", name: "Better Shelves", cost: 800, rpsBoost: 5, maxTier: 3, requiresMaterials: 30 },
            { id: "refrigeration", name: "New Coolers", cost: 1500, rpsBoost: 8, maxTier: 2, requiresMaterials: 60, requiresResearch: "commercial_logistics" },
        ]
    }
];

let ownedProperties = [];
let nextPropertyId = 0;

function getPropertyTypeById(id) {
    return PROPERTY_TYPES.find(prop => prop.id === id);
}

function calculateDynamicPropertyCost(propertyType) {
    // Cost increases by 15% for each one already owned
    const ownedCount = ownedProperties.filter(p => p.typeId === propertyType.id).length;
    return Math.floor(propertyType.baseCost * Math.pow(1.15, ownedCount));
}

function buyProperty(propertyTypeId) {
    const propertyType = getPropertyTypeById(propertyTypeId);
    if (!propertyType) {
        logMessage("Error: Property type not found.", "error");
        return false;
    }

    const currentCost = calculateDynamicPropertyCost(propertyType);

    if (gameState.cash >= currentCost) {
        gameState.cash -= currentCost;

        const newProperty = {
            uniqueId: nextPropertyId++,
            typeId: propertyType.id,
            name: propertyType.name,
            mainLevel: 1, // General level
            purchaseCost: currentCost,
            appliedUpgrades: {}, // Stores tier of applied specific upgrades, e.g., { "patch_roof": 1 }
            currentRPS: calculateInstanceRPS(propertyType.baseRPS, {}, 1) // Initial RPS
        };
        ownedProperties.push(newProperty);
        newProperty.currentRPS = calculateInstanceRPS(propertyType.baseRPS, newProperty.appliedUpgrades, newProperty.mainLevel, propertyType.upgrades); // Recalculate with self

        updateGameData();
        logMessage(`Purchased ${propertyType.name} for $${currentCost.toLocaleString()}.`, "success");
        return true;
    } else {
        logMessage(`Not enough cash to buy ${propertyType.name}. Need $${currentCost.toLocaleString()}.`, "error");
        return false;
    }
}

function calculateInstanceRPS(baseRPS, appliedUpgrades, mainLevel, allPossibleUpgrades) {
    let rpsFromUpgrades = 0;
    if (allPossibleUpgrades) {
        for (const upgradeId in appliedUpgrades) {
            const upgradeTier = appliedUpgrades[upgradeId];
            const upgradeDef = allPossibleUpgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                rpsFromUpgrades += (upgradeDef.rpsBoost * upgradeTier); // RPS boost per tier
            }
        }
    }
    // Main level boosts base RPS and upgrade RPS. Example: 10% boost per mainLevel beyond 1.
    const mainLevelMultiplier = 1 + (mainLevel - 1) * 0.1;
    return parseFloat(((baseRPS + rpsFromUpgrades) * mainLevelMultiplier).toFixed(2));
}

function upgradePropertyMainLevel(ownedPropertyUniqueId) {
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) return;

    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) return;

    if (propertyInstance.mainLevel < propertyType.mainLevelMax) {
        const upgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel -1));

        if (gameState.cash >= upgradeCost) {
            gameState.cash -= upgradeCost;
            propertyInstance.mainLevel++;
            propertyInstance.currentRPS = calculateInstanceRPS(propertyType.baseRPS, propertyInstance.appliedUpgrades, propertyInstance.mainLevel, propertyType.upgrades);
            updateGameData();
            logMessage(`${propertyInstance.name} (ID: ${propertyInstance.uniqueId}) main level upgraded to ${propertyInstance.mainLevel}. Cost: $${upgradeCost.toLocaleString()}.`, "success");
        } else {
            logMessage(`Not enough cash for main level upgrade of ${propertyInstance.name}. Need $${upgradeCost.toLocaleString()}.`, "error");
        }
    } else {
        logMessage(`${propertyInstance.name} is already at max main level.`, "info");
    }
}


function applySpecificPropertyUpgrade(ownedPropertyUniqueId, specificUpgradeId) {
    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) return;

    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) return;

    const upgradeDef = propertyType.upgrades.find(u => u.id === specificUpgradeId);
    if (!upgradeDef) {
        logMessage(`Upgrade definition ${specificUpgradeId} not found for ${propertyType.name}.`, "error");
        return;
    }

    const currentTier = propertyInstance.appliedUpgrades[specificUpgradeId] || 0;
    if (currentTier >= upgradeDef.maxTier) {
        logMessage(`${upgradeDef.name} is already at max tier for ${propertyInstance.name}.`, "info");
        return;
    }

    // Check research requirements
    if (upgradeDef.requiresResearch && !gameState.unlockedResearch.includes(upgradeDef.requiresResearch)) {
        const researchDef = RESEARCH_TOPICS.find(r => r.id === upgradeDef.requiresResearch);
        logMessage(`Cannot apply ${upgradeDef.name}: Requires research "${researchDef ? researchDef.name : upgradeDef.requiresResearch}" which is not yet completed.`, "error");
        return;
    }


    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.5, currentTier)); // Cost increases per tier
    const materialsNeeded = upgradeDef.requiresMaterials ? Math.floor(upgradeDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;

    if (gameState.cash < costForNextTier) {
        logMessage(`Not enough cash for ${upgradeDef.name}. Need $${costForNextTier.toLocaleString()}.`, "error");
        return;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        logMessage(`Not enough materials for ${upgradeDef.name}. Need ${materialsNeeded} (You have ${gameState.buildingMaterials}).`, "error");
        return;
    }

    gameState.cash -= costForNextTier;
    if (materialsNeeded > 0) gameState.buildingMaterials -= materialsNeeded;

    propertyInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    propertyInstance.currentRPS = calculateInstanceRPS(propertyType.baseRPS, propertyInstance.appliedUpgrades, propertyInstance.mainLevel, propertyType.upgrades);

    updateGameData();
    logMessage(`${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${propertyInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (materialsNeeded > 0 ? `, ${materialsNeeded} materials.` : '.'), "success");
}


function calculateTotalPropertiesRPS() {
    return ownedProperties.reduce((sum, prop) => sum + prop.currentRPS, 0);
}

function sellPropertyInstance(ownedPropertyUniqueId) {
    const propertyIndex = ownedProperties.findIndex(p => p.uniqueId === ownedPropertyUniqueId);
    if (propertyIndex === -1) return;

    const propertyInstance = ownedProperties[propertyIndex];
    // Sell price considers initial purchase and a portion of upgrade costs invested
    let upgradeValue = 0;
    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (propertyType && propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const tier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                for (let i = 0; i < tier; i++) {
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.5, i)) * 0.25; // Get back 25% of specific upgrade costs
                }
            }
        }
    }
    // Main level upgrade value
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < propertyInstance.mainLevel -1; i++){
        mainLevelUpgradeValue += Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, i)) * 0.25;
    }


    const sellPrice = Math.floor(propertyInstance.purchaseCost * 0.5 + upgradeValue + mainLevelUpgradeValue); // 50% of base, 25% of upgrades

    gameState.cash += sellPrice;
    ownedProperties.splice(propertyIndex, 1);

    updateGameData();
    logMessage(`Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}.`, "info");
}
