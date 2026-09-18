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
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          "surface-hover": "var(--bg-surface-hover)",
          elevated: "var(--bg-elevated)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
        priority: {
          DEFAULT: "var(--priority)",
          subtle: "var(--priority-subtle)",
        },
        track: "var(--track-bg)",
        semantic: {
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
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
      fontSize: {
        display: ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["24px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5", letterSpacing: "-0.005em", fontWeight: "400" }],
        meta: ["12px", { lineHeight: "1.4", letterSpacing: "0.04em", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "card-hover": "0 2px 6px -1px rgba(0, 0, 0, 0.08)",
        dropdown: "0 4px 12px 0 rgba(0, 0, 0, 0.15)",
        modal: "0 8px 24px -4px rgba(0, 0, 0, 0.3)",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
