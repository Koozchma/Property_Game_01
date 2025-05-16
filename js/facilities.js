// Metropolis Estates - facilities.js

const FACILITY_TYPES = [
    {
        id: "lumber_mill",
        name: "Lumber Mill",
        cost: 300, // UPDATED monetary cost
        materialsCost: 0, // UPDATED material cost
        baseUpkeepRPS: 0.25, // UPDATED upkeep
        description: "Processes logs into usable Building Materials.",
        output: { resource: "buildingMaterials", amount: 0.5 }, // UPDATED output amount
        mainLevelMax: 5,
        upgrades: [
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 0.05 }, maxTier: 2, requiresMaterials: 50 } // Adjusted upkeep reduction to be more proportional
        ],
        requiredResearch: null // Available from start
    },
    {
        id: "basic_workshop",
        name: "Basic Workshop",
        cost: 7500, // Kept lowered cost from previous adjustment
        materialsCost: 40, // Kept lowered material cost
        baseUpkeepRPS: 20,
        description: "Provides RPS boost to cheap properties and enables advanced construction research.",
        effects: [
            { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 }
        ],
        mainLevelMax: 3,
        upgrades: [
            { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 }
        ],
        requiredResearch: "basic_construction_techniques"
    },
    {
        id: "small_science_lab",
        name: "Small Science Lab",
        cost: 15000, // Kept example lowered cost
        materialsCost: 75,  // Kept example lowered material cost
        baseUpkeepRPS: 40,
        description: "Generates Research Points (RP) to unlock new technologies.",
        output: { resource: "researchPoints", amount: 0.1 },
        mainLevelMax: 5,
        upgrades: [
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 0 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 10}, maxTier: 1, requiresMaterials: 0 }
        ],
        requiredResearch: "basic_education" // This facility type itself is unlocked by this research
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
            { id: "supercomputer_access", name: "Supercomputer", cost: 50000, effect: { outputIncrease: 0.2 }, maxTier: 2, requiresMaterials: 50 } // Added example material cost
        ],
        requiredResearch: "scientific_method_2"
    }
];

