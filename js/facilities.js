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

    facilityInstance.currentUpkeepRPS = Math.max(0, parseFloat(upkeep.toFixed(2)));
    if (facilityInstance.currentOutput && facilityType.output) { // Check if facilityInstance.currentOutput exists
        facilityInstance.currentOutput.amount = parseFloat(outputAmount.toFixed(3)); // Output can be more precise
    } else if (facilityType.output) { // If currentOutput doesn't exist but facilityType.output does, create it
         facilityInstance.currentOutput = { resource: facilityType.output.resource, amount: parseFloat(outputAmount.toFixed(3)) };
    }


    // Update global effects if any (this part might need more sophisticated handling for stacking)
    // For now, assume effects are recalculated and reapplied elsewhere or buffs are directly managed in gameState
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
            calculateFacilityStats(facilityInstance, facilityType); // Recalculate stats
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
    // Add material/research checks if facility upgrades need them

    if (gameState.cash >= costForNextTier) {
        gameState.cash -= costForNextTier;
        facilityInstance.appliedUpgrades[specificUpgradeId] = currentTier + 1;
        calculateFacilityStats(facilityInstance, facilityType); // Recalculate stats
        updateGameData();
        logMessage(`${upgradeDef.name} (Tier ${currentTier + 1}) applied to ${facilityInstance.name}. Cost: $${costForNextTier.toLocaleString()}.`, "success");
    } else {
        logMessage(`Not enough cash for ${upgradeDef.name} on ${facilityInstance.name}. Need $${costForNextTier.toLocaleString()}.`, "error");
    }
}


function calculateTotalFacilityUpkeep() {
    return ownedFacilities.reduce((sum, fac) => sum + fac.currentUpkeepRPS, 0);
}

function applyFacilityOutputs() {
    ownedFacilities.forEach(fac => {
        if (fac.currentOutput && fac.currentOutput.amount > 0) {
            const resource = fac.currentOutput.resource;
            const amount = fac.currentOutput.amount; // This is per tick (second)
            if (gameState.hasOwnProperty(resource)) {
                gameState[resource] += amount;
            } else {
                gameState[resource] = amount;
            }
            // gameState[resource] = parseFloat(gameState[resource].toFixed(3)); // Keep precision
        }
    });
}

function sellFacilityInstance(facilityUniqueId) {
    const facilityIndex = ownedFacilities.findIndex(f => f.uniqueId === facilityUniqueId);
    if (facilityIndex === -1) return;

    const facilityInstance = ownedFacilities[facilityIndex];
    const facilityType = getFacilityTypeById(facilityInstance.typeId);
    const sellPrice = Math.floor(facilityType.cost * 0.5); // Simple sell price for now

    gameState.cash += sellPrice;
    ownedFacilities.splice(facilityIndex, 1);

    updateGameData();
    logMessage(`Sold ${facilityInstance.name} for $${sellPrice.toLocaleString()}.`, "info");
}

function completeResearch(researchId) {
    const research = RESEARCH_TOPICS.find(r => r.id === researchId);
    if (!research || gameState.unlockedResearch.includes(researchId)) {
        logMessage("Research topic not found or already completed.", "error");
        return false;
    }

    if (gameState.researchPoints >= research.costRP) {
        gameState.researchPoints -= research.costRP;
        gameState.unlockedResearch.push(researchId);

        // Apply unlocks and buffs
        if (research.unlocksFacility) {
            research.unlocksFacility.forEach(facId => logMessage(`Unlocked facility: ${getFacilityTypeById(facId)?.name || facId}`, "science"));
        }
        if (research.unlocksProperty) {
            // Logic to make new properties available (e.g., add to a list, or set a flag)
            research.unlocksProperty.forEach(propId => logMessage(`Unlocked property type: ${getPropertyTypeById(propId)?.name || propId}`, "science"));
        }
        if (research.globalBuff) {
            // Apply global buff logic - this will need careful management in gameState
            if (!gameState.activeBuffs) gameState.activeBuffs = [];
            gameState.activeBuffs.push(research.globalBuff); // Store the buff; apply it where relevant
            logMessage(`Global buff activated: ${research.globalBuff.type}`, "science");
        }

        logMessage(`Research "${research.name}" completed!`, "science");
        updateGameData(); // Update UI for research list, facility availability etc.
        return true;
    } else {
        logMessage(`Not enough Research Points for "${research.name}". Need ${research.costRP} RP.`, "error");
        return false;
    }
}

// Call this to apply active global buffs from research
function applyAllGlobalBuffs() {
    // Reset any previously applied buff effects if they are not permanent state changes
    // Example: If a buff reduces property costs, it should be applied when costs are calculated.
    // For RPS boosts, they need to be part of the RPS calculation.

    // This function might be more about flagginggameState variables that other functions check.
    // E.g., gameState.propertyCostModifier = 1;
    // (gameState.activeBuffs || []).forEach(buff => {
    //    if (buff.type === "construction_cost_reduction") {
    //        gameState.propertyCostModifier *= (1 - buff.percentage);
    //    }
    // });
    // This approach is complex to manage dynamically. Simpler to check gameState.unlockedResearch directly.
}
