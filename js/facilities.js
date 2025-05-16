// Metropolis Estates - facilities.js

const FACILITY_TYPES = [
    {
        id: "lumber_mill",
        name: "Lumber Mill",
        cost: 300, 
        materialsCost: 0, 
        baseUpkeepRPS: 0.25, 
        description: "Processes logs into usable Building Materials.",
        output: { resource: "buildingMaterials", amount: 0.5 }, 
        mainLevelMax: 5,
        upgrades: [
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 0.05 }, maxTier: 2, requiresMaterials: 50 }
        ],
        requiredResearch: null
    },
    {
        id: "basic_workshop",
        name: "Basic Workshop",
        cost: 7500, 
        materialsCost: 40, 
        baseUpkeepRPS: 20, 
        description: "Provides RPS boost to cheap properties and enables advanced construction research.",
        effects: [ { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 } ],
        mainLevelMax: 3,
        upgrades: [
            { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 }
        ],
        requiredResearch: "basic_construction_techniques"
    },
    {
        id: "small_science_lab",
        name: "Small Science Lab",
        cost: 15000, 
        materialsCost: 75,  
        baseUpkeepRPS: 40, 
        description: "Generates Research Points (RP) to unlock new technologies.",
        output: { resource: "researchPoints", amount: 0.1 },
        mainLevelMax: 5,
        upgrades: [
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 0 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 10}, maxTier: 1, requiresMaterials: 0 }
        ],
        requiredResearch: "basic_education"
    },
    {
        id: "advanced_science_lab",
        name: "Advanced Science Lab",
        cost: 100000,
        materialsCost: 300,
        baseUpkeepRPS: 150,
        description: "Generates more RP and allows for cutting-edge research.",
        output: { resource: "researchPoints", amount: 0.5 },
        mainLevelMax: 5,
        upgrades: [
            { id: "supercomputer_access", name: "Supercomputer", cost: 50000, effect: { outputIncrease: 0.2 }, maxTier: 2, requiresMaterials: 50 }
        ],
        requiredResearch: "scientific_method_2"
    }
];

const RESEARCH_TOPICS = [
    // TIER 0 - Initial
    {
        id: "basic_education",
        name: "Basic Education",
        cost: 300,             // Monetary cost
        materialsCost: 100,    // Material cost
        // requiredLabs removed
        description: "Fundamental knowledge. Unlocks Small Science Labs. Costs $300 & 100 Materials.",
        prerequisites: [],
        unlocksFacilityType: ["small_science_lab"],
        unlocksResearch: ["urban_planning_1", "basic_construction_techniques", "scientific_method_1"]
    },
    // TIER 1 - Unlocked by Basic Education
    {
        id: "urban_planning_1", // This is the research for the first rental unlock after Shack
        name: "Unlock Basic Rentals",
        costRP: 300, // <<< SET TO 300 RP as requested
        // requiredLabs removed
        description: "Learn to build basic new rental types like apartments and trailer homes. Costs 300 RP.",
        prerequisites: ["basic_education"], // Requires basic education first
        unlocksPropertyType: ["small_apartment", "trailer_home"], // Properties unlocked by this
        unlocksResearch: ["urban_planning_2", "commercial_development_1"] // Next research this enables
    },
    {
        id: "basic_construction_techniques",
        name: "Basic Construction",
        costRP: 25,
        // requiredLabs removed
        description: "Improves building methods. Unlocks Basic Workshops. Reduces property monetary costs.",
        prerequisites: ["basic_education"],
        unlocksFacilityType: ["basic_workshop"],
        globalBuff: { type: "property_cost_reduction", percentage: 0.05, scope: "all" },
        unlocksResearch: ["advanced_material_processing"]
    },
    {
        id: "scientific_method_1",
        name: "Scientific Method I",
        costRP: 30,
        // requiredLabs removed
        description: "Improves research efficiency slightly.",
        prerequisites: ["basic_education"],
        globalBuff: { type: "research_speed_boost", percentage: 0.05 },
        unlocksResearch: ["scientific_method_2", "commercial_logistics"]
    },
    // TIER 2 - Branching out
    {
        id: "urban_planning_2",
        name: "Urban Planning II",
        costRP: 150, 
        // requiredLabs removed
        description: "Unlocks Suburban Houses.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["suburban_house"],
        unlocksResearch: ["urban_planning_3"] 
    },
    // ... (rest of your RESEARCH_TOPICS array, ensuring 'requiredLabs' is removed from all) ...
    // Example for a next tier of property unlocks
    {
        id: "urban_planning_3",
        name: "Urban Planning III",
        costRP: 250, 
        // requiredLabs removed
        description: "Unlocks more advanced residential options.",
        prerequisites: ["urban_planning_2"],
        unlocksPropertyType: [/* "luxury_condo", "another_property" */], 
        unlocksResearch: []
    }
];

