// js/gamedata.js

// Function to return a fresh copy of the initial game state definitions
function getInitialGameDefinitions() {
    return {
        mp: 0,
        clickPower: 1,
        mps: 0, // Manipulation Points per second

        secondaryResources: {
            pliableMinions: { name: "Pliable Minions", amount: 0, perSecond: 0, symbol: "PM" },
            compromisedOfficials: { name: "Compromised Officials", amount: 0, perSecond: 0, symbol: "CO" },
            darkCapital: { name: "Dark Capital", amount: 0, perSecond: 0, symbol: "DC" },
            societalFear: { name: "Societal Fear", amount: 0, perSecond: 0, symbol: "SF" },
        },

        idleGenerators: [
            {
                id: "subtleRumors",
                name: "Subtle Rumors",
                description: "Spread whispers and half-truths to sow discord.",
                cost: 10, // Current cost, will be updated
                baseCost: 10, // Initial cost
                mpPerSecond: 0.1,
                owned: 0,
                costMultiplier: 1.15,
                upgradeCostMultiplier: 2,
                level: 1,
                isUnlocked: true, // Initial unlocked state
            },
            {
                id: "exploitInsecurities",
                name: "Exploit Insecurities",
                description: "Prey on the doubts and fears of individuals.",
                cost: 100,
                baseCost: 100,
                mpPerSecond: 1,
                owned: 0,
                costMultiplier: 1.18,
                upgradeCostMultiplier: 2.1,
                level: 1,
                isUnlocked: false, // Initial unlocked state
            },
            {
                id: "gaslightCampaigns",
                name: "Gaslighting Campaigns",
                description: "Systematically distort reality to make targets question their sanity.",
                cost: 1200,
                baseCost: 1200,
                mpPerSecond: 8,
                owned: 0,
                costMultiplier: 1.20,
                upgradeCostMultiplier: 2.2,
                level: 1,
                isUnlocked: false, // Initial unlocked state
            }
        ],

        productionFacilities: [
            {
                id: "recruitmentDrives",
                name: "Recruitment Drives",
                description: "Gather a following of easily influenced individuals.",
                cost: 200,
                baseCost: 200,
                generates: "pliableMinions",
                amountPerSecond: 0.1,
                owned: 0,
                costMultiplier: 1.20,
                isUnlocked: false, // Initial unlocked state
                unlockRequirement: { type: "research", id: "recruitmentTactics" }
            },
            {
                id: "blackmailOperations",
                name: "Blackmail Operations",
                description: "Acquire leverage over key figures.",
                cost: 2500,
                baseCost: 2500,
                generates: "compromisedOfficials",
                amountPerSecond: 0.05,
                owned: 0,
                costMultiplier: 1.25,
                isUnlocked: false, // Initial unlocked state
                unlockRequirement: { type: "research", id: "findingLeverage" }
            }
        ],

        research: [
            // Tier 1
            {
                id: "basicPersuasion",
                name: "Basic Persuasion",
                description: "Enhance your ability to directly manipulate. Increases MP per click by +1.",
                cost: 50,
                isResearched: false, // Initial state
                unlocks: [],
                applyEffect: function() { gameData.clickPower += 1; }, // gameData here refers to the live gameData instance
                requirements: [],
                tier: 1,
                isInitiallyLocked: false,
            },
            {
                id: "unlockExploitInsecurities",
                name: "Exploitation 101",
                description: "Unlock the 'Exploit Insecurities' MP generator.",
                cost: 150,
                isResearched: false,
                unlocks: [{ type: "generator", id: "exploitInsecurities" }],
                applyEffect: function() {},
                requirements: [{type: "research", id:"basicPersuasion"}],
                tier: 1,
                isInitiallyLocked: false,
            },
            {
                id: "advancedScheming",
                name: "Advanced Scheming",
                description: "Delve deeper into the arts of manipulation. Unlocks Tier 2 Research.",
                cost: 500,
                isResearched: false,
                unlocks: [{ type: "tier", id: 2 }],
                applyEffect: function() { /* Logic to unlock tier 2 research display */ },
                requirements: [{type: "research", id:"unlockExploitInsecurities"}],
                tier: 1,
                isInitiallyLocked: false,
            },
            // Tier 2
            {
                id: "recruitmentTactics",
                name: "Recruitment Tactics",
                description: "Learn how to gather followers. Unlocks 'Recruitment Drives' facility.",
                cost: 750,
                isResearched: false,
                unlocks: [{ type: "production", id: "recruitmentDrives" }],
                applyEffect: function() {},
                requirements: [{type: "research", id:"advancedScheming"}],
                tier: 2,
                isInitiallyLocked: true,
            },
            {
                id: "unlockGaslightCampaigns",
                name: "Gaslighting Mastery",
                description: "Unlock the 'Gaslighting Campaigns' MP generator.",
                cost: 2000,
                isResearched: false,
                unlocks: [{ type: "generator", id: "gaslightCampaigns" }],
                applyEffect: function() {},
                requirements: [{type: "research", id:"advancedScheming"}],
                tier: 2,
                isInitiallyLocked: true,
            },
             {
                id: "findingLeverage",
                name: "Finding Leverage",
                description: "Discover methods to compromise officials. Unlocks 'Blackmail Operations'.",
                cost: 5000,
                isResearched: false,
                unlocks: [{ type: "production", id: "blackmailOperations" }],
                applyEffect: function() {},
                requirements: [{type: "research", id:"recruitmentTactics"}, {type: "resource", id: "pliableMinions", amount: 50}],
                tier: 2,
                isInitiallyLocked: true,
            }
        ],

        assets: [
            {
                id: "hiddenLair",
                name: "Hidden Lair",
                description: "A secure base of operations. Provides a small global MP boost.",
                costs: [
                    { resource: "pliableMinions", amount: 100 },
                    { resource: "darkCapital", amount: 50 }
                ],
                isPurchased: false, // Initial state
                isUnlocked: false, // Initial state
                applyEffect: function() { /* e.g., add a global multiplier */ },
                unlockRequirement: { type: "research", id: "someFutureResearch"}
            }
        ],
        currentResearchTier: 1, // Initial state
    };
}

// The main gameData variable that the game will use and modify.
// Initialize it with a fresh copy of definitions.
let gameData = getInitialGameDefinitions(); // Changed from const to let

// Function to calculate current cost of an item (generator, facility)
function calculateCost(item) {
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.owned));
}

// Function to calculate MPS
function calculateMPS() {
    let totalMPS = 0;
    gameData.idleGenerators.forEach(gen => {
        if (gen.isUnlocked) {
            totalMPS += gen.owned * gen.mpPerSecond; // gen.level removed for now, assume mpPerSecond is flat per generator
        }
    });
    return totalMPS;
}

// Function to calculate secondary resource generation
function calculateSecondaryResourcePS() {
    // Reset perSecond for all
    for (const key in gameData.secondaryResources) {
        gameData.secondaryResources[key].perSecond = 0;
    }

    gameData.productionFacilities.forEach(fac => {
        if (fac.isUnlocked && fac.owned > 0) {
            if (gameData.secondaryResources[fac.generates]) {
                gameData.secondaryResources[fac.generates].perSecond += fac.owned * fac.amountPerSecond;
            }
        }
    });
}
