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
      // 字号模板：在默认基础上整体加大约 4px（间距 spacing 不变 → 模块尺寸不动）
      fontSize: {
        xs: ["1rem", { lineHeight: "1.4rem" }], // 12→16
        sm: ["1.125rem", { lineHeight: "1.65rem" }], // 14→18
        base: ["1.25rem", { lineHeight: "1.9rem" }], // 16→20
        lg: ["1.375rem", { lineHeight: "2rem" }], // 18→22
        xl: ["1.5rem", { lineHeight: "2rem" }], // 20→24
        "2xl": ["1.75rem", { lineHeight: "2.25rem" }], // 24→28
        "3xl": ["2.125rem", { lineHeight: "2.5rem" }], // 30→34
        "4xl": ["2.625rem", { lineHeight: "2.9rem" }], // 36→42
        "5xl": ["3.5rem", { lineHeight: "1" }], // 48→56
        "6xl": ["4.25rem", { lineHeight: "1" }], // 60→68
        "7xl": ["5rem", { lineHeight: "1" }], // 72→80
      },
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
        // 正文 —— 对齐原型 df.css：Inter + Noto Sans SC
        sans: [
          "Inter",
          "'Noto Sans SC'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'PingFang SC'",
          "'Hiragino Sans GB'",
          "'Microsoft YaHei'",
          "sans-serif",
        ],
        // 大标题 —— 与正文同源（原型未使用独立 display 字体）
        display: [
          "Inter",
          "'Noto Sans SC'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'PingFang SC'",
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
