// Metropolis Estates - facilities.js (v0.4.8 - Sequential Unlocks)

const FACILITY_TYPES = [
    {
        id: "lumber_mill", name: "Lumber Mill", cost: 300, materialsCost: 50, baseUpkeepRPS: 0.25, // Building it costs mats now
        description: "Processes logs into usable Building Materials.", output: { resource: "buildingMaterials", amount: 0.5 },
        mainLevelMax: 5,
        upgrades: [
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 0.05 }, maxTier: 2, requiresMaterials: 50 }
        ],
        requiredResearch: "unlock_basic_material_production" // This facility type is unlocked by this research
    },
    {
        id: "small_science_lab", name: "Small Science Lab", cost: 1000, materialsCost: 75, baseUpkeepRPS: 1,
        description: "A dedicated space for research. Generates Research Points (RP).", output: { resource: "researchPoints", amount: 0.2 },
        mainLevelMax: 5,
        upgrades: [
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 0.2 }, maxTier: 1 }
        ],
        requiredResearch: "unlock_formal_science" // This facility type is unlocked by this research
    },
    // Example for a next tier material facility
    {
        id: "basic_workshop", name: "Basic Workshop", cost: 7500, materialsCost: 150, baseUpkeepRPS: 5,
        description: "Enables crafting of components and provides minor buffs.",
        effects: [ { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 } ],
        mainLevelMax: 3,
        upgrades: [ { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 } ],
        requiredResearch: "unlock_basic_workshop_research"
    },
    {
        id: "advanced_science_lab", name: "Advanced Science Lab", cost: 50000, materialsCost: 500, baseUpkeepRPS: 10,
        description: "A larger, more efficient laboratory for complex research.", output: { resource: "researchPoints", amount: 1.0 },
        mainLevelMax: 5,
        upgrades: [ { id: "supercomputer_access", name: "Supercomputer", cost: 50000, effect: { outputIncrease: 0.2 }, maxTier: 2, requiresMaterials: 50 } ],
        requiredResearch: "unlock_advanced_labs_research"
    }
];

