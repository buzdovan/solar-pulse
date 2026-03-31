// src/lib/calculator.ts

export interface CalculatorInput {
    monthlyBill: number;
}

export interface CalculatorResult {
    monthlyConsumptionKWh: number;
    yearlyConsumptionKWh: number;
    recommendedSystemKWp: number;
    estimatedYearlyProduction: number;
    yearlySavingsEur: number;
    systemUpsellKWp: number;
    upsellReasoning: string;
}

const ELECTRICITY_PRICE_EUR_KWH = 0.15;
const YEARLY_YIELD_PER_KWP = 1250; // Prosjek za Hrvatsku (1200-1300)

export function calculateSolarROI(input: CalculatorInput): CalculatorResult {
    // Sigurnosna provjera unosa: Max račun dignut na 1000€ kako bi pokrili i velike potrošače (kuće koje troše do 15-20 pa čak i 80 kWp opcija za mini-hotele)
    const safeBill = Math.min(Math.max(input.monthlyBill, 10), 1000);

    // 1. Izračun trenutne potrošnje
    const monthlyConsumptionKWh = safeBill / ELECTRICITY_PRICE_EUR_KWH;
    const yearlyConsumptionKWh = monthlyConsumptionKWh * 12;

    // 2. Preporučena snaga sustava (kWp) - pokriva 100% potrošnje
    const requiredSystemSize = yearlyConsumptionKWh / YEARLY_YIELD_PER_KWP;
    const recommendedSystemKWp = Math.ceil(requiredSystemSize * 2) / 2; // Zaokruživanje na 0.5 kWp

    // 3. Procijenjena proizvodnja (kWh)
    const estimatedYearlyProduction = recommendedSystemKWp * YEARLY_YIELD_PER_KWP;

    // 4. Financije (Ušteda u EUR)
    const yearlySavingsEur = estimatedYearlyProduction * ELECTRICITY_PRICE_EUR_KWH;

    // 5. Upsell logika (EV + Dizalica topline)
    const futureProofingAdditionKWh = 4000; // Realističnije za auto + grijanje u RH
    const upsellSystemSize = (yearlyConsumptionKWh + futureProofingAdditionKWh) / YEARLY_YIELD_PER_KWP;
    const systemUpsellKWp = Math.ceil(upsellSystemSize * 2) / 2;

    const upsellReasoning = `Pametna investicija: Sustavom od ${systemUpsellKWp.toFixed(1)} kWp osiguravate se za skori prelazak na dizalicu topline i punjenje električnog vozila. Fiksirate cijenu energije i potpuno blokirate buduća poskupljenja!`;

    return {
        monthlyConsumptionKWh,
        yearlyConsumptionKWh,
        recommendedSystemKWp,
        estimatedYearlyProduction,
        yearlySavingsEur,
        systemUpsellKWp,
        upsellReasoning
    };
}
