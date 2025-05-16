// js/main.js

const GameLogic = {
    init: function() {
        console.log("Initializing Psychopath Game...");
        this.loadGame(); // Load game data or set defaults

        document.getElementById('manipulate-button').addEventListener('click', () => this.manualManipulate());
        document.getElementById('save-button').addEventListener('click', () => this.saveGame());
        document.getElementById('load-button').addEventListener('click', () => { this.loadGame(); UIManager.updateAll(); });
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());


        // Ensure all costs are correctly set initially based on owned amounts (important for loading)
        gameData.idleGenerators.forEach(gen => gen.cost = calculateCost(gen));
        gameData.productionFacilities.forEach(fac => fac.cost = calculateCost(fac));


        UIManager.updateAll();
        this.gameLoop();
    },

    manualManipulate: function() {
        gameData.mp += gameData.clickPower;
        UIManager.updateResourceDisplay();
        UIManager.renderIdleGenerators(); // Re-render to update button states if costs change due to MP
        UIManager.renderProductionFacilities();
        UIManager.renderResearchTree();
        UIManager.renderAssets();
    },

    buyIdleGenerator: function(generatorId) {
        const generator = gameData.idleGenerators.find(g => g.id === generatorId);
        if (generator && gameData.mp >= generator.cost) {
            gameData.mp -= generator.cost;
            generator.owned++;
            generator.level = generator.owned > 0 ? generator.owned : 1; // Simple level = owned for now
            generator.cost = calculateCost(generator); // Recalculate cost for next purchase
            gameData.mps = calculateMPS();
            UIManager.updateAll();
        }
    },

    buyProductionFacility: function(facilityId) {
        const facility = gameData.productionFacilities.find(f => f.id === facilityId);
        if (facility && facility.isUnlocked && gameData.mp >= facility.cost) {
            gameData.mp -= facility.cost;
            facility.owned++;
            facility.cost = calculateCost(facility);
            calculateSecondaryResourcePS(); // Recalculate secondary PS
            UIManager.updateAll();
        }
    },

    areResearchRequirementsMet: function(researchItem) {
        if (!researchItem.requirements || researchItem.requirements.length === 0) {
            return true;
        }
        return researchItem.requirements.every(req => {
            if (req.type === "research") {
                const requiredResearch = gameData.research.find(r => r.id === req.id);
                return requiredResearch && requiredResearch.isResearched;
            }
            if (req.type === "resource") {
                const resource = gameData.secondaryResources[req.id];
                return resource && resource.amount >= req.amount;
            }
            // Add other requirement types here if needed (e.g., specific building owned)
            return true; // Default to true if requirement type is unknown for now
        });
    },

    canAttemptResearch: function(researchId) {
        const item = gameData.research.find(r => r.id === researchId);
        if (!item) return false;

        // Check if it's in a locked tier that hasn't been unlocked yet
        if (item.tier > gameData.currentResearchTier) {
            // Check if ANY research that unlocks this tier has been completed
            const tierUnlockerMet = gameData.research.some(rUnlock =>
                rUnlock.isResearched && rUnlock.unlocks.some(u => u.type === "tier" && u.id === item.tier)
            );
            if (!tierUnlockerMet) return false;
        }
        return this.areResearchRequirementsMet(item);
    },

    buyResearch: function(researchId) {
        const item = gameData.research.find(r => r.id === researchId);
        if (item && !item.isResearched && gameData.mp >= item.cost && this.areResearchRequirementsMet(item)) {
            gameData.mp -= item.cost;
            item.isResearched = true;
            if (item.applyEffect) {
                item.applyEffect();
            }
            item.unlocks.forEach(unlock => {
                if (unlock.type === "generator") {
                    const gen = gameData.idleGenerators.find(g => g.id === unlock.id);
                    if (gen) gen.isUnlocked = true;
                } else if (unlock.type === "production") {
                    const fac = gameData.productionFacilities.find(f => f.id === unlock.id);
                    if (fac) fac.isUnlocked = true;
                } else if (unlock.type === "tier") {
                    if (unlock.id > gameData.currentResearchTier) {
                        gameData.currentResearchTier = unlock.id;
                        console.log("Unlocked research tier: ", gameData.currentResearchTier);
                    }
                } else if (unlock.type === "asset_unlock") { // New unlock type for assets
                    const asset = gameData.assets.find(a => a.id === unlock.id);
                    if (asset) asset.isUnlocked = true;
                }
                // Add more unlock types (e.g., new tabs, specific upgrades)
            });
            gameData.mps = calculateMPS(); // Recalculate if an effect changed MPS
            UIManager.updateAll();
        }
    },

    canAffordAsset: function(asset) {
        return asset.costs.every(costItem => {
            const resource = gameData.secondaryResources[costItem.resource];
            return resource && resource.amount >= costItem.amount;
        });
    },

    canUnlockAsset: function(assetId) {
        const asset = gameData.assets.find(a => a.id === assetId);
        if (!asset || asset.isUnlocked) return true; // Already unlocked or doesn't exist

        if (asset.unlockRequirement) {
            if (asset.unlockRequirement.type === "research") {
                const research = gameData.research.find(r => r.id === asset.unlockRequirement.id);
                return research && research.isResearched;
            }
            // Add other unlock types like resource amounts, etc.
        }
        return false; // Default to not unlockable if no specific criteria met and not explicitly unlocked
    },

    unlockAsset: function(assetId) {
        const asset = gameData.assets.find(a => a.id === assetId);
        if (asset && !asset.isUnlocked) {
            if (this.canUnlockAsset(assetId)) {
                asset.isUnlocked = true;
                // UIManager.renderAssets(); // May cause recursion if called from renderAssets, handled by updateAll
            }
        }
    },

    buyAsset: function(assetId) {
        const asset = gameData.assets.find(a => a.id === assetId);
        if (asset && asset.isUnlocked && !asset.isPurchased && this.canAffordAsset(asset)) {
            // Deduct costs
            asset.costs.forEach(costItem => {
                gameData.secondaryResources[costItem.resource].amount -= costItem.amount;
            });
            asset.isPurchased = true;
            if (asset.applyEffect) {
                asset.applyEffect();
            }
            calculateSecondaryResourcePS(); // In case the asset affects production
            UIManager.updateAll();
        }
    },

    updatePerSecond: function() {
        // MP from generators
        gameData.mps = calculateMPS();
        gameData.mp += gameData.mps / (1000 / this.tickRate); // Distribute MPS over ticks

        // Secondary resources from facilities
        calculateSecondaryResourcePS();
        for (const key in gameData.secondaryResources) {
            const res = gameData.secondaryResources[key];
            res.amount += res.perSecond / (1000 / this.tickRate);
        }
    },

    gameLoop: function() {
        this.tickRate = 100; // How often the game updates in ms (e.g., 100ms = 10 times per second)

        setInterval(() => {
            this.updatePerSecond();
            UIManager.updateResourceDisplay();
            UIManager.updateSecondaryResourceDisplay(); // Often updated resources

            // Less frequent UI updates for buy buttons (affordability checks)
            // Can be optimized further if performance becomes an issue
            if (this.frameCount % 5 === 0) { // Update these every 5 ticks (0.5 seconds)
                 UIManager.renderIdleGenerators();
                 UIManager.renderProductionFacilities();
                 UIManager.renderResearchTree(); // Research buttons depend on MP and requirements
                 UIManager.renderAssets();
            }

            this.frameCount = (this.frameCount || 0) + 1;
        }, this.tickRate);
    },
    frameCount: 0,

    saveGame: function() {
        try {
            const fullGameData = {
                mp: gameData.mp,
                clickPower: gameData.clickPower,
                secondaryResources: JSON.parse(JSON.stringify(gameData.secondaryResources)), // Deep copy
                idleGeneratorsOwned: gameData.idleGenerators.map(g => ({ id: g.id, owned: g.owned, isUnlocked: g.isUnlocked })),
                productionFacilitiesOwned: gameData.productionFacilities.map(f => ({ id: f.id, owned: f.owned, isUnlocked: f.isUnlocked })),
                researchResearched: gameData.research.map(r => ({ id: r.id, isResearched: r.isResearched })),
                assetsStatus: gameData.assets.map(a => ({ id: a.id, isPurchased: a.isPurchased, isUnlocked: a.isUnlocked })),
                currentResearchTier: gameData.currentResearchTier,
            };
            localStorage.setItem('psychopathGameSave', JSON.stringify(fullGameData));
            console.log("Game Saved!");
            alert("Game Saved!");
        } catch (e) {
            console.error("Error saving game:", e);
            alert("Error saving game. Check console for details.");
        }
    },

    loadGame: function() {
        const savedGame = localStorage.getItem('psychopathGameSave');
        if (savedGame) {
            try {
                const loadedData = JSON.parse(savedGame);
                console.log("Loading game data:", loadedData);

                gameData.mp = loadedData.mp || 0;
                gameData.clickPower = loadedData.clickPower || 1;
                gameData.currentResearchTier = loadedData.currentResearchTier || 1;

                if (loadedData.secondaryResources) {
                    for (const key in loadedData.secondaryResources) {
                        if (gameData.secondaryResources[key]) {
                            gameData.secondaryResources[key].amount = loadedData.secondaryResources[key].amount || 0;
                            // perSecond will be recalculated
                        }
                    }
                }


                loadedData.idleGeneratorsOwned.forEach(savedGen => {
                    const gameGen = gameData.idleGenerators.find(g => g.id === savedGen.id);
                    if (gameGen) {
                        gameGen.owned = savedGen.owned || 0;
                        gameGen.isUnlocked = savedGen.isUnlocked === undefined ? (gameGen.cost <= 10) : savedGen.isUnlocked; // Default unlock for first item or from save
                        gameGen.cost = calculateCost(gameGen); // Recalculate cost
                        gameGen.level = gameGen.owned > 0 ? gameGen.owned : 1;
                    }
                });

                loadedData.productionFacilitiesOwned.forEach(savedFac => {
                    const gameFac = gameData.productionFacilities.find(f => f.id === savedFac.id);
                    if (gameFac) {
                        gameFac.owned = savedFac.owned || 0;
                        gameFac.isUnlocked = savedFac.isUnlocked || false;
                        gameFac.cost = calculateCost(gameFac);
                    }
                });

                loadedData.researchResearched.forEach(savedResearch => {
                    const gameResearch = gameData.research.find(r => r.id === savedResearch.id);
                    if (gameResearch) {
                        gameResearch.isResearched = savedResearch.isResearched || false;
                        if (gameResearch.isResearched && gameResearch.applyEffect) {
                             // Re-apply non-state-modifying effects or ensure state is correctly restored
                             // Be careful with effects that add values (like clickPower) as they might be applied twice
                             // For simplicity now, effects are applied when bought. We ensure clickPower is directly loaded.
                        }
                         // Ensure dependent unlocks are processed
                        if (gameResearch.isResearched) {
                            gameResearch.unlocks.forEach(unlock => {
                                if (unlock.type === "generator") {
                                    const gen = gameData.idleGenerators.find(g => g.id === unlock.id);
                                    if (gen) gen.isUnlocked = true;
                                } else if (unlock.type === "production") {
                                    const fac = gameData.productionFacilities.find(f => f.id === unlock.id);
                                    if (fac) fac.isUnlocked = true;
                                } else if (unlock.type === "tier") {
                                     if (unlock.id > gameData.currentResearchTier) gameData.currentResearchTier = unlock.id;
                                } else if (unlock.type === "asset_unlock") {
                                    const asset = gameData.assets.find(a => a.id === unlock.id);
                                    if (asset) asset.isUnlocked = true;
                                }
                            });
                        }
                    }
                });
                 // Re-apply research effects carefully if they are not simply unlocks
                // This part is tricky, better to load clickPower directly if it's a direct state.
                // For now, we assume clickPower is loaded directly.
                // Let's rebuild clickPower based on researched items to be safe.
                gameData.clickPower = 1; // Reset to base
                gameData.research.forEach(r => {
                    if (r.isResearched && r.id === "basicPersuasion") { // Example specific effect re-application logic
                        if(r.applyEffect.toString().includes("gameData.clickPower += 1")) { // simple check
                           // gameData.clickPower += 1; // This was loaded directly, so skip for now
                        }
                    }
                    // Add other specific persistent effect re-applications if necessary.
                });
                gameData.clickPower = loadedData.clickPower || 1; // Prioritize loaded value

                if (loadedData.assetsStatus) {
                    loadedData.assetsStatus.forEach(savedAsset => {
                        const gameAsset = gameData.assets.find(a => a.id === savedAsset.id);
                        if (gameAsset) {
                            gameAsset.isPurchased = savedAsset.isPurchased || false;
                            gameAsset.isUnlocked = savedAsset.isUnlocked || false;
                            // Re-apply asset effects if necessary and they are persistent
                        }
                    });
                }


                gameData.mps = calculateMPS();
                calculateSecondaryResourcePS();
                console.log("Game Loaded!");
            } catch (e) {
                console.error("Error loading game:", e);
                alert("Error loading saved game. It might be corrupted. Starting new game.");
                this.setDefaultGameData(); // Reset to defaults if load fails
            }
        } else {
            console.log("No saved game found. Starting new game.");
            this.setDefaultGameData();
        }
        UIManager.updateAll();
    },

    setDefaultGameData: function() {
        // This function should reset gameData to its initial state,
        // similar to how it's defined in gamedata.js but ensuring all 'owned', 'isResearched' etc. are default.
        // For simplicity, we'll re-initialize parts of gameData. A more robust way would be to clone the initial gamedata object.

        gameData.mp = 0;
        gameData.clickPower = 1;
        gameData.mps = 0;
        gameData.currentResearchTier = 1;

        for (const key in gameData.secondaryResources) {
            gameData.secondaryResources[key].amount = 0;
            gameData.secondaryResources[key].perSecond = 0;
        }

        gameData.idleGenerators.forEach(gen => {
            gen.owned = 0;
            gen.cost = gen.baseCost;
            gen.level = 1;
            // isUnlocked should respect its initial definition in gamedata.js
            const initialGen = originalGameData.idleGenerators.find(ig => ig.id === gen.id);
            if (initialGen) gen.isUnlocked = initialGen.isUnlocked;
        });

        gameData.productionFacilities.forEach(fac => {
            fac.owned = 0;
            fac.cost = fac.baseCost;
            const initialFac = originalGameData.productionFacilities.find(pf => pf.id === fac.id);
            if (initialFac) fac.isUnlocked = initialFac.isUnlocked;

        });

        gameData.research.forEach(res => {
            res.isResearched = false;
            const initialRes = originalGameData.research.find(ir => ir.id === res.id);
            if (initialRes) res.isInitiallyLocked = initialRes.isInitiallyLocked;
        });

        gameData.assets.forEach(as => {
            as.isPurchased = false;
            const initialAsset = originalGameData.assets.find(ia => ia.id === as.id);
            if (initialAsset) as.isUnlocked = initialAsset.isUnlocked;
        });

        gameData.mps = calculateMPS();
        calculateSecondaryResourcePS();
    },

    resetGame: function() {
        if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
            localStorage.removeItem('psychopathGameSave');
            // Create a deep copy of the initial gameData state to reset to
            // This requires originalGameData to be a snapshot of the initial state.
            // For now, we'll call setDefaultGameData which approximates this.
            this.setDefaultGameData();
            gameData.clickPower = 1; // Ensure click power also resets
            gameData.research.find(r => r.id === "basicPersuasion").isResearched = false; // example specific reset
            console.log("Game Reset!");
            UIManager.updateAll();
        }
    }
};

