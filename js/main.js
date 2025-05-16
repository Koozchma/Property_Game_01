// js/main.js

const GameLogic = {
    init: function() {
        console.log("Initializing Psychopath Game...");
        this.loadGame();

        // Updated event listener to the image
        const manipulateImageElement = document.getElementById('manipulate-image');
        if (manipulateImageElement) {
            manipulateImageElement.addEventListener('click', () => this.manualManipulate());
        } else {
            console.error("Manipulate image element not found!");
        }

        document.getElementById('save-button').addEventListener('click', () => this.saveGame());
        document.getElementById('load-button').addEventListener('click', () => { this.loadGame(); });
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());

        this.gameLoop();
    },

    manualManipulate: function() {
        gameData.mp += gameData.clickPower;
        // Optional: Trigger JS-based animation if you prefer it over pure CSS :active
        // UIManager.triggerClickAnimation();
        UIManager.updateAll(); // This will update MP count and also click power display text
    },

    // ... (rest of GameLogic object remains the same)

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
                    }
                } else if (unlock.type === "asset_unlock") {
                    const asset = gameData.assets.find(a => a.id === unlock.id);
                    if (asset) asset.isUnlocked = true;
                }
            });
            gameData.mps = calculateMPS();
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
            UIManager.updateResourceDisplay(); // MP, MPS, Click Power
            UIManager.updateSecondaryResourceDisplay();

            if (this.frameCount % 5 === 0) {
                 UIManager.renderIdleGenerators();
                 UIManager.renderProductionFacilities();
                 UIManager.renderResearchTree();
                 UIManager.renderAssets();
            }
            this.frameCount = (this.frameCount + 1) % 1000;
        }, this.tickRate);
    },

    saveGame: function() {
        try {
            const saveData = {
                mp: gameData.mp,
                clickPower: gameData.clickPower,
                currentResearchTier: gameData.currentResearchTier,
                secondaryResources: {},
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
        gameData = getInitialGameDefinitions();
        gameData.mps = calculateMPS();
        calculateSecondaryResourcePS();
        console.log("Default game data set.");
        UIManager.updateAll();
    },

    loadGame: function() {
        const savedGame = localStorage.getItem('psychopathGameSave');
        if (savedGame) {
            try {
                const loadedData = JSON.parse(savedGame);
                console.log("Loading game data:", loadedData);
                gameData = getInitialGameDefinitions();

                gameData.mp = loadedData.mp || 0;
                gameData.clickPower = loadedData.clickPower || gameData.clickPower;
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
                            gameGen.isUnlocked = typeof savedGen.isUnlocked === 'boolean' ? savedGen.isUnlocked : gameGen.isUnlocked;
                            gameGen.cost = calculateCost(gameGen);
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
                }

                if (loadedData.assetsStatus) {
                    loadedData.assetsStatus.forEach(savedAsset => {
                        const gameAsset = gameData.assets.find(a => a.id === savedAsset.id);
                        if (gameAsset) {
                            gameAsset.isPurchased = savedAsset.isPurchased || false;
                            gameAsset.isUnlocked = typeof savedAsset.isUnlocked === 'boolean' ? savedAsset.isUnlocked : gameAsset.isUnlocked;
                        }
                    });
                }
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
        UIManager.updateAll();
    },

    resetGame: function() {
        if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
            localStorage.removeItem('psychopathGameSave');
            this.setDefaultGameData();
            console.log("Game Reset!");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GameLogic.init();
});
