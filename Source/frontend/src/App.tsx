import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { AppRouter } from "./router";
import { useAuth } from "./context/AuthContext";

function AppWithPreferences() {
  const { isAuthenticated } = useAuth();
  return (
    <PreferencesProvider isAuthenticated={isAuthenticated}>
      <AppRouter />
    </PreferencesProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWithPreferences />
      </AuthProvider>
    </ThemeProvider>
  );
}
