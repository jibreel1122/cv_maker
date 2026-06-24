/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // هوية بصرية: كحلي عميق + ذهبي/برونزي خافت + كريمي + رمادي أزرق
        midnight: {
          DEFAULT: "#0B1B3A",
          deep: "#070F26",
          soft: "#13264D",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#D8B65A",
        },
        cream: "#F6F3EC",
        slateblue: "#5B6B86",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cairo", "serif"],
        body: ["var(--font-body)", "Tajawal", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
