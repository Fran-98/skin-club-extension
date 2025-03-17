document.addEventListener("DOMContentLoaded", () => {
    try {
        chrome.runtime.sendMessage({ type: "getROI" }, (response) => {
            if (response && response.roiData) {
                const roiData = response.roiData;
                if (typeof roiData.casePrice === 'number' && !isNaN(roiData.casePrice)) {
                    document.getElementById("case-price").innerText = `Case Price: $${roiData.casePrice.toFixed(2)}`;
                } else {
                    document.getElementById("case-price").innerText = 'Case Price: Data not available.';
                }

                if (typeof roiData.expectedROI === 'number' && !isNaN(roiData.expectedROI)) {
                    document.getElementById("expected-roi").innerText = `Expected ROI: $${roiData.expectedROI.toFixed(2)}`;
                } else {
                    document.getElementById("expected-roi").innerText = 'Expected ROI: Data not available.';
                }

                if (typeof roiData.probWinOrEven === 'number' && !isNaN(roiData.probWinOrEven)) {
                    document.getElementById("prob-win").innerText = `Win/Even probability: ${(roiData.probWinOrEven * 100).toFixed(2)}%`;
                } else {
                    document.getElementById("prob-win").innerText = 'Win/Even probability: Data not available.';
                }

                if (typeof roiData.expectedROIWithUpgrade === 'number' && !isNaN(roiData.expectedROIWithUpgrade)) {
                    document.getElementById("expected-roi-upgrade").innerText = `Upgrade ROI (x1.5): $${roiData.expectedROIWithUpgrade.toFixed(2)}`;
                } else {
                    document.getElementById("expected-roi-upgrade").innerText = 'Upgrade ROI (x1.5): Data not available.';
                }
            } else {
                console.log("No ROI data received.");
                document.getElementById("case-price").innerText = 'Loading...';
                document.getElementById("expected-roi").innerText = 'Loading...';
                document.getElementById("prob-win").innerText = 'Loading...';
                document.getElementById("expected-roi-upgrade").innerText = 'Loading...';
            }
        });
    } catch (error) {
        console.error("Error sending getROI message:", error);
        document.getElementById("case-price").innerText = 'Error loading data.';
        document.getElementById("expected-roi").innerText = 'Error loading data.';
        document.getElementById("prob-win").innerText = 'Error loading data.';
        document.getElementById("expected-roi-upgrade").innerText = 'Error loading data.';
    }
});