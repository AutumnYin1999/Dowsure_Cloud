/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      colors: {
        // 主色: 玫红 / 珊瑚红 —— 对齐 Dowsure Cloud 视觉
        brand: {
          50: "#fff1f4",
          100: "#ffe1e8",
          200: "#ffc4d1",
          300: "#ff9bb1",
          400: "#ff6b89",
          500: "#ff3d5e",
          600: "#ed1f46",
          700: "#c8163a",
          800: "#a01030",
          900: "#7a0c25",
          950: "#4b0617",
        },
        ink: {
          DEFAULT: "#1a1422",
          muted: "#5b5566",
          soft: "#8c8694",
        },
        surface: {
          DEFAULT: "#ffffff",
          alt: "#fff7f9",
          line: "#f1e3e8",
        },
        accent: {
          emerald: "#10b981",
          gold: "#f5a623",
          violet: "#7c5cff",
        },
      },
      fontFamily: {
        // 默认正文 —— 西文 Plus Jakarta Sans + 中文优先系统圆润字体
        sans: [
          "'Plus Jakarta Sans'",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "'PingFang SC'",
          "'HarmonyOS Sans SC'",
          "MiSans",
          "'Noto Sans SC'",
          "'Hiragino Sans GB'",
          "'Microsoft YaHei'",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        // 大标题专用 —— 中文优先思源/苹方 Heavy,塑造柔和饱满感
        display: [
          "'Plus Jakarta Sans'",
          "'PingFang SC'",
          "'HarmonyOS Sans SC'",
          "MiSans",
          "'Noto Sans SC'",
          "'Hiragino Sans GB'",
          "'Microsoft YaHei'",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(255,61,94,0.04), 0 8px 24px rgba(255,61,94,0.06)",
        soft: "0 6px 20px rgba(26,20,34,0.06)",
        pop: "0 14px 40px rgba(237,31,70,0.22)",
        ring: "0 0 0 4px rgba(255,61,94,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      backgroundImage: {
        // 主 CTA 渐变 (玫红 → 桃粉)
        "brand-gradient":
          "linear-gradient(135deg, #ed1f46 0%, #ff3d5e 45%, #ff8aa3 110%)",
        // Hero 区: 上粉下白 + 淡粉网格
        "hero-grid": [
          "linear-gradient(180deg, #ffe4ea 0%, #fff5f7 55%, #ffffff 100%)",
          "repeating-linear-gradient(0deg, rgba(255,61,94,0.05) 0px, rgba(255,61,94,0.05) 1px, transparent 1px, transparent 80px)",
          "repeating-linear-gradient(90deg, rgba(255,61,94,0.05) 0px, rgba(255,61,94,0.05) 1px, transparent 1px, transparent 80px)",
        ].join(", "),
        // 卡片 (KPI 用) 浅粉 → 白渐变
        "kpi-pink":
          "linear-gradient(135deg, #ffe1e8 0%, #fff5f7 60%, #ffffff 100%)",
        "kpi-soft":
          "linear-gradient(135deg, #fff5f7 0%, #ffffff 70%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "calc(200px + 100%) 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "fade-up": "fade-up 320ms ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};
