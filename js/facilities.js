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
            { id: "sharper_saws", name: "Sharper Saws", cost: 2000, effect: { outputIncrease: 0.05 }, maxTier: 3 }, // Increases output amount by 0.05
            { id: "efficiency_experts", name: "Efficiency Experts", cost: 3000, effect: { upkeepReduction: 2 }, maxTier: 2 } // Reduces upkeepRPS by 2
        ],
        requiredResearch: null
    },
    {
        id: "basic_workshop",
        name: "Basic Workshop",
        cost: 15000,
        baseUpkeepRPS: 25,
        description: "Allows crafting of more advanced components (future use). Currently provides a small global RPS boost to cheap properties.",
        effects: [ // Global effects
            { type: "property_rps_boost", propertyCategory: "cheap", percentage: 0.02 } // 2% boost to shacks, small_apartments
        ],
        mainLevelMax: 3,
        upgrades: [
            { id: "better_tools", name: "Better Tools", cost: 5000, effect: { rpsBoostIncrease: 0.01 }, maxTier: 2 }
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
            { id: "more_beakers", name: "More Beakers", cost: 10000, effect: { outputIncrease: 0.05 }, maxTier: 3 },
            { id: "grant_application", name: "Grant Writing", cost: 12000, effect: { upkeepReduction: 10}, maxTier: 1}
        ],
        requiredResearch: "basic_education"
    }
];

const RESEARCH_TOPICS = [
    {
        id: "basic_education",
        name: "Basic Education",
        costRP: 10,
        description: "Unlocks the ability to build Small Science Labs.",
        unlocksFacility: ["small_science_lab"],
        unlocksProperty: [],
        globalBuff: null
    },
    {
        id: "basic_construction_techniques",
        name: "Basic Construction",
        costRP: 25,
        description: "Improves building methods. Unlocks Basic Workshops and some property upgrades.",
        unlocksFacility: ["basic_workshop"],
        unlocksProperty: [], // Could unlock a new property type here
        globalBuff: { type: "construction_cost_reduction", percentage: 0.05 } // 5% reduction on property purchase
    },
    {
        id: "commercial_logistics",
        name: "Commercial Logistics",
        costRP: 50,
        description: "Improves efficiency of commercial operations.",
        unlocksFacility: [],
        unlocksProperty: [],
        globalBuff: { type: "commercial_rps_boost", percentage: 0.05 } // 5% boost to commercial properties RPS
    },
    // More research topics
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

function isFacilityAvailable(facilityType) {
    if (facilityType.requiredResearch) {
        return gameState.unlockedResearch.includes(facilityType.requiredResearch);
    }
    // For facilities unlocked by research that unlocks facility types (like small_science_lab by basic_education)
    const researchUnlockingThis = RESEARCH_TOPICS.find(rt => rt.unlocksFacility && rt.unlocksFacility.includes(facilityType.id));
    if (researchUnlockingThis) {
        return gameState.unlockedResearch.includes(researchUnlockingThis.id);
    }
    return !facilityType.requiredResearch; // If no specific research, check if it's a base facility (like Lumber Mill if it had no req)
}


function buyFacility(facilityTypeId) {
    const facilityType = getFacilityTypeById(facilityTypeId);
    if (!facilityType) {
        logMessage("Error: Facility type not found.", "error");
        return false;
    }

    if (facilityType.requiredResearch && !gameState.unlockedResearch.includes(facilityType.requiredResearch)) {
         logMessage(`Cannot buy ${facilityType.name}: Requires research "${getResearchTopicById(facilityType.requiredResearch)?.name || facilityType.requiredResearch}".`, "error");
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
            currentUpkeepRPS: facilityType.baseUpkeepRPS,
            currentOutput: facilityType.output ? { ...facilityType.output } : null, // Copy output object
            appliedUpgrades: {} // For specific upgrades like properties
        };
        // Recalculate upkeep/output based on default level 1 and no applied upgrades (done by calculateFacilityStats)
        calculateFacilityStats(newFacility, facilityType);
        ownedFacilities.push(newFacility);

        updateGameData();
        if (facilityType.output && facilityType.output.resource === 'researchPoints') {
            document.getElementById('research-points-display').style.display = 'inline-block';
            document.getElementById('research-section').style.display = 'block';
        }
        if (facilityType.output && facilityType.output.resource === 'buildingMaterials') {
            document.getElementById('building-materials-display').style.display = 'inline-block';
        }
        document.getElementById('total-upkeep-display').style.display = 'inline-block';


        logMessage(`Built ${facilityType.name} for $${currentCost.toLocaleString()}. Upkeep: $${newFacility.currentUpkeepRPS}/s.`, "success");
        return true;
    } else {
        logMessage(`Not enough cash to build ${facilityType.name}. Need $${currentCost.toLocaleString()}.`, "error");
        return false;
    }
}

function calculateFacilityStats(facilityInstance, facilityType) {
    let upkeep = facilityType.baseUpkeepRPS;
    let outputAmount = facilityType.output ? facilityType.output.amount : 0;

    // Apply specific upgrade effects
    for (const upgradeId in facilityInstance.appliedUpgrades) {
        const tier = facilityInstance.appliedUpgrades[upgradeId];
        const upgradeDef = facilityType.upgrades.find(u => u.id === upgradeId);
        if (upgradeDef && upgradeDef.effect) {
            for (let i = 0; i < tier; i++) { // Apply effect for each tier achieved
                if (upgradeDef.effect.outputIncrease) {
                    outputAmount += upgradeDef.effect.outputIncrease;
                }
                if (upgradeDef.effect.upkeepReduction) {
                    upkeep -= upgradeDef.effect.upkeepReduction;
                }
            }
        }
    }

    // Apply main level effects (e.g., level 2 gives 10% output boost and 5% upkeep reduction)
    const mainLevelOutputMultiplier = 1 + (facilityInstance.mainLevel - 1) * 0.1; // 10% output boost per level
    const mainLevelUpkeepMultiplier = 1 - (facilityInstance.mainLevel - 1) * 0.05; // 5% upkeep reduction per level

    outputAmount *= mainLevelOutputMultiplier;
    upkeep *= mainLevelUpkeepMultiplier;

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(
