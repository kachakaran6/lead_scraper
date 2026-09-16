/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0A0A0B",
          surface: "#131315",
          "surface-hover": "#1B1B1E",
        },
        border: {
          subtle: "#232326",
          DEFAULT: "#2E2E32",
        },
        text: {
          primary: "#EDEDEF",
          secondary: "#9B9BA1",
          tertiary: "#6B6B70",
        },
        accent: {
          DEFAULT: "#4C7CF0",
          hover: "#3B6BE0",
          subtle: "rgba(76, 124, 240, 0.1)",
        },
        semantic: {
          success: "#34A874",
          warning: "#C98A2E",
          danger: "#D14D4D",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        dropdown: "0 4px 12px 0 rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