const RESEARCH_TOPICS = [
    // --- INITIAL BOOTSTRAP RESEARCH (Costs Cash Only) ---
    {
        id: "initiate_rental_development",
        name: "Initiate Rental Development",
        cost: 200, // Cash cost
        description: "Lay the groundwork for residential construction. Unlocks the Dilapidated Shack.",
        prerequisites: [],
        unlocksPropertyType: ["shack"], // Unlocks the first property type
        unlocksResearch: ["unlock_urban_planning_1"] // Leads to the next rental research
    },
    {
        id: "unlock_basic_material_production",
        name: "Basic Resource Extraction",
        cost: 250, // Cash cost
        description: "Establish initial methods for gathering building materials. Unlocks the Lumber Mill.",
        prerequisites: [],
        unlocksFacilityType: ["lumber_mill"], // Unlocks the first material facility
        unlocksResearch: ["unlock_basic_workshop_research"] // Leads to next material facility research
    },
    {
        id: "establish_foundational_science",
        name: "Establish Foundational Science",
        cost: 500, // Cash cost (as requested for first science unlock)
        description: "Fund basic scientific inquiry. Starts passive RP generation and unlocks formal lab research.",
        prerequisites: [],
        grantsResourcePerSecond: { resource: "researchPoints", amount: 0.05 }, // Small passive RP gain
        unlocksResearch: ["unlock_formal_science"] // Unlocks research that allows building labs
    },

    // --- TIER 1 RESEARCH (after initial bootstrap, costs vary) ---

    // Rental Path (Tier 2+ Rentals cost Materials + RP)
    {
        id: "unlock_urban_planning_1",
        name: "Urban Planning I",
        costRP: 300, // Costs 300 RP as requested
        materialsCost: 50, // ADDED: Also costs materials
        description: "Develop basic urban structures. Unlocks Small Apartments and Trailer Homes.",
        prerequisites: ["initiate_rental_development", "establish_foundational_science"], // Needs RP generation and initial rental unlock
        unlocksPropertyType: ["small_apartment", "trailer_home"],
        unlocksResearch: ["unlock_suburban_homes_research"]
    },

    // Material Acquisition Path (Tier 2+ Material Facilities cost Cash + RP)
    {
        id: "unlock_basic_workshop_research",
        name: "Workshop Schematics",
        cost: 3000, // Cash cost
        costRP: 75,  // RP cost
        description: "Design and develop basic workshop capabilities.",
        prerequisites: ["unlock_basic_material_production", "establish_foundational_science"],
        unlocksFacilityType: ["basic_workshop"],
        unlocksResearch: ["advanced_material_processing_research"]
    },

    // Science Path (Tier 2+ Science costs Cash + Materials)
    {
        id: "unlock_formal_science", // This research unlocks the ability to build the first actual Science Lab
        name: "Formalize Scientific Method",
        cost: 1000,      // Cash cost
        materialsCost: 50, // Material cost
        description: "Establish dedicated laboratories. Unlocks Small Science Labs for construction.",
        prerequisites: ["establish_foundational_science"],
        unlocksFacilityType: ["small_science_lab"], // Player can now BUILD Science Labs
        unlocksResearch: ["scientific_method_1_research"]
    },
    {
        id: "scientific_method_1_research",
        name: "Scientific Method I",
        cost: 2000,      // Cash cost
        materialsCost: 100, // Material cost
        description: "Improves overall research point generation from labs and unlocks advanced lab designs.",
        prerequisites: ["unlock_formal_science"],
        globalBuff: { type: "research_speed_boost", percentage: 0.10 }, // Boosts RP output of labs
        unlocksResearch: ["unlock_advanced_labs_research"]
    },


    // --- TIER 2+ RESEARCH EXAMPLES ---
    {
        id: "unlock_suburban_homes_research",
        name: "Urban Planning II",
        costRP: 200,
        materialsCost: 150,
        description: "Advanced residential planning. Unlocks Suburban Houses.",
        prerequisites: ["unlock_urban_planning_1"],
        unlocksPropertyType: ["suburban_house"],
        unlocksResearch: ["unlock_commercial_rentals_research"]
    },
    {
        id: "unlock_advanced_labs_research",
        name: "Advanced Lab Design",
        cost: 25000,
        materialsCost: 300,
        description: "Develop schematics for Advanced Science Labs.",
        prerequisites: ["scientific_method_1_research"],
        unlocksFacilityType: ["advanced_science_lab"],
        unlocksResearch: [/* "next_big_science_thing" */]
    },
    {
        id: "advanced_material_processing_research",
        name: "Adv. Material Processing",
        cost: 5000, // Cash cost
        costRP: 100,  // RP cost
        description: "More efficient use of building materials for upgrades.",
        prerequisites: ["unlock_basic_workshop_research"],
        globalBuff: { type: "material_usage_efficiency", percentage: 0.10 },
        unlocksResearch: []
    },
    {
        id: "unlock_commercial_rentals_research",
        name: "Commercial Zoning",
        costRP: 180,
        materialsCost: 200,
        description: "Zone for and develop basic commercial properties. Unlocks Corner Stores.",
        prerequisites: ["unlock_suburban_homes_research"],
        unlocksPropertyType: ["corner_store"],
        unlocksResearch: []
    }
];

// --- Game State Variables for Facilities ---
let ownedFacilities = [];
let nextFacilityId = 0;

// --- Functions ---
// (Ensure all functions like getFacilityTypeById, getResearchTopicById, calculateFacilityDynamicCost,
//  isFacilityTypeUnlocked, isResearchAvailable, buyFacility, calculateFacilityStats,
//  upgradeFacilityMainLevel, applySpecificFacilityUpgrade, calculateTotalFacilityUpkeep,
//  applyFacilityOutputs, sellFacilityInstance, and the LATEST version of completeResearch
//  that handles mixed costs and NO lab requirements are present and correct)

function getFacilityTypeById(id) { return FACILITY_TYPES.find(fac => fac.id === id); }
function getResearchTopicById(id) { return RESEARCH_TOPICS.find(res => res.id === id); }
function calculateFacilityDynamicCost(facilityType) { return facilityType.cost; } // Flat monetary cost

