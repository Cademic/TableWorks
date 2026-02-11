import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { NoteBoardPage } from "../pages/NoteBoardPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { CalendarsPage } from "../pages/CalendarsPage";
import { ChalkBoardsPage } from "../pages/ChalkBoardsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/boards/:boardId" element={<NoteBoardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/calendars" element={<CalendarsPage />} />
            <Route path="/chalkboards" element={<ChalkBoardsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
