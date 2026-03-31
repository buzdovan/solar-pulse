import { jsPDF } from 'jspdf';
import { CalculatorResult } from './calculator';

const t = (str: string) => {
    return str.replace(/[čć]/g, 'c')
        .replace(/[ČĆ]/g, 'C')
        .replace(/š/g, 's')
        .replace(/Š/g, 'S')
        .replace(/ž/g, 'z')
        .replace(/Ž/g, 'Z')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

export function generateSolarProposalPDF(
    result: CalculatorResult,
    location: string,
    companyName: string = "SolarPulse Solutions"
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const locStr = location.trim() ? location : "Vas Objekt";

    doc.setFillColor(16, 185, 129); // #10b981
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(t(companyName), 20, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(t(`SolarPulse Ponuda za ${locStr}`), 20, 32);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(t("Kalkulacija Sustava"), 20, 60);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(t(`Lokacija objekta: ${locStr}`), 20, 70);
    doc.text(t(`Preporucena snaga elektrane: ${result.recommendedSystemKWp.toFixed(1)} kWp`), 20, 78);
    doc.text(t(`Ocekivana godisnja energetska proizvodnja: ${result.estimatedYearlyProduction.toFixed(0)} kWh`), 20, 86);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(t(`1. Bazicna godisnja usteda: ${result.yearlySavingsEur.toFixed(0)} €`), 20, 105);

    const inflationRate = 0.03;
    let tenYearProjection: number[] = [];
    let cumSum = 0;
    for (let i = 0; i < 10; i++) {
        cumSum += result.yearlySavingsEur * Math.pow(1 + inflationRate, i);
        tenYearProjection.push(cumSum);
    }
    const tenYearSavingsEstimate = tenYearProjection[9] || 0;
    doc.text(t(`2. Akumulirana usteda (10 Godina): ${tenYearSavingsEstimate.toFixed(0)} €`), 20, 115);

    doc.setTextColor(15, 23, 42);

    // Upsell
    doc.setFillColor(254, 243, 199);
    doc.rect(20, 125, pageWidth - 40, 50, 'F');

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t("Osiguranje za Buducnost (Premium Upgrade)"), 25, 137);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const introText = t("Ovaj sustav smanjuje vasu ovisnost o rastu cijena energenata za 80%.");
    doc.text(introText, 25, 145);
    const splitText = doc.splitTextToSize(t(result.upsellReasoning), pageWidth - 50);
    doc.text(splitText, 25, 151);

    doc.setFont("helvetica", "bold");
    doc.text(t(`Preporucena buduca snaga sustava: ${result.systemUpsellKWp.toFixed(1)} kWp`), 25, 168);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("Projekcija rasta ustede (10 Godina)"), 20, 190);

    const chartX = 20;
    const chartY = 245;
    const chartWidth = 170;
    const maxBarHeight = 45;
    const barWidth = 10;
    const spacing = (chartWidth - (10 * barWidth)) / 9;
    const maxVal = Math.max(...tenYearProjection, 1);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    for (let i = 0; i < 10; i++) {
        const val = tenYearProjection[i];
        const height = (val / maxVal) * maxBarHeight;
        const x = chartX + i * (barWidth + spacing);
        const y = chartY - height;

        doc.setFillColor(16, 185, 129);
        doc.rect(x, y, barWidth, height, 'F');

        doc.setTextColor(100, 100, 100);
        doc.text(`G${i + 1}`, x + 2, chartY + 5);

        doc.setTextColor(15, 23, 42);
        const valStr = `${val.toFixed(0)}€`;
        doc.text(valStr, x - 1, y - 2);
    }
    doc.setDrawColor(220, 220, 220);
    doc.line(chartX, chartY, chartX + chartWidth, chartY);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(t("Spremni za energetsku neovisnost?"), 20, 265);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(t("Ovo je informativni izracun. Da biste ovaj plan pretvorili u stvarnost,"), 20, 273);
    doc.text(t("kontaktirajte nas vec danas za strucni pregled i finalnu ponudu."), 20, 279);
    doc.text("Email: info@solarpulsesolutions.hr  |  Telefon: +385 91 234 5678", 20, 287);

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(t("Generirano putem SolarPulse AI sustava. Svi izracuni podlijezu izmjenama."), 20, 295);

    doc.save(`SolarPulse_Ponuda_${locStr.replace(/\s+/g, "")}.pdf`);
}
