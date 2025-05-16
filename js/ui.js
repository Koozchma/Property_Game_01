// js/ui.js

const UIManager = {
    elements: {
        mpCount: document.getElementById('mp-count'),
        mpsCount: document.getElementById('mps-count'),
        clickPowerDisplay: document.getElementById('click-power-display'),
        idleGeneratorsDiv: document.getElementById('idle-generators'),
        researchTreeDiv: document.getElementById('research-tree'),
        secondaryResourcesDiv: document.getElementById('secondary-resources'),
        productionFacilitiesDiv: document.getElementById('production-facilities'),
        assetsDiv: document.getElementById('game-assets'),
    },

    updateResourceDisplay: function() {
        this.elements.mpCount.textContent = formatNumber(gameData.mp);
        this.elements.mpsCount.textContent = formatNumber(gameData.mps, 2);
        this.elements.clickPowerDisplay.textContent = formatNumber(gameData.clickPower);
    },

    updateSecondaryResourceDisplay: function() {
        this.elements.secondaryResourcesDiv.innerHTML = '<h3>Secondary Resources</h3>';
        let hasVisibleResource = false;
        for (const key in gameData.secondaryResources) {
            const res = gameData.secondaryResources[key];
            // Only display if owned, or if a facility producing it is unlocked, or if it's part of a cost for something unlocked
            let shouldDisplay = res.amount > 0 || res.perSecond > 0;
            if (!shouldDisplay) {
                 // Check if any unlocked production facility produces this
                if (gameData.productionFacilities.some(pf => pf.isUnlocked && pf.generates === key)) {
                    shouldDisplay = true;
                }
                // Check if any unlocked asset requires this
                if (!shouldDisplay && gameData.assets.some(a => a.isUnlocked && a.costs.some(c => c.resource === key))) {
                    shouldDisplay = true;
                }
            }


            if (shouldDisplay) {
                hasVisibleResource = true;
                const resDiv = document.createElement('div');
                resDiv.classList.add('resource-line');
                resDiv.innerHTML = `${res.name} (${res.symbol}): ${formatNumber(res.amount)} (${formatNumber(res.perSecond, 2)}/s)`;
                this.elements.secondaryResourcesDiv.appendChild(resDiv);
            }
        }
         this.elements.secondaryResourcesDiv.style.display = hasVisibleResource ? 'block' : 'none';
         document.getElementById('production-column').style.display = hasVisibleResource || gameData.productionFacilities.some(pf => pf.isUnlocked) ? 'flex' : 'none';

    },

    renderIdleGenerators: function() {
        this.elements.idleGeneratorsDiv.innerHTML = '<h3>Idle MP Generators</h3>';
        gameData.idleGenerators.forEach(gen => {
            if (!gen.isUnlocked) return;

            const genDiv = document.createElement('div');
            genDiv.classList.add('item-container');
            genDiv.id = `gen-${gen.id}`;

            genDiv.innerHTML = `
                <div class="name">${gen.name} (Lvl ${gen.level})</div>
                <div class="description">${gen.description}</div>
                <div class="stats">Generates: ${formatNumber(gen.mpPerSecond * gen.level, 2)} MP/s each</div>
                <div class="owned">Owned: ${gen.owned}</div>
                <div class="cost">Cost: ${formatNumber(calculateCost(gen))} MP</div>
                <button id="buy-${gen.id}">Buy 1</button>
            `;
            this.elements.idleGeneratorsDiv.appendChild(genDiv);

            document.getElementById(`buy-${gen.id}`).addEventListener('click', () => GameLogic.buyIdleGenerator(gen.id));
        });
    },

    renderProductionFacilities: function() {
        this.elements.productionFacilitiesDiv.innerHTML = '<h3>Production Facilities</h3>';
        let hasVisibleFacility = false;
        gameData.productionFacilities.forEach(fac => {
            if (!fac.isUnlocked) return;
            hasVisibleFacility = true;

            const facDiv = document.createElement('div');
            facDiv.classList.add('item-container');
            facDiv.id = `fac-${fac.id}`;
            const resourceGenerated = gameData.secondaryResources[fac.generates];

            facDiv.innerHTML = `
                <div class="name">${fac.name}</div>
                <div class="description">${fac.description}</div>
                <div class="stats">Generates: ${formatNumber(fac.amountPerSecond, 2)} ${resourceGenerated ? resourceGenerated.symbol : ''}/s each</div>
                <div class="owned">Owned: ${fac.owned}</div>
                <div class="cost">Cost: ${formatNumber(calculateCost(fac))} MP</div>
                <button id="buy-${fac.id}">Acquire (MP)</button>
            `;
            this.elements.productionFacilitiesDiv.appendChild(facDiv);
            document.getElementById(`buy-${fac.id}`).addEventListener('click', () => GameLogic.buyProductionFacility(fac.id));
        });
        this.elements.productionFacilitiesDiv.style.display = hasVisibleFacility ? 'block' : 'none';
    },

    renderResearchTree: function() {
        this.elements.researchTreeDiv.innerHTML = ''; // Clear before re-rendering
        gameData.research
            .filter(r => !r.isInitiallyLocked || (r.isInitiallyLocked && gameData.currentResearchTier >= r.tier))
            .filter(r => { // Filter based on requirements
                if (r.isResearched) return true; // Always show researched items
                return GameLogic.canAttemptResearch(r.id);
            })
            .sort((a,b) => a.tier - b.tier || (a.isResearched - b.isResearched)) // Sort by tier, then by researched status
            .forEach(item => {
                if (item.tier > gameData.currentResearchTier && !item.isResearched && !GameLogic.areResearchRequirementsMet(item)) {
                    // Don't display research from future tiers if its direct unlock requirement (like "Advanced Scheming") isn't met
                     const isTierUnlockerMet = gameData.research.some(rUnlock =>
                        rUnlock.isResearched && rUnlock.unlocks.some(u => u.type === "tier" && u.id === item.tier)
                    );
                    if (!isTierUnlockerMet) return;
                }


                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item-container', 'research-item');
                itemDiv.id = `research-${item.id}`;
                if (item.isResearched) {
                    itemDiv.classList.add('researched');
                }

                let requirementsText = "";
                if (item.requirements && item.requirements.length > 0) {
                    requirementsText = "Requires: ";
                    item.requirements.forEach((req, index) => {
                        if (req.type === "research") {
                            const reqItem = gameData.research.find(r => r.id === req.id);
                            requirementsText += `${reqItem ? reqItem.name : 'Unknown Research'}`;
                        } else if (req.type === "resource") {
                            const res = gameData.secondaryResources[req.id];
                            requirementsText += `${req.amount} ${res ? res.name : req.id}`;
                        }
                        if (index < item.requirements.length - 1) requirementsText += ", ";
                    });
                }


                itemDiv.innerHTML = `
                    <div class="name">${item.name} (Tier ${item.tier})</div>
                    <div class="description">${item.description}</div>
                    ${requirementsText ? `<div class="description">${requirementsText}</div>` : ''}
                    <div class="cost">Cost: ${formatNumber(item.cost)} MP</div>
                    <button id="research-btn-${item.id}" ${item.isResearched ? 'disabled' : ''}>
                        ${item.isResearched ? 'Researched' : 'Research'}
                    </button>
                `;
                this.elements.researchTreeDiv.appendChild(itemDiv);

                if (!item.isResearched) {
                    const button = document.getElementById(`research-btn-${item.id}`);
                    button.addEventListener('click', () => GameLogic.buyResearch(item.id));
                    // Disable button if requirements not met or not enough MP
                    if (!GameLogic.areResearchRequirementsMet(item) || gameData.mp < item.cost) {
                        button.disabled = true;
                    }
                }
        });
    },

    renderAssets: function() {
        this.elements.assetsDiv.innerHTML = '<h3>Major Assets</h3>';
        let hasVisibleAsset = false;
        gameData.assets.forEach(asset => {
            if (!asset.isUnlocked && !GameLogic.canUnlockAsset(asset.id)) return; // Don't show if not unlockable yet

            // If not unlocked but unlockable, show it as such, otherwise proceed
            if (!asset.isUnlocked) {
                 // For now, all assets will be displayed if their research unlock is met.
                 // More complex unlock logic can be added later.
                const unlockReq = asset.unlockRequirement;
                if (unlockReq && unlockReq.type === "research") {
                    const researchItem = gameData.research.find(r => r.id === unlockReq.id);
                    if (!researchItem || !researchItem.isResearched) return; // Hide if unlock research not done
                }
                // If we reach here, it means it should be unlocked if not already
                GameLogic.unlockAsset(asset.id); // Attempt to unlock it based on its own criteria
                if (!asset.isUnlocked) return; // If still not unlocked after attempt, hide
            }
            hasVisibleAsset = true;


            const assetDiv = document.createElement('div');
            assetDiv.classList.add('item-container', 'asset-item');
            assetDiv.id = `asset-${asset.id}`;
            if (asset.isPurchased) {
                assetDiv.classList.add('purchased'); // You'll need CSS for .purchased
            }

            let costText = "Cost: ";
            asset.costs.forEach((costItem, index) => {
                const resource = gameData.secondaryResources[costItem.resource] || { name: costItem.resource, symbol: costItem.resource.toUpperCase() };
                costText += `${formatNumber(costItem.amount)} ${resource.symbol}`;
                if (index < asset.costs.length - 1) costText += ", ";
            });

            assetDiv.innerHTML = `
                <div class="name">${asset.name}</div>
                <div class="description">${asset.description}</div>
                <div class="cost">${costText}</div>
                <button id="buy-asset-${asset.id}" ${asset.isPurchased ? 'disabled' : ''}>
                    ${asset.isPurchased ? 'Acquired' : 'Acquire Asset'}
                </button>
            `;
            this.elements.assetsDiv.appendChild(assetDiv);

            if (!asset.isPurchased) {
                document.getElementById(`buy-asset-${asset.id}`).addEventListener('click', () => GameLogic.buyAsset(asset.id));
                // Disable button if costs not met
                if (!GameLogic.canAffordAsset(asset)) {
                     document.getElementById(`buy-asset-${asset.id}`).disabled = true;
                }
            }
        });
         this.elements.assetsDiv.style.display = hasVisibleAsset ? 'block' : 'none';
         document.getElementById('assets-column').style.display = hasVisibleAsset ? 'flex' : 'none';
    },


    updateAll: function() {
        this.updateResourceDisplay();
        this.updateSecondaryResourceDisplay(); // Needs to be called before rendering items that might depend on its visibility
        this.renderIdleGenerators();
        this.renderProductionFacilities(); // Render before research if research depends on production visibility
        this.renderResearchTree(); // Research might unlock production/assets
        this.renderAssets(); // Assets might be unlocked by research

        // Initial hide for columns that might be empty
        if (!gameData.productionFacilities.some(pf => pf.isUnlocked) && Object.values(gameData.secondaryResources).every(sr => sr.amount === 0)) {
            document.getElementById('production-column').style.display = 'none';
        }
        if (!gameData.assets.some(a => a.isUnlocked || a.isPurchased)) {
            document.getElementById('assets-column').style.display = 'none';
        }
    }
};

// Helper function for formatting numbers (simple version)
function formatNumber(num, decimals = 0) {
    if (num === undefined || num === null) return '0';
    if (num < 1000 && decimals === 0) return num.toFixed(0);
    if (num < 1000) return num.toFixed(decimals);

    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"]; // Add more if needed
    const i = Math.floor(Math.log10(Math.abs(num)) / 3);
    const scaled = num / Math.pow(1000, i);
    const fixedDecimals = i === 0 ? decimals : Math.max(0, Math.min(2, decimals - (scaled >= 100 ? 2 : (scaled >= 10 ? 1 : 0)) )); // Adjust decimals for larger numbers
    return scaled.toFixed(fixedDecimals) + suffixes[i];
}
