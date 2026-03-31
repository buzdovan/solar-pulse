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
                alert("DIJAGNOSTIKA V12-LAST-STAND: \n\n VAŽNO: Molimo koristite SLIKU (JPG/PNG) umjesto PDF-a. \n\n" + (result.error || "Greška"));
            }
        } catch (err) {
            alert("DIJAGNOSTIKA V12-LAST-STAND (Crash): \n\n" + (err instanceof Error ? err.message : "Neuspjeh"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!phoneNumber) { alert("Unesite broj."); return; }
        await generatePDF({ billAmount, location, systemSize, yearlySavings, investmentCost, roiYears, phoneNumber });
    };

    return (
        <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900 border-t-8 border-green-600">
            <header className="py-8 px-6 max-w-5xl mx-auto flex justify-between items-center bg-white shadow-xl rounded-b-[2rem] mb-12 animate-fade-in border-b border-green-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                        <span className="text-white font-black text-3xl italic">S</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-neutral-900 italic uppercase">SOLARPULSE <span className="text-green-600">AI</span></h1>
                </div>
                <div className="hidden md:flex gap-4 items-center">
                    <div className="text-green-600 font-bold text-xs bg-green-50 px-4 py-2 rounded-full border border-green-100">
                        SYSTEM V12 READY
                    </div>
                </div>
            </header>

            <section className="max-w-4xl mx-auto px-6 pb-24">
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-neutral-100 relative overflow-hidden group">
                    <div className="flex items-center gap-5 mb-12">
                        <span className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-3">1</span>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Učitavanje računa (Slika)</h2>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-4 border-dashed rounded-[2.5rem] p-16 text-center transition-all cursor-pointer'
               ${isProcessing ? 'bg-green-50 border-green-300' : 'bg-neutral-50 border-neutral-200 hover:border-green-600 hover:bg-green-50'}`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl
                  ${isProcessing ? 'bg-green-600 text-white animate-bounce' : 'bg-white text-green-600 border border-green-100'}`}>
                                {isProcessing ? '...' : <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            </div>
                            <p className="text-2xl font-black text-neutral-900 mb-2 italic uppercase">
                                {isProcessing ? 'OČITAVAM...' : (conversionSuccess ? 'USPJEŠNO! ✅' : 'SLIKAJTE RAČUN')}
                            </p>
                            <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Molimo koristite JPG/PNG sliku za OCR</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Lokacija</label>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Npr. Split" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-6 text-xl font-bold focus:ring-4 focus:ring-green-100 outline-none" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Mjesečni račun (€)</label>
                            <input type="number" value={billAmount || ""} onChange={(e) => setBillAmount(Number(e.target.value))} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-6 text-xl font-bold focus:ring-4 focus:ring-green-100 outline-none" />
                        </div>
                    </div>

                    <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="w-full mt-12 bg-black text-white rounded-[2rem] p-8 text-2xl font-black hover:bg-neutral-800 transition-all shadow-2xl uppercase italic">
                        Izračunaj ROI
                    </button>
                </div>

                {billAmount > 0 && (
                    <div className="mt-12 animate-slide-up space-y-8">
                        <div className="bg-green-600 text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-70">10-godišnja ušteda</h3>
                            <div className="text-7xl font-black tracking-tighter italic">
                                {tenYearSavings.toLocaleString("hr-HR")} €
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-green-600">
                            <h2 className="text-4xl font-black text-neutral-900 mb-4 tracking-tighter italic uppercase">Preuzmi PDF ponudu</h2>
                            <div className="flex flex-col md:flex-row gap-5 mt-10">
                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+385 9..." className="flex-1 bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-7 text-2xl font-black outline-none focus:ring-4 focus:ring-green-100" />
                                <button onClick={handleDownload} className="bg-green-600 text-white rounded-2xl px-12 py-7 text-3xl font-black hover:bg-green-700 shadow-xl uppercase italic">
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <footer className="py-20 text-center text-neutral-300 font-black uppercase tracking-[0.3em] text-[10px]">
                <p>© 2026 SolarPulse AI — V12 LAST STAND ENGINE</p>
            </footer>
        </main>
    );
}
