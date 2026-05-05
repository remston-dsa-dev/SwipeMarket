import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import type { TextStyle } from "react-native";
import { useSessionStore } from "@/stores/session-store";

export type TypographyVariant = "title" | "headline" | "body" | "caption" | "label";

export type AppTheme = {
  scheme: "light" | "dark";
  colors: {
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textOnPrimary: string;
    primary: string;
    secondary: string;
    border: string;
    glassBorder: string;
    overlay: string;
    gradientStart: string;
    gradientEnd: string;
  };
  radius: { sm: number; md: number; lg: number; pill: number };
  glassBlurIntensity: number;
  typography: Record<TypographyVariant, TextStyle>;
};

const ThemeContext = createContext<AppTheme | null>(null);

function buildTheme(scheme: "light" | "dark"): AppTheme {
  const isDark = scheme === "dark";
  return {
    scheme,
    glassBlurIntensity: 60,
    colors: {
      background: isDark ? "#0B0F19" : "#F4F4F8",
      surface: isDark ? "#151B2B" : "#FFFFFF",
      textPrimary: isDark ? "#F8FAFC" : "#0F172A",
      textSecondary: isDark ? "#94A3B8" : "#64748B",
      textOnPrimary: "#FFFFFF",
      primary: "#7C3AED",
      secondary: "#EC4899",
      border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
      glassBorder: "rgba(255,255,255,0.18)",
      overlay: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.35)",
      gradientStart: isDark ? "#1E1035" : "#EDE9FE",
      gradientEnd: isDark ? "#0B0F19" : "#FDF2F8",
    },
    radius: { sm: 12, md: 20, lg: 28, pill: 999 },
    typography: {
      title: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
      headline: { fontSize: 20, fontWeight: "600", lineHeight: 26 },
      body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
      caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
      label: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
    },
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSessionStore((s) => s.themePreference);
  const system = useColorScheme();
  const resolvedScheme: "light" | "dark" =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;

  const theme = useMemo(
    () => buildTheme(resolvedScheme),
    [resolvedScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