// Store a deep copy of the initial gameData for resetting purposes
// This needs to be done carefully. JSON stringify/parse is a common way for deep copy if no functions.
// Since gamedata.js has functions, a more sophisticated deep copy or manual reset is needed.
// For this iteration, setDefaultGameData will manually reset known values.
let originalGameData = JSON.parse(JSON.stringify(gameData)); // This will strip functions, be careful
// A better way for reset might be to re-initialize from a template or reload the page and not load save.
// For the reset function, we'll do a more direct re-initialization:
const initialClickPower = 1;
const initialGeneratorsState = gameData.idleGenerators.map(g => ({ ...g, owned: 0, cost: g.baseCost, level: 1 }));
const initialFacilitiesState = gameData.productionFacilities.map(f => ({ ...f, owned: 0, cost: f.baseCost }));
const initialResearchState = gameData.research.map(r => ({ ...r, isResearched: false }));
const initialAssetsState = gameData.assets.map(a => ({...a, isPurchased: false}));

// Override parts of setDefaultGameData to use these truly initial states
GameLogic.setDefaultGameData = function() {
    gameData.mp = 0;
    gameData.clickPower = initialClickPower;
    gameData.mps = 0;
    gameData.currentResearchTier = 1;

    for (const key in gameData.secondaryResources) {
        gameData.secondaryResources[key].amount = 0;
        gameData.secondaryResources[key].perSecond = 0;
    }

    gameData.idleGenerators.forEach((gen, index) => {
        Object.assign(gen, JSON.parse(JSON.stringify(originalGameData.idleGenerators[index]))); // Deep copy default state
        gen.owned = 0;
        gen.cost = gen.baseCost;
        gen.level = 1;
    });

    gameData.productionFacilities.forEach((fac, index) => {
        Object.assign(fac, JSON.parse(JSON.stringify(originalGameData.productionFacilities[index])));
        fac.owned = 0;
        fac.cost = fac.baseCost;
    });

    gameData.research.forEach((res, index) => {
         Object.assign(res, JSON.parse(JSON.stringify(originalGameData.research[index]))); // This loses functions, so be careful.
         // Manually copy functions if needed or re-establish them.
         // For now, we restore applyEffect from the live gameData definition if it's missing.
        const liveResDef = window.gameData.research.find(r => r.id === res.id);
        if (liveResDef && !res.applyEffect) res.applyEffect = liveResDef.applyEffect;
        res.isResearched = false;

    });

     gameData.assets.forEach((asset, index) => {
        Object.assign(asset, JSON.parse(JSON.stringify(originalGameData.assets[index])));
        const liveAssetDef = window.gameData.assets.find(a => a.id === asset.id);
        if (liveAssetDef && !asset.applyEffect) asset.applyEffect = liveAssetDef.applyEffect;
        asset.isPurchased = false;
    });


    gameData.mps = calculateMPS();
    calculateSecondaryResourcePS();
    // Ensure the originalGameData (used for reset) is truly the pristine initial state
    // This is tricky because originalGameData is a snapshot at a point in time.
    // Simplest for full reset is often to reload the page and clear storage.
    // For this setup, we're trying to do it in-place.
};


// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make a pristine copy of gameData *before* any modifications (like loading from save)
    // Storing a copy of the initial state of `gameData` before it's modified by `loadGame`
    // This is a bit tricky because gamedata.js defines the initial state globally.
    // GameLogic.init() will call loadGame(), which modifies gameData.
    // So, we need a clean copy *before* GameLogic.init().
    // The 'originalGameData' above is one attempt.
    // For a truly robust reset, it might be easier to store the gamedata definitions in a function
    // that returns a fresh object, or deep clone before any mutation.

    // For now, the originalGameData established above will serve this purpose,
    // assuming it's run before any other script heavily modifies gameData structure.
    // Let's re-capture it here to be sure it's from the fresh gamedata.js load.
    originalGameData = {
        mp: 0, clickPower: 1, mps: 0, currentResearchTier: 1,
        secondaryResources: JSON.parse(JSON.stringify(gameData.secondaryResources)),
        idleGenerators: JSON.parse(JSON.stringify(gameData.idleGenerators)),
        productionFacilities: JSON.parse(JSON.stringify(gameData.productionFacilities)),
        research: JSON.parse(JSON.stringify(gameData.research)), // Functions will be lost here!
        assets: JSON.parse(JSON.stringify(gameData.assets)) // Functions will be lost here!
    };
    // Due to functions being lost in JSON.parse(JSON.stringify()), the reset logic for research/assets
    // needs to carefully re-assign functions from the original definitions if they are needed post-reset.
    // The current GameLogic.setDefaultGameData attempts this.

    GameLogic.init();
});
