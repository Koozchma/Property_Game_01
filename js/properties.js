// Metropolis Estates - properties.js

// --- Property Definitions ---
const PROPERTY_TYPES = [
    {
        id: "shack",
        name: "Dilapidated Shack",
        baseCost: 50,
        baseRPS: 0.5,
        mainLevelMax: 3,
        description: "It's a roof, mostly. Generates minimal rent.",
        category: "cheap",
        materialsCost: 0, // Shack costs no materials
        requiredResearch: null, // Available from start
        upgrades: [
            { id: "patch_roof", name: "Patch Roof", cost: 20, rpsBoost: 0.2, maxTier: 1, requiresMaterials: 5, requiresResearch: null },
            { id: "board_windows", name: "Board Windows", cost: 30, rpsBoost: 0.3, maxTier: 1, requiresMaterials: 8, requiresResearch: null },
            { id: "basic_plumbing", name: "Basic Plumbing", cost: 75, rpsBoost: 0.5, maxTier: 1, requiresMaterials: 15, requiresResearch: "basic_construction_techniques" }
        ]
    },
    {
        id: "small_apartment",
        name: "Small Apartment Unit",
        baseCost: 250,
        baseRPS: 3,
        mainLevelMax: 5,
        description: "A basic living unit. A steady, small earner.",
        category: "cheap",
        materialsCost: 20,
        requiredResearch: "urban_planning_1", // Example: Locked by initial urban planning research
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
        baseRPS: 7,
        mainLevelMax: 5,
        description: "Mobile, but not going anywhere. Decent income.",
        category: "residential",
        materialsCost: 35,
        requiredResearch: "urban_planning_1",
        upgrades: [
            { id: "skirting", name: "Add Skirting", cost: 250, rpsBoost: 1.5, maxTier: 1, requiresMaterials: 30 },
            { id: "insulation", name: "Insulation", cost: 400, rpsBoost: 2.5, maxTier: 2, requiresMaterials: 40 },
        ]
    },
    {
        id: "suburban_house",
        name: "Suburban House",
        baseCost: 1500,
        baseRPS: 15,
        mainLevelMax: 7,
        description: "The classic family home. Reliable returns.",
        category: "residential",
        materialsCost: 75,
        requiredResearch: "urban_planning_2", // Locked further
        upgrades: [
            { id: "landscaping", name: "Landscaping", cost: 500, rpsBoost: 3, maxTier: 2, requiresMaterials: 50 },
            { id: "kitchen_reno", name: "Kitchen Reno", cost: 1000, rpsBoost: 5, maxTier: 1, requiresMaterials: 80, requiresResearch: "basic_construction_techniques" },
            { id: "add_garage", name: "Add Garage", cost: 1200, rpsBoost: 4, maxTier: 1, requiresMaterials: 100 }
        ]
    },
    {
        id: "corner_store",
        name: "Small Corner Store",
        baseCost: 3500,
        baseRPS: 30,
        mainLevelMax: 6,
        description: "Sells essentials to the neighborhood. Good cash flow.",
        category: "commercial",
        materialsCost: 120,
        requiredResearch: "commercial_development_1",
        upgrades: [
            { id: "shelf_stocking", name: "Better Shelves", cost: 800, rpsBoost: 5, maxTier: 3, requiresMaterials: 60 },
            { id: "refrigeration", name: "New Coolers", cost: 1500, rpsBoost: 8, maxTier: 2, requiresMaterials: 90, requiresResearch: "commercial_logistics" },
        ]
    }
];

let ownedProperties = [];
let nextPropertyId = 0;

function getPropertyTypeById(id) {
    return PROPERTY_TYPES.find(prop => prop.id === id);
}

// Cost of properties is now flat (monetary wise)
function calculateDynamicPropertyCost(propertyType) {
    let currentCost = propertyType.baseCost;
    // Apply global property cost reduction from research
    if (gameState.unlockedResearch.includes("basic_construction_techniques")) {
        const buffResearch = getResearchTopicById("basic_construction_techniques"); // from facilities.js
        if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "property_cost_reduction") {
            currentCost *= (1 - buffResearch.globalBuff.percentage);
        }
    }
    return Math.floor(currentCost);
}

function isPropertyTypeUnlocked(propertyTypeId) {
    const propType = getPropertyTypeById(propertyTypeId);
    if (!propType) return false;
    if (!propType.requiredResearch) return true; // No research needed, always unlocked

    // Check if this property type is directly unlocked by any completed research topic
    for (const researchId of gameState.unlockedResearch) {
        const researchTopic = getResearchTopicById(researchId); // from facilities.js
        if (researchTopic && researchTopic.unlocksPropertyType && researchTopic.unlocksPropertyType.includes(propertyTypeId)) {
            return true;
        }
    }
    // Fallback: Check direct requiredResearch field (though unlocksPropertyType in research is preferred)
    return gameState.unlockedResearch.includes(propType.requiredResearch);
}


