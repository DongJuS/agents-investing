/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Toss 스타일 컬러 팔레트
      colors: {
        brand: {
          DEFAULT: "#3182F6",  // Toss 파란색
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#3182F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        positive: "#00B894",   // 수익 녹색
        negative: "#FF3B30",   // 손실 빨간색
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9FAFB",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