let ownedFacilities = [];
let nextFacilityId = 0;

function getFacilityTypeById(id) { return FACILITY_TYPES.find(fac => fac.id === id); }
function getResearchTopicById(id) { return RESEARCH_TOPICS.find(res => res.id === id); }

function calculateFacilityDynamicCost(facilityType) { return facilityType.cost; }

function isFacilityTypeUnlocked(facilityTypeId) {
    const facType = getFacilityTypeById(facilityTypeId);
    if (!facType) return false;
    if (!facType.requiredResearch) return true;
    for (const researchId of gameState.unlockedResearch) {
        const researchTopic = getResearchTopicById(researchId);
        if (researchTopic && researchTopic.unlocksFacilityType && researchTopic.unlocksFacilityType.includes(facilityTypeId)) {
            return true;
        }
    }
    return gameState.unlockedResearch.includes(facType.requiredResearch);
}

function isResearchAvailable(researchTopicId) {
    const topic = getResearchTopicById(researchTopicId);
    if (!topic || gameState.unlockedResearch.includes(topic.id)) return false;
    for (const prereqId of topic.prerequisites) {
        if (!gameState.unlockedResearch.includes(prereqId)) return false;
    }
    return true;
}

function buyFacility(facilityTypeId) {
    const facilityType = getFacilityTypeById(facilityTypeId);
    if (!facilityType) { console.error("Buy Facility Error: Type not found - ", facilityTypeId); return false; }
    if (!isFacilityTypeUnlocked(facilityTypeId)) {
         const requiredResearchId = facilityType.requiredResearch;
         const researchTopic = getResearchTopicById(requiredResearchId);
         console.log(`[GAME] Cannot build ${facilityType.name}: Requires research "${researchTopic ? researchTopic.name : (requiredResearchId || "Unknown")}".`);
        return false;
    }
    const currentMonetaryCost = calculateFacilityDynamicCost(facilityType);
    const materialsNeeded = facilityType.materialsCost || 0;
    if (gameState.cash < currentMonetaryCost) {
        console.log(`[GAME] Not enough cash for ${facilityType.name}. Need $${currentMonetaryCost.toLocaleString()}.`); return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        console.log(`[GAME] Not enough materials for ${facilityType.name}. Need ${materialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}).`); return false;
    }
    gameState.cash -= currentMonetaryCost;
    if (materialsNeeded > 0) gameState.buildingMaterials -= materialsNeeded;
    const newFacility = {
        uniqueId: nextFacilityId++, typeId: facilityType.id, name: facilityType.name, mainLevel: 1,
        baseUpkeepRPS: facilityType.baseUpkeepRPS, baseOutputAmount: facilityType.output ? facilityType.output.amount : 0,
        currentUpkeepRPS: facilityType.baseUpkeepRPS, currentOutput: facilityType.output ? { ...facilityType.output } : null,
        appliedUpgrades: {}
    };
    calculateFacilityStats(newFacility, facilityType);
    ownedFacilities.push(newFacility);
    updateGameData();
    console.log(`[GAME] Built ${facilityType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'));
    return true;
}

function calculateFacilityStats(facilityInstance, facilityType) {
    let upkeep = facilityInstance.baseUpkeepRPS;
    let outputAmount = facilityInstance.baseOutputAmount;
    for (const upgradeId in facilityInstance.appliedUpgrades) {
        const tier = facilityInstance.appliedUpgrades[upgradeId];
        const upgradeDef = facilityType.upgrades.find(u => u.id === upgradeId);
        if (upgradeDef && upgradeDef.effect) {
            for (let i = 0; i < tier; i++) {
                if (typeof upgradeDef.effect.outputIncrease === 'number') outputAmount += upgradeDef.effect.outputIncrease;
                if (typeof upgradeDef.effect.upkeepReduction === 'number') upkeep -= upgradeDef.effect.upkeepReduction;
            }
        }
    }
    const mainLevelOutputMultiplier = 1 + (facilityInstance.mainLevel - 1) * 0.10;
    const mainLevelUpkeepMultiplier = 1 - (facilityInstance.mainLevel - 1) * 0.05;
    outputAmount *= mainLevelOutputMultiplier;
    upkeep *= mainLevelUpkeepMultiplier;
    if (facilityType.output && facilityType.output.resource === 'researchPoints') {
        let researchSpeedMultiplier = 1;
        if(gameState.unlockedResearch.includes("scientific_method_1")) {
            const buff1 = getResearchTopicById("scientific_method_1")?.globalBuff;
            if(buff1 && buff1.type === "research_speed_boost") researchSpeedMultiplier += buff1.percentage;
        }
        if(gameState.unlockedResearch.includes("scientific_method_2")) {
            const buff2 = getResearchTopicById("scientific_method_2")?.globalBuff;
            if(buff2 && buff2.type === "research_speed_boost") researchSpeedMultiplier += buff2.percentage;
        }
        outputAmount *= researchSpeedMultiplier;
    }
    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityInstance.currentOutput && facilityType.output) {
        facilityInstance.currentOutput.amount = parseFloat(outputAmount.toFixed(3));
    } else if (facilityType.output) {
         facilityInstance.currentOutput = { resource: facilityType.output.resource, amount: parseFloat(outputAmount.toFixed(3)) };
    }
}

function upgradeFacilityMainLevel(facilityUniqueId) {
    const facilityInstance = ownedFacilities.find(f => f.uniqueId === facilityUniqueId);
    if (!facilityInstance) return;
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    if (!facilityType) return;
    if (facilityInstance.mainLevel < facilityType.mainLevelMax) {
        const upgradeMonetaryCost = Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, facilityInstance.mainLevel - 1));
        if (gameState.cash >= upgradeMonetaryCost) {
            gameState.cash -= upgradeMonetaryCost;
            facilityInstance.mainLevel++;
            calculateFacilityStats(facilityInstance, facilityType);
            updateGameData();
            console.log(`[GAME] ${facilityInstance.name} main level to ${facilityInstance.mainLevel}. Cost: $${upgradeMonetaryCost.toLocaleString()}.`);
        } else {
            console.log(`[GAME] Not enough cash for ${facilityInstance.name} main level upgrade.`);
        }
    } else {
        console.log(`[GAME] ${facilityInstance.name} is at max main level.`);
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
        console.log(`[GAME] ${upgradeDef.name} max tier for ${facilityInstance.name}.`); return;
    }
    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.6, currentTier));
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
        console.log(`[GAME] Not enough cash for ${upgradeDef.name} on ${facilityInstance.name}.`); return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        console.log(`[GAME] Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded}.`); return;
    }
    gameState.cash -= costForNextTier;
    if (actualMaterialsNeeded > 0) gameState.buildingMaterials -= actualMaterialsNeeded;
    facilityInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    calculateFacilityStats(facilityInstance, facilityType);
    updateGameData();
    console.log(`[GAME] ${upgradeDef.name} (Tier ${currentTier + 1}) for ${facilityInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (actualMaterialsNeeded > 0 ? `, ${actualMaterialsNeeded} mats.` : '.'));
}

