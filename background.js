let roiData = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "updateROI") {
        roiData = request.data;
        // console.log("ROI data stored temporarily:", roiData);
    } else if (request.type === "getROI") {
        sendResponse({ roiData });
    } else {
        // console.log("Unknown message type:", request.type);
    }
});