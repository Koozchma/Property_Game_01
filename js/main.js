// js/main.js

const GameLogic = {
    init: function() {
        console.log("Initializing Psychopath Game...");
        this.loadGame(); // Load game data or set defaults

        document.getElementById('manipulate-button').addEventListener('click', () => this.manualManipulate());
        document.getElementById('save-button').addEventListener('click', () => this.saveGame());
        document.getElementById('load-button').addEventListener('click', () => { this.loadGame(); /* UIManager.updateAll() is called within loadGame */ });
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());

        // Costs are calculated dynamically or upon load/purchase.
        // UIManager.updateAll() will render initial state.
        this.gameLoop();
    },

    manualManipulate: function() {
        gameData.mp += gameData.clickPower;
        // No need to call UIManager.updateAll() fully, just relevant parts if optimization needed.
        // For simplicity, updateAll is fine for now.
        UIManager.updateAll();
    },

    buyIdleGenerator: function(generatorId) {
        const generator = gameData.idleGenerators.find(g => g.id === generatorId);
        if (generator && gameData.mp >= generator.cost) {
            gameData.mp -= generator.cost;
            generator.owned++;
            generator.level = generator.owned > 0 ? generator.owned : 1;
            generator.cost = calculateCost(generator);
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
            calculateSecondaryResourcePS();
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
            return true;
        });
    },

    canAttemptResearch: function(researchId) {
        const item = gameData.research.find(r => r.id === researchId);
        if (!item) return false;

        if (item.tier > gameData.currentResearchTier) {
            const tierUnlockerMet = gameData.research.some(rUnlock =>
                rUnlock.isResearched && rUnlock.unlocks.some(u => u.type === "tier" && u.id === item.tier)
            );
            if (!tierUnlockerMet) return false;
        }
        //Also check if isInitiallyLocked is true and tier is > 1 but currentResearchTier is still 1
        if(item.isInitiallyLocked && item.tier > gameData.currentResearchTier && !item.requirements.some(r => r.type === "tier" && r.id === item.tier)) {
            //This condition means the item belongs to a higher tier that is not yet unlocked globally.
            //However, if the direct requirement IS the tier unlocker research, this check is redundant.
            //The tier > gameData.currentResearchTier check above should handle most of this.
        }

        return this.areResearchRequirementsMet(item);
    },

    buyResearch: function(researchId) {
        const item = gameData.research.find(r => r.id === researchId);
        if (item && !item.isResearched && gameData.mp >= item.cost && this.areResearchRequirementsMet(item)) {
            gameData.mp -= item.cost;
            item.isResearched = true;
            if (item.applyEffect) {
                item.applyEffect(); // This function will modify the global gameData
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
                    }
                } else if (unlock.type === "asset_unlock") {
                    const asset = gameData.assets.find(a => a.id === unlock.id);
                    if (asset) asset.isUnlocked = true;
                }
            });
            gameData.mps = calculateMPS(); // Recalculate if an effect changed MPS (e.g. new generator type)
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
        if (!asset || asset.isUnlocked) return true;

        if (asset.unlockRequirement) {
            if (asset.unlockRequirement.type === "research") {
                const research = gameData.research.find(r => r.id === asset.unlockRequirement.id);
                return research && research.isResearched;
            }
        }
        return false;
    },

    unlockAsset: function(assetId) {
        const asset = gameData.assets.find(a => a.id === assetId);
        if (asset && !asset.isUnlocked) {
            if (this.canUnlockAsset(assetId)) {
                asset.isUnlocked = true;
            }
        }
    },

    buyAsset: function(assetId) {
        const asset = gameData.assets.find(a => a.id === assetId);
        if (asset && asset.isUnlocked && !asset.isPurchased && this.canAffordAsset(asset)) {
            asset.costs.forEach(costItem => {
                gameData.secondaryResources[costItem.resource].amount -= costItem.amount;
            });
            asset.isPurchased = true;
            if (asset.applyEffect) {
                asset.applyEffect();
            }
            calculateSecondaryResourcePS();
            UIManager.updateAll();
        }
    },

    updatePerSecond: function() {
        gameData.mps = calculateMPS();
        gameData.mp += gameData.mps / (1000 / this.tickRate);

        calculateSecondaryResourcePS();
        for (const key in gameData.secondaryResources) {
            const res = gameData.secondaryResources[key];
            res.amount += res.perSecond / (1000 / this.tickRate);
        }
    },

    gameLoop: function() {
        this.tickRate = 100;
        this.frameCount = 0;

        setInterval(() => {
            this.updatePerSecond();
            UIManager.updateResourceDisplay();
            UIManager.updateSecondaryResourceDisplay();

            if (this.frameCount % 5 === 0) { // Update buy buttons/full lists less frequently
                 UIManager.renderIdleGenerators();
                 UIManager.renderProductionFacilities();
                 UIManager.renderResearchTree();
                 UIManager.renderAssets();
            }
            this.frameCount = (this.frameCount + 1) % 1000; // Modulo to prevent excessively large number
        }, this.tickRate);
    },

    saveGame: function() {
        try {
            // Save only the state, not the definitions with functions
            const saveData = {
                mp: gameData.mp,
                clickPower: gameData.clickPower,
                currentResearchTier: gameData.currentResearchTier,
                secondaryResources: {}, // Only save amounts
                idleGeneratorsOwned: gameData.idleGenerators.map(g => ({ id: g.id, owned: g.owned, isUnlocked: g.isUnlocked, level: g.level })),
                productionFacilitiesOwned: gameData.productionFacilities.map(f => ({ id: f.id, owned: f.owned, isUnlocked: f.isUnlocked })),
                researchResearched: gameData.research.map(r => ({ id: r.id, isResearched: r.isResearched })),
                assetsStatus: gameData.assets.map(a => ({ id: a.id, isPurchased: a.isPurchased, isUnlocked: a.isUnlocked })),
            };
            for (const key in gameData.secondaryResources) {
                saveData.secondaryResources[key] = { amount: gameData.secondaryResources[key].amount };
            }

            localStorage.setItem('psychopathGameSave', JSON.stringify(saveData));
            console.log("Game Saved!", saveData);
            alert("Game Saved!");
        } catch (e) {
            console.error("Error saving game:", e);
            alert("Error saving game. Check console for details.");
        }
    },

    setDefaultGameData: function() {
        console.log("Setting default game data...");
        gameData = getInitialGameDefinitions(); // This reassigns the global gameData to a pristine state

        // Ensure calculations are updated after reset
        gameData.mps = calculateMPS();
        calculateSecondaryResourcePS();
        console.log("Default game data set.");
        UIManager.updateAll(); // Update UI to reflect the reset state
    },

    loadGame: function() {
        const savedGame = localStorage.getItem('psychopathGameSave');
        if (savedGame) {
            try {
                const loadedData = JSON.parse(savedGame);
                console.log("Loading game data:", loadedData);

                // Start with a fresh gameData structure from definitions
                gameData = getInitialGameDefinitions();

                // Apply saved state
                gameData.mp = loadedData.mp || 0;
                gameData.clickPower = loadedData.clickPower || gameData.clickPower; // Default to initial if not in save
                gameData.currentResearchTier = loadedData.currentResearchTier || gameData.currentResearchTier;

                if (loadedData.secondaryResources) {
                    for (const key in loadedData.secondaryResources) {
                        if (gameData.secondaryResources[key] && loadedData.secondaryResources[key]) {
                            gameData.secondaryResources[key].amount = loadedData.secondaryResources[key].amount || 0;
                        }
                    }
                }

                if (loadedData.idleGeneratorsOwned) {
                    loadedData.idleGeneratorsOwned.forEach(savedGen => {
                        const gameGen = gameData.idleGenerators.find(g => g.id === savedGen.id);
                        if (gameGen) {
                            gameGen.owned = savedGen.owned || 0;
                            gameGen.level = savedGen.level || 1;
                            // Ensure isUnlocked is explicitly boolean from save, else use initial definition
                            gameGen.isUnlocked = typeof savedGen.isUnlocked === 'boolean' ? savedGen.isUnlocked : gameGen.isUnlocked;
                            gameGen.cost = calculateCost(gameGen); // Recalculate current cost
                        }
                    });
                }

                if (loadedData.productionFacilitiesOwned) {
                    loadedData.productionFacilitiesOwned.forEach(savedFac => {
                        const gameFac = gameData.productionFacilities.find(f => f.id === savedFac.id);
                        if (gameFac) {
                            gameFac.owned = savedFac.owned || 0;
                            gameFac.isUnlocked = typeof savedFac.isUnlocked === 'boolean' ? savedFac.isUnlocked : gameFac.isUnlocked;
                            gameFac.cost = calculateCost(gameFac);
                        }
                    });
                }

                if (loadedData.researchResearched) {
                    loadedData.researchResearched.forEach(savedResearch => {
                        const gameResearch = gameData.research.find(r => r.id === savedResearch.id);
                        if (gameResearch) {
                            gameResearch.isResearched = savedResearch.isResearched || false;
                            // Re-apply unlocks based on loaded research state
                            if (gameResearch.isResearched) {
                                // The applyEffect itself is part of the definition from getInitialGameDefinitions()
                                // gameResearch.applyEffect(); // NO! This applies the effect again. clickPower is loaded directly.
                                // Unlockables based on this research need to be re-processed for isUnlocked status
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
                }

                if (loadedData.assetsStatus) {
                    loadedData.assetsStatus.forEach(savedAsset => {
                        const gameAsset = gameData.assets.find(a => a.id === savedAsset.id);
                        if (gameAsset) {
                            gameAsset.isPurchased = savedAsset.isPurchased || false;
                            gameAsset.isUnlocked = typeof savedAsset.isUnlocked === 'boolean' ? savedAsset.isUnlocked : gameAsset.isUnlocked;
                            // if (gameAsset.isPurchased && gameAsset.applyEffect) gameAsset.applyEffect(); // Careful with re-applying asset effects
                        }
                    });
                }

                // Recalculate all derived stats
                gameData.mps = calculateMPS();
                calculateSecondaryResourcePS();
                console.log("Game Loaded Successfully!");

            } catch (e) {
                console.error("Error loading game:", e);
                alert("Error loading saved game. It might be corrupted. Starting new game.");
                this.setDefaultGameData();
            }
        } else {
            console.log("No saved game found. Starting new game.");
            this.setDefaultGameData();
        }
        UIManager.updateAll(); // Crucial: Update UI after gameData is fully set up
    },

    resetGame: function() {
        if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
            localStorage.removeItem('psychopathGameSave');
            this.setDefaultGameData(); // This now correctly resets gameData to initial definitions
            console.log("Game Reset!");
            // UIManager.updateAll() is called at the end of setDefaultGameData
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GameLogic.init();
});