function calculateTotalFacilityUpkeep() {
    return ownedFacilities.reduce((sum, fac) => sum + fac.currentUpkeepRPS, 0);
}

function applyFacilityOutputs() {
    ownedFacilities.forEach(fac => {
        if (fac.currentOutput && fac.currentOutput.amount > 0) {
            const resource = fac.currentOutput.resource;
            const amount = fac.currentOutput.amount;
            gameState[resource] = (gameState[resource] || 0) + amount;
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
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.6, i)) * 0.25;
                }
            }
        }
    }
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < facilityInstance.mainLevel -1; i++){
        mainLevelUpgradeValue += Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, i)) * 0.25;
    }
    const sellPrice = Math.floor(facilityType.cost * 0.5 + upgradeValue + mainLevelUpgradeValue);
    const materialsReturned = Math.floor((facilityType.materialsCost || 0) * 0.25);
    gameState.cash += sellPrice;
    if (materialsReturned > 0) gameState.buildingMaterials += materialsReturned;
    ownedFacilities.splice(facilityIndex, 1);
    updateGameData();
    console.log(`[GAME] Demolished ${facilityInstance.name} for $${sellPrice.toLocaleString()}`+ (materialsReturned > 0 ? ` & ${materialsReturned} mats.` : '.'));
}

