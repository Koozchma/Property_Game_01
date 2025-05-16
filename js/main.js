// js/main.js (TEMPORARY DEBUG VERSION)

const GameLogic = {
    init: function() {
        console.log("[DEBUG] GameLogic.init function has started.");
        console.log("[DEBUG] Attempting to find element with ID 'manipulate-image'...");

        const manipulateImageElement = document.getElementById('manipulate-image');

        if (manipulateImageElement) {
            console.log("[DEBUG] SUCCESS: Element 'manipulate-image' was FOUND in the HTML.", manipulateImageElement);
            try {
                manipulateImageElement.addEventListener('click', function() {
                    console.log("[DEBUG] Manipulate image was CLICKED!");
                    // In a real scenario, you'd call: GameLogic.manualManipulate();
                });
                console.log("[DEBUG] Event listener ADDED to 'manipulate-image'.");
            } catch (e) {
                console.error("[DEBUG] ERROR adding event listener:", e);
            }
        } else {
            console.error("[DEBUG] FAILURE: Element 'manipulate-image' was NOT FOUND in the HTML by getElementById.");
        }

        console.log("[DEBUG] GameLogic.init function has finished.");
    }
    // manualManipulate, loadGame, etc. are not used in this temporary version
};

// This listener ensures the HTML is loaded before GameLogic.init runs
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded event has fired. The HTML should be ready.");
    GameLogic.init();
});
