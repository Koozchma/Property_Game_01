// js/gamedata.js

let gameData = {
    manipulationPoints: 0,
    mpPerClick: 1,
    mps: 0, // Total Manipulation Points per second from generators

    idleGenerators: [
        {
            id: "whisperNetwork",
            name: "Whisper Network",
            description: "A few well-placed rumors can go a long way...",
            cost: 10,         // Initial cost
            baseCost: 10,     // For recalculating cost after purchase
            mps: 0.1,         // MP generated per second by one unit
            owned: 0,
            costMultiplier: 1.15 // How much the cost increases each time you buy one
        },
        {
            id: "exploitInsecurities",
            name: "Exploit Insecurities",
            description: "Everyone has a weak spot. Find it. Press it.",
            cost: 100,
            baseCost: 100,
            mps: 1,
            owned: 0,
            costMultiplier: 1.20
        }
        // Add more generators here later!
        // Example:
        // {
        //     id: "gaslightingRig",
        //     name: "Gaslighting Rig",
        //     description: "Make them doubt their own reality.",
        //     cost: 1000,
        //     baseCost: 1000,
        //     mps: 8,
        //     owned: 0,
        //     costMultiplier: 1.25
        // }
    ]
};
