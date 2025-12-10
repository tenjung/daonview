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
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#f43f5e", // Rose 500
                    light: "#fb7185",   // Rose 400
                    dark: "#e11d48",    // Rose 600
                },
                accent: {
                    DEFAULT: "#fbbf24", // Amber 400
                    hover: "#f59e0b",   // Amber 500
                },
                surface: "#ffffff",
                text: {
                    main: "#4a044e",
                    secondary: "#831843",
                },
                border: "#fbcfe8",
            },
        },
    },
    plugins: [],
};
export default config;
