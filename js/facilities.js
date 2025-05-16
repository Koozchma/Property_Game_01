// Metropolis Estates - facilities.js

const FACILITY_TYPES = [
    {
        id: "lumber_mill",
        name: "Lumber Mill",
        cost: 5000,
        baseUpkeepRPS: 10,
        description: "Processes logs into usable Building Materials (Wood).",
        output: { resource: "buildingMaterials", amount: 0.2 }, // 0.2 per game tick (second)
        mainLevelMax: 5,
        upgrades: [ // Specific upgrades for facilities
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 2 }, maxTier: 2, requiresMaterials: 50 }
        ],
        requiredResearch: null // Available from start
    },
    {
        id: "basic_workshop",
        name: "Basic Workshop",
        cost: 15000,
        baseUpkeepRPS: 25,
        description: "Allows crafting of more advanced components (future use). Currently provides a small global RPS boost to cheap properties.",
        effects: [ // Global effects can be handled by checking owned facilities
            { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 } // e.g. Shack, Small Apartment
        ],
        mainLevelMax: 3,
        upgrades: [
            { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 } // increases the 'percentage' above
        ],
        requiredResearch: "basic_construction_techniques"
    },
    {
        id: "small_science_lab",
        name: "Small Science Lab",
        cost: 25000,
        baseUpkeepRPS: 50,
        description: "Generates Research Points (RP) to unlock new technologies.",
        output: { resource: "researchPoints", amount: 0.1 }, // 0.1 RP per game tick
        mainLevelMax: 5,
        upgrades: [
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 0 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 10}, maxTier: 1, requiresMaterials: 0 }
        ],
        requiredResearch: "basic_education" // This facility itself is unlocked by this research
    }
];

const RESEARCH_TOPICS = [
    {
        id: "basic_education",
        name: "Basic Education",
        costRP: 10,
        description: "Fundamental knowledge paving the way for scientific endeavors. Unlocks the Small Science Lab.",
        unlocksFacilityType: ["small_science_lab"], // Facility types to make available for purchase
        unlocksPropertyType: [],
        globalBuff: null,
        requiredLabs: 0 // No specific lab needed to research this, just RP
    },
    {
        id: "basic_construction_techniques",
        name: "Basic Construction",
        costRP: 25,
        description: "Improves building methods. Unlocks Basic Workshops and enables some property upgrades.",
        unlocksFacilityType: ["basic_workshop"],
        unlocksPropertyType: [], // Could unlock a new property type here
        globalBuff: { type: "property_cost_reduction", percentage: 0.05, scope: "all" },
        requiredLabs: 1 // Requires at least one Small Science Lab to be owned
    },
    {
        id: "commercial_logistics",
        name: "Commercial Logistics",
        costRP: 50,
        description: "Improves efficiency of commercial operations. Boosts RPS for commercial properties.",
        unlocksFacilityType: [],
        unlocksPropertyType: [],
        globalBuff: { type: "property_rps_boost", percentage: 0.05, scope: "commercial" }, // e.g., Corner Store
        requiredLabs: 1
    },
    {
        id: "advanced_material_processing",
        name: "Adv. Material Processing",
        costRP: 75,
        description: "Allows more efficient use of building materials and unlocks advanced facility upgrades.",
        unlocksFacilityType: [],
        unlocksPropertyType: [],
        globalBuff: { type: "material_usage_efficiency", percentage: 0.10 }, // 10% less materials for upgrades
        requiredLabs: 2
    }
];


let ownedFacilities = [];
let nextFacilityId = 0;

function getFacilityTypeById(id) {
    return FACILITY_TYPES.find(fac => fac.id === id);
}
function getResearchTopicById(id) {
    return RESEARCH_TOPICS.find(res => res.id === id);
}

function calculateFacilityDynamicCost(facilityType) {
    const ownedCount = ownedFacilities.filter(f => f.typeId === facilityType.id).length;
    return Math.floor(facilityType.cost * Math.pow(1.20, ownedCount)); // 20% increase per facility
}

