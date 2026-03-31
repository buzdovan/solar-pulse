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
            return { success: false, error: "LEGENDARY: GEMINI_API_KEY nije postavljen!" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj račun za struju. Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima. Vrati SAMO broj (npr. 319.64).`;

        // LEGENDARY: KORISTIMO CLIENT-HEADERS KOJE GOOGLE TRAŽI U EU
        const scenarios = [
            { ver: "v1beta", mod: "gemini-1.5-flash" },
            { ver: "v1", mod: "gemini-2.0-flash" },
            { ver: "v1beta", mod: "gemini-2.0-flash" },
            { ver: "v1", mod: "gemini-1.5-pro" }
        ];

        let lastFullError = "";

        for (const s of scenarios) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/${s.ver}/models/${s.mod}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                        "x-goog-api-client": "genai-js/0.21.0" // Simuliramo najnoviji SDK koji Vercel voli
                    },
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
                lastFullError = `[${s.ver}/${s.mod}]: ${data?.error?.message || "Nepoznato"}`;
            } catch (e) {
                lastFullError = e.message;
            }
        }

        return { success: false, error: "LEGENDARY neuspjeh: Google i dalje odbija vezu. Zadnja greška: " + lastFullError };

    } catch (error: any) {
        return { success: false, error: "LEGENDARY Fatal: " + error.message };
    }
}
