// Metropolis Estates - facilities.js (v0.4.10 - Reflecting specific cost updates and no labs)

// --- Facility Type Definitions ---
// These are the actual "buildings" the player constructs after their TYPE is unlocked by research.
// They cost money/materials to build and may have upkeep or produce resources.
const FACILITY_TYPES = [
    {
        id: "lumber_mill",
        name: "Lumber Mill",
        cost: 300,             // Monetary cost - As per your latest update
        materialsCost: 0,      // Material cost - As per your latest update
        baseUpkeepRPS: 0.25,   // Upkeep - As per your latest update
        description: "Processes logs into usable Building Materials.",
        output: { resource: "buildingMaterials", amount: 0.5 }, // Output - As per your latest update
        mainLevelMax: 5,
        upgrades: [
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 100 },
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 0.05 }, maxTier: 2, requiresMaterials: 50 } // Adjusted upkeep reduction
        ],
        requiredResearch: "unlock_basic_material_production" // This facility type is unlocked by this research
    },
    {
        id: "small_science_lab",
        name: "Small Science Lab",
        cost: 1000, // Example: Cheaper to build first lab
        materialsCost: 75,
        baseUpkeepRPS: 1,
        description: "A dedicated space for research. Generates Research Points (RP).",
        output: { resource: "researchPoints", amount: 0.2 }, // Example: Slightly better initial RP
        mainLevelMax: 5,
        upgrades: [
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3, requiresMaterials: 0 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 0.2 }, maxTier: 1, requiresMaterials: 0 }
        ],
        requiredResearch: "basic_education" // This facility type is unlocked by "Basic Education"
    },
    {
        id: "basic_workshop", // Example, ensure its unlock research exists
        name: "Basic Workshop",
        cost: 7500,
        materialsCost: 40,
        baseUpkeepRPS: 5, // Example upkeep
        description: "Enables crafting of components and provides minor buffs.",
        effects: [ { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 } ],
        mainLevelMax: 3,
        upgrades: [ { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2, requiresMaterials: 75 } ],
        requiredResearch: "unlock_basic_workshop_research" // Requires a research topic with this ID
    },
    {
        id: "advanced_science_lab", // Example
        name: "Advanced Science Lab",
        cost: 50000,
        materialsCost: 250,
        baseUpkeepRPS: 10,
        description: "A larger, more efficient laboratory for complex research.",
        output: { resource: "researchPoints", amount: 1.0 },
        mainLevelMax: 5,
        upgrades: [ { id: "supercomputer_access", name: "Supercomputer", cost: 50000, effect: { outputIncrease: 0.2 }, maxTier: 2, requiresMaterials: 50 } ],
        requiredResearch: "unlock_advanced_labs_research" // Requires a research topic with this ID
    }
];

const RESEARCH_TOPICS = [
    // TIER 0 - Initial
    {
        id: "basic_education",
        name: "Basic Education",
        cost: 300,             // Monetary cost
        materialsCost: 100,    // Material cost
        // requiredLabs: 0, // REMOVED
        description: "Fundamental knowledge. Unlocks Small Science Labs. Costs $300 & 100 Materials.",
        prerequisites: [],
        unlocksFacilityType: ["small_science_lab"], // Allows building Small Science Labs
        unlocksResearch: ["urban_planning_1", "unlock_basic_material_production", "scientific_method_1_research"] // Leads to next research
    },

    // TIER 1 - Rental Path
    {
        id: "urban_planning_1",
        name: "Unlock Basic Rentals",
        costRP: 300, // Costs 300 RP as requested
        // materialsCost: 50, // Example if it also costs materials
        // requiredLabs removed
        description: "Develop basic urban structures. Unlocks Small Apartments and Trailer Homes. Costs 300 RP.",
        prerequisites: ["basic_education"],
        unlocksPropertyType: ["small_apartment", "trailer_home"],
        unlocksResearch: ["urban_planning_2"]
    },

    // TIER 1 - Material Path
    {
        id: "unlock_basic_material_production",
        name: "Basic Resource Extraction",
        costRP: 50, // Example RP cost
        description: "Study basic resource gathering. Unlocks the Lumber Mill.",
        prerequisites: ["basic_education"],
        unlocksFacilityType: ["lumber_mill"],
        unlocksResearch: ["unlock_basic_workshop_research"]
    },
    {
        id: "unlock_basic_workshop_research",
        name: "Workshop Schematics",
        costRP: 75,  // Example RP cost
        // cost: 3000, // Example if it also costs cash
        description: "Design and develop basic workshop capabilities.",
        prerequisites: ["unlock_basic_material_production"],
        unlocksFacilityType: ["basic_workshop"],
        globalBuff: { type: "property_cost_reduction", percentage: 0.05, scope: "all" },
        unlocksResearch: ["advanced_material_processing_research"]
    },

    // TIER 1 - Science Path
    {
        id: "scientific_method_1_research", // Renamed for clarity
        name: "Scientific Method I",
        costRP: 75, // Example RP cost
        // cost: 2000, // Example if it also costs cash
        // materialsCost: 100, // Example if it also costs materials
        description: "Improves overall research point generation from labs.",
        prerequisites: ["basic_education"],
        globalBuff: { type: "research_speed_boost", percentage: 0.10 },
        unlocksResearch: ["unlock_advanced_labs_research"]
    },

    // TIER 2 - Further Unlocks
    {
        id: "urban_planning_2",
        name: "Urban Planning II",
        costRP: 200,
        materialsCost: 150,
        description: "Advanced residential planning. Unlocks Suburban Houses.",
        prerequisites: ["urban_planning_1"],
        unlocksPropertyType: ["suburban_house"],
        unlocksResearch: ["unlock_commercial_rentals_research"]
    },
    {
        id: "unlock_advanced_labs_research",
        name: "Advanced Lab Design",
        costRP: 200, // Example RP cost
        // cost: 25000, // Example if it also costs cash
        // materialsCost: 300, // Example if it also costs materials
        description: "Develop schematics for Advanced Science Labs.",
        prerequisites: ["scientific_method_1_research"],
        unlocksFacilityType: ["advanced_science_lab"],
        unlocksResearch: [/* "next_big_science_thing" */]
    },
    {
        id: "advanced_material_processing_research",
        name: "Adv. Material Processing",
        costRP: 100,
        // cost: 5000,
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
        prerequisites: ["urban_planning_2"], // Or a parallel path
        unlocksPropertyType: ["corner_store"],
        unlocksResearch: []
    }
];