function buyProperty(propertyTypeId) {
    const propertyType = getPropertyTypeById(propertyTypeId);
    if (!propertyType) {
        logMessage("Error: Property type not found.", "error");
        return false;
    }

    if (!isPropertyTypeUnlocked(propertyTypeId)) {
        const requiredResearchId = propertyType.requiredResearch;
        const researchTopic = getResearchTopicById(requiredResearchId);
        logMessage(`Cannot buy ${propertyType.name}: Requires research "${researchTopic ? researchTopic.name : requiredResearchId}".`, "error");
        return false;
    }

    const currentMonetaryCost = calculateDynamicPropertyCost(propertyType); // Monetary cost
    const materialsNeeded = propertyType.materialsCost || 0;

    if (gameState.cash < currentMonetaryCost) {
        logMessage(`Not enough cash to buy ${propertyType.name}. Need $${currentMonetaryCost.toLocaleString()}.`, "error");
        return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        logMessage(`Not enough materials to buy ${propertyType.name}. Need ${materialsNeeded} materials (You have ${Math.floor(gameState.buildingMaterials)}).`, "error");
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
        appliedUpgrades: {},
        baseRPS: propertyType.baseRPS,
        currentRPS: 0
    };
    newProperty.currentRPS = calculateInstanceRPS(newProperty, propertyType);
    ownedProperties.push(newProperty);

    updateGameData();
    logMessage(`Purchased ${propertyType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'), "success");
    return true;
}

function calculateInstanceRPS(propertyInstance, propertyType) {
    let rpsFromUpgrades = 0;
    if (propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const upgradeTier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef && typeof upgradeDef.rpsBoost === 'number') {
                rpsFromUpgrades += (upgradeDef.rpsBoost * upgradeTier);
            }
        }
    }
    const mainLevelMultiplier = 1 + (propertyInstance.mainLevel - 1) * 0.1;
    return parseFloat(((propertyInstance.baseRPS + rpsFromUpgrades) * mainLevelMultiplier).toFixed(2));
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

    if (upgradeDef.requiresResearch && !gameState.unlockedResearch.includes(upgradeDef.requiresResearch)) {
        const researchDef = getResearchTopicById(upgradeDef.requiresResearch);
        logMessage(`Cannot apply ${upgradeDef.name}: Requires research "${researchDef ? researchDef.name : upgradeDef.requiresResearch}".`, "error");
        return;
    }

    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.5, currentTier)); // Monetary cost
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
        logMessage(`Not enough cash for ${upgradeDef.name}. Need $${costForNextTier.toLocaleString()}.`, "error");
        return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        logMessage(`Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}). Efficiency bonus applied if researched.`, "error");
        return;
    }

    gameState.cash -= costForNextTier;
    if (actualMaterialsNeeded > 0) gameState.buildingMaterials -= actualMaterialsNeeded;

    propertyInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    propertyInstance.currentRPS = calculateInstanceRPS(propertyInstance, propertyType);

    updateGameData();
    logMessage(`${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${propertyInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (actualMaterialsNeeded > 0 ? `, ${actualMaterialsNeeded} materials.` : '.'), "success");
}

function calculateTotalPropertiesRPS() {
    let totalRPS = 0;
    let cheapPropertyBuffPercentage = 0;

    // Calculate combined workshop buff percentage
    ownedFacilities.forEach(facInst => {
        const facType = getFacilityTypeById(facInst.typeId);
        if (facType && facType.id === "basic_workshop" && facType.effects) {
            const effectDef = facType.effects.find(e => e.type === "property_rps_boost" && e.propertyCategory === "cheap");
            if (effectDef) {
                let currentEffectPercentage = effectDef.percentage;
                const upgradeToolDef = facType.upgrades.find(u => u.id === "better_tools");
                if (upgradeToolDef && facInst.appliedUpgrades && facInst.appliedUpgrades[upgradeToolDef.id] && upgradeToolDef.effect.rpsBoostIncrease) {
                     currentEffectPercentage += (upgradeToolDef.effect.rpsBoostIncrease * facInst.appliedUpgrades[upgradeToolDef.id]);
                }
                cheapPropertyBuffPercentage += currentEffectPercentage;
            }
        }
    });

    ownedProperties.forEach(propInst => {
        let effectiveRPS = propInst.currentRPS;
        const propTypeDetails = getPropertyTypeById(propInst.typeId);

        if (propTypeDetails) {
            if (gameState.unlockedResearch.includes("commercial_logistics") && propTypeDetails.category === "commercial") {
                const buffResearch = getResearchTopicById("commercial_logistics");
                if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "property_rps_boost" && buffResearch.globalBuff.scope === "commercial") {
                    effectiveRPS *= (1 + buffResearch.globalBuff.percentage);
                }
            }
            if (cheapPropertyBuffPercentage > 0 && propTypeDetails.category === "cheap") {
                 effectiveRPS *= (1 + cheapPropertyBuffPercentage);
            }
        }
        totalRPS += effectiveRPS;
    });
    return parseFloat(totalRPS.toFixed(2));
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
    const materialsReturned = Math.floor((propertyType.materialsCost || 0) * 0.25); // Return 25% of base material cost

    gameState.cash += sellPrice;
    if (materialsReturned > 0) {
        gameState.buildingMaterials += materialsReturned;
    }
    ownedProperties.splice(propertyIndex, 1);

    updateGameData();
    logMessage(`Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}` + (materialsReturned > 0 ? ` and recovered ${materialsReturned} materials.` : '.'), "info");
}