const RESEARCH_TOPICS = [
    // TIER 0 - Initial (Costs Money & Materials)
    {
        id: "basic_education",
        name: "Basic Education",
        cost: 300,             // Monetary cost
        materialsCost: 100,    // Material cost
        // costRP: 0, // Explicitly no RP cost or remove if your logic handles missing costRP
        // requiredLabs: 0, // REMOVED
        description: "Fundamental knowledge paving the way for scientific endeavors. Unlocks the Small Science Lab. Costs $300 & 100 Materials.",
        prerequisites: [],
        unlocksFacilityType: ["small_science_lab"],
        unlocksResearch: ["urban_planning_1", "basic_construction_techniques", "scientific_method_1"]
    },

    // TIER 1 - Unlocked by Basic Education (Costs RP)
    {
        id: "urban_planning_1",
        name: "Unlock Basic Rentals",
        costRP: 100,
        // materialsCost: 0, // Research generally shouldn't cost materials unless specifically intended
        // requiredLabs: 1, // REMOVED
        description: "Learn to build basic new rental types like apartments and trailer homes.",
        prerequisites: ["basic_education"],
        unlocksPropertyType: ["small_apartment", "trailer_home"],
        unlocksResearch: ["urban_planning_2", "commercial_development_1"]
    },
    {
        id: "basic_construction_techniques",
        name: "Basic Construction",
        costRP: 25,
        // requiredLabs: 1, // REMOVED
        description: "Improves building methods. Unlocks Basic Workshops and enables some property upgrades. Reduces property monetary costs.",
        prerequisites: ["basic_education"],
        unlocksFacilityType: ["basic_workshop"],
        globalBuff: { type: "property_cost_reduction", percentage: 0.05, scope: "all" },
        unlocksResearch: ["advanced_material_processing"]
    },
    {
        id: "scientific_method_1",
        name: "Scientific Method I",
        costRP: 30,
        // requiredLabs: 1, // REMOVED
        description: "Improves research efficiency slightly.",
        prerequisites: ["basic_education"],
        globalBuff: { type: "research_speed_boost", percentage: 0.05 },
        unlocksResearch: ["scientific_method_2", "commercial_logistics"]
    },

    // TIER 2 - Branching out (Costs RP)
    {
        id: "urban_planning_2",
        name: "Urban Planning II",
        costRP: 50,
        // requiredLabs: 1, // REMOVED
        description: "Unlocks Suburban Houses.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["suburban_house"],
        unlocksResearch: []
    },
    {
        id: "commercial_development_1",
        name: "Commercial Dev. I",
        costRP: 40,
        // requiredLabs: 1, // REMOVED
        description: "Unlocks basic commercial properties.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["corner_store"],
        unlocksResearch: []
    },
    {
        id: "advanced_material_processing",
        name: "Adv. Material Processing",
        costRP: 60,
        // requiredLabs: 1, // REMOVED
        description: "More efficient use of building materials for upgrades.",
        prerequisites: ["basic_construction_techniques"],
        globalBuff: { type: "material_usage_efficiency", percentage: 0.10 },
        unlocksResearch: []
    },
    {
        id: "commercial_logistics",
        name: "Commercial Logistics",
        costRP: 50,
        // requiredLabs: 1, // REMOVED
        description: "Improves RPS for commercial properties.",
        prerequisites: ["scientific_method_1"],
        globalBuff: { type: "property_rps_boost", percentage: 0.05, scope: "commercial" },
        unlocksResearch: []
    },
    {
        id: "scientific_method_2",
        name: "Scientific Method II",
        costRP: 75,
        // requiredLabs: 2, // REMOVED
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

// Cost of facilities is flat (monetary wise)
function calculateFacilityDynamicCost(facilityType) {
    return facilityType.cost;
}

function isFacilityTypeUnlocked(facilityTypeId) {
    const facType = getFacilityTypeById(facilityTypeId);
    if (!facType) return false;
    if (!facType.requiredResearch) return true; // Base facilities like Lumber Mill

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
        console.error("Buy Facility Error: Type not found - ", facilityTypeId);
        return false;
    }

    if (!isFacilityTypeUnlocked(facilityTypeId)) {
         const requiredResearchId = facilityType.requiredResearch;
         const researchTopic = getResearchTopicById(requiredResearchId);
         console.log(`[GAME] Cannot build ${facilityType.name}: Requires research "${researchTopic ? researchTopic.name : (requiredResearchId || "Unknown")}".`);
        return false;
    }

    const currentMonetaryCost = calculateFacilityDynamicCost(facilityType);
    const materialsNeeded = facilityType.materialsCost || 0;

    if (gameState.cash < currentMonetaryCost) {
        console.log(`[GAME] Not enough cash to build ${facilityType.name}. Need $${currentMonetaryCost.toLocaleString()}.`);
        return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        console.log(`[GAME] Not enough materials to build ${facilityType.name}. Need ${materialsNeeded} materials (You have ${Math.floor(gameState.buildingMaterials)}).`);
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
        currentOutput: facilityType.output ? { resource: facilityType.output.resource, amount: facilityType.output.amount } : null, // Create a new object copy
        appliedUpgrades: {}
    };
    calculateFacilityStats(newFacility, facilityType); // Calculate initial stats
    ownedFacilities.push(newFacility);

    updateGameData(); // This will recalculate total upkeep and update UI

    // UI visibility updates for resource displays are now handled by their respective update functions in ui.js when updateGameData is called.
    console.log(`[GAME] Built ${facilityType.name} for $${currentMonetaryCost.toLocaleString()}` + (materialsNeeded > 0 ? ` and ${materialsNeeded} materials.` : '.'));
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
            for (let i = 0; i < tier; i++) { // Apply effect for each tier achieved
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
            const buff1 = getResearchTopicById("scientific_method_1")?.globalBuff;
            if(buff1 && buff1.type === "research_speed_boost") researchSpeedMultiplier += buff1.percentage;
        }
        if(gameState.unlockedResearch.includes("scientific_method_2")) {
            const buff2 = getResearchTopicById("scientific_method_2")?.globalBuff;
            if(buff2 && buff2.type === "research_speed_boost") researchSpeedMultiplier += buff2.percentage; // These stack additively for now
        }
        outputAmount *= researchSpeedMultiplier;
    }

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityInstance.currentOutput && facilityType.output) { // Check if facilityInstance.currentOutput exists
        facilityInstance.currentOutput.amount = parseFloat(outputAmount.toFixed(3)); // Output can be more precise
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
        const upgradeMonetaryCost = Math.floor(facilityType.cost * 0.4 * Math.pow(1.7, facilityInstance.mainLevel - 1));
        // Example: Add material cost for facility main level upgrades
        // const upgradeMaterialCost = Math.floor((facilityType.materialsCost || 0) * 0.2 * Math.pow(1.5, facilityInstance.mainLevel - 1) + 5); // Ensure it costs some materials if base is 0

        if (gameState.cash >= upgradeMonetaryCost /* && gameState.buildingMaterials >= upgradeMaterialCost */) {
            gameState.cash -= upgradeMonetaryCost;
            // if (upgradeMaterialCost > 0) gameState.buildingMaterials -= upgradeMaterialCost;
            facilityInstance.mainLevel++;
            calculateFacilityStats(facilityInstance, facilityType); // Recalculate stats
            updateGameData(); // This will refresh relevant parts of UI including potentially open upgrade views
            console.log(`[GAME] ${facilityInstance.name} main level upgraded to ${facilityInstance.mainLevel}. Cost: $${upgradeMonetaryCost.toLocaleString()}.`);
        } else {
            console.log(`[GAME] Not enough resources for ${facilityInstance.name} main level upgrade.`);
        }
    } else {
        console.log(`[GAME] ${facilityInstance.name} is already at max main level.`);
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
        console.log(`[GAME] ${upgradeDef.name} is already at max tier for ${facilityInstance.name}.`); return;
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
        console.log(`[GAME] Not enough cash for ${upgradeDef.name} on ${facilityInstance.name}. Need $${costForNextTier.toLocaleString()}.`); return;
    }
    if (actualMaterialsNeeded > 0 && gameState.buildingMaterials < actualMaterialsNeeded) {
        console.log(`[GAME] Not enough materials for ${upgradeDef.name}. Need ${actualMaterialsNeeded} (You have ${Math.floor(gameState.buildingMaterials)}). Efficiency bonus applied if researched.`); return;
    }

    gameState.cash -= costForNextTier;
    if (actualMaterialsNeeded > 0) gameState.buildingMaterials -= actualMaterialsNeeded;

    facilityInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
    calculateFacilityStats(facilityInstance, facilityType); // Recalculate stats
    updateGameData(); // This will refresh relevant UI
    console.log(`[GAME] ${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${facilityInstance.name}. Cost: $${costForNextTier.toLocaleString()}` + (actualMaterialsNeeded > 0 ? `, ${actualMaterialsNeeded} materials.` : '.'));
}


