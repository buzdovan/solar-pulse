// @ts-nocheck
"use server";

export async function extractBillAmount(formData: FormData): Promise<{ success: boolean, amount?: number, error?: string }> {
    try {
        const file = formData.get("billImage") as File | null;
        if (!file || file.size === 0) {
            return { success: false, error: "Server nije primio datoteku. Veličina je 0." };
        }

        // ČITAMO KLJUČ IZ VERCEL OKRUŽENJA (VIŠE GA NEĆEMO BETONIRATI JAVNO!)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { success: false, error: "Greška: GEMINI_API_KEY nije postavljen u Vercel Environment Variables!" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const prompt = `Analiziraj ovaj dokument (račun za struju). 
Zadatak: Pronađi PROSJEČNI MJESEČNI TROŠAK u Eurima.
Pravila:
1. Ako vidiš "Obračunsko razdoblje" veće od mjesec dana (npr. 'Ukupan iznos' 1917€ za 25 mjeseci), OBAVEZNO podijeli taj ukupni iznos s brojem mjeseci da dobiješ MJESEČNI prosjek.
2. Ako je to jedna mjesečna rata, ignoriraj druge dugove i vrati redovnu ratu.
3. Vrati SAMO broj (npr. 319.64). Bez teksta i valuta.`;

        // SIROVI POZIV (RAW FETCH) NA v1 ENDPOINT
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
            throw new Error(`Google Error ${response.status}: ${data?.error?.message || "Provjerite je li API ključ valjan i spojen na Billing račun"}`);
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const extractedNumber = parseFloat(responseText.replace(/[^\d.-]/g, ''));

        if (!isNaN(extractedNumber)) {
            return { success: true, amount: extractedNumber };
        } else {
            return { success: false, error: "AI nije pronašao broj. Vratio je tekst: " + responseText.substring(0, 50) };
        }

    } catch (error: any) {
        console.error("AI OCR Greška na Vercelu:", error);
        return { success: false, error: "OCR Greška: " + (error.message || "Provjerite API ključ") };
    }
}
