import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                solar: {
                    green: "#10b981", // emerald-500
                    yellow: "#f59e0b", // amber-500
                    white: "#ffffff",
                    dark: "#0f172a", // slate-900
                }
            }
        },
    },
    plugins: [],
};
export default config;