function isFacilityTypeUnlocked(facilityTypeId) {
    const facilityType = getFacilityTypeById(facilityTypeId);
    if (!facilityType) return false;

    // Check if this facility type is directly unlocked by a completed research topic
    for (const researchId of gameState.unlockedResearch) {
        const researchTopic = getResearchTopicById(researchId);
        if (researchTopic && researchTopic.unlocksFacilityType && researchTopic.unlocksFacilityType.includes(facilityTypeId)) {
            return true;
        }
    }
    // If it's not unlocked by any research, it must be available if it has no specific research requirement itself
    return !facilityType.requiredResearch;
}


function buyFacility(facilityTypeId) {
    const facilityType = getFacilityTypeById(facilityTypeId);
    if (!facilityType) {
        logMessage("Error: Facility type not found.", "error");
        return false;
    }

    // Check if the facility type itself is unlocked (e.g. Small Science Lab via Basic Education)
    if (!isFacilityTypeUnlocked(facilityType.id) && facilityType.requiredResearch) {
         logMessage(`Cannot build ${facilityType.name}: Its type is not yet unlocked through research. Look for research that unlocks "${facilityType.name}".`, "error");
        return false;
    }
     // A secondary check, mostly for facilities that aren't unlocked by a specific "unlocksFacilityType" research item but have a direct `requiredResearch` field.
    if (facilityType.requiredResearch && !gameState.unlockedResearch.includes(facilityType.requiredResearch)) {
        const reqResearch = getResearchTopicById(facilityType.requiredResearch);
        logMessage(`Cannot build ${facilityType.name}: Requires research "${reqResearch ? reqResearch.name : facilityType.requiredResearch}".`, "error");
        return false;
    }


    const currentCost = calculateFacilityDynamicCost(facilityType);

    if (gameState.cash >= currentCost) {
        gameState.cash -= currentCost;

        const newFacility = {
            uniqueId: nextFacilityId++,
            typeId: facilityType.id,
            name: facilityType.name,
            mainLevel: 1,
            baseUpkeepRPS: facilityType.baseUpkeepRPS, // Store base for reference
            baseOutputAmount: facilityType.output ? facilityType.output.amount : 0, // Store base for reference
            currentUpkeepRPS: facilityType.baseUpkeepRPS,
            currentOutput: facilityType.output ? { resource: facilityType.output.resource, amount: facilityType.output.amount } : null,
            appliedUpgrades: {}
        };
        calculateFacilityStats(newFacility, facilityType); // Calculate initial stats
        ownedFacilities.push(newFacility);

        updateGameData(); // This will recalculate total upkeep and update UI

        // Show resource displays if they are now relevant
        if (newFacility.currentOutput) {
            if (newFacility.currentOutput.resource === 'researchPoints') {
                document.getElementById('research-points-display').style.display = 'inline-block';
                document.getElementById('research-section').style.display = 'block';
            }
            if (newFacility.currentOutput.resource === 'buildingMaterials') {
                document.getElementById('building-materials-display').style.display = 'inline-block';
            }
        }
        document.getElementById('total-upkeep-display').style.display = 'inline-block';

        logMessage(`Built ${facilityType.name} for $${currentCost.toLocaleString()}. Upkeep: $${newFacility.currentUpkeepRPS.toLocaleString()}/s.`, "success");
        return true;
    } else {
        logMessage(`Not enough cash to build ${facilityType.name}. Need $${currentCost.toLocaleString()}.`, "error");
        return false;
    }
}

