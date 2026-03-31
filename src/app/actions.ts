// @ts-nocheck
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "V13-FINAL: Datoteka nije primljena!" };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: "V13-FINAL: GEMINI_API_KEY fali u Vercelu!" };
        }

        // KREIRAMO SDK KLIJENT (ZVJERKA KOJA SAMA RJEŠAVA ENDPOINTE)
        const genAI = new GoogleGenerativeAI(apiKey);

        // POKUŠAJ 1: GEMINI 1.5 FLASH (Najbrži)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // Forsiramo verziju ako treba
            apiVersion: "v1beta"
        });

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const prompt = "Analiziraj račun za struju. Pronađi PROSJEČNI MJESEČNI TROŠAK u eurima. Odgovori samo brojem.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: file.type || "image/jpeg",
                    data: base64Data
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        const num = parseFloat(text.replace(/[^\d.-]/g, ''));

        if (!isNaN(num)) {
            return { success: true, amount: num };
        } else {
            return { success: false, error: "V13-FINAL: AI je vratio tekst ali nije našao broj: " + text.substring(0, 50) };
        }

    } catch (error: any) {
        console.error("AI SDK Greška:", error);
        return { success: false, error: "V13-FINAL SDK Greška: " + (error.message || "Provjerite API ključ u Vercelu") };
    }
}
