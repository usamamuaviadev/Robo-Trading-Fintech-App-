/** @type {import('tailwindcss').Config} */
// Use platformSelect to map font families per platform as recommended by NativeWind
const { platformSelect } = require('nativewind/theme');

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/components/**/*.{js,jsx,ts,tsx}","./src/screens/**/*.{js,jsx,ts,tsx}", "./src/navigation/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Font Families — platform-aware per NativeWind docs
      // Use classes like: font-arabic, font-arabic-bold, font-system
      // Note: React Native does not support fallback arrays; first value is used.
      fontFamily: {
        // System font you can use via className="font-system"
        system: platformSelect({
          ios: 'System',
          android: 'sans-serif',
          default: 'ui-sans-serif',
        }),
        // Arabic family variants (ensure fonts are linked)
        arabic: platformSelect({
          ios: 'NotoKufiArabic-Regular',
          android: 'NotoKufiArabic-Regular',
          default: 'NotoKufiArabic-Regular',
        }),
        'arabic-light': platformSelect({
          ios: 'NotoKufiArabic-Light',
          android: 'NotoKufiArabic-Light',
          default: 'NotoKufiArabic-Light',
        }),
        'arabic-medium': platformSelect({
          ios: 'NotoKufiArabic-Medium',
          android: 'NotoKufiArabic-Medium',
          default: 'NotoKufiArabic-Medium',
        }),
        'arabic-semibold': platformSelect({
          ios: 'NotoKufiArabic-SemiBold',
          android: 'NotoKufiArabic-SemiBold',
          default: 'NotoKufiArabic-SemiBold',
        }),
        'arabic-bold': platformSelect({
          ios: 'NotoKufiArabic-Bold',
          android: 'NotoKufiArabic-Bold',
          default: 'NotoKufiArabic-Bold',
        }),
        'arabic-extrabold': platformSelect({
          ios: 'NotoKufiArabic-ExtraBold',
          android: 'NotoKufiArabic-ExtraBold',
          default: 'NotoKufiArabic-ExtraBold',
        }),
        'arabic-black': platformSelect({
          ios: 'NotoKufiArabic-Black',
          android: 'NotoKufiArabic-Black',
          default: 'NotoKufiArabic-Black',
        })
      },
      // Color Schemes
      colors: {
        black: "#000000",
        white: "#FFFFFF",
        // Primary Brand Colors
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#CCC2FF",
          400: "#B5A6FE",
          500: "#A795FE", // Main primary
          600: "#917AFE",
          700: "#0369a1",
          800: "#6757B4",
          900: "#0c3d66",
        },
        // Secondary Colors (for accents)
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Main secondary
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Success Colors
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Main success
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
        },
        // Warning Colors
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Main warning
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Danger Colors
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Main danger
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Neutral/Gray Colors
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Light & Dark modes
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          border: "#334155",
        },
        light: {
          bg: "#ffffff",
          surface: "#f8fafc",
          border: "#e2e8f0",
        },
      },

      // Typography - Font Sizes
      fontSize: {
        // Headings
        "h1": [40, { lineHeight: "30px", fontWeight: "800" }],
        "h2": [28, { lineHeight: "36px", fontWeight: "700" }],
        "h3": [24, { lineHeight: "32px", fontWeight: "600" }],
        "h4": [20, { lineHeight: "28px", fontWeight: "600" }],
        "h5": [18, { lineHeight: "24px", fontWeight: "600" }],
        "h6": [16, { lineHeight: "22px", fontWeight: "600" }],

        // Body Text
        "body-lg": [18, { lineHeight: "28px", fontWeight: "400" }],
        "body": [16, { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": [14, { lineHeight: "20px", fontWeight: "400" }],
        "body-xs": [12, { lineHeight: "16px", fontWeight: "400" }],

        // Label & Small Text
        "label": [14, { lineHeight: "20px", fontWeight: "500" }],
        "label-sm": [12, { lineHeight: "16px", fontWeight: "500" }],

        // Caption & Extra Small
        "caption": [12, { lineHeight: "16px", fontWeight: "400" }],
        "caption-sm": [11, { lineHeight: "14px", fontWeight: "400" }],

        // Button Text
        "button": [16, { lineHeight: "24px", fontWeight: "600" }],
        "button-sm": [14, { lineHeight: "20px", fontWeight: "600" }],
      },

      // Font Weights
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      // Line Heights
      lineHeight: {
        tight: "1.2",
        normal: "1.5",
        relaxed: "1.75",
        loose: "2",
      },

      // Spacing - already extended for consistency
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
      },

      // Border Radius
      borderRadius: {
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "24px",
        "full": "9999px",
      },

      // Shadows
      boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
      },

      // Opacity
      opacity: {
        "0": "0",
        "5": "0.05",
        "10": "0.1",
        "20": "0.2",
        "30": "0.3",
        "40": "0.4",
        "50": "0.5",
        "60": "0.6",
        "70": "0.7",
        "80": "0.8",
        "90": "0.9",
        "100": "1",
      },
    },
  },
  plugins: [],
}

