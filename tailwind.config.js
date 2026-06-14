/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#141414",
        "bg-secondary": "#1A1A1A",
        "bg-tertiary": "#202020",
        surface: "#242424",
        "surface-hover": "#2A2A2A",
        "border-subtle": "#2E2E2E",
        "border-default": "#383838",
        "accent-primary": "#AAFF00",
        "accent-hover": "#BBFF33",
        "accent-dark": "#88CC00",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A0A0A0",
        "text-muted": "#606060",
        online: "#AAFF00",
        busy: "#FF6B00",
        away: "#FFB800",
        offline: "#404040",
        danger: "#FF3B3B",
        success: "#AAFF00",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk Fallback", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "Space Grotesk Fallback", "sans-serif"],
      },
      letterSpacing: {
        heading: "-0.02em",
        body: "-0.01em",
        section: "0.08em",
      },
      borderRadius: {
        server: "12px",
      },
      boxShadow: {
        "accent-glow": "0 0 20px rgba(170, 255, 0, 0.2)",
        "accent-focus": "0 0 0 2px rgba(170, 255, 0, 0.1)",
      },
    },
  },
  plugins: [],
}
