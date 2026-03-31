// @ts-nocheck
"use server";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "Server nije primio datoteku. Veličina je 0." };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: "V8-KRAJ: GEMINI_API_KEY nije postavljen u Vercelu!" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj račun za struju. Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima. Vrati SAMO broj (npr. 319.64).`;

        // POKUŠAJ 1: GEMINI 1.5 FLASH (Standard)
        // POKUŠAJ 2: GEMINI 1.0 PRO (Backup)
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest"];
        let lastError = "";

        for (const model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                { inline_data: { mime_type: mimeType, data: base64Data } }
                            ]
                        }]
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    const num = parseFloat(text.replace(/[^\d.-]/g, ''));
                    if (!isNaN(num)) return { success: true, amount: num };
                }
                lastError = data?.error?.message || "Nepoznato";
            } catch (e) {
                lastError = e.message;
            }
        }

        // AKO SVE PROPADNE, DAJ NAM LISTU MODELA DA ZNAMO ŠTO SE DOGAĐA
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();
        const list = (modelsData.models || []).map(m => m.name.split('/').pop()).join(', ');

        return { success: false, error: `Svi modeli (Flash/Pro) su odbili ključ: ${lastError} | Dostupni modeli za tvoj ključ: ${list}` };

    } catch (error: any) {
        return { success: false, error: "V8 Kritična Greška: " + error.message };
    }
}