function isFacilityTypeUnlocked(facilityTypeId) {
    const facType = getFacilityTypeById(facilityTypeId);
    if (!facType) return false;
    // A facility type is unlocked if its requiredResearch ID is in gameState.unlockedResearch
    // OR if it has no requiredResearch (e.g. an implicit starting facility if we had one)
    if (!facType.requiredResearch) return true; // Some facilities might be available by default
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
         const requiredResearch = getResearchTopicById(facilityType.requiredResearch);
         console.log(`[GAME] Cannot build ${facilityType.name}: Requires research "${requiredResearch ? requiredResearch.name : facilityType.requiredResearch}".`);
        return false;
    }
    const currentMonetaryCost = calculateFacilityDynamicCost(facilityType);
    const materialsNeeded = facilityType.materialsCost || 0;
    if (gameState.cash < currentMonetaryCost) {
        console.log(`[GAME] Not enough cash for ${facilityType.name}. Need $${currentMonetaryCost.toLocaleString()}.`); return false;
    }
    if (materialsNeeded > 0 && gameState.buildingMaterials < materialsNeeded) {
        console.log(`[GAME] Not enough materials for ${facilityType.name}. Need ${materialsNeeded} (Have ${Math.floor(gameState.buildingMaterials)}).`); return false;
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
    let upkeep = facilityType.baseUpkeepRPS;
    let outputAmount = facilityType.output ? facilityType.output.amount : 0;
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
        let researchSpeedMultiplier = 1; // Base multiplier
        // Additive stacking of research speed buffs from completed research
        if(gameState.unlockedResearch.includes("scientific_method_1_research")) { // Ensure correct ID
            const buff = getResearchTopicById("scientific_method_1_research")?.globalBuff;
            if(buff && buff.type === "research_speed_boost") researchSpeedMultiplier += buff.percentage;
        }
        // Add more buff checks here if other research topics boost RP generation
        outputAmount *= researchSpeedMultiplier;
    }

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityType.output) {
        facilityInstance.currentOutput = { 
            resource: facilityType.output.resource, 
            amount: parseFloat(outputAmount.toFixed(3)) 
        };
    } else {
        facilityInstance.currentOutput = null;
    }
}

function completeResearch(researchId) {
    const topic = getResearchTopicById(researchId);
    if (!topic) { console.error(`[GAME] Research topic ID "${researchId}" not found.`); return false; }
    if (gameState.unlockedResearch.includes(researchId)) { console.log(`[GAME] Research "${topic.name}" already completed.`); return false; }
    if (!isResearchAvailable(researchId)) { console.log(`[GAME] Cannot start research "${topic.name}": Prerequisites not met.`); return false; }

    let canAfford = true;
    let missingResourcesLog = []; 

    if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number' && topic.cost > 0) {
        if (gameState.cash < topic.cost) { canAfford = false; missingResourcesLog.push(`$${formatNumber(topic.cost - gameState.cash, 0)}`); }
    }
    if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) {
        if (gameState.buildingMaterials < topic.materialsCost) { canAfford = false; missingResourcesLog.push(`${formatNumber(topic.materialsCost - gameState.buildingMaterials, 0)} Materials`); }
    }
    if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) {
        if (gameState.researchPoints < topic.costRP) { canAfford = false; missingResourcesLog.push(`${formatNumber(topic.costRP - gameState.researchPoints, 1)} RP`); }
    }
    
    if (!canAfford) {
        console.log(`[GAME] Cannot research "${topic.name}". Need: ${missingResourcesLog.join(' + ')}.`);
        return false;
    }

    if (topic.hasOwnProperty('cost') && typeof topic.cost === 'number') gameState.cash -= topic.cost;
    if (topic.hasOwnProperty('materialsCost') && typeof topic.materialsCost === 'number' && topic.materialsCost > 0) gameState.buildingMaterials -= topic.materialsCost;
    if (topic.hasOwnProperty('costRP') && typeof topic.costRP === 'number' && topic.costRP > 0) gameState.researchPoints -= topic.costRP;

    gameState.unlockedResearch.push(researchId);

    if (topic.grantsResourcePerSecond) {
        const resKey = topic.grantsResourcePerSecond.resource + "PerSecond";
        gameState[resKey] = (gameState[resKey] || 0) + topic.grantsResourcePerSecond.amount;
        console.log(`[GAME] "${topic.name}" now grants +${topic.grantsResourcePerSecond.amount}/s ${topic.grantsResourcePerSecond.resource}.`);
    }
    
    let unlockMessages = [];
    if (topic.unlocksFacilityType) topic.unlocksFacilityType.forEach(id => unlockMessages.push(`construction: ${getFacilityTypeById(id)?.name || id}`));
    if (topic.unlocksPropertyType) topic.unlocksPropertyType.forEach(id => unlockMessages.push(`rental: ${getPropertyTypeById(id)?.name || id}`));
    if (topic.unlocksResearch) topic.unlocksResearch.forEach(id => unlockMessages.push(`research: ${getResearchTopicById(id)?.name || id}`));
    if (topic.globalBuff) unlockMessages.push(`buff: ${topic.globalBuff.type}`);
    let message = `Research "${topic.name}" completed!`;
    if (unlockMessages.length > 0) message += " Unlocked: " + unlockMessages.join(', ') + ".";
    console.log(`[GAME] ${message}`);
    
    updateGameData(); 
    return true;
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
