"use client";

import { useState } from "react";
import { calculateSolarROI, CalculatorResult } from "../lib/calculator";
import { extractBillAmount } from "./actions";

export default function Home() {
    const [location, setLocation] = useState("");
    const [bill, setBill] = useState<string | number>("");
    const [phone, setPhone] = useState("");
    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [ocrSuccess, setOcrSuccess] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(true);

    const getNumericBill = () => Number(String(bill).replace(',', '.'));

    const handleCalculate = () => {
        const numericBill = getNumericBill();
        if (!numericBill || numericBill <= 0) return;
        setIsConfirmed(true);
        const res = calculateSolarROI({ monthlyBill: numericBill });
        setResult(res);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setOcrSuccess(false);
        try {
            const formData = new FormData();
            formData.append("billImage", file);
            const response = await extractBillAmount(formData);

            if (response && response.success && response.amount !== undefined && response.amount !== null) {
                setBill(response.amount.toString());
                setOcrSuccess(true);
                setIsConfirmed(false);
                setResult(null);
                setTimeout(() => setOcrSuccess(false), 5000);
            } else {
                alert("DIJAGNOSTIKA V4 (ZA MIKIJA):\n\n" + (response?.error || JSON.stringify(response) || "Vercel je srušio poziv."));
            }
        } catch (error: any) {
            console.error(error);
            alert("Kritična greška u komunikaciji s Vercel serverom: " + error.message);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!result) return;
        try {
            const { generateSolarProposalPDF } = await import("../lib/pdf-generator");
            generateSolarProposalPDF(result, location);
        } catch (e) {
            console.error(e);
            alert("Dogodila se greška prilikom izrade PDF dokumenta.");
        }
    };

    let tenYearProjection: number[] = [];
    let maxYearValue = 1;

    if (result) {
        const inflationRate = 0.03;
        let cumSum = 0;
        tenYearProjection = Array.from({ length: 10 }, (_, i) => {
            cumSum += result.yearlySavingsEur * Math.pow(1 + inflationRate, i);
            return cumSum;
        });
        maxYearValue = Math.max(tenYearProjection[9], 1);
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
                        <span className="bg-solar-green text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] mr-3 font-black">1</span>
                        Automatsko očitavanje
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>

                        <div className="mb-8">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-emerald-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-emerald-50 transition-colors relative group">
                                <div className="flex flex-col items-center justify-center pt-2 pb-2 z-10 transition-transform group-hover:scale-[1.02]">
                                    <svg className={`w-8 h-8 mb-2 ${isExtracting ? 'animate-bounce text-emerald-600' : 'text-solar-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <p className="text-sm text-slate-800 font-bold mb-1">
                                        {isExtracting ? 'Očitavam vrijednosti...' : 'Slikajte i učitajte vaš račun'}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">AI će automatski prepoznati prosječnu potrošnju</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isExtracting} />
                                {isExtracting && <div className="absolute inset-0 bg-white/50 z-0"></div>}
                            </label>
                        </div>

                        <div className="flex items-center mb-6">
                            <hr className="flex-grow border-slate-200" />
                            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ili upišite ručno</span>
                            <hr className="flex-grow border-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Lokacija</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 focus:border-solar-green outline-none text-slate-800" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Prosječni mjesečni račun</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bill}
                                    onChange={(e) => { setBill(e.target.value.replace(',', '.')); setIsConfirmed(true); }}
                                    className={`w-full px-3 py-2 rounded border outline-none text-slate-800 transition-colors ${!isConfirmed ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 focus:border-solar-green'}`}
                                    required
                                />

                                {!isConfirmed && (
                                    <div className="absolute top-16 left-0 w-full z-20 mt-1 bg-white border border-emerald-200 p-3 rounded shadow-lg animate-fade-in-up">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isConfirmed}
                                                onChange={(e) => {
                                                    setIsConfirmed(e.target.checked);
                                                    if (e.target.checked && bill) {
                                                        const numericBill = getNumericBill();
                                                        const res = calculateSolarROI({ monthlyBill: numericBill });
                                                        setResult(res);
                                                    }
                                                }}
                                                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-semibold text-slate-700">Je li ovo vaš uobičajeni mjesečni prosjek?</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!result && (
                            <div className="mt-4">
                                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded text-sm">Izračunaj</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {result && isConfirmed && (
                <div className="animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-emerald-400 text-center shadow-sm">
                            <p className="text-slate-500 text-xs font-bold mb-1">Preporučena snaga:</p>
                            <p className="text-xl font-bold text-slate-800">{result.recommendedSystemKWp.toFixed(1)} kWp</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-emerald-400 text-center shadow-sm">
                            <p className="text-slate-500 text-xs font-bold mb-1">Godišnja ušteda:</p>
                            <p className="text-xl font-bold text-slate-800">{result.yearlySavingsEur.toFixed(0)} €</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-emerald-400 text-center shadow-sm">
                            <p className="text-slate-500 text-xs font-bold mb-1">Godišnja proizvodnja:</p>
                            <p className="text-xl font-bold text-slate-800">{result.estimatedYearlyProduction.toFixed(0)} kWh</p>
                        </div>
                    </div>

                    <div className="bg-[#fefce8] p-4 rounded-lg border border-[#fef08a] mb-8 text-left shadow-sm px-6 flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">
                                Osiguranje za Budućnost: <span className="text-solar-green">{result.systemUpsellKWp.toFixed(1)} kWp</span>
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                Uključuje EV punjač i grijanje. Smanjuje ovisnost o rastu cijena energenata za <strong className="text-emerald-600 font-extrabold text-sm">80%</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-6 text-center">
                        <h4 className="text-sm font-bold text-slate-800 mb-6 text-center">Akumulirana ušteda po godinama (10 Godina)</h4>

                        <div className="flex items-end justify-center h-48 border-b border-slate-200 pb-1 gap-1 md:gap-3 px-2 md:px-4 relative">
                            {tenYearProjection.map((val, i) => {
                                const heightPercent = (val / maxYearValue) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center group relative h-full justify-end w-8 md:w-10">
                                        <div
                                            className="w-full bg-solar-green hover:bg-emerald-400 transition-colors"
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                        <span className="text-[10px] text-slate-500 mt-2">{i + 1}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-between items-center bg-emerald-50 px-5 py-4 rounded-lg border border-emerald-100/50">
                            <span className="font-extrabold text-slate-700 text-sm tracking-wide">Ukupna stvarna ušteda (10 god):</span>
                            <span className="text-3xl font-black text-solar-green">{tenYearProjection[9].toFixed(0)} €</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Vaš broj telefona"
                                className="w-full px-4 py-2 rounded border border-slate-300 outline-none text-center text-slate-800"
                            />
                            <button
                                onClick={handleDownloadPDF}
                                disabled={phone.length < 6}
                                className={`w-full font-bold py-3 rounded transition-colors ${phone.length >= 6 ? 'bg-black text-white' : 'bg-slate-200 text-slate-400'}`}
                            >
                                Otključaj i Preuzmi PDF
                            </button>
                            <p className="text-[10px] font-bold text-slate-400 pt-3 uppercase tracking-wider">
                                GDPR usklađeno. Vaši podaci su sigurni i koriste se isključivo za slanje ponude. Sva prava pridržana.
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