function calculateFacilityStats(facilityInstance, facilityType) {
    let upkeep = facilityInstance.baseUpkeepRPS;
    let outputAmount = facilityInstance.baseOutputAmount;

    // Apply specific upgrade effects
    for (const upgradeId in facilityInstance.appliedUpgrades) {
        const tier = facilityInstance.appliedUpgrades[upgradeId];
        const upgradeDef = facilityType.upgrades.find(u => u.id === upgradeId);
        if (upgradeDef && upgradeDef.effect) {
            for (let i = 0; i < tier; i++) {
                if (upgradeDef.effect.outputIncrease) {
                    outputAmount += upgradeDef.effect.outputIncrease;
                }
                if (upgradeDef.effect.upkeepReduction) {
                    upkeep -= upgradeDef.effect.upkeepReduction;
                }
                // Handle other potential effects like rpsBoostIncrease for workshop-like facilities
                 if (upgradeDef.effect.rpsBoostIncrease && facilityType.effects) {
                    const mainEffect = facilityType.effects.find(e => e.type === "property_rps_boost");
                    if (mainEffect) {
                        // This is tricky. The effect itself is stored on the facilityType.
                        // We might need a currentEffectPercentage on the facilityInstance.
                        // For now, this upgrade implies the base effect gets stronger.
                        // Actual application of this buff happens in calculateTotalPropertiesRPS
                    }
                }
            }
        }
    }

    // Apply main level effects
    const mainLevelOutputMultiplier = 1 + (facilityInstance.mainLevel - 1) * 0.10; // 10% output boost per level
    const mainLevelUpkeepMultiplier = 1 - (facilityInstance.mainLevel - 1) * 0.05; // 5% upkeep reduction per level

    outputAmount *= mainLevelOutputMultiplier;
    upkeep *= mainLevelUpkeepMultiplier;

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityInstance.currentOutput && facilityType.output) {
        facilityInstance.currentOutput.amount = parseFloat(outputAmount.toFixed(3));
    } else if (facilityType.output) { // If currentOutput doesn't exist but facilityType.output does, create it
         facilityInstance.currentOutput = { resource: facilityType.output.resource, amount: parseFloat(outputAmount.toFixed(3)) };
    }
}


function upgradeFacilityMainLevel(facilityUniqueId) {
    const facilityInstance = ownedFacilities.find(f => f.uniqueId === facilityUniqueId);
    if (!facilityInstance) return;
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    if (!facilityType) return;

    if (facilityInstance.mainLevel < facilityType.mainLevelMax) {
        const upgradeCost = Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, facilityInstance.mainLevel - 1));
        if (gameState.cash >= upgradeCost) {
            gameState.cash -= upgradeCost;
            facilityInstance.mainLevel++;
            calculateFacilityStats(facilityInstance, facilityType);
            updateGameData();
            logMessage(`${facilityInstance.name} main level upgraded to ${facilityInstance.mainLevel}. Cost: $${upgradeCost.toLocaleString()}.`, "success");
        } else {
            logMessage(`Not enough cash for ${facilityInstance.name} main level upgrade. Need $${upgradeCost.toLocaleString()}.`, "error");
        }
    } else {
        logMessage(`${facilityInstance.name} is at max main level.`, "info");
    }
}

