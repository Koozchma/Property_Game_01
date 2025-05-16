// Metropolis Estates - properties.js

const PROPERTY_TYPES = [
    {
        id: "shack", name: "Dilapidated Shack", baseCost: 50, baseRPS: 0.5, mainLevelMax: 3,
        description: "It's a roof, mostly. Generates minimal rent.", category: "cheap",
        materialsCost: 0,
        requiredResearch: "initiate_rental_development", // Now unlocked by initial cash research
        upgrades: [
            { id: "patch_roof", name: "Patch Roof", cost: 20, rpsBoost: 0.2, maxTier: 1, requiresMaterials: 5 },
            { id: "board_windows", name: "Board Windows", cost: 30, rpsBoost: 0.3, maxTier: 1, requiresMaterials: 8 },
            { id: "basic_plumbing", name: "Basic Plumbing", cost: 75, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 15, requiredResearch: "unlock_basic_workshop_research" } // Example of upgrade needing research
        ]
    },
    {
        id: "small_apartment", name: "Small Apartment Unit", baseCost: 250, baseRPS: 3, mainLevelMax: 5,
        description: "A basic living unit. A steady, small earner.", category: "cheap",
        materialsCost: 20, // Subsequent rentals cost materials to build
        requiredResearch: "unlock_urban_planning_1", // Unlocked by the 300 RP research
        upgrades: [ /* ... */ ]
    },
    {
        id: "trailer_home", name: "Trailer Home", baseCost: 600, baseRPS: 7, mainLevelMax: 5,
        description: "Mobile, but not going anywhere. Decent income.", category: "residential",
        materialsCost: 35,
        requiredResearch: "unlock_urban_planning_1", // Also unlocked by the 300 RP research
        upgrades: [ /* ... */ ]
    },
    {
        id: "suburban_house", name: "Suburban House", baseCost: 1500, baseRPS: 15, mainLevelMax: 7,
        description: "The classic family home. Reliable returns.", category: "residential",
        materialsCost: 75,
        requiredResearch: "unlock_suburban_homes_research", // Unlocked by its specific research
        upgrades: [ /* ... */ ]
    },
    {
        id: "corner_store", name: "Small Corner Store", baseCost: 3500, baseRPS: 30, mainLevelMax: 6,
        description: "Sells essentials to the neighborhood. Good cash flow.", category: "commercial",
        materialsCost: 120,
        requiredResearch: "unlock_commercial_rentals_research", // Unlocked by its specific research
        upgrades: [ /* ... */ ]
    }
    // Define more properties like "luxury_condo" and their requiredResearch from the new tree
];

let ownedProperties = [];
let nextPropertyId = 0;

function getPropertyTypeById(id) { return PROPERTY_TYPES.find(prop => prop.id === id); }

function calculateDynamicPropertyCost(propertyType) { // Monetary cost is flat
    let currentCost = propertyType.baseCost;
    // Apply global property cost reduction from research
    if (gameState.unlockedResearch.includes("unlock_basic_workshop_research")) { // Assuming this research gives the buff
        const buffResearch = getResearchTopicById("unlock_basic_workshop_research"); // from facilities.js
        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "property_cost_reduction") {
            currentCost *= (1 - buffResearch.globalBuff.percentage);
        }
    }
    return Math.floor(currentCost);
}

function isPropertyTypeUnlocked(propertyTypeId) {
    const propType = getPropertyTypeById(propertyTypeId);
    if (!propType) return false;
    if (!propType.requiredResearch) return true; // Should not happen if all have a research path
    return gameState.unlockedResearch.includes(propType.requiredResearch);
}

