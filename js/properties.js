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
        category: "cheap", // For buffs
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

function calculateDynamicPropertyCost(propertyType) {
    const ownedCount = ownedProperties.filter(p => p.typeId === propertyType.id).length;
    let currentCost = propertyType.baseCost * Math.pow(1.15, ownedCount);

    // Apply global property cost reduction from research
    if (gameState.unlockedResearch.includes("basic_construction_techniques")) {
        const buff = getResearchTopicById("basic_construction_techniques").globalBuff;
        if (buff && buff.type === "property_cost_reduction") {
            currentCost *= (1 - buff.percentage);
        }
    }
    return Math.floor(currentCost);
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
            mainLevel: 1,
            purchaseCost: currentCost,
            appliedUpgrades: {},
            baseRPS: propertyType.baseRPS, // Store base RPS of the type
            currentRPS: 0 // Will be calculated
        };
        // Calculate initial RPS after it's added to the array if needed for some logic, or just here
        newProperty.currentRPS = calculateInstanceRPS(newProperty, propertyType);
        ownedProperties.push(newProperty); // Add to list *after* initial calculation if it depends on existing props

        updateGameData();
        logMessage(`Purchased ${propertyType.name} for $${currentCost.toLocaleString()}.`, "success");
        return true;
    } else {
        logMessage(`Not enough cash to buy ${propertyType.name}. Need $${currentCost.toLocaleString()}.`, "error");
        return false;
    }
}

function calculateInstanceRPS(propertyInstance, propertyType) {
    let rpsFromUpgrades = 0;
    if (propertyType.upgrades) {
        for (const upgradeId in propertyInstance.appliedUpgrades) {
            const upgradeTier = propertyInstance.appliedUpgrades[upgradeId];
            const upgradeDef = propertyType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                rpsFromUpgrades += (upgradeDef.rpsBoost * upgradeTier);
            }
        }
    }
    const mainLevelMultiplier = 1 + (propertyInstance.mainLevel - 1) * 0.1;
    // Base RPS for this instance is from its type
    return parseFloat(((propertyInstance.baseRPS + rpsFromUpgrades) * mainLevelMultiplier).toFixed(2));
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
        const researchDef = getResearchTopicById(upgradeDef.requiresResearch); // Assuming getResearchTopicById is in facilities.js and global
        logMessage(`Cannot apply ${upgradeDef.name}: Requires research "${researchDef ? researchDef.name : upgradeDef.requiresResearch}".`, "error");
        return;
    }

    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.5, currentTier));
    const materialsNeededBase = upgradeDef.requiresMaterials ? Math.floor(upgradeDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;

    let materialUsageEfficiency = 1;
    if (gameState.unlockedResearch.includes("advanced_material_processing")) {
        const buffResearch = getResearchTopicById("advanced_material_processing"); // from facilities.js
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

// THIS IS THE FUNCTION main.js IS LOOKING FOR
function calculateTotalPropertiesRPS() {
    let totalRPS = 0;

    // Calculate combined workshop buff percentage first
    let cheapPropertyBuffPercentage = 0;
    ownedFacilities.forEach(facInst => { // facInst, not fac
        const facType = getFacilityTypeById(facInst.typeId); // facInst.typeId
        if (facType && facType.id === "basic_workshop" && facType.effects) {
            const effectDef = facType.effects.find(e => e.type === "property_rps_boost" && e.propertyCategory === "cheap");
            if (effectDef) {
                let currentEffectPercentage = effectDef.percentage; // Base effect
                // Check for workshop's own upgrades that enhance this buff
                const upgradeToolDef = facType.upgrades.find(u => u.id === "better_tools");
                if (upgradeToolDef && facInst.appliedUpgrades && facInst.appliedUpgrades[upgradeToolDef.id]) {
                    currentEffectPercentage += (upgradeToolDef.effect.rpsBoostIncrease * facInst.appliedUpgrades[upgradeToolDef.id]);
                }
                cheapPropertyBuffPercentage += currentEffectPercentage;
            }
        }
    });

    ownedProperties.forEach(propInst => {
        let effectiveRPS = propInst.currentRPS; // This is the already calculated RPS for the instance (base + specific upgrades + main level)
        const propTypeDetails = getPropertyTypeById(propInst.typeId);

        if (propTypeDetails) {
            // Apply global RPS buffs from research (e.g., commercial logistics)
            if (gameState.unlockedResearch.includes("commercial_logistics") && propTypeDetails.category === "commercial") {
                const buffResearch = getResearchTopicById("commercial_logistics"); // from facilities.js
                if (buffResearch && buffResearch.globalBuff && buffResearch.globalBuff.type === "property_rps_boost" && buffResearch.globalBuff.scope === "commercial") {
                    effectiveRPS *= (1 + buffResearch.globalBuff.percentage);
                }
            }

            // Apply workshop buff if property is "cheap" and buff exists
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

    gameState.cash += sellPrice;
    ownedProperties.splice(propertyIndex, 1);

    updateGameData();
    logMessage(`Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}.`, "info");
}
