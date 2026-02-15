/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getPreferences } from "../api/users";
import { useThemeContext, type ThemeMode } from "./ThemeContext";
import type { UserPreferencesDto } from "../types";

function backendToTheme(value: string): ThemeMode {
  const v = value?.toLowerCase();
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

interface PreferencesContextValue {
  preferences: UserPreferencesDto | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

interface PreferencesProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export function PreferencesProvider({ children, isAuthenticated }: PreferencesProviderProps) {
  const { setThemeMode } = useThemeContext();
  const [preferences, setPreferences] = useState<UserPreferencesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getPreferences();
      setPreferences(data);
      setThemeMode(backendToTheme(data.theme));
    } catch {
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setThemeMode]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getPreferences()
      .then((data) => {
        if (!cancelled) {
          setPreferences(data);
          setThemeMode(backendToTheme(data.theme));
        }
      })
      .catch(() => {
        if (!cancelled) setPreferences(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setThemeMode]);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, isLoading, refetch }),
    [preferences, isLoading, refetch]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
