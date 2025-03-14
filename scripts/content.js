let lastURL = location.href;
let extracted = false;
let retryAttempts = 0;
const maxRetries = 10; 

function addROICalculatorToPage(casePrice, expectedROI, probWinOrEven, expectedROIWithUpgrade) {
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
    <b>Case ROI</b><br>
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
        let price = parseFloat(skin.price.replace('$', '')); // Convertir precio a número
        let probability = parseFloat(skin.probability.replace('%', '')) / 100; // Convertir % a decimal

        expectedROI += price * probability; // Sumar al valor esperado

        if (price >= casePrice) {
            probWinOrEven += probability; // Sumar probabilidad de ganar o salir even
        }

        // Cálculo de ROI con actualización
        let upgradedPrice = 1.05 * price; // Valor después de actualizar
        let expectedPriceAfterUpgrade = (0.7 * upgradedPrice) + (0.3 * 0); // 70% chance de éxito
        expectedROIWithUpgrade += expectedPriceAfterUpgrade * probability;
    });

    return { expectedROI, probWinOrEven, expectedROIWithUpgrade };
}

function extractSkinData() {
    if (extracted) return;

    const skins = document.querySelectorAll('.case-skin');

    if (skins.length === 0) {
        console.log("Waiting for skings...");
        retryAttempts++;  // Aumentar el contador de intentos
        if (retryAttempts <= maxRetries) {
            setTimeout(extractSkinData, 1000);  // Reintentar después de 1 segundo
        } else {
            console.log("Max retries and skins were not loaded.");
        }
        return;
    }

    const firstSkin = skins[0];
    const nameExists = firstSkin.querySelector('.case-skin__name')?.innerText.trim();
    const priceExists = firstSkin.querySelector('.case-skin__price .currency-text')?.innerText.trim();

    if (!nameExists || !priceExists) {
        // console.log("Skins without info, waiting...");
        retryAttempts++;  // Aumentar el contador de intentos
        if (retryAttempts <= maxRetries) {
            setTimeout(extractSkinData, 1000);  // Reintentar después de 1 segundo
        } else {
            console.log("Max retries and sking were not loaded.");
        }
        return;
    }

    extracted = true;

    // Extraer información de los skins
    const skinData = Array.from(skins).map(skin => {
        const name = skin.querySelector('.case-skin__name')?.innerText.trim() || 'N/A';
        const title = skin.querySelector('.case-skin__title')?.innerText.trim() || 'N/A';
        const quality = skin.querySelector('.case-skin__quality')?.innerText.trim() || 'N/A';
        const price = skin.querySelector('.case-skin__price .currency-text')?.innerText.trim() || 'N/A';
        const probability = skin.querySelector('.case-skin-chance .chance-text')?.innerText.trim() || 'N/A';

        return { name, title, quality, price, probability };
    });

    // Extraer el precio de la caja
    const casePriceElement = document.querySelector('[data-qa="sticker-case-price-element"] .currency-text');
    const casePrice = casePriceElement ? parseFloat(casePriceElement.innerText.trim().replace('$', '')) : 0;

    // Verificar si hay NaN y si es necesario reintentar
    if (isNaN(casePrice) || skinData.some(skin => isNaN(parseFloat(skin.price.replace('$', ''))))) {
        console.log("NaN values, waiting...");
        retryAttempts++;  // Aumentar el contador de intentos
        if (retryAttempts <= maxRetries) {
            setTimeout(extractSkinData, 1000);  // Reintentar después de 1 segundo
        } else {
            // console.log("Máximo número de intentos alcanzado. No se pudo extraer la información completa.");
        }
        return; // Detener la ejecución hasta el siguiente intento
    }

    // Calcular ROI y probabilidades
    const { expectedROI, probWinOrEven, expectedROIWithUpgrade } = calculateROI(casePrice, skinData);

    console.log("Data extracted:", { casePrice, skins: skinData });
    console.log(`ROI: $${expectedROI.toFixed(2)}`);
    console.log(`Even or win prob: ${(probWinOrEven * 100).toFixed(2)}%`);
    console.log(`ROI upgrading x1.5: $${expectedROIWithUpgrade.toFixed(2)}`);

    addROICalculatorToPage(casePrice, expectedROI, probWinOrEven, expectedROIWithUpgrade);
    chrome.runtime.sendMessage({
        type: "updateROI",
        data: {
            casePrice,
            expectedROI,
            probWinOrEven,
            expectedROIWithUpgrade
        }
    });
}

// Observador para detectar cambios en el DOM y verificar si la URL cambió
const observer = new MutationObserver(() => {
    if (location.href !== lastURL) {  
        // console.log("Cambio de página detectado, reiniciando extracción...");
        lastURL = location.href;
        extracted = false;
        retryAttempts = 0;  // Reiniciar contador de intentos al cambiar de página
        extractSkinData();
    } else {
        extractSkinData();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

extractSkinData();  // Llamada inicial para intentar extraer los datos
