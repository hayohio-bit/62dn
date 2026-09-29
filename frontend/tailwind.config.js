/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      /* 62댕냥 디자인 토큰: 따뜻한 에디토리얼 (크림 배경, 잉크 텍스트, 테라코타 포인트) */
      colors: {
        cream: {
          DEFAULT: "#F5EFE6",
          50: "#FBF8F3",
          100: "#F5EFE6",
          200: "#EDE4D6",
          300: "#E0D3C0",
        },
        ink: {
          DEFAULT: "#221C16",
          soft: "#5B5147",
          muted: "#6E6357",
          faint: "#B5AB9E",
        },
        terracotta: {
          DEFAULT: "#C8553D",
          50: "#FBEEE9",
          100: "#F3DDD4",
          400: "#D46D57",
          500: "#C8553D",
          600: "#B04632",
          700: "#8E3726",
        },
        sage: {
          DEFAULT: "#8A9A5B",
          50: "#F1F3E8",
          100: "#E4E9D3",
          600: "#6E7D44",
        },
        /* 기존 코드의 primary-* 클래스 호환 (테라코타 계열로 대체) */
        primary: {
          50: "#FBEEE9",
          100: "#F3DDD4",
          500: "#C8553D",
          600: "#B04632",
          700: "#8E3726",
        },
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "Noto Sans KR", "sans-serif"],
        display: ["Gowun Dodum", "Pretendard Variable", "Pretendard", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(34,28,22,.04), 0 12px 32px -16px rgba(34,28,22,.18)",
        lift: "0 24px 48px -24px rgba(34,28,22,.35)",
        glow: "0 12px 30px -10px rgba(200,85,61,.55)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        marquee: "marquee 60s linear infinite",
      },
    },
  },
  plugins: [],
};
