// Metropolis Estates - properties.js

// --- Property Definitions ---
const PROPERTY_TYPES = [
    {
        id: "shack",
        name: "Dilapidated Shack",
        cost: 50,
        baseRPS: 0.5,
        maxLevel: 5,
        description: "It's a roof, mostly. Generates minimal rent.",
        upgrades: [ // Future use: define specific upgrades here
            { name: "Patch Roof", cost: 20, rpsBoost: 0.1 },
            { name: "Board Windows", cost: 30, rpsBoost: 0.15 },
        ]
    },
    {
        id: "small_apartment",
        name: "Small Apartment Unit",
        cost: 250,
        baseRPS: 3,
        maxLevel: 10,
        description: "A basic living unit. A steady, small earner.",
        upgrades: []
    },
    {
        id: "trailer_home",
        name: "Trailer Home",
        cost: 600,
        baseRPS: 7,
        maxLevel: 8,
        description: "Mobile, but not going anywhere. Decent income.",
        upgrades: []
    },
    {
        id: "suburban_house",
        name: "Suburban House",
        cost: 1500,
        baseRPS: 15,
        maxLevel: 15,
        description: "The classic family home. Reliable returns.",
        upgrades: []
    },
    {
        id: "corner_store",
        name: "Small Corner Store",
        cost: 3500,
        baseRPS: 30,
        maxLevel: 12,
        description: "Sells essentials to the neighborhood. Good cash flow.",
        upgrades: []
    }
    // Add more property types here later
];

// --- Game State for Properties ---
let ownedProperties = []; // Array to store instances of owned properties
let nextPropertyId = 0; // To give each owned property a unique ID

// --- Functions ---
function getPropertyTypeById(id) {
    return PROPERTY_TYPES.find(prop => prop.id === id);
}

function buyProperty(propertyTypeId) {
    const propertyType = getPropertyTypeById(propertyTypeId);
    if (!propertyType) {
        logMessage("Error: Property type not found.", "error");
        return false;
    }

    if (gameState.cash >= propertyType.cost) {
        gameState.cash -= propertyType.cost;

        const newProperty = {
            uniqueId: nextPropertyId++, // Unique ID for this specific instance
            typeId: propertyType.id,
            name: propertyType.name,
            level: 1,
            currentRPS: propertyType.baseRPS,
            purchaseCost: propertyType.cost,
            // Add more instance-specific details here if needed later (e.g., individual upgrade levels)
        };
        ownedProperties.push(newProperty);

        updateGameData(); // Recalculate RPS and update UI
        logMessage(`Purchased ${propertyType.name} for $${propertyType.cost.toLocaleString()}.`, "success");
        return true;
    } else {
        logMessage(`Not enough cash to buy ${propertyType.name}. Need $${propertyType.cost.toLocaleString()}.`, "error");
        return false;
    }
}

function upgradePropertyInstance(ownedPropertyUniqueId, upgradeSlotIndex) {
    // Note: The 'upgradeSlotIndex' isn't fully used yet as detailed upgrades per property are basic.
    // This is a placeholder for more complex, individual property instance upgrades.

    const propertyInstance = ownedProperties.find(p => p.uniqueId === ownedPropertyUniqueId);
    if (!propertyInstance) {
        logMessage("Error: Could not find the property to upgrade.", "error");
        return;
    }

    const propertyType = getPropertyTypeById(propertyInstance.typeId);
    if (!propertyType) {
        logMessage("Error: Property type definition missing for upgrade.", "error");
        return;
    }

    // Basic Level Up Example (can be expanded with 'propertyType.upgrades')
    if (propertyInstance.level < propertyType.maxLevel) {
        const upgradeCost = propertyInstance.purchaseCost * 0.5 * Math.pow(1.5, propertyInstance.level -1); // Example cost scaling

        if (gameState.cash >= upgradeCost) {
            gameState.cash -= upgradeCost;
            propertyInstance.level++;
            // Increase RPS by a percentage of baseRPS per level, or a fixed amount.
            // Example: +20% of base RPS per level up from level 1.
            propertyInstance.currentRPS = propertyType.baseRPS * (1 + (propertyInstance.level - 1) * 0.20);
            // Ensure RPS is not fractional in an undesired way, round if necessary
            propertyInstance.currentRPS = parseFloat(propertyInstance.currentRPS.toFixed(2));


            updateGameData();
            logMessage(`${propertyInstance.name} (ID: ${propertyInstance.uniqueId}) upgraded to Level ${propertyInstance.level}. Cost: $${upgradeCost.toLocaleString()}.`, "success");
        } else {
            logMessage(`Not enough cash to upgrade ${propertyInstance.name}. Need $${upgradeCost.toLocaleString()}.`, "error");
        }
    } else {
        logMessage(`${propertyInstance.name} is already at max level (${propertyType.maxLevel}).`, "info");
    }
}


function calculateTotalRPS() {
    let totalRPS = 0;
    ownedProperties.forEach(prop => {
        totalRPS += prop.currentRPS;
    });
    return parseFloat(totalRPS.toFixed(2)); // Ensure two decimal places for currency
}

// Sell property function (basic implementation)
function sellPropertyInstance(ownedPropertyUniqueId) {
    const propertyIndex = ownedProperties.findIndex(p => p.uniqueId === ownedPropertyUniqueId);
    if (propertyIndex === -1) {
        logMessage("Error: Property not found to sell.", "error");
        return;
    }

    const propertyInstance = ownedProperties[propertyIndex];
    const sellPrice = propertyInstance.purchaseCost * 0.75; // Example: sell for 75% of original purchase price

    gameState.cash += sellPrice;
    ownedProperties.splice(propertyIndex, 1); // Remove from array

    updateGameData();
    logMessage(`Sold ${propertyInstance.name} for $${sellPrice.toLocaleString()}.`, "info");
}
