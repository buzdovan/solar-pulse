import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SolarPulse AI - Solar Closer',
    description: 'Profesionalna ponuda i izračun ROI za solarne panele',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="hr">
            <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 antialiased`}>
                <div className="flex min-h-screen flex-col">
                    {/* Vraćen vizual naboljeg layouta sa zelene slike */}
                    <header className="bg-solar-green sticky top-0 z-50 shadow-sm py-4">
                        <div className="container mx-auto px-6 flex justify-center items-center max-w-5xl">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                SolarPulse AI
                            </h1>
                        </div>
                    </header>

                    <main className="flex-grow">
                        {children}
                    </main>

                    <footer className="bg-slate-50 text-slate-400 py-8 text-center text-sm">
                        <p className="font-medium text-slate-400 tracking-widest">&copy; {new Date().getFullYear()} SolarPulse AI</p>
                    </footer>
                </div>
            </body>
        </html>
    )
}
