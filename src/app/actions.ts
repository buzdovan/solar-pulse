// @ts-nocheck
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "Server nije primio datoteku. Veličina je 0." };
        }

        // KORISNIKOV OSOBNI NOVI PAY-AS-YOU-GO KLJUČ 
        const apiKey = "AIzaSyAuZGURwRaNjxYJj32JVHapP5y27sOxINQ";

        // FORSIRAMO 'v1' verziju jer tvoj Vercel uporno bježi u 'v1beta' koja je mrtva za Flash model.
        const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" } as any);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj dokument (račun za struju). 
Zadatak: Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima.
Pravila:
1. Ako vidiš "Obračunsko razdoblje" veće od mjesec dana (npr. 'Ukupan iznos' 1917€ za 25 mjeseci), OBAVEZNO podijeli taj ukupni iznos s brojem mjeseci da dobiješ MJESEČNI prosjek.
2. Ako je to jedna mjesečna rata, ignoriraj druge dugove i vrati redovnu ratu.
3. Vrati SAMO broj (npr. 319.64). Bez teksta i valuta.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
            prompt,
        ]);

        const responseText = result.response.text();
        const extractedNumber = parseFloat(responseText.replace(/[^\d.-]/g, ''));

        if (!isNaN(extractedNumber)) {
            return { success: true, amount: extractedNumber };
        } else {
            return { success: false, error: "AI nije pronašao broj. Vratio je tekst: " + responseText.substring(0, 50) };
        }

    } catch (error: any) {
        console.error("AI OCR Greška na Vercelu:", error);
        return { success: false, error: "Google API Greška: " + (error.message || "Nepoznato - provjerite je li API ključ valjan i omogućeno plaćanje") };
    }
}
