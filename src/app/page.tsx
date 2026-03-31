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
    const [conversionSuccess, setConversionSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const calculateSystemSize = () => {
        const annualConsumption = (billAmount * 12) / 0.15;
        return Math.min(Math.max(annualConsumption / 1250, 3), 20);
    };

    const systemSize = calculateSystemSize();
    const yearlySavings = billAmount * 12 * 0.9;
    const tenYearSavings = yearlySavings * 10;
    const investmentCost = systemSize * 1100;
    const roiYears = investmentCost / yearlySavings;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
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
                alert("DIJAGNOSTIKA V11-LEGENDARY: \n\n" + (result.error || "Nepoznata greška"));
            }
        } catch (err) {
            alert("DIJAGNOSTIKA V11-LEGENDARY (Crash): \n\n" + (err instanceof Error ? err.message : "Neuspjeh"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!phoneNumber) { alert("Molimo unesite broj."); return; }
        await generatePDF({ billAmount, location, systemSize, yearlySavings, investmentCost, roiYears, phoneNumber });
    };

    return (
        <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900 border-t-8 border-green-600">
            {/* Header */}
            <header className="py-10 px-6 max-w-5xl mx-auto flex justify-between items-center bg-white shadow-xl rounded-b-[2rem] mb-12 animate-fade-in border-b border-green-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                        <span className="text-white font-black text-3xl italic">S</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-neutral-900 italic">SOLARPULSE <span className="text-green-600">AI</span></h1>
                </div>
                <div className="hidden md:flex gap-4 items-center">
                    <div className="text-green-600 font-black text-xs bg-green-50 px-4 py-2 rounded-full border border-green-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                        AI SYSTEM ONLINE
                    </div>
                </div>
            </header>

            <section className="max-w-4xl mx-auto px-6 pb-24">
                {/* Step 1: Input */}
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-neutral-100 relative overflow-hidden group">
                    <div className="flex items-center gap-5 mb-12">
                        <span className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-3">1</span>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Automatsko očitanje računa</h2>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-4 border-dashed rounded-[2.5rem] p-16 text-center transition-all cursor-pointer relative overflow-hidden
               ${isProcessing ? 'bg-green-50 border-green-300' : 'bg-neutral-50 border-neutral-200 hover:border-green-600 hover:bg-green-50'}`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-all shadow-xl
                  ${isProcessing ? 'bg-green-600 text-white animate-bounce' : 'bg-white text-green-600 border border-green-100'}`}>
                                {isProcessing ? '...' : <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                            </div>
                            <p className="text-2xl font-black text-neutral-900 mb-2 italic">
                                {isProcessing ? 'OČITAVAM...' : (conversionSuccess ? 'USPJEŠNO! ✅' : 'UČITAJTE RAČUN')}
                            </p>
                            <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">AI će automatski prepoznati vašu ratu</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Lokacija objekta</label>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Npr. Split" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-6 text-xl font-bold focus:ring-4 focus:ring-green-100 outline-none" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Prosječni mjesečni račun (€)</label>
                            <input type="number" value={billAmount || ""} onChange={(e) => setBillAmount(Number(e.target.value))} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-6 text-xl font-bold focus:ring-4 focus:ring-green-100 outline-none" />
                        </div>
                    </div>

                    <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="w-full mt-12 bg-neutral-950 text-white rounded-[2rem] p-8 text-2xl font-black hover:bg-black transition-all hover:scale-[1.01] active:scale-95 shadow-2xl uppercase italic">
                        Izračunaj uštedu
                    </button>
                </div>

                {/* Results */}
                {billAmount > 0 && (
                    <div className="mt-12 space-y-8 animate-slide-up">
                        <div className="bg-green-600 text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-70">10-godišnja ušteda</h3>
                                <div className="text-7xl font-black tracking-tighter mb-4 italic">
                                    {tenYearSavings.toLocaleString("hr-HR")} €
                                </div>
                                <p className="text-green-100 font-bold text-lg opacity-80 uppercase tracking-tight">Obrana od rasta cijena energenata</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-green-600 relative overflow-hidden">
                            <h2 className="text-4xl font-black text-neutral-900 mb-4 tracking-tighter italic">Preuzmite PDF ponudu</h2>
                            <p className="text-neutral-500 font-bold mb-10 text-lg">Unesite broj telefona za slanje preciznog izračuna.</p>

                            <div className="flex flex-col md:flex-row gap-5">
                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+385 9..." className="flex-1 bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-7 text-2xl font-black outline-none focus:ring-4 focus:ring-green-100" />
                                <button onClick={handleDownload} className="bg-green-600 text-white rounded-2xl px-12 py-7 text-3xl font-black hover:bg-green-700 transition-all shadow-xl uppercase italic">
                                    PDF PONUDA
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <footer className="py-20 text-center text-neutral-300 font-black uppercase tracking-[0.3em] text-[10px]">
                <p>© 2026 SolarPulse AI — Premium ROI Engine V11</p>
            </footer>
        </main>
    );
}
