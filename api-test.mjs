#!/usr/bin/env node

// Skript pro testování veřejných a zabezpečených API routes
// Spuštění: node api-test.mjs

const ADMIN_API_URL = "http://localhost:3001";

// --- NASTAVENÍ TOKENŮ ---
// 1. Po přihlášení do admina si získejte platný JWT token (např. z dev tools -> network -> headers)
// 2. Vložte ho sem.
const VALID_ADMIN_JWT = "vlozte.platny.admin.jwt.token.sem";

// Token uživatele, který NENÍ admin
const NON_ADMIN_JWT = "vlozte.platny.ne-admin.jwt.token.sem";

// --- Helper pro barevný výstup ---
const color = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m'
};
const log = (message) => console.log(message);
const logSuccess = (message) => console.log(color.green + message + color.reset);
const logError = (message) => console.log(color.red + message + color.reset);
const logInfo = (message) => console.log(color.cyan + message + color.reset);
const logWarning = (message) => console.log(color.yellow + message + color.reset);

// --- Testovací funkce ---

async function testPublicApi() {
    logInfo("\n--- Test 1: Veřejné API (create-payment-intent) ---");
    try {
        const response = await fetch(`${ADMIN_API_URL}/api/stripe/create-payment-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: 2500, // min. 15 Kč pro Stripe
                currency: "czk",
                customerEmail: "public-test@example.com",
                idempotencyKey: `test-${Date.now()}`
            }),
        });

        const data = await response.json();

        if (response.status === 200 && data.clientSecret) {
            logSuccess(`✅ SUCCESS: Veřejné API funguje. Status ${response.status} a clientSecret přijat.`);
        } else {
            logError(`❌ FAILURE: Očekáván status 200, ale přišel ${response.status}.`);
            logError(`   Odpověď: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        logError(`❌ FAILURE: Request selhal - ${error.message}. Běží backend na portu 3001?`);
    }
}

async function testAdminApi(description, endpoint, token, expectedStatus) {
    logInfo(`\n--- Test: ${description} ---`);

    if (token && token.startsWith('vlozte')) {
        logWarning(`ℹ️ TEST PŘESKOČEN. Vložte platný token do konstanty ve skriptu.`);
        return;
    }

    try {
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${ADMIN_API_URL}${endpoint}`, { headers });

        if (response.status === expectedStatus) {
            logSuccess(`✅ SUCCESS: API správně vrátilo status ${response.status}.`);
        } else {
            const responseBody = await response.text();
            logError(`❌ FAILURE: Očekáván status ${expectedStatus}, ale přišel ${response.status}.`);
            logError(`   Endpoint: ${endpoint}`);
            logError(`   Response: ${responseBody}`);
        }
    } catch (error) {
        logError(`❌ FAILURE: Request na ${endpoint} selhal - ${error.message}`);
    }
}

// --- Spuštění testů ---
async function main() {
    logInfo("====== Spouštím API a JWT testy ======");

    await testPublicApi();

    // Testy pro zabezpečené /api/admin/orders
    const adminEndpoint = "/api/admin/orders";
    await testAdminApi("Zabezpečené API - Bez tokenu", adminEndpoint, null, 401);
    await testAdminApi("Zabezpečené API - Neplatný token", adminEndpoint, "neplatny.token.123", 401);
    await testAdminApi("Zabezpečené API - Ne-admin token", adminEndpoint, NON_ADMIN_JWT, 403);
    await testAdminApi("Zabezpečené API - Platný admin token", adminEndpoint, VALID_ADMIN_JWT, 200); // Předpokládáme GET na /api/admin/orders vrátí 200 OK

    logInfo("\n====== Testy dokončeny ======");
    logWarning("Nezapomeňte, že pro úspěšný test s platným tokenem musíte mít v databázi roli 'admin' pro daného uživatele.");
}

main();

