// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { extractBillAmount } from "./actions";
import { generatePDF } from "@/lib/pdf-generator";

export default function SolarCalculator() {
    const [billAmount, setBillAmount] = useState<number>(0);
    const [location, setLocation] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showGDPR, setShowGDPR] = useState(false);
    const [conversionSuccess, setConversionSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Kalkulacija uštede (Hrvatski prosjek: 0.15 EUR/kWh, 1250 kWh/kWp)
    const calculateSystemSize = () => {
        const annualConsumption = (billAmount * 12) / 0.15;
        return Math.min(Math.max(annualConsumption / 1250, 3), 20);
    };

    const systemSize = calculateSystemSize();
    const yearlySavings = billAmount * 12 * 0.9; // 90% uštede
    const tenYearSavings = yearlySavings * 10;
    const investmentCost = systemSize * 1100; // 1100€ po kWp
    const roiYears = investmentCost / yearlySavings;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setErrorMsg("");
        setConversionSuccess(false);

        try {
            const formData = new FormData();
            formData.append("billImage", file);

            const result = await extractBillAmount(formData);

            if (result.success && result.amount) {
                setBillAmount(result.amount);
                setConversionSuccess(true);
                setTimeout(() => setConversionSuccess(false), 3000);
            } else {
                alert("DIJAGNOSTIKA V9-MASTER: \n\n" + (result.error || "Nepoznata greška"));
            }
        } catch (err) {
            alert("DIJAGNOSTIKA V9-MASTER (Fatal): \n\n" + (err instanceof Error ? err.message : "Sustav nije uspio pročitati račun"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!phoneNumber) {
            alert("Molimo unesite broj telefona za preuzimanje ponude.");
            return;
        }
        const data = {
            billAmount,
            location,
            systemSize,
            yearlySavings,
            investmentCost,
            roiYears,
            phoneNumber
        };
        await generatePDF(data);
    };

    return (
        <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900 border-t-8 border-green-600">
            {/* Header */}
            <header className="py-8 px-6 max-w-5xl mx-auto flex justify-between items-center bg-white shadow-sm rounded-b-2xl mb-12 animate-fade-in border-b border-green-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
                        <span className="text-white font-bold text-2xl">S</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-neutral-800">SOLARPULSE <span className="text-green-600">AI</span></h1>
                </div>
                <div className="hidden md:flex gap-4 items-center">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 px-3 py-1 rounded-full">B2B SaaS Croatia</span>
                    <div className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                        AI READY
                    </div>
                </div>
            </header>

            <section className="max-w-4xl mx-auto px-6 pb-24">
                {/* Step 1: Input */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-neutral-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3L16 7L12 11V7M12 17V21L8 17L12 13V17Z" /></svg>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                        <span className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-green-50">1</span>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Automatsko očitanje računa</h2>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-4 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer relative overflow-hidden
               ${isProcessing ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200 hover:border-green-400 hover:bg-green-50'}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf"
                            className="hidden"
                        />

                        <div className="relative z-10">
                            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-transform
                  ${isProcessing ? 'bg-green-600 text-white animate-bounce' : 'bg-green-100 text-green-600 border border-green-200'}`}>
                                {isProcessing ? '...' : (
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                )}
                            </div>
                            <p className="text-xl font-bold text-neutral-800 mb-2">
                                {isProcessing ? 'Očitavam vrijednosti...' : (conversionSuccess ? 'Račun uspješno očitan! ✅' : 'Učitajte sliku vašeg računa')}
                            </p>
                            <p className="text-neutral-500 font-medium">AI će automatski prepoznati prosječnu potrošnju</p>
                        </div>

                        {isProcessing && (
                            <div className="absolute bottom-0 left-0 h-2 bg-green-600 animate-progress-buffer"></div>
                        )}
                    </div>

                    <div className="my-10 flex items-center justify-center gap-4 text-neutral-300">
                        <div className="h-px bg-neutral-200 flex-1"></div>
                        <span className="text-xs font-bold uppercase tracking-widest">ili upišite ručno</span>
                        <div className="h-px bg-neutral-200 flex-1"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3 focus-within:transform focus-within:translate-x-2 transition-transform">
                            <label className="text-sm font-bold uppercase tracking-widest text-neutral-500 ml-1">Lokacija</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Grad ili županija"
                                className="w-full bg-neutral-100 border-2 border-neutral-100 rounded-2xl p-5 text-xl font-bold focus:ring-4 focus:ring-green-100 focus:bg-white focus:border-green-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-3 focus-within:transform focus-within:translate-x-2 transition-transform">
                            <label className="text-sm font-bold uppercase tracking-widest text-neutral-500 ml-1">Prosječni mjesečni račun</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={billAmount || ""}
                                    onChange={(e) => setBillAmount(Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full bg-neutral-100 border-2 border-neutral-100 rounded-2xl p-5 text-xl font-bold focus:ring-4 focus:ring-green-100 focus:bg-white focus:border-green-500 transition-all outline-none"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-neutral-400">€</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        className="w-full mt-10 bg-neutral-900 text-white rounded-2xl p-6 text-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3"
                    >
                        Izračunaj
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>

                {/* Results */}
                {billAmount > 0 && (
                    <div className="mt-12 space-y-12 animate-slide-up">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* 10 Year Savings View */}
                            <div className="bg-green-600 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                <h3 className="text-lg font-bold uppercase tracking-widest mb-6 opacity-80">10-godišnja ušteda</h3>
                                <div className="text-6xl font-black mb-4 tracking-tighter">
                                    {tenYearSavings.toLocaleString("hr-HR", { minimumFractionDigits: 0 })} €
                                </div>
                                <p className="text-green-100 text-lg leading-relaxed font-medium">Osiguranje protiv budućih poskupljenja struje.</p>
                            </div>

                            {/* ROI View */}
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-neutral-100 flex flex-col justify-center">
                                <h3 className="text-lg font-bold uppercase tracking-widest mb-2 text-neutral-400">Isplativost (ROI)</h3>
                                <div className="text-5xl font-black text-neutral-800 mb-2 tracking-tighter">
                                    ~{roiYears.toFixed(1)} godina
                                </div>
                                <div className="w-full bg-neutral-100 h-4 rounded-full overflow-hidden mt-4">
                                    <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (1 / roiYears) * 400)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* CTA/LeadGen */}
                        <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border-4 border-green-600 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black text-neutral-900 mb-4 leading-none">Preuzmite detaljnu ponudu</h2>
                                <p className="text-xl text-neutral-500 mb-10 font-medium">Kamo da vam pošaljemo precizan izračun i tehničko rješenje?</p>

                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-1">Vaš broj telefona</label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+385 9..."
                                            className="w-full bg-neutral-100 border-2 border-neutral-100 rounded-2xl p-6 text-xl font-bold focus:ring-4 focus:ring-green-100 focus:bg-white focus:border-green-500 transition-all outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        className="bg-green-600 text-white rounded-2xl px-12 py-6 text-2xl font-black hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3 self-end"
                                    >
                                        PONUDA (PDF)
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-2xl">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                                    <p className="text-xs font-bold text-green-800 uppercase tracking-tighter">Vaši podaci se koriste isključivo za izradu ponude.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-xs border-t border-neutral-100">
                <p>© 2026 SolarPulse AI — Hrvatski Lider za ROI Analizu</p>
            </footer>
        </main>
    );
}
