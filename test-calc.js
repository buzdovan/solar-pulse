const ELECTRICITY_PRICE_EUR_KWH = 0.15;
const YEARLY_YIELD_PER_KWP = 1250;

function calculateSolarROI(monthlyBill) {
    const safeBill = Math.min(Math.max(monthlyBill, 10), 1000);
    const monthlyConsumptionKWh = safeBill / ELECTRICITY_PRICE_EUR_KWH;
    const yearlyConsumptionKWh = monthlyConsumptionKWh * 12;
    const requiredSystemSize = yearlyConsumptionKWh / YEARLY_YIELD_PER_KWP;
    const recommendedSystemKWp = Math.ceil(requiredSystemSize * 2) / 2;
    const estimatedYearlyProduction = recommendedSystemKWp * YEARLY_YIELD_PER_KWP;
    const yearlySavingsEur = estimatedYearlyProduction * ELECTRICITY_PRICE_EUR_KWH;

    const futureProofingAdditionKWh = 4000;
    const upsellSystemSize = (yearlyConsumptionKWh + futureProofingAdditionKWh) / YEARLY_YIELD_PER_KWP;
    const systemUpsellKWp = Math.ceil(upsellSystemSize * 2) / 2;

    let tenYearProjection = [];
    let cumSum = 0;
    for (let i = 0; i < 10; i++) {
        cumSum += yearlySavingsEur * Math.pow(1 + 0.03, i);
        tenYearProjection.push(cumSum);
    }

    console.log("=== REZULTATI ZA RAČUN OD", monthlyBill, "€ ===");
    console.log("Potrebna snaga za pokrivanje: ", requiredSystemSize.toFixed(2), "kWp -> Zaokruženo na", recommendedSystemKWp.toFixed(1), "kWp");
    console.log("Godišnja proizvodnja instalacije: ", estimatedYearlyProduction.toFixed(0), "kWh");
    console.log("Godišnja zarada/ušteda: ", yearlySavingsEur.toFixed(0), "€");
    console.log("-----------------------------------------");
    console.log("Future-Proof up-sell snaga: ", systemUpsellKWp.toFixed(1), "kWp");
    console.log("Akumulirana ušteda (10 god) s uračunatom inflacijom cijene struje od 3%: ", tenYearProjection[9].toFixed(0), "€");
    console.log("=========================================");
}

calculateSolarROI(150);
