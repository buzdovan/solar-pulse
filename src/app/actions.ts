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
            return { success: false, error: "V9-MASTER: GEMINI_API_KEY nije postavljen u Vercelu!" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj račun za struju. Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima. Vrati SAMO broj (npr. 319.64).`;

        // POBIJEDNIČKI MODEL 2.0 FLASH (Potvrđeno da ga ključ vidi!)
        const primaryModel = "gemini-2.0-flash";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${primaryModel}:generateContent?key=${apiKey}`, {
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

            throw new Error(data?.error?.message || "Model odbio zahtjev");
        } catch (e) {
            // BACKUP NA GEMINI 1.5 PRO AKO 2.0 PUKNE
            const backupRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
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
            const backupData = await backupRes.json();
            if (backupRes.ok) {
                const text = backupData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                const num = parseFloat(text.replace(/[^\d.-]/g, ''));
                if (!isNaN(num)) return { success: true, amount: num };
            }
            throw new Error(`Oba modela su odbila ključ. Zadnja greška: ${backupData?.error?.message || e.message}`);
        }

    } catch (error: any) {
        return { success: false, error: "V9-MASTER Greška: " + error.message };
    }
}
