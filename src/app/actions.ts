// @ts-nocheck
"use server";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "LAST-STAND: Datoteka nije primljena!" };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: "LAST-STAND: GEMINI_API_KEY fali u Vercelu!" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        // FORSIRAMO IMAGE/JPEG ZA MAKSIMALNU KOMPATIBILNOST
        const mimeType = "image/jpeg";

        const prompt = "Koliki je ukupni mjesečni račun u eurima na ovoj slici? Odgovori samo brojem.";

        // NAJJEDNOSTAVNIJI MOGUĆI URL (v1beta1 ili v1beta)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
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

        if (!response.ok) {
            // Ako 2.0 i dalje odbija, probaj stari dobri 1.5-flash ali s v1beta
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const fallbackRes = await fetch(fallbackUrl, {
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
            const fallbackData = await fallbackRes.json();
            if (fallbackRes.ok) {
                const text = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                const num = parseFloat(text.replace(/[^\d.-]/g, ''));
                if (!isNaN(num)) return { success: true, amount: num };
            }
            throw new Error(fallbackData?.error?.message || data?.error?.message || "Google odbija oba modela.");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const num = parseFloat(text.replace(/[^\d.-]/g, ''));

        if (!isNaN(num)) return { success: true, amount: num };
        return { success: false, error: "AI je pročitao tekst ali nije našao broj: " + text };

    } catch (error: any) {
        return { success: false, error: "LAST-STAND Kritično: " + error.message };
    }
}
