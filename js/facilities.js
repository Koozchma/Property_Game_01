// Metropolis Estates - facilities.js

const FACILITY_TYPES = [
    {
        id: "lumber_mill",
        name: "Lumber Mill",
        cost: 5000, // Monetary cost
        materialsCost: 25, // Material cost
        baseUpkeepRPS: 10,
        description: "Processes logs into usable Building Materials.",
        output: { resource: "buildingMaterials", amount: 0.2 },
        mainLevelMax: 5,
        upgrades: [
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 2 }, maxTier: 2, requiresMaterials: 50 }
        ],
        requiredResearch: null // Available from start
    },
    {
        id: "basic_workshop",
        name: "Basic Workshop",
        cost: 15000,
        materialsCost: 70,
        baseUpkeepRPS: 25,
        description: "Provides a small global RPS boost to cheap properties and enables advanced construction research.",
        effects: [
            { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 }
        ],
        mainLevelMax: 3,
        upgrades: [
            { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 }
        ],
        requiredResearch: "basic_construction_techniques" // This facility type itself is unlocked by research
    },
    {
        id: "small_science_lab",
        name: "Small Science Lab",
        cost: 25000,
        materialsCost: 100,
        baseUpkeepRPS: 50,
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
            { id: "supercomputer_access", name: "Supercomputer", cost: 50000, effect: { outputIncrease: 0.2 }, maxTier: 2}
        ],
        requiredResearch: "scientific_method_2"
    }
];