function completeResearch(researchId) {
    const topic = getResearchTopicById(researchId);
    if (!topic) {
        console.error(`[GAME] Research topic ID "${researchId}" not found.`);
        return false;
    }
    if (gameState.unlockedResearch.includes(researchId)) {
        console.log(`[GAME] Research "${topic.name}" already completed.`);
        return false;
    }
    if (!isResearchAvailable(researchId)) {
        console.log(`[GAME] Cannot start research "${topic.name}": Prerequisites not met.`);
        return false;
    }

    // Removed Lab Requirement Check

    let canAfford = true;
    let missingResourcesLog = []; // For logging if multiple resources are missing

    // Check for monetary cost (topic.cost)
    if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) {
        if (gameState.cash < topic.cost) {
            canAfford = false;
            missingResourcesLog.push(`$${formatNumber(topic.cost - gameState.cash, 0)}`);
        }
    }

    // Check for material cost (topic.materialsCost)
    if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
        if (gameState.buildingMaterials < topic.materialsCost) {
            canAfford = false;
            missingResourcesLog.push(`${formatNumber(topic.materialsCost - gameState.buildingMaterials, 0)} Materials`);
        }
    }

    // Check for RP cost (topic.costRP)
    if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
        if (gameState.researchPoints < topic.costRP) {
            canAfford = false;
            missingResourcesLog.push(`${formatNumber(topic.costRP - gameState.researchPoints, 1)} RP`);
        }
    }
    
    if (!canAfford) {
        console.log(`[GAME] Cannot research "${topic.name}". Need: ${missingResourcesLog.join(' + ')}.`);
        return false;
    }

    // Deduct costs
    if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number') {
        gameState.cash -= topic.cost;
    }
    if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
        gameState.buildingMaterials -= topic.materialsCost;
    }
    if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
        gameState.researchPoints -= topic.costRP;
    }

    gameState.unlockedResearch.push(researchId);

    let unlockMessages = [];
    if (topic.unlocksFacilityType) topic.unlocksFacilityType.forEach(id => unlockMessages.push(`construction: ${getFacilityTypeById(id)?.name || id}`));
    if (topic.unlocksPropertyType) topic.unlocksPropertyType.forEach(id => unlockMessages.push(`rental: ${getPropertyTypeById(id)?.name || id}`));
    if (topic.unlocksResearch) topic.unlocksResearch.forEach(id => unlockMessages.push(`research: ${getResearchTopicById(id)?.name || id}`));
    if (topic.globalBuff) unlockMessages.push(`buff: ${topic.globalBuff.type}`);
    
    let message = `Research "${topic.name}" completed!`;
    if (unlockMessages.length > 0) message += " Unlocked: " + unlockMessages.join(', ') + ".";
    console.log(`[GAME] ${message}`);
    
    updateGameData(); // This will refresh UI
    return true;
}
