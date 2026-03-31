// @ts-nocheck
"use server";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "Server nije primio datoteku. Veličina je 0." };
        }

        const apiKey = "AIzaSyAuZGURwRaNjxYJj32JVHapP5y27sOxINQ";
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj dokument (račun za struju). 
Zadatak: Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima.
Pravila:
1. Ako vidiš "Obračunsko razdoblje" veće od mjesec dana (npr. 'Ukupan iznos' 1917€ za 25 mjeseci), OBAVEZNO podijeli taj ukupni iznos s brojem mjeseci da dobiješ MJESEČNI prosjek.
2. Ako je to jedna mjesečna rata, ignoriraj druge dugove i vrati redovnu ratu.
3. Vrati SAMO broj (npr. 319.64). Bez teksta i valuta.`;

        // PROVJERAMO SVE MODELA NA OVOM KVALITETNOM KLJUČU
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();
        const availableModels = (modelsData.models || []).map(m => m.name.replace('models/', '')).join(', ');

        // AKO GA NEMA U LISTI, POKUŠAJMO "gemini-1.5-flash-latest" ILI "gemini-1.5-pro"
        const modelToUse = availableModels.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : 'gemini-1.5-pro';

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Google Error ${response.status}: ${data?.error?.message || "Nepoznato"} | Dostupni modeli: ${availableModels}`);
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const extractedNumber = parseFloat(responseText.replace(/[^\d.-]/g, ''));

        if (!isNaN(extractedNumber)) {
            return { success: true, amount: extractedNumber };
        } else {
            return { success: false, error: "AI nije pronašao broj. Vratio je tekst: " + responseText.substring(0, 50) + " | Modeli: " + availableModels };
        }

    } catch (error: any) {
        console.error("AI OCR Greška na Vercelu:", error);
        return { success: false, error: "Konačna Greška V6: " + (error.message || "Nepoznato") };
    }
}