// --- Game State Variables for Facilities ---
let ownedFacilities = [];
let nextFacilityId = 0;

// --- Helper Functions ---
function getFacilityTypeById(id) { return FACILITY_TYPES.find(fac => fac.id === id); }
function getResearchTopicById(id) { return RESEARCH_TOPICS.find(res => res.id === id); }
function calculateFacilityDynamicCost(facilityType) { return facilityType.cost; } // Facilities have flat monetary cost

function isFacilityTypeUnlocked(facilityTypeId) {
    const facType = getFacilityTypeById(facilityTypeId);
    if (!facType) return false;
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

// --- Core Functions for Facilities & Research ---
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
        let researchSpeedMultiplier = 1; // Base multiplier from the lab itself
        // Additive stacking of research speed buffs from completed research
        if(gameState.unlockedResearch.includes("scientific_method_1_research")) {
            const buff = getResearchTopicById("scientific_method_1_research")?.globalBuff;
            if(buff && buff.type === "research_speed_boost") researchSpeedMultiplier += buff.percentage;
        }
        // Add more checks if other research topics (e.g., scientific_method_2_research) also boost RP
        outputAmount *= researchSpeedMultiplier;
    }

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityType.output) { // Ensure facility type is supposed to have an output
        facilityInstance.currentOutput = { 
            resource: facilityType.output.resource, 
            amount: parseFloat(outputAmount.toFixed(3)) 
        };
    } else {
        facilityInstance.currentOutput = null;
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
    if (gameState.unlockedResearch.includes("advanced_material_processing_research")) { // Ensure correct ID
        const buffResearch = getResearchTopicById("advanced_material_processing_research");
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

function applyFacilityOutputs() { // This is called each game tick
    ownedFacilities.forEach(fac => {
        if (fac.currentOutput && fac.currentOutput.amount > 0) {
            const resource = fac.currentOutput.resource;
            const amount = fac.currentOutput.amount; // Amount per second
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

    // Apply direct resource-per-second grants from research
    if (topic.grantsResourcePerSecond) {
        const resKey = topic.grantsResourcePerSecond.resource + "PerSecond"; // e.g., researchPointsPerSecond
        gameState[resKey] = (gameState[resKey] || 0) + topic.grantsResourcePerSecond.amount;
        console.log(`[GAME] "${topic.name}" now grants +${topic.grantsResourcePerSecond.amount}/s ${topic.grantsResourcePerSecond.resource}.`);
    }
    
    let unlockMessages = [];
    if (topic.unlocksFacilityType) topic.unlocksFacilityType.forEach(id => unlockMessages.push(`construction: ${getFacilityTypeById(id)?.name || id}`));
    if (topic.unlocksPropertyType) topic.unlocksPropertyType.forEach(id => unlockMessages.push(`rental: ${getPropertyTypeById(id)?.name || id}`)); // getPropertyTypeById is from properties.js
    if (topic.unlocksResearch) topic.unlocksResearch.forEach(id => unlockMessages.push(`research: ${getResearchTopicById(id)?.name || id}`));
    if (topic.globalBuff) unlockMessages.push(`buff: ${topic.globalBuff.type}`);
    let message = `Research "${topic.name}" completed!`;
    if (unlockMessages.length > 0) message += " Unlocked: " + unlockMessages.join(', ') + ".";
    console.log(`[GAME] ${message}`);
    
    updateGameData(); 
    return true;
}
