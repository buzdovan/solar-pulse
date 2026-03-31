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
        try {
            const formData = new FormData();
            formData.append("billImage", file);
            const result = await extractBillAmount(formData);

            if (result.success && result.amount) {
                setBillAmount(result.amount);
                setConversionSuccess(true);
                setTimeout(() => setConversionSuccess(false), 3000);
            } else {
                alert("DIJAGNOSTIKA V8-KRAJ: \n\n" + (result.error || "Nepoznata greška"));
            }
        } catch (err) {
            alert("DIJAGNOSTIKA V8-KRAJ (Crash): \n\n" + (err instanceof Error ? err.message : "Neuspjeh"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!phoneNumber) { alert("Molimo unesite broj telefona."); return; }
        await generatePDF({
            billAmount, location, systemSize, yearlySavings, investmentCost, roiYears, phoneNumber
        });
    };

    return (
        <main className="min-h-screen bg-white font-sans text-neutral-950 px-4 py-12">
            <div className="max-w-2xl mx-auto space-y-12 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-4">
                        <span className="text-white font-black text-3xl">S</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">SOLAR<span className="text-green-600">PULSE</span></h1>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">B2B SaaS ROI Analiza</p>
                </div>

                {/* Input Box */}
                <div className="bg-neutral-50 rounded-[2rem] p-8 border border-neutral-100 shadow-sm">
                    <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                        Učitavanje računa
                    </h2>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                ${isProcessing ? 'bg-green-50 border-green-400' : 'bg-white border-neutral-200 hover:border-green-600'}`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <p className="font-bold text-neutral-800">{isProcessing ? "OČITAVAM..." : (conversionSuccess ? "USPJEH! ✅" : "KLIKNITE ZA UPLOAD RAČUNA")}</p>
                        <p className="text-xs text-neutral-400 mt-1 uppercase font-bold tracking-tighter">AI će prepoznati mjesečnu ratu</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-neutral-400 mb-1 block ml-1">Mjesečni račun (€)</label>
                            <input
                                type="number"
                                value={billAmount || ""}
                                onChange={(e) => setBillAmount(Number(e.target.value))}
                                className="w-full bg-white border border-neutral-200 rounded-xl p-4 font-bold text-xl outline-none focus:border-green-600"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-neutral-400 mb-1 block ml-1">Lokacija</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Npr. Split"
                                className="w-full bg-white border border-neutral-200 rounded-xl p-4 font-bold text-xl outline-none focus:border-green-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                {billAmount > 0 && (
                    <div className="animate-slide-up space-y-6">
                        <div className="bg-green-600 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-black uppercase opacity-60 mb-2">10-godišnja ušteda</p>
                                <h2 className="text-6xl font-black tracking-tighter">
                                    {tenYearSavings.toLocaleString("hr-HR")} €
                                </h2>
                            </div>
                        </div>

                        <div className="bg-white border border-green-600 rounded-[2rem] p-10 shadow-lg">
                            <h3 className="text-3xl font-black text-neutral-900 mb-2">Preuzmite ponudu</h3>
                            <p className="text-neutral-500 font-bold mb-8">Kamo da vam pošaljemo detaljan ROI izračun?</p>

                            <div className="space-y-4">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+385 9..."
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-5 font-bold text-xl outline-none"
                                />
                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 text-white rounded-xl p-6 text-2xl font-black hover:bg-green-700 shadow-xl transition-all"
                                >
                                    PONUDA (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