const RESEARCH_TOPICS = [
    // TIER 0 - Initial
    {
        id: "basic_education", name: "Basic Education", costRP: 10, requiredLabs: 0,
        description: "Fundamental knowledge. Unlocks Small Science Labs.",
        prerequisites: [],
        unlocksFacilityType: ["small_science_lab"],
        unlocksResearch: ["urban_planning_1", "basic_construction_techniques", "scientific_method_1"]
    },
    // TIER 1 - Unlocked by Basic Education
    {
        id: "urban_planning_1", name: "Urban Planning I", costRP: 20, requiredLabs: 1,
        description: "Learn to build basic new rental types.",
        prerequisites: ["basic_education"],
        unlocksPropertyType: ["small_apartment", "trailer_home"],
        unlocksResearch: ["urban_planning_2", "commercial_development_1"]
    },
    {
        id: "basic_construction_techniques", name: "Basic Construction", costRP: 25, requiredLabs: 1,
        description: "Improves building methods. Unlocks Basic Workshops and some property upgrades. Reduces property monetary costs.",
        prerequisites: ["basic_education"],
        unlocksFacilityType: ["basic_workshop"],
        globalBuff: { type: "property_cost_reduction", percentage: 0.05, scope: "all" },
        unlocksResearch: ["advanced_material_processing"]
    },
    {
        id: "scientific_method_1", name: "Scientific Method I", costRP: 30, requiredLabs: 1,
        description: "Improves research efficiency slightly.",
        prerequisites: ["basic_education"],
        globalBuff: { type: "research_speed_boost", percentage: 0.05 }, // Note: "research_speed_boost" not yet implemented in RP generation
        unlocksResearch: ["scientific_method_2", "commercial_logistics"]
    },
    // TIER 2 - Branching out
    {
        id: "urban_planning_2", name: "Urban Planning II", costRP: 50, requiredLabs: 1,
        description: "Unlocks Suburban Houses.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["suburban_house"],
        unlocksResearch: []
    },
    {
        id: "commercial_development_1", name: "Commercial Dev. I", costRP: 40, requiredLabs: 1,
        description: "Unlocks basic commercial properties.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["corner_store"],
        unlocksResearch: []
    },
    {
        id: "advanced_material_processing", name: "Adv. Material Processing", costRP: 60, requiredLabs: 1, // Requires workshop implicitly by its prereq
        description: "More efficient use of building materials for upgrades.",
        prerequisites: ["basic_construction_techniques"],
        globalBuff: { type: "material_usage_efficiency", percentage: 0.10 },
        unlocksResearch: []
    },
    {
        id: "commercial_logistics", name: "Commercial Logistics", costRP: 50, requiredLabs: 1,
        description: "Improves RPS for commercial properties.",
        prerequisites: ["scientific_method_1"], // Or could be from commercial_dev_1
        globalBuff: { type: "property_rps_boost", percentage: 0.05, scope: "commercial" },
        unlocksResearch: []
    },
    {
        id: "scientific_method_2", name: "Scientific Method II", costRP: 75, requiredLabs: 2,
        description: "Further improves research efficiency and unlocks Advanced Science Labs.",
        prerequisites: ["scientific_method_1"],
        unlocksFacilityType: ["advanced_science_lab"],
        globalBuff: { type: "research_speed_boost", percentage: 0.10 },
        unlocksResearch: [] // End of this branch for now
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

// Cost of facilities is now flat (monetary wise)
function calculateFacilityDynamicCost(facilityType) {
    // Monetary cost is flat
    return facilityType.cost;
}

function isFacilityTypeUnlocked(facilityTypeId) {
    const facType = getFacilityTypeById(facilityTypeId);
    if (!facType) return false;
    if (!facType.requiredResearch) return true; // Base facilities like Lumber Mill

    // Check if any completed research topic explicitly unlocks this facility type
    for (const researchId of gameState.unlockedResearch) {
        const researchTopic = getResearchTopicById(researchId);
        if (researchTopic && researchTopic.unlocksFacilityType && researchTopic.unlocksFacilityType.includes(facilityTypeId)) {
            return true;
        }
    }
    // Fallback for direct `requiredResearch` field, though `unlocksFacilityType` is preferred.
    return gameState.unlockedResearch.includes(facType.requiredResearch);
}

function isResearchAvailable(researchTopicId) {
    const topic = getResearchTopicById(researchTopicId);
    if (!topic || gameState.unlockedResearch.includes(topic.id)) {
        return false; // Not found or already researched
    }
    for (const prereqId of topic.prerequisites) {
        if (!gameState.unlockedResearch.includes(prereqId)) {
            return false; // Prerequisite not met
        }
    }
    return true; // All prerequisites met and not yet researched
}


function buyFacility(facilityTypeId) {
    const facilityType = getFacilityTypeById(facilityTypeId);
    if (!facilityType) {
        logMessage("Error: Facility type not found.", "error");
        return false;
    }

    if (!isFacilityTypeUnlocked(facilityTypeId)) {
         const requiredResearchId = facilityType.requiredResearch;
         const researchTopic = getResearchTopicById(requiredResearchId); // Get the name of the research
         logMessage(`Cannot build ${facilityType.name}: Requires research "${researchTopic ? researchTopic.name : (requiredResearchId || "Unknown")}".`, "error");
        return false;
    }

    const currentMonetaryCost = calculateFacilityDynamicCost(facilityType);
    const materialsNeeded = facilityType.materialsCost || 0;

    if (gameState.cash < currentMonetaryCost) {
        logMessage(`Not enough cash to build ${facilityType.name}. Need $${currentMonetaryCost.toLocaleString()}.`, "error");
        return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        logMessage(`Not enough materials to build ${facilityType.name}. Need ${materialsNeeded} materials (You have ${Math.floor(gameState.buildingMaterials)}).`, "error");
        return false;
    }

    gameState.cash -= currentMonetaryCost;
    if (materialsNeeded > 0) {
        gameState.buildingMaterials -= materialsNeeded;
    }

    const newFacility = {
        uniqueId: nextFacilityId++,
        typeId: facilityType.id,
        name: facilityType.name,
        mainLevel: 1,
        baseUpkeepRPS: facilityType.baseUpkeepRPS,
        baseOutputAmount: facilityType.output ? facilityType.output.amount : 0,
        currentUpkeepRPS: facilityType.baseUpkeepRPS,
        currentOutput: facilityType.output ? { resource: facilityType.output.resource, amount: facilityType.output.amount } : null,
        appliedUpgrades: {}
    };
    calculateFacilityStats(newFacility, facilityType);
    ownedFacilities.push(newFacility);

    updateGameData();

    if (newFacility.currentOutput) {
        if (newFacility.currentOutput.resource === 'researchPoints' && researchPointsDisplay.style.display === 'none') {
            researchPointsDisplay.style.display = 'inline-block';
            document.getElementById('research-section').style.display = 'block'; // Show research section
        }
        if (newFacility.currentOutput.resource === 'buildingMaterials' && buildingMaterialsDisplay.style.display === 'none') {
            buildingMaterialsDisplay.style.display = 'inline-block';
        }
    }
    if (totalUpkeepDisplay.style.display === 'none' && newFacility.currentUpkeepRPS > 0) {
        totalUpkeepDisplay.style.display = 'inline-block';
    }

    logMessage(`Built ${facilityType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'), "success");
    return true;
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
                if (typeof upgradeDef.effect.outputIncrease === 'number') {
                    outputAmount += upgradeDef.effect.outputIncrease;
                }
                if (typeof upgradeDef.effect.upkeepReduction === 'number') {
                    upkeep -= upgradeDef.effect.upkeepReduction;
                }
            }
        }
    }

    // Apply main level effects
    const mainLevelOutputMultiplier = 1 + (facilityInstance.mainLevel - 1) * 0.10;
    const mainLevelUpkeepMultiplier = 1 - (facilityInstance.mainLevel - 1) * 0.05;

    outputAmount *= mainLevelOutputMultiplier;
    upkeep *= mainLevelUpkeepMultiplier;

    // Apply global research speed buffs from research if this is an RP-generating facility
    if (facilityType.output && facilityType.output.resource === 'researchPoints') {
        let researchSpeedMultiplier = 1;
        if(gameState.unlockedResearch.includes("scientific_method_1")) {
            const buff1 = getResearchTopicById("scientific_method_1").globalBuff;
            if(buff1 && buff1.type === "research_speed_boost") researchSpeedMultiplier += buff1.percentage;
        }
        if(gameState.unlockedResearch.includes("scientific_method_2")) {
            const buff2 = getResearchTopicById("scientific_method_2").globalBuff;
            if(buff2 && buff2.type === "research_speed_boost") researchSpeedMultiplier += buff2.percentage; // These stack additively for now
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
        // Add material cost for facility main level upgrades if desired
        // const upgradeMaterialCost = Math.floor((facilityType.materialsCost || 0) * 0.2 * Math.pow(1.5, facilityInstance.mainLevel - 1));

        if (gameState.cash >= upgradeMonetaryCost /* && gameState.buildingMaterials >= upgradeMaterialCost */) {
            gameState.cash -= upgradeMonetaryCost;
            // gameState.buildingMaterials -= upgradeMaterialCost;
            facilityInstance.mainLevel++;
            calculateFacilityStats(facilityInstance, facilityType);
            updateGameData();
            logMessage(`${facilityInstance.name} main level upgraded to ${facilityInstance.mainLevel}. Cost: $${upgradeMonetaryCost.toLocaleString()}.`, "success");
        } else {
            logMessage(`Not enough resources for ${facilityInstance.name} main level upgrade.`, "error");
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

    const costForNextTier = Math.floor(upgradeDef.cost * Math.pow(1.6, currentTier)); // Monetary cost
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
        logMessage(`Not enough cash for ${upgradeDef.name} on ${facilityInstance.name}. Need $${costForNextTier.toLocaleString()}.`, "error");
        return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        logMessage(`Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}). Efficiency bonus applied if researched.`, "error");
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
                    upgradeValue += Math.floor(upgradeDef.cost * Math.pow(1.6, i)) * 0.25;
                }
            }
        }
    }
    let mainLevelUpgradeValue = 0;
    for(let i = 0; i < facilityInstance.mainLevel -1; i++){
        mainLevelUpgradeValue += Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, i)) * 0.25;
    }
    const sellPrice = Math.floor(facilityType.cost * 0.5 + upgradeValue + mainLevelUpgradeValue); // Monetary return
    const materialsReturned = Math.floor((facilityType.materialsCost || 0) * 0.25); // Material return

    gameState.cash += sellPrice;
    if (materialsReturned > 0) {
        gameState.buildingMaterials += materialsReturned;
    }
    ownedFacilities.splice(facilityIndex, 1);

    updateGameData();
    logMessage(`Demolished ${facilityInstance.name} for $${sellPrice.toLocaleString()}`+ (materialsReturned > 0 ? ` and recovered ${materialsReturned} materials.` : '.'), "info");
}

function completeResearch(researchId) {
    const topic = getResearchTopicById(researchId);
    if (!topic) {
        logMessage(`Research topic ID "${researchId}" not found.`, "error");
        return false;
    }
    if (gameState.unlockedResearch.includes(researchId)) {
        logMessage(`Research "${topic.name}" already completed.`, "info");
        return false;
    }
    if (!isResearchAvailable(researchId)) { // Checks prerequisites
        logMessage(`Cannot start research "${topic.name}": Prerequisites not met or already researched.`, "error");
        return false;
    }

    const requiredLabsCount = topic.requiredLabs || 0;
    const ownedScienceLabs = ownedFacilities.filter(f => {
        const facType = getFacilityTypeById(f.typeId);
        return facType && facType.output && facType.output.resource === 'researchPoints';
    }).length;

    if (ownedScienceLabs < requiredLabsCount) {
        logMessage(`Cannot research "${topic.name}": Requires ${requiredLabsCount} Science Lab(s) (You have ${ownedScienceLabs}). Build more or upgrade existing labs.`, "error");
        return false;
    }

    if (gameState.researchPoints >= topic.costRP) {
        gameState.researchPoints -= topic.costRP;
        gameState.unlockedResearch.push(researchId);

        let unlockMessages = [];
        if (topic.unlocksFacilityType && topic.unlocksFacilityType.length > 0) {
            topic.unlocksFacilityType.forEach(facId => {
                const facType = getFacilityTypeById(facId);
                if (facType) unlockMessages.push(`construction: ${facType.name}`);
            });
        }
        if (topic.unlocksPropertyType && topic.unlocksPropertyType.length > 0) {
            topic.unlocksPropertyType.forEach(propId => {
                 const propType = getPropertyTypeById(propId);
                if (propType) unlockMessages.push(`rental: ${propType.name}`);
            });
        }
        if (topic.unlocksResearch && topic.unlocksResearch.length > 0) {
             topic.unlocksResearch.forEach(resId => {
                const nextTopic = getResearchTopicById(resId);
                if(nextTopic) unlockMessages.push(`research: ${nextTopic.name}`);
             });
        }
        if (topic.globalBuff) {
            unlockMessages.push(`global buff: ${topic.globalBuff.type}`);
        }

        let message = `Research "${topic.name}" completed!`;
        if (unlockMessages.length > 0) {
            message += " Unlocked: " + unlockMessages.join(', ') + ".";
        }
        logMessage(message, "science");

        updateGameData(); // This will refresh UI including available research, properties, facilities
        return true;
    } else {
        logMessage(`Not enough Research Points for "${topic.name}". Need ${topic.costRP.toFixed(1)} RP (You have ${gameState.researchPoints.toFixed(1)} RP).`, "error");
        return false;
    }
}
