/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "asidenote.theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

function resolveTheme(mode: ThemeMode) {
  if (mode !== "system") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue === "light" || storedValue === "dark" || storedValue === "system") {
      return storedValue;
    }
    return "system";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, themeMode);
    const htmlElement = document.documentElement;
    const effectiveTheme = resolveTheme(themeMode);
    htmlElement.classList.toggle("dark", effectiveTheme === "dark");
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      const htmlElement = document.documentElement;
      htmlElement.classList.toggle("dark", query.matches);
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      setThemeMode,
    }),
    [themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }

  return context;
}