function buyProperty(propertyTypeId) {
    const propertyType = getPropertyTypeById(propertyTypeId);
    if (!propertyType) { console.error("Buy Property Error: Type not found - ", propertyTypeId); return false; }
    if (!isPropertyTypeUnlocked(propertyTypeId)) {
        const requiredResearch = getResearchTopicById(propertyType.requiredResearch);
        console.log(`[GAME] Cannot buy ${propertyType.name}: Requires research "${requiredResearch ? requiredResearch.name : propertyType.requiredResearch}".`);
        return false;
    }
    const currentMonetaryCost = calculateDynamicPropertyCost(propertyType);
    const materialsNeeded = propertyType.materialsCost || 0;
    if (gameState.cash < currentMonetaryCost) {
        console.log(`[GAME] Not enough cash for ${propertyType.name}. Need $${currentMonetaryCost.toLocaleString()}.`); return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        console.log(`[GAME] Not enough materials for ${propertyType.name}. Need ${materialsNeeded} (Have ${Math.floor(gameState.buildingMaterials)}).`); return false;
    }
    gameState.cash -= currentMonetaryCost;
    if (materialsNeeded > 0) gameState.buildingMaterials -= materialsNeeded;
    const newProperty = {
        uniqueId: nextPropertyId++, typeId: propertyType.id, name: propertyType.name, mainLevel: 1,
        purchaseCost: currentMonetaryCost, appliedUpgrades: {}, baseRPS: propertyType.baseRPS, currentRPS: 0
    };
    newProperty.currentRPS = calculateInstanceRPS(newProperty, propertyType);
    ownedProperties.push(newProperty);
    updateGameData();
    console.log(`[GAME] Purchased ${propertyType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'));
    return true;
}

function calculateInstanceRPS(propertyInstance, propertyType) {
    let rpsFromUpgrades = 0;
    if (propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const tier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef && typeof upgradeDef.rpsBoost === 'number') rpsFromUpgrades += (upgradeDef.rpsBoost * tier);
        }
    }
    const mainLevelMultiplier = 1 + (propertyInstance.mainLevel - 1) * 0.1;
    return parseFloat(((propertyInstance.baseRPS + rpsFromUpgrades) * mainLevelMultiplier).toFixed(2));
}

function calculateTotalPropertiesRPS() {
    let totalRPS = 0;
    let cheapPropertyBuffPercentage = 0;
    let commercialPropertyBuffPercentage = 0;

    // Check for global buffs from completed research
    if (gameState.unlockedResearch.includes("unlock_basic_workshop_research")) { // Assuming this research provides the cheap buff
        const researchTopic = getResearchTopicById("unlock_basic_workshop_research");
        if (researchTopic && researchTopic.globalBuff && researchTopic.globalBuff.type === "property_rps_boost" && researchTopic.globalBuff.propertyCategory === "cheap") {
            cheapPropertyBuffPercentage += researchTopic.globalBuff.percentage;
        }
    }
    if (gameState.unlockedResearch.includes("commercial_logistics")) { // This ID might need to match your new research tree
        const researchTopic = getResearchTopicById("commercial_logistics");
        if (researchTopic && researchTopic.globalBuff && researchTopic.globalBuff.type === "property_rps_boost" && researchTopic.globalBuff.scope === "commercial") {
            commercialPropertyBuffPercentage += researchTopic.globalBuff.percentage;
        }
    }
    // Add more buff checks as needed

    ownedProperties.forEach(propInst => {
        let effectiveRPS = propInst.currentRPS;
        const propTypeDetails = getPropertyTypeById(propInst.typeId);
        if (propTypeDetails) {
            if (cheapPropertyBuffPercentage > 0 && propTypeDetails.category === "cheap") {
                 effectiveRPS *= (1 + cheapPropertyBuffPercentage);
            }
            if (commercialPropertyBuffPercentage > 0 && propTypeDetails.category === "commercial") {
                 effectiveRPS *= (1 + commercialPropertyBuffPercentage);
            }
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
        const upgradeCost = Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, propertyInstance.mainLevel -1));
        if (gameState.cash >= upgradeCost) {
            gameState.cash -= upgradeCost;
            propertyInstance.mainLevel++;
            propertyInstance.currentRPS = calculateInstanceRPS(propertyInstance, propertyType);
            updateGameData(); // This will refresh the portfolio view, including the open upgrade detail
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
    if (upgradeDef.requiresResearch && !gameState.unlockedResearch.includes(upgradeDef.requiresResearch)) {
        const researchDef = getResearchTopicById(upgradeDef.requiresResearch);
        console.log(`[GAME] Cannot apply ${upgradeDef.name}: Requires research "${researchDef ? researchDef.name : upgradeDef.requiresResearch}".`); return;
    }
    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.5, currentTier));
    const materialsNeededBase = upgradeDef.requiresMaterials ? Math.floor(upgradeDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;
    let materialUsageEfficiency = 1;
    if (gameState.unlockedResearch.includes("advanced_material_processing")) {
        const buffResearch = getResearchTopicById("advanced_material_processing");
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
    updateGameData(); // This will refresh the portfolio view
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
                for (let i = 0; i < tier; i++) {
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.5, i)) * 0.25;
                }
            }
        }
    }
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < propertyInstance.mainLevel -1; i++){
        mainLevelUpgradeValue += Math.floor(propertyInstance.purchaseCost * 0.3 * Math.pow(1.8, i)) * 0.25;
    }
    const sellPrice = Math.floor(propertyInstance.purchaseCost * 0.5 + upgradeValue + mainLevelUpgradeValue);
    const materialsReturned = Math.floor((propertyType.materialsCost || 0) * 0.25);
    gameState.cash += sellPrice;
    if (materialsReturned > 0) {
        gameState.buildingMaterials += materialsReturned;
    }
    ownedProperties.splice(propertyIndex, 1);
    updateGameData();
    console.log(`[GAME] Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}` + (materialsReturned > 0 ? ` and recovered ${materialsReturned} materials.` : '.'));
}