function applySpecificFacilityUpgrade(facilityUniqueId, specificUpgradeId) {
    const facilityInstance = ownedFacilities.find(f => f.uniqueId === facilityUniqueId);
    if (!facilityInstance) return;
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    if (!facilityType || !facilityType.upgrades) return;

    const upgradeDef = facilityType.upgrades.find(u => u.id === specificUpgradeId);
    if (!upgradeDef) return;

    const currentTier = facilityInstance.appliedUpgrades[specificUpgradeId] || 0;
    if (currentTier >= upgradeDef.maxTier) {
        logMessage(`${upgradeDef.name} is already at max tier for ${facilityInstance.name}.`, "info");
        return;
    }

    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.6, currentTier));
    const materialsNeeded = upgradeDef.requiresMaterials ? Math.floor(upgradeDef.requiresMaterials * Math.pow(1.2, currentTier)) : 0;

    let materialUsageEfficiency = 1;
    if (gameState.unlockedResearch.includes("advanced_material_processing")) {
        const buff = getResearchTopicById("advanced_material_processing").globalBuff;
        if (buff && buff.type === "material_usage_efficiency") {
            materialUsageEfficiency = 1 - buff.percentage;
        }
    }
    const actualMaterialsNeeded = Math.floor(materialsNeeded * materialUsageEfficiency);


    if (gameState.cash < costForNextTier) {
        logMessage(`Not enough cash for ${upgradeDef.name} on ${facilityInstance.name}. Need $${costForNextTier.toLocaleString()}.`, "error");
        return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        logMessage(`Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded} (You have ${gameState.buildingMaterials}). Efficiency bonus applied if researched.`, "error");
        return;
    }


    gameState.cash -= costForNextTier;
    if (actualMaterialsNeeded > 0) gameState.buildingMaterials -= actualMaterialsNeeded;

    facilityInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    calculateFacilityStats(facilityInstance, facilityType);
    updateGameData();
    logMessage(`${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${facilityInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (actualMaterialsNeeded > 0 ? `, ${actualMaterialsNeeded} materials.` : '.'), "success");
}


function calculateTotalFacilityUpkeep() {
    return ownedFacilities.reduce((sum, fac) => sum + fac.currentUpkeepRPS, 0);
}

function applyFacilityOutputs() {
    ownedFacilities.forEach(fac => {
        if (fac.currentOutput && fac.currentOutput.amount > 0) {
            const resource = fac.currentOutput.resource;
            const amount = fac.currentOutput.amount;
            if (gameState.hasOwnProperty(resource)) {
                gameState[resource] += amount;
            } else {
                gameState[resource] = amount;
            }
        }
    });
}

function sellFacilityInstance(facilityUniqueId) {
    const facilityIndex = ownedFacilities.findIndex(f => f.uniqueId === facilityUniqueId);
    if (facilityIndex === -1) return;

    const facilityInstance = ownedFacilities[facilityIndex];
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    let upgradeValue = 0;
     if (facilityType && facilityType.upgrades) {
        for (const upgradeId in facilityInstance.appliedUpgrades) {
            const tier = facilityInstance.appliedUpgrades[upgradeId];
            const upgradeDef = facilityType.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                for (let i = 0; i < tier; i++) {
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.6, i)) * 0.25; // Get back 25% of specific upgrade costs
                }
            }
        }
    }
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < facilityInstance.mainLevel -1; i++){
        mainLevelUpgradeValue += Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, i)) * 0.25;
    }
    const sellPrice = Math.floor(facilityType.cost * 0.5 + upgradeValue + mainLevelUpgradeValue);


    gameState.cash += sellPrice;
    ownedFacilities.splice(facilityIndex, 1);

    updateGameData();
    logMessage(`Demolished ${facilityInstance.name} for $${sellPrice.toLocaleString()}.`, "info");
}

function completeResearch(researchId) {
    const research = RESEARCH_TOPICS.find(r => r.id === researchId);
    if (!research) {
        logMessage(`Research topic ID "${researchId}" not found.`, "error");
        return false;
    }
    if (gameState.unlockedResearch.includes(researchId)) {
        logMessage(`Research "${research.name}" already completed.`, "info");
        return false;
    }

    const requiredLabsCount = research.requiredLabs || 0;
    const ownedScienceLabs = ownedFacilities.filter(f => getFacilityTypeById(f.typeId)?.output?.resource === 'researchPoints').length;

    if (ownedScienceLabs < requiredLabsCount) {
        logMessage(`Cannot research "${research.name}": Requires ${requiredLabsCount} Science Lab(s) (You have ${ownedScienceLabs}).`, "error");
        return false;
    }


    if (gameState.researchPoints >= research.costRP) {
        gameState.researchPoints -= research.costRP;
        gameState.unlockedResearch.push(researchId);

        let unlockMessages = [];
        if (research.unlocksFacilityType && research.unlocksFacilityType.length > 0) {
            research.unlocksFacilityType.forEach(facId => {
                const facType = getFacilityTypeById(facId);
                if (facType) unlockMessages.push(`facility type "${facType.name}"`);
            });
        }
        if (research.unlocksPropertyType && research.unlocksPropertyType.length > 0) {
            research.unlocksPropertyType.forEach(propId => {
                 const propType = getPropertyTypeById(propId);
                if (propType) unlockMessages.push(`property type "${propType.name}"`);
            });
        }
        if (research.globalBuff) {
            // Active buffs are applied dynamically where needed (e.g. cost calculation, RPS calculation)
            // No need to store in gameState.activeBuffs unless for very specific stateful buffs
            unlockMessages.push(`global buff: ${research.globalBuff.type} (${research.globalBuff.percentage*100}%)`);
        }

        let message = `Research "${research.name}" completed!`;
        if (unlockMessages.length > 0) {
            message += " Unlocked: " + unlockMessages.join(', ') + ".";
        }
        logMessage(message, "science");

        updateGameData();
        return true;
    } else {
        logMessage(`Not enough Research Points for "${research.name}". Need ${research.costRP} RP (You have ${gameState.researchPoints.toFixed(1)} RP).`, "error");
        return false;
    }
}