function calculateTotalFacilityUpkeep() {
    return ownedFacilities.reduce((sum, fac) => sum + fac.currentUpkeepRPS, 0);
}

function applyFacilityOutputs() {
    ownedFacilities.forEach(fac => {
        if (fac.currentOutput && fac.currentOutput.amount > 0) {
            const resource = fac.currentOutput.resource;
            const amount = fac.currentOutput.amount; // Amount per game tick (second)
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
    const sellPrice = Math.floor(facilityType.cost * 0.5 + upgradeValue + mainLevelUpgradeValue); // Monetary return
    const materialsReturned = Math.floor((facilityType.materialsCost || 0) * 0.25); // Material return

    gameState.cash += sellPrice;
    if (materialsReturned > 0) {
        gameState.buildingMaterials += materialsReturned;
    }
    ownedFacilities.splice(facilityIndex, 1);

    updateGameData();
    console.log(`[GAME] Demolished ${facilityInstance.name} for $${sellPrice.toLocaleString()}`+ (materialsReturned > 0 ? ` and recovered ${materialsReturned} materials.` : '.'));
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
    // isResearchAvailable also checks prerequisites
    if (!isResearchAvailable(researchId)) {
        console.log(`[GAME] Cannot start research "${topic.name}": Prerequisites not met or already researched.`);
        return false;
    }

    const requiredLabsCount = topic.requiredLabs || 0;
    const ownedScienceLabs = ownedFacilities.filter(f => {
        const facType = getFacilityTypeById(f.typeId);
        return facType && facType.output && facType.output.resource === 'researchPoints';
    }).length;

    if (ownedScienceLabs < requiredLabsCount) {
        console.log(`[GAME] Cannot research "${topic.name}": Requires ${requiredLabsCount} Science Lab(s) (You have ${ownedScienceLabs}). Build more or upgrade existing labs.`);
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
                 const propType = getPropertyTypeById(propId); // from properties.js
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
        console.log(`[GAME] ${message}`); // Log science related messages to console
        updateGameData(); // This will refresh UI including available research, properties, facilities
        return true;
    } else {
        console.log(`[GAME] Not enough Research Points for "${topic.name}". Need ${topic.costRP.toFixed(1)} RP (You have ${gameState.researchPoints.toFixed(1)} RP).`);
        return false;
    }
}
