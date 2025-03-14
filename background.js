let roiData = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "updateROI") {
        roiData = request.data;  // Guardar los datos temporalmente en la variable global
        console.log("Datos de ROI almacenados temporalmente:", roiData);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getROI") {
        sendResponse({ roiData });  // Enviar los datos temporales
    }
});
