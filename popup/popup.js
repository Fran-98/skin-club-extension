document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({ type: "getROI" }, (response) => {
        if (response && response.roiData) {
            document.getElementById("case-price").innerText = `Case Price: $${response.roiData.casePrice.toFixed(2)}`;
            document.getElementById("expected-roi").innerText = `Expected ROI: $${response.roiData.expectedROI.toFixed(2)}`;
            document.getElementById("prob-win").innerText = `Win/Even probability: ${(response.roiData.probWinOrEven * 100).toFixed(2)}%`;
            document.getElementById("expected-roi-upgrade").innerText = `Upgrade ROI (x1.5): $${response.roiData.expectedROIWithUpgrade.toFixed(2)}`;
        } else {
            console.log("No data yet");
        }
    });
});
