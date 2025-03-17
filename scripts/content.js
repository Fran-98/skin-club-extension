let lastURL = location.href;
let lastSkinCount = 0;
let retryAttempts = 0;
const maxRetries = 3;
const initialRetryDelay = 1000;
const longRetryDelay = 5000;

function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    // Directly return the joined string
    return splitStr.join(' '); 
 }

 function getCaseName() {
    const match = location.href.match(/cases\/open\/([^\/]+)/);
    if (match) {
      let caseName = decodeURIComponent(match[1]);
      return caseName.replace(/-/g, ' ').replace(/_/g, ' ');
    } else {
      return "Case";
    }
  }

function isCaseOpenPage() {
    return /^https:\/\/skin\.club\/[a-z]{2}\/cases\/open\//.test(location.href);
}

function addROICalculatorToPage(caseName, casePrice, expectedROI, probWinOrEven, expectedROIWithUpgrade) {
    let roiDiv = document.getElementById("roi-calculator");
    if (!roiDiv) {
        roiDiv = document.createElement("div");
        roiDiv.id = "roi-calculator";
        roiDiv.style.position = "fixed";
        roiDiv.style.bottom = "10px";
        roiDiv.style.left = "10px";
        roiDiv.style.background = "rgba(0, 0, 0, 0.8)";
        roiDiv.style.color = "#fff";
        roiDiv.style.padding = "10px";
        roiDiv.style.borderRadius = "5px";
        roiDiv.style.zIndex = "9999";
        document.body.appendChild(roiDiv);
    }

    roiDiv.innerHTML = `
    <b>${titleCase(caseName)} ROI</b><br>
    Case price: $${casePrice.toFixed(2)}<br>
    Expected ROI: $${expectedROI.toFixed(2)}<br>
    Win/Even prob: ${(probWinOrEven * 100).toFixed(2)}%<br>
    Upgrade ROI (x1.5): $${expectedROIWithUpgrade.toFixed(2)}<br><br>
    <a href="https://buymeacoffee.com/franman" target="_blank" style="color: #4CAF50; text-decoration: none;">Send ❤️</a><br>
    <a href="https://steamcommunity.com/tradeoffer/new/?partner=67016770&token=h3Xc4KVg" target="_blank" style="color: #FF5733; text-decoration: none;">Or send me a 🔫</a>
    `;
}

function calculateROI(casePrice, skins) {
    let expectedROI = 0;
    let expectedROIWithUpgrade = 0;
    let probWinOrEven = 0;
    skins.forEach(skin => {
        let price = parseFloat(skin.price.replace('$', ''));
        let probability = parseFloat(skin.probability.replace('%', '')) / 100;
        expectedROI += price * probability;
        if (price >= casePrice) probWinOrEven += probability;
        let upgradedPrice = 1.05 * price;
        let expectedPriceAfterUpgrade = (0.7 * upgradedPrice) + (0.3 * 0);
        expectedROIWithUpgrade += expectedPriceAfterUpgrade * probability;
    });
    return { expectedROI, probWinOrEven, expectedROIWithUpgrade };
}

function fastScrollToLoadAllSkins(callback) {
    const skins = document.querySelectorAll('.case-skin');
    let hasValidSkins = Array.from(skins).some(skin => skin.querySelector('.case-skin__price .currency-text')?.innerText.trim());
    let hasInvalidSkins = Array.from(skins).some(skin => !skin.querySelector('.case-skin__price .currency-text')?.innerText.trim());

    if (skins.length === 0) {
        // console.log("No skins detectados, reintentando...");
        retryExtract(() => fastScrollToLoadAllSkins(callback));
        return;
    }

    if (hasValidSkins && hasInvalidSkins) {
        // console.log("Haciendo fast scroll...");
        let scrollHeight = document.body.scrollHeight;
        window.scrollTo(0, scrollHeight);
        setTimeout(() => {
            window.scrollTo(0, 0);
            setTimeout(() => {
                // console.log("Fast scroll terminado. Extrayendo datos...");
                callback();
            }, 1000);
        }, 1000);
    } else {
        // console.log("Todas las skins están cargadas correctamente.");
        callback();
    }
}

function retryExtract(callback) {
    if (retryAttempts >= maxRetries) {
        // console.log("Máximo de reintentos alcanzado.");
        return;
    }
    retryAttempts++;
    let delay = retryAttempts < 2 ? initialRetryDelay : longRetryDelay;
    // console.log(`Reintentando extracción en ${delay / 1000} segundos...`);
    setTimeout(callback, delay);
}

function extractSkinData() {
    if (!location.href.includes("/cases/open/")) return;
    const skins = document.querySelectorAll('.case-skin');
    if (skins.length === 0) {
        retryExtract(extractSkinData);
        return;
    }
    let skinData = Array.from(skins).map(skin => {
        const name = skin.querySelector('.case-skin__name')?.innerText.trim() || 'N/A';
        const price = skin.querySelector('.case-skin__price .currency-text')?.innerText.trim() || 'N/A';
        const probability = skin.querySelector('.case-skin-chance .chance-text')?.innerText.trim() || 'N/A';
        return { name, price, probability };
    }).filter(item => !isNaN(parseFloat(item.price.replace('$', ''))) && !isNaN(parseFloat(item.probability.replace('%', ''))));

    const casePriceElement = document.querySelector('[data-qa="sticker-case-price-element"] .currency-text') 
                          || document.querySelector('.case-price');
    const casePrice = casePriceElement ? parseFloat(casePriceElement.innerText.trim().replace('$', '')) : 0;
    if (isNaN(casePrice) || skinData.length === 0) {
        retryExtract(extractSkinData);
        return;
    }
    const { expectedROI, probWinOrEven, expectedROIWithUpgrade } = calculateROI(casePrice, skinData);
    
    addROICalculatorToPage(getCaseName(), casePrice, expectedROI, probWinOrEven, expectedROIWithUpgrade);
    
    // BG
    chrome.runtime.sendMessage({
        type: "updateROI",
        data: {
            caseName: getCaseName(),
            casePrice: casePrice,
            expectedROI: expectedROI,
            probWinOrEven: probWinOrEven,
            expectedROIWithUpgrade: expectedROIWithUpgrade
        }
    });
}

const observer = new MutationObserver(() => {
    if (!isCaseOpenPage()) return;
    if (location.href !== lastURL) {
        // console.log("Cambio de página detectado, reiniciando extracción...");
        lastURL = location.href;
        lastSkinCount = 0;
        retryAttempts = 0;
        fastScrollToLoadAllSkins(extractSkinData);
    }
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('DOMContentLoaded', () => {
    if (location.href.includes("/cases/open/")) {
        fastScrollToLoadAllSkins(extractSkinData);
    }
});
